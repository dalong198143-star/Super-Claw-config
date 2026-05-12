Write-Host "========== C盘空间分析报告 =========="
Write-Host ""

$folders = @(
    "C:\Windows",
    "C:\Users",
    "C:\Program Files",
    "C:\Program Files (x86)"
)

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        $size = (Get-ChildItem -Path $folder -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
        if ($size -ne $null) {
            $sizeGB = [math]::Round($size / 1GB, 2)
            Write-Host "$folder`: $sizeGB GB"
        }
    }
}

Write-Host ""
Write-Host "========== 用户目录详细分析 =========="
$userDir = "C:\Users"
if (Test-Path $userDir) {
    Get-ChildItem -Path $userDir -Directory | ForEach-Object {
        $size = (Get-ChildItem -Path $_.FullName -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
        if ($size -ne $null) {
            $sizeGB = [math]::Round($size / 1GB, 2)
            Write-Host "  $($_.Name): $sizeGB GB"
        }
    }
}

Write-Host ""
Write-Host "========== 常见大文件位置检查 =========="
$commonLarge = @(
    "C:\Users\*\Downloads",
    "C:\Users\*\Documents",
    "C:\Users\*\WeChat Files",
    "C:\Users\*\Tencent Files",
    "C:\Users\*\AppData\Local\Google\Chrome",
    "C:\Users\*\AppData\Local\Microsoft\Edge"
)

foreach ($path in $commonLarge) {
    $expanded = Resolve-Path $path -ErrorAction SilentlyContinue
    if ($expanded) {
        $size = (Get-ChildItem -Path $expanded.Path -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
        if ($size -ne $null -and $size -gt 100MB) {
            $sizeGB = [math]::Round($size / 1GB, 2)
            Write-Host "$($expanded.Path): $sizeGB GB"
        }
    }
}

Write-Host ""
Write-Host "========== 分析完成！ =========="
