Write-Host "========== C盘快速清理 =========="
Write-Host ""

$tempPath = $env:TEMP
$items = Get-ChildItem -Path $tempPath -Recurse -ErrorAction SilentlyContinue
$totalSize = ($items | Measure-Object -Property Length -Sum).Sum
$totalSizeGB = [math]::Round($totalSize / 1GB, 2)
Write-Host "检测到临时文件夹大小: $totalSizeGB GB"

Write-Host ""
Write-Host "正在清理用户临时文件夹..."

$deletedCount = 0
$deletedSize = 0

foreach ($item in $items) {
    try {
        Remove-Item -Path $item.FullName -Recurse -Force -ErrorAction Stop
        $deletedCount++
        $deletedSize += $item.Length
    } catch {
        # 跳过正在使用的文件
    }
}

$deletedSizeGB = [math]::Round($deletedSize / 1GB, 2)
Write-Host "已删除: $deletedCount 个文件，释放空间: $deletedSizeGB GB"

Write-Host ""
Write-Host "========== 清理完成！ =========="
