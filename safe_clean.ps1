Write-Host "开始深度清理..."

$cleaned = 0

$paths = @(
    $env:TEMP,
    "C:\Windows\Temp",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache",
    "$env:LOCALAPPDATA\pip\cache",
    "$env:APPDATA\npm-cache",
    "$env:APPDATA\Local\Yarn\Cache",
    "$env:LOCALAPPDATA\npm-cache"
)

foreach ($path in $paths) {
    if (Test-Path $path) {
        $size = (Get-ChildItem -Path $path -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        if ($size -gt 0) {
            Write-Host "清理 $path ..."
            Write-Host "  大小: $([math]::Round($size/1MB, 2)) MB"
            Get-ChildItem -Path $path -Recurse -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
            $cleaned += $size
        }
    }
}

Write-Host ""
Write-Host "清理Recent文件夹..."
Remove-Item -Path "$env:APPDATA\Microsoft\Windows\Recent\*" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "清理缩略图..."
Remove-Item -Path "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache_*.db" -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "完成！释放空间: $([math]::Round($cleaned/1GB, 2)) GB"
