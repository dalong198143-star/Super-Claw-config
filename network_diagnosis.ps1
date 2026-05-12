Write-Host "========== 网络环境诊断报告 =========="
Write-Host ""

Write-Host "📶 【网络适配器状态】"
Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | Select-Object Name, InterfaceDescription, Status, LinkSpeed | Format-Table -AutoSize

Write-Host ""
Write-Host "📡 【WiFi连接信息】"
$wifi = netsh wlan show interfaces | Select-String "SSID|信号|接收速率|信道|加密"
$wifi | ForEach-Object { Write-Host $_.Line }

Write-Host ""
Write-Host "📊 【网络延迟测试】"
Write-Host "正在测试延迟..."
Test-Connection -ComputerName www.baidu.com -Count 5 | Select-Object Address, ResponseTime | Format-Table -AutoSize

Write-Host ""
Write-Host "🌐 【网络速度测试】"
Write-Host "正在测试下载速度..."
$speed = Invoke-WebRequest -Uri "http://speedtest.tele2.net/10MB.zip" -UseBasicParsing -TimeoutSec 30
$downloadTime = $speed.BaseResponse.ResponseTime / 1000
$speedMbps = [math]::Round((10 * 8) / $downloadTime, 2)
Write-Host "下载速度: $speedMbps Mbps"

Write-Host ""
Write-Host "🔧 【路由器连接检查】"
$routerIP = (Get-NetRoute | Where-Object { $_.DestinationPrefix -eq '0.0.0.0/0' } | Select-Object -First 1).NextHop
Write-Host "网关(路由器)IP: $routerIP"
try {
    Test-Connection -ComputerName $routerIP -Count 3 -ErrorAction Stop | Select-Object ResponseTime | Format-Table -AutoSize
} catch {
    Write-Host "⚠️  无法连接到路由器，请检查物理连接"
}

Write-Host ""
Write-Host "========== 诊断完成！ =========="
Write-Host ""
Write-Host "💡 建议："
Write-Host "1. 如果延迟高，尝试重启路由器"
Write-Host "2. 如果WiFi信号弱，靠近路由器或使用5GHz频段"
Write-Host "3. 如果速度慢，检查是否有人占用带宽或重启路由器"
