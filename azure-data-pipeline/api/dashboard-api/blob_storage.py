"""
Blob Storage操作モジュール
Azure Blob Storageを使用したデータ保存・取得機能
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import AzureError

logger = logging.getLogger(__name__)


class BlobStorageManager:
  """Blob Storage管理クラス"""

  def __init__(self):
    """初期化"""
    self.storage_account_name = os.getenv('STORAGE_ACCOUNT_NAME')
    self.storage_account_key = os.getenv('STORAGE_ACCOUNT_KEY')
    self.connection_string = f"DefaultEndpointsProtocol=https;AccountName={self.storage_account_name};AccountKey={self.storage_account_key};EndpointSuffix=core.windows.net"

    self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)

    # コンテナ名
    self.sensor_container = os.getenv('BLOB_CONTAINER_SENSOR', 'sensor-data')
    self.analysis_container = os.getenv('BLOB_CONTAINER_ANALYSIS', 'analysis-data')
    self.image_container = os.getenv('BLOB_CONTAINER_IMAGE', 'image-data')

    # コンテナクライアント
    self.sensor_container_client = self.blob_service_client.get_container_client(self.sensor_container)
    self.analysis_container_client = self.blob_service_client.get_container_client(self.analysis_container)
    self.image_container_client = self.blob_service_client.get_container_client(self.image_container)

  def upload_sensor_data(self, data: Dict[str, Any], device_id: str) -> bool:
    """
    センサーデータをBlob Storageにアップロード

    Args:
        data: センサーデータ
        device_id: デバイスID

    Returns:
        bool: 成功時True
    """
    try:
      timestamp = datetime.utcnow().isoformat()
      blob_name = f"{device_id}/{timestamp}.json"

      # データにメタデータを追加
      data_with_metadata = {
          "device_id": device_id,
          "timestamp": timestamp,
          "uploaded_at": datetime.utcnow().isoformat(),
          "data": data
      }

      blob_client = self.sensor_container_client.get_blob_client(blob_name)
      blob_client.upload_blob(
          json.dumps(data_with_metadata, ensure_ascii=False),
          overwrite=True
      )

      logger.info(f"センサーデータをアップロードしました: {blob_name}")
      return True

    except AzureError as e:
      logger.error(f"Blob Storageアップロードエラー: {e}")
      return False

  def upload_analysis_data(self, data: Dict[str, Any], analysis_type: str) -> bool:
    """
    分析データをBlob Storageにアップロード

    Args:
        data: 分析データ
        analysis_type: 分析タイプ

    Returns:
        bool: 成功時True
    """
    try:
      timestamp = datetime.utcnow().isoformat()
      blob_name = f"{analysis_type}/{timestamp}.json"

      # データにメタデータを追加
      data_with_metadata = {
          "analysis_type": analysis_type,
          "timestamp": timestamp,
          "uploaded_at": datetime.utcnow().isoformat(),
          "data": data
      }

      blob_client = self.analysis_container_client.get_blob_client(blob_name)
      blob_client.upload_blob(
          json.dumps(data_with_metadata, ensure_ascii=False),
          overwrite=True
      )

      logger.info(f"分析データをアップロードしました: {blob_name}")
      return True

    except AzureError as e:
      logger.error(f"Blob Storageアップロードエラー: {e}")
      return False

  def upload_image_data(self, image_data: bytes, device_id: str, image_type: str) -> Optional[str]:
    """
    画像データをBlob Storageにアップロード

    Args:
        image_data: 画像データ（バイト）
        device_id: デバイスID
        image_type: 画像タイプ

    Returns:
        Optional[str]: アップロードされたBlobのURL
    """
    try:
      timestamp = datetime.utcnow().isoformat()
      blob_name = f"{device_id}/{image_type}/{timestamp}.jpg"

      blob_client = self.image_container_client.get_blob_client(blob_name)
      blob_client.upload_blob(image_data, overwrite=True)

      blob_url = blob_client.url
      logger.info(f"画像データをアップロードしました: {blob_name}")
      return blob_url

    except AzureError as e:
      logger.error(f"Blob Storageアップロードエラー: {e}")
      return None

  def get_sensor_data(self, device_id: str, start_time: Optional[str] = None, end_time: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    センサーデータを取得

    Args:
        device_id: デバイスID
        start_time: 開始時刻（ISO形式）
        end_time: 終了時刻（ISO形式）

    Returns:
        List[Dict[str, Any]]: センサーデータのリスト
    """
    try:
      data_list = []

      # デバイスIDでフィルタリング
      blobs = self.sensor_container_client.list_blobs(name_starts_with=f"{device_id}/")

      for blob in blobs:
        # 時刻フィルタリング
        if start_time and blob.name < f"{device_id}/{start_time}":
          continue
        if end_time and blob.name > f"{device_id}/{end_time}":
          continue

        blob_client = self.sensor_container_client.get_blob_client(blob.name)
        blob_data = blob_client.download_blob()
        data = json.loads(blob_data.readall().decode('utf-8'))
        data_list.append(data)

      # 時刻順にソート
      data_list.sort(key=lambda x: x.get('timestamp', ''))

      return data_list

    except AzureError as e:
      logger.error(f"Blob Storage取得エラー: {e}")
      return []

  def get_analysis_data(self, analysis_type: str, start_time: Optional[str] = None, end_time: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    分析データを取得

    Args:
        analysis_type: 分析タイプ
        start_time: 開始時刻（ISO形式）
        end_time: 終了時刻（ISO形式）

    Returns:
        List[Dict[str, Any]]: 分析データのリスト
    """
    try:
      data_list = []

      # 分析タイプでフィルタリング
      blobs = self.analysis_container_client.list_blobs(name_starts_with=f"{analysis_type}/")

      for blob in blobs:
        # 時刻フィルタリング
        if start_time and blob.name < f"{analysis_type}/{start_time}":
          continue
        if end_time and blob.name > f"{analysis_type}/{end_time}":
          continue

        blob_client = self.analysis_container_client.get_blob_client(blob.name)
        blob_data = blob_client.download_blob()
        data = json.loads(blob_data.readall().decode('utf-8'))
        data_list.append(data)

      # 時刻順にソート
      data_list.sort(key=lambda x: x.get('timestamp', ''))

      return data_list

    except AzureError as e:
      logger.error(f"Blob Storage取得エラー: {e}")
      return []

  def delete_old_data(self, days: int = 30) -> bool:
    """
    古いデータを削除

    Args:
        days: 保持日数

    Returns:
        bool: 成功時True
    """
    try:
      cutoff_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
      cutoff_date = cutoff_date.replace(day=cutoff_date.day - days)

      deleted_count = 0

      # センサーデータの削除
      for container_client in [self.sensor_container_client, self.analysis_container_client, self.image_container_client]:
        blobs = container_client.list_blobs()

        for blob in blobs:
          # Blob名から時刻を抽出（簡易的な実装）
          try:
            blob_date_str = blob.name.split('/')[-1].split('.')[0]
            blob_date = datetime.fromisoformat(blob_date_str.replace('Z', '+00:00'))

            if blob_date < cutoff_date:
              blob_client = container_client.get_blob_client(blob.name)
              blob_client.delete_blob()
              deleted_count += 1
              logger.info(f"古いデータを削除しました: {blob.name}")
          except Exception:
            # 日付解析に失敗した場合はスキップ
            continue

      logger.info(f"合計 {deleted_count} 個の古いデータを削除しました")
      return True

    except AzureError as e:
      logger.error(f"Blob Storage削除エラー: {e}")
      return False
