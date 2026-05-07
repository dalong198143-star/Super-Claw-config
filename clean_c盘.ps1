Write-Host "========== 开始清理C盘临时文件 =========="

Write-Host "`n1. 清理用户临时文件夹..."
try {
    Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ 用户临时文件夹已清理"
} catch {
    Write-Host "   ⚠️ 用户临时文件夹清理部分文件失败（可能正在使用）"
}

Write-Host "`n2. 清理系统临时文件夹..."
try {
    Remove-Item -Path "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✅ 系统临时文件夹已清理"
} catch {
    Write-Host "   ⚠️ 系统临时文件夹清理部分文件失败（可能正在使用）"
}

Write-Host "`n3. 清理浏览器缓存文件夹..."
try {
    $chromeCache = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache"
    if (Test-Path $chromeCache) {
        Remove-Item -Path "$chromeCache\*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Chrome缓存已清理"
    }
} catch {
    Write-Host "   ⚠️ Chrome缓存清理失败"
}

try {
    $edgeCache = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache"
    if (Test-Path $edgeCache) {
        Remove-Item -Path "$edgeCache\*" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✅ Edge缓存已清理"
    }
} catch {
    Write-Host "   ⚠️ Edge缓存清理失败"
}

Write-Host "`n4. 清理回收站..."
try {
    $shell = New-Object -ComObject Shell.Application
    $recycleBin = $shell.NameSpace(0xA)
    $items = $recycleBin.Items()
    if ($items.Count -gt 0) {
        $recycleBin.Items() | ForEach-Object {
            $_.Delete()
        }
        Write-Host "   ✅ 回收站已清空"
    } else {
        Write-Host "   ℹ️ 回收站已为空"
    }
} catch {
    Write-Host "   ⚠️ 回收站清理失败（可能需要管理员权限）"
}

Write-Host "`n========== 清理完成！ =========="
