Write-Host "========== 连接设备检测报告 =========="
Write-Host ""

Write-Host "📡 【获取网关地址】"
$gateway = (Get-NetRoute | Where-Object { $_.DestinationPrefix -eq '0.0.0.0/0' } | Select-Object -First 1).NextHop
Write-Host "路由器IP地址: $gateway"
Write-Host ""

Write-Host "🔍 【扫描局域网设备】"
Write-Host "正在扫描中..."
arp -a | Select-String -Pattern "$gateway|动态|静态" -NotMatch | ForEach-Object {
    $line = $_.Line.Trim()
    if ($line -match '^([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\s+([0-9A-Fa-f-]+)\s+(\w+)') {
        [PSCustomObject]@{
            IP = $matches[1]
            MAC = $matches[2]
            Type = $matches[3]
        }
    }
} | Format-Table -AutoSize

Write-Host ""
Write-Host "📊 【WiFi连接设备】"
try {
    netsh wlan show hostednetwork | Select-String "已连接的客户端" -Context 0,5
} catch {
    Write-Host "⚠️  无法获取WiFi客户端信息"
}

Write-Host ""
Write-Host "========== 检测完成！ =========="
Write-Host ""
Write-Host "💡 提示：如果想查看更详细的设备信息，可以登录路由器管理后台"
Write-Host "路由器管理地址: http://$gateway"
