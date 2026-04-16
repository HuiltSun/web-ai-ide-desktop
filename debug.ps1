# Web AI IDE 一键调试脚本
# 适用于 PowerShell 7+ 环境
# debug.ps1 第一行
#Requires -Version 7
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 | Out-Null
# ── 配置 ──────────────────────────────────────────────
$ScriptDir      = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot    = if ($ScriptDir) { $ScriptDir } else { $PWD }
$ReleaseDir     = "$ProjectRoot\release"
$ServerDir      = "$ProjectRoot\packages\server"
$OpenClaudeDir  = "$ProjectRoot\packages\openclaude-temp"
$ElectronDir    = "$ProjectRoot\packages\electron"   # 统一定义，不再重复
$DockerContainer = "webaiide-postgres"
$EnvFile        = "$ProjectRoot\.env"

# ── 辅助函数 ──────────────────────────────────────────

# 停止占用指定 TCP 端口的进程
function Stop-ProcessOnPort([int]$Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $conn | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 1
        return $true
    }
    return $false
}

# 确保目录下的 npm 依赖已安装
function Ensure-NodeModules([string]$Dir) {
    if ((Test-Path "$Dir\package.json") -and (-not (Test-Path "$Dir\node_modules"))) {
        Write-Host "  安装依赖: $Dir"
        Push-Location $Dir
        npm install 2>&1 | ForEach-Object { Write-Host "    $_" }
        Pop-Location
    }
}

# ── 命令行参数 ────────────────────────────────────────
$BuildOnly = $args -contains "--build"

Write-Host "========================================"
Write-Host "Web AI IDE $(if ($BuildOnly) { '构建模式' } else { '一键调试脚本' })"
Write-Host "========================================"

# ── [1] 环境配置 ──────────────────────────────────────
Write-Host ""
Write-Host "[1] 检查环境配置..."

if (Test-Path $EnvFile) {
    Write-Host "  读取 .env 文件..."
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^([^#=][^=]*)=(.*)$') {
            $key   = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
            Write-Host "    $key = ****"
        }
    }
} else {
    Write-Host "  警告: .env 文件不存在"
}

if (-not $env:POSTGRES_USER -or -not $env:POSTGRES_PASSWORD) {
    Write-Host ""
    Write-Host "错误: 缺少必需的数据库环境变量"
    Write-Host "  请确保根目录 .env 文件包含:"
    Write-Host "    POSTGRES_USER=myuser"
    Write-Host "    POSTGRES_PASSWORD=StrongPass123!"
    Write-Host "    POSTGRES_DB=webaiide"
    exit 1
}

if (-not $env:ENCRYPTION_SECRET) {
    Write-Host "  警告: 未设置 ENCRYPTION_SECRET，将自动生成..."
    $randomBytes = [byte[]]::new(32)
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($randomBytes)
    $env:ENCRYPTION_SECRET = [Convert]::ToBase64String($randomBytes)
    [Environment]::SetEnvironmentVariable("ENCRYPTION_SECRET", $env:ENCRYPTION_SECRET, 'Process')
    Write-Host "  已生成加密密钥 (仅用于开发环境)"
}

$env:POSTGRES_DB = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { 'webaiide' }

Write-Host "  用户名: $env:POSTGRES_USER"
Write-Host "  数据库: $env:POSTGRES_DB"
Write-Host "  加密:   已启用"

# ── 构建模式：跳过 dev 服务，直接构建后退出 ──────────
if ($BuildOnly) {
    Write-Host ""
    Write-Host "[2] 构建 Electron 应用..."

    if (-not (Test-Path "$ElectronDir\package.json")) {
        Write-Host "  错误: 未找到 electron package.json"
        exit 1
    }

    Ensure-NodeModules $ElectronDir

    Write-Host "  构建命令: npm run build"
    Write-Host "  工作目录: $ElectronDir"
    Push-Location $ElectronDir
    try {
        npm run build 2>&1 | ForEach-Object { Write-Host "    $_" }
        Write-Host "  构建完成！"
    } catch {
        Write-Host "  构建失败: $_"
        exit 1
    }
    Pop-Location

    Write-Host ""
    Write-Host "========================================"
    Write-Host "构建完成!"
    Write-Host "  输出目录: $ReleaseDir"
    Write-Host "  启动应用: 双击 launch.bat"
    Write-Host "========================================"
    exit 0
}

# ── 以下仅在调试模式下执行 ────────────────────────────

# ── [2] 检查依赖 ──────────────────────────────────────
Write-Host ""
Write-Host "[2] 检查依赖安装..."
Ensure-NodeModules $ElectronDir
Write-Host "  依赖检查完成"

# ── [3] 启动 PostgreSQL ───────────────────────────────
Write-Host ""
Write-Host "[3] 启动 PostgreSQL 数据库..."

