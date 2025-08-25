"""
AI Search操作モジュール
Azure AI Searchを使用したデータ検索・分析機能
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SimpleField,
    SearchableField,
    SearchFieldDataType
)
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import AzureError

logger = logging.getLogger(__name__)


class AISearchManager:
  """AI Search管理クラス"""

  def __init__(self):
    """初期化"""
    self.search_service_name = os.getenv('SEARCH_SERVICE_NAME')
    self.search_service_key = os.getenv('SEARCH_SERVICE_KEY')
    self.search_index_name = os.getenv('SEARCH_INDEX_NAME', 'sensor-data-index')

    self.endpoint = f"https://{self.search_service_name}.search.windows.net"
    self.credential = AzureKeyCredential(self.search_service_key)

    self.search_client = SearchClient(
        endpoint=self.endpoint,
        index_name=self.search_index_name,
        credential=self.credential
    )

    self.index_client = SearchIndexClient(
        endpoint=self.endpoint,
        credential=self.credential
    )

  def upload_document(self, document: Dict[str, Any]) -> bool:
    """
    ドキュメントをAI Searchにアップロード

    Args:
        document: アップロードするドキュメント

    Returns:
        bool: 成功時True
    """
    try:
      # ドキュメントにメタデータを追加
      document_with_metadata = {
          "id": document.get("id", f"doc_{datetime.utcnow().isoformat()}"),
          "deviceId": document.get("deviceId", ""),
          "deviceType": document.get("deviceType", ""),
          "timestamp": document.get("timestamp", datetime.utcnow().isoformat()),
          "temperature": document.get("temperature", 0.0),
          "humidity": document.get("humidity", 0.0),
          "co2": document.get("co2", 0.0),
          "personCount": document.get("personCount", 0),
          "content": json.dumps(document.get("data", {}), ensure_ascii=False),
          "uploaded_at": datetime.utcnow().isoformat()
      }

      self.search_client.upload_documents([document_with_metadata])
      logger.info(f"ドキュメントをアップロードしました: {document_with_metadata['id']}")
      return True

    except AzureError as e:
      logger.error(f"AI Searchアップロードエラー: {e}")
      return False

  def search_documents(self, search_text: str = "", filters: Optional[str] = None,
                       order_by: Optional[List[str]] = None, top: int = 50) -> List[Dict[str, Any]]:
    """
    ドキュメントを検索

    Args:
        search_text: 検索テキスト
        filters: フィルター条件
        order_by: ソート条件
        top: 取得件数

    Returns:
        List[Dict[str, Any]]: 検索結果
    """
    try:
      search_results = self.search_client.search(
          search_text=search_text,
          filter=filters,
          order_by=order_by,
          top=top,
          include_total_count=True
      )

      results = []
      for result in search_results:
        results.append(dict(result))

      logger.info(f"検索結果: {len(results)}件")
      return results

    except AzureError as e:
      logger.error(f"AI Search検索エラー: {e}")
      return []

  def search_by_device(self, device_id: str, start_time: Optional[str] = None,
                       end_time: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    デバイスIDで検索

    Args:
        device_id: デバイスID
        start_time: 開始時刻
        end_time: 終了時刻

    Returns:
        List[Dict[str, Any]]: 検索結果
    """
    try:
      # フィルター条件を構築
      filter_conditions = [f"deviceId eq '{device_id}'"]

      if start_time:
        filter_conditions.append(f"timestamp ge {start_time}")
      if end_time:
        filter_conditions.append(f"timestamp le {end_time}")

      filter_string = " and ".join(filter_conditions)

      return self.search_documents(
          filters=filter_string,
          order_by=["timestamp desc"]
      )

    except Exception as e:
      logger.error(f"デバイス検索エラー: {e}")
      return []

  def search_by_device_type(self, device_type: str) -> List[Dict[str, Any]]:
    """
    デバイスタイプで検索

    Args:
        device_type: デバイスタイプ

    Returns:
        List[Dict[str, Any]]: 検索結果
    """
    try:
      return self.search_documents(
          filters=f"deviceType eq '{device_type}'",
          order_by=["timestamp desc"]
      )

    except Exception as e:
      logger.error(f"デバイスタイプ検索エラー: {e}")
      return []

  def search_by_temperature_range(self, min_temp: float, max_temp: float) -> List[Dict[str, Any]]:
    """
    温度範囲で検索

    Args:
        min_temp: 最小温度
        max_temp: 最大温度

    Returns:
        List[Dict[str, Any]]: 検索結果
    """
    try:
      return self.search_documents(
          filters=f"temperature ge {min_temp} and temperature le {max_temp}",
          order_by=["temperature desc"]
      )

    except Exception as e:
      logger.error(f"温度範囲検索エラー: {e}")
      return []

  def search_by_person_count(self, min_count: int, max_count: int) -> List[Dict[str, Any]]:
    """
    人数範囲で検索

    Args:
        min_count: 最小人数
        max_count: 最大人数

    Returns:
        List[Dict[str, Any]]: 検索結果
    """
    try:
      return self.search_documents(
          filters=f"personCount ge {min_count} and personCount le {max_count}",
          order_by=["personCount desc"]
      )

    except Exception as e:
      logger.error(f"人数範囲検索エラー: {e}")
      return []

  def get_facets(self, field_name: str, count: int = 10) -> List[Dict[str, Any]]:
    """
    ファセット検索

    Args:
        field_name: フィールド名
        count: 取得件数

    Returns:
        List[Dict[str, Any]]: ファセット結果
    """
    try:
      search_results = self.search_client.search(
          search_text="*",
          facets=[f"{field_name},count:{count}"],
          top=0
      )

      facets = []
      for result in search_results.get_facets():
        if field_name in result:
          facets = result[field_name]
          break

      return facets

    except AzureError as e:
      logger.error(f"ファセット検索エラー: {e}")
      return []

  def get_statistics(self) -> Dict[str, Any]:
    """
    統計情報を取得

    Returns:
        Dict[str, Any]: 統計情報
    """
    try:
      # デバイスタイプ別の統計
      device_types = self.get_facets("deviceType")

      # 温度の統計
      temp_results = self.search_documents("*", top=1000)
      temperatures = [r.get("temperature", 0) for r in temp_results if r.get("temperature")]

      # 人数の統計
      person_counts = [r.get("personCount", 0) for r in temp_results if r.get("personCount")]

      stats = {
          "device_types": device_types,
          "temperature": {
              "count": len(temperatures),
              "average": sum(temperatures) / len(temperatures) if temperatures else 0,
              "min": min(temperatures) if temperatures else 0,
              "max": max(temperatures) if temperatures else 0
          },
          "person_count": {
              "count": len(person_counts),
              "average": sum(person_counts) / len(person_counts) if person_counts else 0,
              "min": min(person_counts) if person_counts else 0,
              "max": max(person_counts) if person_counts else 0
          },
          "total_documents": len(temp_results)
      }

      return stats

    except Exception as e:
      logger.error(f"統計情報取得エラー: {e}")
      return {}

  def delete_document(self, document_id: str) -> bool:
    """
    ドキュメントを削除

    Args:
        document_id: ドキュメントID

    Returns:
        bool: 成功時True
    """
    try:
      self.search_client.delete_documents([{"id": document_id}])
      logger.info(f"ドキュメントを削除しました: {document_id}")
      return True

    except AzureError as e:
      logger.error(f"AI Search削除エラー: {e}")
      return False

  def create_index_if_not_exists(self) -> bool:
    """
    インデックスが存在しない場合は作成

    Returns:
        bool: 成功時True
    """
    try:
      # インデックスが存在するかチェック
      try:
        self.index_client.get_index(self.search_index_name)
        logger.info(f"インデックスは既に存在します: {self.search_index_name}")
        return True
      except AzureError:
        # インデックスが存在しない場合は作成
        pass

      # インデックス定義
      index = SearchIndex(
          name=self.search_index_name,
          fields=[
              SimpleField(name="id", type=SearchFieldDataType.String, key=True),
              SearchableField(name="deviceId", type=SearchFieldDataType.String, filterable=True, sortable=True, facetable=True),
              SearchableField(name="deviceType", type=SearchFieldDataType.String, filterable=True, sortable=True, facetable=True),
              SimpleField(name="timestamp", type=SearchFieldDataType.DateTimeOffset, filterable=True, sortable=True),
              SimpleField(name="temperature", type=SearchFieldDataType.Double, filterable=True, sortable=True, facetable=True),
              SimpleField(name="humidity", type=SearchFieldDataType.Double, filterable=True, sortable=True, facetable=True),
              SimpleField(name="co2", type=SearchFieldDataType.Double, filterable=True, sortable=True, facetable=True),
              SimpleField(name="personCount", type=SearchFieldDataType.Int32, filterable=True, sortable=True, facetable=True),
              SearchableField(name="content", type=SearchFieldDataType.String, analyzer="ja.microsoft"),
              SimpleField(name="uploaded_at", type=SearchFieldDataType.DateTimeOffset, filterable=True, sortable=True)
          ]
      )

      self.index_client.create_index(index)
      logger.info(f"インデックスを作成しました: {self.search_index_name}")
      return True

    except AzureError as e:
      logger.error(f"インデックス作成エラー: {e}")
      return False
