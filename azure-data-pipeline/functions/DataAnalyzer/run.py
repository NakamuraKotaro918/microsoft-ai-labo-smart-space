import logging
import azure.functions as func
import json
from datetime import datetime, timedelta
from azure.cosmos import CosmosClient
import os


def main(req: func.HttpRequest, outputDocument: func.Out[func.Document]) -> func.HttpResponse:
  logging.info('Data analysis function processed a request.')

  try:
    # 分析期間の取得（デフォルト: 過去1時間）
    hours = int(req.params.get('hours', 1))
    analysis_time = datetime.utcnow() - timedelta(hours=hours)

    # Cosmos DBからデータを取得して分析
    analysis_result = analyze_sensor_data(analysis_time)

    # 分析結果をCosmos DBに保存
    document = {
        "id": f"analysis-{datetime.utcnow().strftime('%Y%m%d-%H%M')}",
        "type": "analysis_data",
        "timestamp": datetime.utcnow().isoformat(),
        "analysisPeriod": {
            "start": analysis_time.isoformat(),
            "end": datetime.utcnow().isoformat(),
            "hours": hours
        },
        "summary": analysis_result
    }

    outputDocument.set(func.Document.from_dict(document))

    return func.HttpResponse(
        json.dumps({
            "status": "success",
            "message": "Analysis completed successfully",
            "result": analysis_result
        }),
        status_code=200,
        mimetype="application/json"
    )

  except Exception as e:
    logging.error(f'Error in data analysis: {str(e)}')
    return func.HttpResponse(
        json.dumps({"status": "error", "message": str(e)}),
        status_code=500,
        mimetype="application/json"
    )


def analyze_sensor_data(since_time: datetime) -> dict:
  """センサーデータの分析・集計"""

  try:
    # Cosmos DB接続
    cosmos_connection = os.environ.get("CosmosDBConnectionString")
    client = CosmosClient.from_connection_string(cosmos_connection)

    # データベースとコンテナの取得
    database = client.get_database_client("smart-space-db")
    container = database.get_container_client("sensor-data")

    # クエリ実行
    query = f"""
        SELECT 
            c.source,
            c.deviceType,
            c.data.personCount as personCount,
            c.data.temperature as temperature,
            c.data.humidity as humidity,
            c.data.co2 as co2,
            c.data.lightLevel as lightLevel,
            c.data.confidence as confidence
        FROM c 
        WHERE c.timestamp >= '{since_time.isoformat()}'
        """

    items = list(container.query_items(query=query, enable_cross_partition_query=True))

    # 分析結果の計算
    result = {
        "totalRecords": len(items),
        "sources": {},
        "deviceTypes": {},
        "environmental": {
            "avgTemperature": 0,
            "avgHumidity": 0,
            "avgCO2": 0,
            "avgLightLevel": 0
        },
        "occupancy": {
            "totalPersonCount": 0,
            "avgConfidence": 0
        }
    }

    # ソース別・デバイス別の集計
    temp_sum = 0
    humidity_sum = 0
    co2_sum = 0
    light_sum = 0
    person_sum = 0
    confidence_sum = 0
    valid_count = 0

    for item in items:
      # ソース別集計
      source = item.get("source", "unknown")
      if source not in result["sources"]:
        result["sources"][source] = 0
      result["sources"][source] += 1

      # デバイス別集計
      device_type = item.get("deviceType", "unknown")
      if device_type not in result["deviceTypes"]:
        result["deviceTypes"][device_type] = 0
      result["deviceTypes"][device_type] += 1

      # 環境データの集計
      if item.get("temperature") is not None:
        temp_sum += item["temperature"]
        humidity_sum += item.get("humidity", 0)
        co2_sum += item.get("co2", 0)
        light_sum += item.get("lightLevel", 0)
        valid_count += 1

      # 人物データの集計
      if item.get("personCount") is not None:
        person_sum += item["personCount"]
        confidence_sum += item.get("confidence", 0)

    # 平均値の計算
    if valid_count > 0:
      result["environmental"]["avgTemperature"] = round(temp_sum / valid_count, 2)
      result["environmental"]["avgHumidity"] = round(humidity_sum / valid_count, 2)
      result["environmental"]["avgCO2"] = round(co2_sum / valid_count, 2)
      result["environmental"]["avgLightLevel"] = round(light_sum / valid_count, 2)

    if len(items) > 0:
      result["occupancy"]["totalPersonCount"] = person_sum
      result["occupancy"]["avgConfidence"] = round(confidence_sum / len(items), 2)

    # 異常値の検出
    result["anomalies"] = detect_anomalies(result["environmental"])

    return result

  except Exception as e:
    logging.error(f"Error analyzing data: {str(e)}")
    return {"error": str(e)}


def detect_anomalies(env_data: dict) -> dict:
  """環境データの異常値検出"""

  anomalies = []

  # 温度の異常値検出
  if env_data["avgTemperature"] > 30:
    anomalies.append({
        "type": "high_temperature",
        "value": env_data["avgTemperature"],
        "threshold": 30,
        "severity": "warning"
    })
  elif env_data["avgTemperature"] < 10:
    anomalies.append({
        "type": "low_temperature",
        "value": env_data["avgTemperature"],
        "threshold": 10,
        "severity": "warning"
    })

  # CO2の異常値検出
  if env_data["avgCO2"] > 1000:
    anomalies.append({
        "type": "high_co2",
        "value": env_data["avgCO2"],
        "threshold": 1000,
        "severity": "critical"
    })

  # 照度の異常値検出
  if env_data["avgLightLevel"] < 100:
    anomalies.append({
        "type": "low_light",
        "value": env_data["avgLightLevel"],
        "threshold": 100,
        "severity": "info"
    })

  return anomalies