try {
    docker ps 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  错误: Docker 未运行，请先启动 Docker Desktop"
        exit 1
    }

    $containerRunning = docker ps          --format '{{.Names}}' 2>$null | Select-String -Pattern "^$DockerContainer$" -Quiet
    $containerExists  = docker ps -a       --format '{{.Names}}' 2>$null | Select-String -Pattern "^$DockerContainer$" -Quiet

    if ($containerRunning) {
        Write-Host "  重启运行中的容器 $DockerContainer..."
        docker restart $DockerContainer | Out-Null
    } elseif ($containerExists) {
        Write-Host "  启动已有容器 $DockerContainer..."
        docker start $DockerContainer | Out-Null
    } else {
        Write-Host "  创建并启动新容器..."
        docker run -d --name $DockerContainer `
            -e POSTGRES_USER=$env:POSTGRES_USER `
            -e POSTGRES_PASSWORD=$env:POSTGRES_PASSWORD `
            -e POSTGRES_DB=$env:POSTGRES_DB `
            -p 5432:5432 postgres:16 | Out-Null
    }

    # 轮询等待 DB 就绪，最多 30 秒
    $dbReady = $false
    for ($i = 1; $i -le 15; $i++) {
        Start-Sleep -Seconds 2
        docker exec $DockerContainer pg_isready -U $env:POSTGRES_USER -d $env:POSTGRES_DB 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $dbReady = $true; break }
        Write-Host "    等待数据库就绪... ($i/15)"
    }

    if ($dbReady) {
        Write-Host "  PostgreSQL 就绪 (localhost:5432)"
    } else {
        Write-Host "  警告: PostgreSQL 在 30 秒内未就绪，继续执行..."
    }
} catch {
    Write-Host "  Docker 操作失败: $_"
}

# ── [4] 初始化数据库 ──────────────────────────────────
Write-Host ""
Write-Host "[4] 初始化数据库..."

if (Test-Path "$ServerDir\prisma\schema.prisma") {
    Push-Location $ServerDir -ErrorAction SilentlyContinue
    try {
        Write-Host "  生成 Prisma Client..."
        npx prisma generate
        if ($LASTEXITCODE -ne 0) { throw "prisma generate 失败" }

        Write-Host "  推送数据库 Schema..."
        npx prisma db push
        if ($LASTEXITCODE -ne 0) { throw "prisma db push 失败" }

        Write-Host "  数据库初始化完成"
    } catch {
        Write-Host "  数据库初始化失败: $_"
    }
    Pop-Location -ErrorAction SilentlyContinue
} else {
    Write-Host "  警告: 未找到 prisma schema，跳过数据库初始化"
}

# ── [5] 启动后端服务器 ────────────────────────────────
Write-Host ""
Write-Host "[5] 启动后端服务器 (http://localhost:3001)..."

if (-not (Test-Path "$ServerDir\package.json")) {
    Write-Host "  错误: 未找到 server package.json"
} else {
    if (Stop-ProcessOnPort 3001) {
        Write-Host "  已关闭占用 3001 端口的进程"
    }

    Write-Host "  工作目录: $ServerDir"
    Start-Process cmd.exe -ArgumentList "/k cd /d `"$ServerDir`" && npm run dev"
    Write-Host "  后端服务器已在新窗口启动，等待就绪..."

    $serverReady = $false
    for ($i = 1; $i -le 10; $i++) {
        Start-Sleep -Seconds 2
        try {
            Invoke-WebRequest -Uri "http://localhost:3001/api/projects" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop | Out-Null
            $serverReady = $true
            break
        } catch {
            # 非连接错误（如 401/403）说明服务器已在响应
            if ($_.Exception.Message -notmatch "Unable to connect|No connection could be made") {
                $serverReady = $true
                break
            }
            Write-Host "    检查中... ($i/10)"
        }
    }

    Write-Host $(if ($serverReady) { "  后端服务器就绪 (http://localhost:3001)" } else { "  后端服务器启动中（可能需要几秒钟）" })
}

# ── [6] 启动 OpenClaude gRPC 服务器 ───────────────────
Write-Host ""
Write-Host "[6] 启动 OpenClaude gRPC 服务器 (localhost:50051)..."

if (-not (Test-Path "$OpenClaudeDir\package.json")) {
    Write-Host "  警告: 未找到 openclaude-temp package.json，跳过 gRPC 服务器启动"
} else {
    if (Stop-ProcessOnPort 50051) {
        Write-Host "  已关闭占用 50051 端口的进程"
    }

    Write-Host "  工作目录: $OpenClaudeDir"
    Start-Process cmd.exe -ArgumentList "/k cd /d `"$OpenClaudeDir`" && bun run dev:grpc"
    Write-Host "  OpenClaude gRPC 服务器已在新窗口启动，等待就绪..."

    $grpcReady = $false
    for ($i = 1; $i -le 10; $i++) {
        Start-Sleep -Seconds 2
        if ((Test-NetConnection -ComputerName "localhost" -Port 50051 -WarningAction SilentlyContinue).TcpTestSucceeded) {
            $grpcReady = $true
            break
        }
        Write-Host "    检查中... ($i/10)"
    }

    Write-Host $(if ($grpcReady) { "  OpenClaude gRPC 服务器就绪 (localhost:50051)" } else { "  OpenClaude gRPC 服务器启动中（可能需要几秒钟）" })
}


# ── 完成摘要 ──────────────────────────────────────────
Write-Host ""
Write-Host "========================================"
Write-Host "所有服务已启动:"
Write-Host "  - PostgreSQL:       localhost:5432"
Write-Host "  - 后端 API:         http://localhost:3001"
Write-Host "  - OpenClaude gRPC:  localhost:50051"
Write-Host "  - Electron:         已启动"
Write-Host "========================================"
Write-Host ""
Write-Host "生产构建:  .\debug.ps1 --build"
Write-Host "启动构建后的应用: 双击 launch.bat"
Write-Host "停止服务: 关闭对应的 cmd 窗口"
Write-Host "========================================"