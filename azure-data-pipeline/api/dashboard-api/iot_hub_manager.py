"""
IoT Hub管理モジュール
Azure IoT Hubを使用したデバイス管理・データ収集機能
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from azure.iot.hub import IoTHubRegistryManager
from azure.iot.hub.models import CloudToDeviceMethod, Twin
from azure.core.exceptions import AzureError

logger = logging.getLogger(__name__)


class IoTHubManager:
  """IoT Hub管理クラス"""

  def __init__(self):
    """初期化"""
    self.connection_string = os.getenv('IOT_HUB_CONNECTION_STRING')
    if not self.connection_string:
      # 環境変数から接続文字列を構築
      iot_hub_name = os.getenv('IOT_HUB_HOST', '').replace('.azure-devices.net', '')
      if iot_hub_name:
        # 実際の運用では、Key Vaultから取得することを推奨
        self.connection_string = f"HostName={iot_hub_name}.azure-devices.net;SharedAccessKeyName=service;SharedAccessKey=your-key"

    self.registry_manager = IoTHubRegistryManager(self.connection_string)

  def create_device(self, device_id: str, device_type: str = "sensor") -> bool:
    """
    デバイスを作成

    Args:
        device_id: デバイスID
        device_type: デバイスタイプ

    Returns:
        bool: 成功時True
    """
    try:
      # デバイスツインの初期設定
      twin = Twin()
      twin.tags = {
          "deviceType": device_type,
          "createdAt": datetime.utcnow().isoformat(),
          "status": "active"
      }
      twin.properties.desired = {
          "telemetryInterval": 30,
          "reportingEnabled": True
      }

      # デバイスを作成
      self.registry_manager.create_device_with_sas(
          device_id=device_id,
          status="enabled",
          authentication_type="sas",
          primary_key="auto-generated",
          secondary_key="auto-generated",
          twin=twin
      )

      logger.info(f"デバイスを作成しました: {device_id}")
      return True

    except AzureError as e:
      logger.error(f"IoT Hubデバイス作成エラー: {e}")
      return False

  def delete_device(self, device_id: str) -> bool:
    """
    デバイスを削除

    Args:
        device_id: デバイスID

    Returns:
        bool: 成功時True
    """
    try:
      self.registry_manager.delete_device(device_id)
      logger.info(f"デバイスを削除しました: {device_id}")
      return True

    except AzureError as e:
      logger.error(f"IoT Hubデバイス削除エラー: {e}")
      return False

  def get_device_twin(self, device_id: str) -> Optional[Dict[str, Any]]:
    """
    デバイスツインを取得

    Args:
        device_id: デバイスID

    Returns:
        Optional[Dict[str, Any]]: デバイスツイン情報
    """
    try:
      twin = self.registry_manager.get_twin(device_id)

      twin_info = {
          "deviceId": twin.device_id,
          "etag": twin.etag,
          "version": twin.version,
          "tags": twin.tags,
          "properties": {
              "desired": twin.properties.desired,
              "reported": twin.properties.reported
          }
      }

      return twin_info

    except AzureError as e:
      logger.error(f"IoT Hubデバイスツイン取得エラー: {e}")
      return None

  def update_device_twin(self, device_id: str, properties: Dict[str, Any]) -> bool:
    """
    デバイスツインを更新

    Args:
        device_id: デバイスID
        properties: 更新するプロパティ

    Returns:
        bool: 成功時True
    """
    try:
      twin = Twin()
      twin.properties.desired = properties

      self.registry_manager.update_twin(device_id, twin, twin.etag)
      logger.info(f"デバイスツインを更新しました: {device_id}")
      return True

    except AzureError as e:
      logger.error(f"IoT Hubデバイスツイン更新エラー: {e}")
      return False

  def send_cloud_to_device_message(self, device_id: str, message: Dict[str, Any]) -> bool:
    """
    クラウドからデバイスへのメッセージを送信

    Args:
        device_id: デバイスID
        message: 送信メッセージ

    Returns:
        bool: 成功時True
    """
    try:
      cloud_to_device_method = CloudToDeviceMethod(
          method_name="sendMessage",
          payload=json.dumps(message),
          response_timeout_in_seconds=30
      )

      self.registry_manager.invoke_device_method(device_id, cloud_to_device_method)

      logger.info(f"クラウドツーデバイスメッセージを送信しました: {device_id}")
      return True

    except AzureError as e:
      logger.error(f"IoT Hubメッセージ送信エラー: {e}")
      return False

  def get_device_list(self, max_count: int = 100) -> List[Dict[str, Any]]:
    """
    デバイスリストを取得

    Args:
        max_count: 最大取得件数

    Returns:
        List[Dict[str, Any]]: デバイスリスト
    """
    try:
      devices = self.registry_manager.get_devices(max_count)

      device_list = []
      for device in devices:
        device_info = {
            "deviceId": device.device_id,
            "status": device.status,
            "authenticationType": device.authentication_type,
            "lastActivityTime": device.last_activity_time.isoformat() if device.last_activity_time else None,
            "cloudToDeviceMessageCount": device.cloud_to_device_message_count
        }
        device_list.append(device_info)

      return device_list

    except AzureError as e:
      logger.error(f"IoT Hubデバイスリスト取得エラー: {e}")
      return []

  def get_device_statistics(self) -> Dict[str, Any]:
    """
    デバイス統計情報を取得

    Returns:
        Dict[str, Any]: 統計情報
    """
    try:
      devices = self.get_device_list()

      total_devices = len(devices)
      enabled_devices = len([d for d in devices if d["status"] == "enabled"])
      disabled_devices = len([d for d in devices if d["status"] == "disabled"])

      # デバイスタイプ別の統計
      device_types = {}
      for device in devices:
        try:
          twin = self.get_device_twin(device["deviceId"])
          if twin and "tags" in twin and "deviceType" in twin["tags"]:
            device_type = twin["tags"]["deviceType"]
            device_types[device_type] = device_types.get(device_type, 0) + 1
        except Exception:
          continue

      stats = {
          "totalDevices": total_devices,
          "enabledDevices": enabled_devices,
          "disabledDevices": disabled_devices,
          "deviceTypes": device_types,
          "lastUpdate": datetime.utcnow().isoformat()
      }

      return stats

    except Exception as e:
      logger.error(f"IoT Hub統計情報取得エラー: {e}")
      return {}

  def configure_device_telemetry(self, device_id: str, interval: int = 30) -> bool:
    """
    デバイスのテレメトリ設定を更新

    Args:
        device_id: デバイスID
        interval: テレメトリ間隔（秒）

    Returns:
        bool: 成功時True
    """
    try:
      properties = {
          "telemetryInterval": interval,
          "reportingEnabled": True,
          "lastConfigured": datetime.utcnow().isoformat()
      }

      return self.update_device_twin(device_id, properties)

    except Exception as e:
      logger.error(f"テレメトリ設定エラー: {e}")
      return False

  def enable_device(self, device_id: str) -> bool:
    """
    デバイスを有効化

    Args:
        device_id: デバイスID

    Returns:
        bool: 成功時True
    """
    try:
      self.registry_manager.update_device(device_id, status="enabled")
      logger.info(f"デバイスを有効化しました: {device_id}")
      return True

    except AzureError as e:
      logger.error(f"IoT Hubデバイス有効化エラー: {e}")
      return False

  def disable_device(self, device_id: str) -> bool:
    """
    デバイスを無効化

    Args:
        device_id: デバイスID

    Returns:
        bool: 成功時True
    """
    try:
      self.registry_manager.update_device(device_id, status="disabled")
      logger.info(f"デバイスを無効化しました: {device_id}")
      return True

    except AzureError as e:
      logger.error(f"IoT Hubデバイス無効化エラー: {e}")
      return False
