import logging
import azure.functions as func
import json
from datetime import datetime
import uuid


def main(req: func.HttpRequest, outputDocument: func.Out[func.Document]) -> func.HttpResponse:
  logging.info('Python HTTP trigger function processed a request.')

  try:
    # リクエストからデータソースを取得
    source = req.route_params.get('source')

    # リクエストボディを取得
    req_body = req.get_json()

    # データの正規化
    normalized_data = normalize_data(source, req_body)

    # Cosmos DBに保存
    document = {
        "id": str(uuid.uuid4()),
        "source": source,
        "timestamp": datetime.utcnow().isoformat(),
        "data": normalized_data,
        "deviceId": normalized_data.get("deviceId", "unknown"),
        "type": "sensor_data"
    }
    outputDocument.set(func.Document.from_dict(document))

    return func.HttpResponse(
        json.dumps({"status": "success", "message": "Data collected successfully"}),
        status_code=200,
        mimetype="application/json"
    )

  except Exception as e:
    logging.error(f'Error processing request: {str(e)}')
    return func.HttpResponse(
        json.dumps({"status": "error", "message": str(e)}),
        status_code=500,
        mimetype="application/json"
    )


def normalize_data(source: str, data: dict) -> dict:
  """データソース別のデータ正規化"""

  if source == "aitrios":
    return normalize_aitrios_data(data)
  elif source == "gemini":
    return normalize_gemini_data(data)
  elif source == "kaiteki":
    return normalize_kaiteki_data(data)
  else:
    return data


def normalize_aitrios_data(data: dict) -> dict:
  """SONY AITRIOSデータの正規化"""
  return {
      "deviceId": data.get("deviceId", "aitrios-unknown"),
      "deviceType": "aitrios",
      "timestamp": data.get("timestamp", datetime.utcnow().isoformat()),
      "personCount": data.get("personCount", 0),
      "ageDistribution": data.get("ageDistribution", []),
      "genderDistribution": data.get("genderDistribution", []),
      "confidence": data.get("confidence", 0.0),
      "location": data.get("location", {}),
      "rawData": data
  }


def normalize_gemini_data(data: dict) -> dict:
  """Google Geminiデータの正規化"""
  return {
      "deviceId": data.get("deviceId", "gemini-unknown"),
      "deviceType": "gemini",
      "timestamp": data.get("timestamp", datetime.utcnow().isoformat()),
      "behaviorAnalysis": data.get("behaviorAnalysis", {}),
      "emotionAnalysis": data.get("emotionAnalysis", {}),
      "interactionPatterns": data.get("interactionPatterns", []),
      "confidence": data.get("confidence", 0.0),
      "rawData": data
  }


def normalize_kaiteki_data(data: dict) -> dict:
  """快適君データの正規化"""
  return {
      "deviceId": data.get("deviceId", "kaiteki-unknown"),
      "deviceType": "kaiteki",
      "timestamp": data.get("timestamp", datetime.utcnow().isoformat()),
      "temperature": data.get("temperature", 0.0),
      "humidity": data.get("humidity", 0.0),
      "co2": data.get("co2", 0),
      "lightLevel": data.get("lightLevel", 0),
      "noiseLevel": data.get("noiseLevel", 0),
      "occupancy": data.get("occupancy", False),
      "rawData": data
  }
