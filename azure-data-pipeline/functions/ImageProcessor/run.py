import logging
import azure.functions as func
import json
from datetime import datetime
import uuid
import base64
from azure.storage.blob import BlobServiceClient
import os


def main(req: func.HttpRequest, outputDocument: func.Out[func.Document]) -> func.HttpResponse:
  logging.info('Image processing function processed a request.')

  try:
    # リクエストボディを取得
    req_body = req.get_json()

    # 画像データの処理
    image_url = process_image(req_body)

    # メタデータをCosmos DBに保存
    document = {
        "id": str(uuid.uuid4()),
        "source": "aitrios",
        "timestamp": datetime.utcnow().isoformat(),
        "deviceId": req_body.get("deviceId", "aitrios-unknown"),
        "deviceType": "aitrios",
        "type": "image_data",
        "imageUrl": image_url,
        "metadata": {
            "personCount": req_body.get("personCount", 0),
            "ageDistribution": req_body.get("ageDistribution", []),
            "genderDistribution": req_body.get("genderDistribution", []),
            "confidence": req_body.get("confidence", 0.0),
            "location": req_body.get("location", {}),
            "imageTimestamp": req_body.get("timestamp", datetime.utcnow().isoformat())
        }
    }

    outputDocument.set(func.Document.from_dict(document))

    return func.HttpResponse(
        json.dumps({
            "status": "success",
            "message": "Image processed successfully",
            "imageUrl": image_url
        }),
        status_code=200,
        mimetype="application/json"
    )

  except Exception as e:
    logging.error(f'Error processing image: {str(e)}')
    return func.HttpResponse(
        json.dumps({"status": "error", "message": str(e)}),
        status_code=500,
        mimetype="application/json"
    )


def process_image(data: dict) -> str:
  """画像データを処理してBlob Storageに保存"""

  try:
    # Blob Storage接続
    connection_string = os.environ.get("AzureWebJobsStorage")
    blob_service_client = BlobServiceClient.from_connection_string(connection_string)

    # コンテナ名
    container_name = "aitrios-images"

    # ファイル名生成
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    device_id = data.get("deviceId", "unknown")
    filename = f"{device_id}_{timestamp}.jpg"

    # 画像データの取得（Base64またはURL）
    image_data = data.get("imageData")

    if image_data:
      # Base64データの場合
      if image_data.startswith("data:image"):
        # data:image/jpeg;base64, の部分を除去
        image_data = image_data.split(",")[1]

      # Base64デコード
      image_bytes = base64.b64decode(image_data)

      # Blobにアップロード
      blob_client = blob_service_client.get_blob_client(
          container=container_name,
          blob=filename
      )

      blob_client.upload_blob(image_bytes, overwrite=True)

      # URLを返す
      return f"https://{blob_service_client.account_name}.blob.core.windows.net/{container_name}/{filename}"

    else:
      # 画像データがない場合はメタデータのみ保存
      return "no-image"

  except Exception as e:
    logging.error(f"Error saving image to blob storage: {str(e)}")
    return "error-saving-image"
