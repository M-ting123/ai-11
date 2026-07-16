@echo off
set PAGES_SOURCE=skills
cd /d "c:\Users\Mting\WorkBuddy\游戏项目1\ai-\deploy-cn-fix"
echo Starting deployment...
edgeone makers deploy -n "reverse-ai-court-cn2" -t "zDehqNl4/OcQgFsw6eVt+AdFZUgMFXuXMv4ecsznwOA=" -e production --json > "c:\Users\Mting\WorkBuddy\游戏项目1\ai-\deploy-output-fix.json" 2>&1
echo.
echo Deployment completed! Check deploy-output-fix.json for results.
pause
