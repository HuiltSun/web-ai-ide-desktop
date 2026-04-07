# Web AI IDE 一键调试脚本
# 适用于 PowerShell 7+ 环境

# 配置
$ReleaseDir = "E:\web\web-ai-ide\release"
$ServerDir = "E:\web\web-ai-ide\packages\server"
$DockerContainer = "webaiide-postgres"

Write-Host "========================================"
Write-Host "Web AI IDE 一键调试脚本"
Write-Host "========================================"

# 1. 启动 PostgreSQL (Docker)
Write-Host ""
Write-Host "[1/4] 启动 PostgreSQL 数据库..."

try {
    $dockerRunning = docker ps 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  错误: Docker 未运行，请先启动 Docker Desktop"
        exit 1
    }

    $containerExists = docker ps -a --format '{{.Names}}' | Select-String -Pattern "^$DockerContainer$"
    $containerRunning = docker ps --format '{{.Names}}' | Select-String -Pattern "^$DockerContainer$"

    if ($containerRunning) {
        Write-Host "  容器 $DockerContainer 已在运行"
    } elseif ($containerExists) {
        Write-Host "  启动已有容器 $DockerContainer..."
        docker start $DockerContainer
    } else {
        Write-Host "  创建并启动新容器..."
        docker run -d --name $DockerContainer `
            -e POSTGRES_USER=user `
            -e POSTGRES_PASSWORD=password `
            -e POSTGRES_DB=webaiide `
            -p 5432:5432 postgres:16
    }

    Start-Sleep -Seconds 2

    $dbReady = docker exec $DockerContainer pg_isready -U user -d webaiide 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  PostgreSQL 就绪 (localhost:5432)"
    } else {
        Write-Host "  PostgreSQL 启动中..."
        Start-Sleep -Seconds 3
    }
} catch {
    Write-Host "  Docker 操作失败: $_"
}

# 2. 初始化数据库
Write-Host ""
Write-Host "[2/4] 初始化数据库..."

if (Test-Path "$ServerDir\prisma\schema.prisma") {
    Push-Location $ServerDir -ErrorAction SilentlyContinue
    try {
        Write-Host "  生成 Prisma Client..."
        npx prisma generate 2>$null | Out-Null
        Write-Host "  推送数据库 Schema..."
        npx prisma db push 2>$null | Out-Null
        Write-Host "  数据库初始化完成"
    } catch {
        Write-Host "  数据库初始化失败: $_"
    }
    Pop-Location -ErrorAction SilentlyContinue
} else {
    Write-Host "  警告: 未找到 prisma schema，跳过数据库初始化"
}

# 3. 启动后端服务器（新窗口）
Write-Host ""
Write-Host "[3/4] 启动后端服务器 (http://localhost:3001)..."

if (-not (Test-Path "$ServerDir\package.json")) {
    Write-Host "  错误: 未找到 server package.json"
} else {
    Write-Host "  启动命令: npm run dev"
    Write-Host "  工作目录: $ServerDir"

    # 在新窗口启动后端服务器
    Start-Process cmd.exe -ArgumentList "/k cd /d `"$ServerDir`" && npm run dev"

    Write-Host "  后端服务器已在新窗口启动"
    Write-Host "  等待服务器就绪..."

    # 等待服务器启动，最多 20 秒
    $serverReady = $false
    for ($i = 0; $i -lt 10; $i++) {
        Start-Sleep -Seconds 2
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/api/projects" -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401) {
                $serverReady = $true
                Write-Host "  后端服务器就绪 (http://localhost:3001)"
                break
            }
        } catch {
            Write-Host "    检查中... ($($i + 1)/10)"
        }
    }

    if (-not $serverReady) {
        Write-Host "  后端服务器启动中（可能需要几秒钟）"
    }
}

# 4. 查找并启动桌面应用
Write-Host ""
Write-Host "[4/4] 启动桌面应用..."

if (-not (Test-Path $ReleaseDir)) {
    Write-Host "  错误: release 目录不存在: $ReleaseDir"
} else {
    $latestRelease = Get-ChildItem $ReleaseDir -Directory | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($null -eq $latestRelease) {
        Write-Host "  错误: release 目录为空"
    } else {
        $exePath = Join-Path $latestRelease.FullName "win-unpacked\Web AI IDE.exe"

        Write-Host "  最新 release: $($latestRelease.Name)"

        if (Test-Path $exePath) {
            Write-Host "  启动桌面应用..."
            Start-Process $exePath
        } else {
            Write-Host "  错误: 未找到 exe 文件"
        }
    }
}

# 完成信息
Write-Host ""
Write-Host "========================================"
Write-Host "所有服务已启动:"
Write-Host "  - PostgreSQL: localhost:5432"
Write-Host "  - 后端 API:   http://localhost:3001"
Write-Host "  - 桌面应用:   已启动"
Write-Host "========================================"
Write-Host ""
Write-Host "提示: 关闭后端服务器窗口即可停止服务"
Write-Host "========================================"
