#!/usr/bin/env python3
"""
Smart Space システム統合テストスクリプト
アーキテクチャ図に沿ったデータフローのテスト
"""

import requests
import json
import time
from datetime import datetime
import random


class SmartSpaceIntegrationTest:
  def __init__(self, base_url="http://localhost:7071"):
    self.base_url = base_url
    self.test_results = []

  def log_test(self, test_name, success, message, data=None):
    """テスト結果を記録"""
    result = {
        "test": test_name,
        "success": success,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        "data": data
    }
    self.test_results.append(result)

    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}: {message}")

    if data:
      print(f"   Data: {json.dumps(data, indent=2, ensure_ascii=False)}")
    print()

  def test_kaiteki_sensor_data(self):
    """快適君センサーデータのテスト"""
    print("🔍 Testing KAITEKI → IoT Hub → Functions → Cosmos DB flow...")

    # 快適君データのシミュレーション
    kaiteki_data = {
        "deviceId": "kaiteki-001",
        "timestamp": datetime.utcnow().isoformat(),
        "temperature": round(random.uniform(20, 25), 1),
        "humidity": round(random.uniform(40, 60), 1),
        "co2": random.randint(400, 600),
        "lightLevel": random.randint(200, 800),
        "noiseLevel": random.randint(30, 70),
        "occupancy": random.choice([True, False])
    }

    try:
      # Functionsに直接データ送信（IoT Hub経由のシミュレーション）
      response = requests.post(
          f"{self.base_url}/api/collect/kaiteki",
          json=kaiteki_data,
          headers={"Content-Type": "application/json"}
      )

      if response.status_code == 200:
        result = response.json()
        self.log_test(
            "KAITEKI Sensor Data Flow",
            True,
            "Data collected successfully",
            {"sent": kaiteki_data, "response": result}
        )
      else:
        self.log_test(
            "KAITEKI Sensor Data Flow",
            False,
            f"HTTP {response.status_code}: {response.text}"
        )

    except Exception as e:
      self.log_test(
          "KAITEKI Sensor Data Flow",
          False,
          f"Connection error: {str(e)}"
      )

  def test_aitrios_data(self):
    """SONY AITRIOSデータのテスト"""
    print("🔍 Testing AITRIOS → Functions → Cosmos DB flow...")

    # AITRIOSデータのシミュレーション
    aitrios_data = {
        "deviceId": "aitrios-001",
        "timestamp": datetime.utcnow().isoformat(),
        "personCount": random.randint(0, 10),
        "ageDistribution": [random.randint(20, 60) for _ in range(4)],
        "genderDistribution": [random.randint(30, 70) for _ in range(3)],
        "confidence": round(random.uniform(0.8, 0.98), 2),
        "location": {"x": random.randint(0, 100), "y": random.randint(0, 100)}
    }

    try:
      response = requests.post(
          f"{self.base_url}/api/collect/aitrios",
          json=aitrios_data,
          headers={"Content-Type": "application/json"}
      )

      if response.status_code == 200:
        result = response.json()
        self.log_test(
            "AITRIOS Data Flow",
            True,
            "Data collected successfully",
            {"sent": aitrios_data, "response": result}
        )
      else:
        self.log_test(
            "AITRIOS Data Flow",
            False,
            f"HTTP {response.status_code}: {response.text}"
        )

    except Exception as e:
      self.log_test(
          "AITRIOS Data Flow",
          False,
          f"Connection error: {str(e)}"
      )

  def test_gemini_api(self):
    """Google Gemini APIデータのテスト"""
    print("🔍 Testing GEMINI → Functions → Cosmos DB flow...")

    # Geminiデータのシミュレーション
    gemini_data = {
        "deviceId": "gemini-001",
        "timestamp": datetime.utcnow().isoformat(),
        "behaviorAnalysis": {
            "activity": random.choice(["walking", "standing", "sitting"]),
            "interaction": random.choice(["none", "low", "medium", "high"])
        },
        "emotionAnalysis": {
            "primary": random.choice(["happy", "neutral", "concerned"]),
            "confidence": round(random.uniform(0.7, 0.95), 2)
        },
        "interactionPatterns": [
            random.choice(["entrance", "exit", "waiting", "active"])
            for _ in range(random.randint(1, 3))
        ],
        "confidence": round(random.uniform(0.8, 0.98), 2)
    }

    try:
      response = requests.post(
          f"{self.base_url}/api/collect/gemini",
          json=gemini_data,
          headers={"Content-Type": "application/json"}
      )

      if response.status_code == 200:
        result = response.json()
        self.log_test(
            "GEMINI API Flow",
            True,
            "Data collected successfully",
            {"sent": gemini_data, "response": result}
        )
      else:
        self.log_test(
            "GEMINI API Flow",
            False,
            f"HTTP {response.status_code}: {response.text}"
        )

    except Exception as e:
      self.log_test(
          "GEMINI API Flow",
          False,
          f"Connection error: {str(e)}"
      )

  def test_data_analysis(self):
    """データ分析機能のテスト"""
    print("🔍 Testing Data Analysis Function...")

    try:
      # 過去1時間のデータ分析
      response = requests.get(
          f"{self.base_url}/api/analyze?hours=1"
      )

      if response.status_code == 200:
        result = response.json()
        self.log_test(
            "Data Analysis",
            True,
            "Analysis completed successfully",
            result
        )
      else:
        self.log_test(
            "Data Analysis",
            False,
            f"HTTP {response.status_code}: {response.text}"
        )

    except Exception as e:
      self.log_test(
          "Data Analysis",
          False,
          f"Connection error: {str(e)}"
      )

  def test_image_processing(self):
    """画像処理機能のテスト"""
    print("🔍 Testing Image Processing Function...")

    # 画像データのシミュレーション（Base64エンコードされた小さな画像）
    # 実際のテストでは1x1ピクセルのJPEG画像を使用
    sample_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

    image_data = {
        "deviceId": "aitrios-001",
        "timestamp": datetime.utcnow().isoformat(),
        "personCount": 3,
        "ageDistribution": [25, 35, 45],
        "genderDistribution": [60, 40, 0],
        "confidence": 0.92,
        "location": {"x": 150, "y": 200},
        "imageData": f"data:image/jpeg;base64,{sample_image_base64}"
    }

    try:
      response = requests.post(
          f"{self.base_url}/api/process-image",
          json=image_data,
          headers={"Content-Type": "application/json"}
      )

      if response.status_code == 200:
        result = response.json()
        self.log_test(
            "Image Processing",
            True,
            "Image processed successfully",
            {"sent": {**image_data, "imageData": "[BASE64_DATA]"}, "response": result}
        )
      else:
        self.log_test(
            "Image Processing",
            False,
            f"HTTP {response.status_code}: {response.text}"
        )

    except Exception as e:
      self.log_test(
          "Image Processing",
          False,
          f"Connection error: {str(e)}"
      )

  def run_all_tests(self):
    """すべてのテストを実行"""
    print("🚀 Starting Smart Space Integration Tests...")
    print("=" * 60)
    print()

    # 各データフローのテスト
    self.test_kaiteki_sensor_data()
    time.sleep(1)  # データの順序を保つため

    self.test_aitrios_data()
    time.sleep(1)

    self.test_gemini_api()
    time.sleep(1)

    # 分析機能のテスト
    self.test_data_analysis()
    time.sleep(1)

    # 画像処理のテスト
    self.test_image_processing()

    # テスト結果のサマリー
    self.print_summary()

  def print_summary(self):
    """テスト結果のサマリーを表示"""
    print("=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)

    total_tests = len(self.test_results)
    passed_tests = sum(1 for r in self.test_results if r["success"])
    failed_tests = total_tests - passed_tests

    print(f"Total Tests: {total_tests}")
    print(f"✅ Passed: {passed_tests}")
    print(f"❌ Failed: {failed_tests}")
    print(f"Success Rate: {(passed_tests / total_tests) * 100:.1f}%")
    print()

    if failed_tests > 0:
      print("Failed Tests:")
      for result in self.test_results:
        if not result["success"]:
          print(f"  - {result['test']}: {result['message']}")

    print()
    if passed_tests == total_tests:
      print("🎉 All tests passed! The architecture is working correctly.")
    else:
      print("⚠️  Some tests failed. Please check the implementation.")


if __name__ == "__main__":
  # テストの実行
  tester = SmartSpaceIntegrationTest()
  tester.run_all_tests()
