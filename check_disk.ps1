$disk = Get-PSDrive -Name C
$total = [math]::Round(($disk.Used + $disk.Free) / 1GB, 2)
$free = [math]::Round($disk.Free / 1GB, 2)
$used = [math]::Round($disk.Used / 1GB, 2)
Write-Host "C盘总容量: $total GB"
Write-Host "C盘已用: $used GB"
Write-Host "C盘可用: $free GB"
