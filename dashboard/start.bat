@echo off
chcp 65001 > nul

echo Microsoft AI Labo スマート空間最適化ダッシュボード
echo ==================================================
echo.

REM Pythonのバージョンチェック
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo エラー: Pythonがインストールされていません
    echo Python 3.6以上をインストールしてください
    echo https://www.python.org/downloads/
    pause
    exit /b 1
)

echo 使用するPython: python
echo.

REM 現在のディレクトリに移動
cd /d "%~dp0"

echo ダッシュボードディレクトリ: %CD%
echo.

REM サーバー起動
echo サーバーを起動しています...
echo ブラウザで http://localhost:8000 にアクセスしてください
echo.
echo 終了するには Ctrl+C を押してください
echo ==================================================
echo.

python simple-server.py

pause
