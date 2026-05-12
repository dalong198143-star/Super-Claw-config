@echo off
echo ========== C盘快速清理 ==========
echo.
echo 正在清理用户临时文件夹...
del /f /s /q "%temp%\*.*" 2>nul
for /d %%i in ("%temp%\*") do rmdir /s /q "%%i" 2>nul
echo 用户临时文件夹清理完成
echo.
echo 正在清理系统临时文件夹...
del /f /s /q "C:\Windows\Temp\*.*" 2>nul
for /d %%i in ("C:\Windows\Temp\*") do rmdir /s /q "%%i" 2>nul
echo 系统临时文件夹清理完成
echo.
echo ========== 清理完成！ ==========
pause