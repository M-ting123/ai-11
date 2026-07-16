@echo off
chcp 65001 >nul
cd /d "C:\Users\Mting\WorkBuddy\游戏项目1\export\vercel-gz"
echo === 正在部署 逆转AI·法庭 到 Vercel ===
echo.
echo 首次运行会自动下载 Vercel CLI，请等待...
echo.
call npx vercel --token=vcp_7U0pcnrK0qxl6GgdeZ3PGmuODuNFt3MBSfoMyZbgu7srjuE4134CTP4u --prod --yes --name=reverse-ai-court
echo.
echo 部署完成！如果上方显示了 URL，请复制到浏览器打开。
echo.
pause
