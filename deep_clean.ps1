Write-Host "========== C盘彻底清理 =========="
Write-Host ""

$totalCleaned = 0

Write-Host "1. 清理用户临时文件夹..."
$size1 = (Get-ChildItem -Path $env:TEMP -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   释放: $([math]::Round($size1/1MB, 2)) MB"
$totalCleaned += $size1

Write-Host "2. 清理系统临时文件夹..."
$size2 = (Get-ChildItem -Path "C:\Windows\Temp" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
Remove-Item -Path "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   释放: $([math]::Round($size2/1MB, 2)) MB"
$totalCleaned += $size2

Write-Host "3. 清理Prefetch文件夹..."
$size3 = (Get-ChildItem -Path "C:\Windows\Prefetch" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
Remove-Item -Path "C:\Windows\Prefetch\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   释放: $([math]::Round($size3/1MB, 2)) MB"
$totalCleaned += $size3

Write-Host "4. 清理Windows日志文件..."
$size4 = (Get-ChildItem -Path "C:\Windows\Logs" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
Remove-Item -Path "C:\Windows\Logs\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   释放: $([math]::Round($size4/1MB, 2)) MB"
$totalCleaned += $size4

Write-Host "5. 清理Recent文件夹..."
Remove-Item -Path "$env:APPDATA\Microsoft\Windows\Recent\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   释放: 未知（Recent文件）"

Write-Host "6. 清理缩略图缓存..."
Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache_*.db" -Force -ErrorAction SilentlyContinue
Write-Host "   已清理缩略图缓存"

Write-Host "7. 清理Chrome缓存..."
$chromeCache = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache"
if (Test-Path $chromeCache) {
    $size7 = (Get-ChildItem -Path $chromeCache -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    Remove-Item -Path "$chromeCache\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   释放: $([math]::Round($size7/1MB, 2)) MB"
    $totalCleaned += $size7
}

Write-Host "8. 清理Edge缓存..."
$edgeCache = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache"
if (Test-Path $edgeCache) {
    $size8 = (Get-ChildItem -Path $edgeCache -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    Remove-Item -Path "$edgeCache\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   释放: $([math]::Round($size8/1MB, 2)) MB"
    $totalCleaned += $size8
}

Write-Host "9. 清理npm缓存..."
$size9 = (Get-ChildItem -Path "$env:APPDATA\npm-cache" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
Remove-Item -Path "$env:APPDATA\npm-cache\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   释放: $([math]::Round($size9/1MB, 2)) MB"
$totalCleaned += $size9

Write-Host "10. 清理pip缓存..."
$size10 = (Get-ChildItem -Path "$env:LOCALAPPDATA\pip\cache" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
Remove-Item -Path "$env:LOCALAPPDATA\pip\cache\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   释放: $([math]::Round($size10/1MB, 2)) MB"
$totalCleaned += $size10

Write-Host "11. 清理Windows更新下载缓存..."
$size11 = (Get-ChildItem -Path "C:\Windows\SoftwareDistribution\Download" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
Remove-Item -Path "C:\Windows\SoftwareDistribution\Download\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   释放: $([math]::Round($size11/1MB, 2)) MB"
$totalCleaned += $size11

Write-Host "12. 清理下载文件夹（30天以上的文件）..."
$downloads = [Environment]::GetFolderPath("UserProfile") + "\Downloads"
Get-ChildItem -Path $downloads -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | ForEach-Object {
    $size12 += $_.Length
    Remove-Item -Path $_.FullName -Force -ErrorAction SilentlyContinue
}
Write-Host "   释放: $([math]::Round($size12/1MB, 2)) MB"
$totalCleaned += $size12

Write-Host ""
Write-Host "========== 清理完成！ =========="
Write-Host "总共释放空间: $([math]::Round($totalCleaned/1GB, 2)) GB"
