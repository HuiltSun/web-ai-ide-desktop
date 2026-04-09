# Web AI IDE 一键调试脚本
# 适用于 PowerShell 7+ 环境

# 配置
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = if ($ScriptDir) { $ScriptDir } else { $PWD }
$ReleaseDir = "$ProjectRoot\release"
$ServerDir = "$ProjectRoot\packages\server"
$DockerContainer = "webaiide-postgres"
$EnvFile = "$ProjectRoot\.env"

Write-Host "========================================"
Write-Host "Web AI IDE 一键调试脚本"
Write-Host "========================================"

# 读取 .env 文件
Write-Host ""
Write-Host "[1/6] 检查环境配置..."

if (Test-Path $EnvFile) {
    Write-Host "  读取 .env 文件..."
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^(.+?)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
            Write-Host "    $key = ****"
        }
    }
}

# 检查数据库配置

if (-not $env:POSTGRES_USER -or -not $env:POSTGRES_PASSWORD) {
    Write-Host ""
    Write-Host "错误: 缺少必需的数据库环境变量"
    Write-Host ""
    Write-Host "请设置以下环境变量后重新运行脚本："
    Write-Host '  $env:POSTGRES_USER  - PostgreSQL 用户名'
    Write-Host '  $env:POSTGRES_PASSWORD - PostgreSQL 密码'
    Write-Host '  $env:POSTGRES_DB - 数据库名称（可选，默认为 webaiide）'
    Write-Host ""
    Write-Host "示例："
    Write-Host '  $env:POSTGRES_USER="myuser"'
    Write-Host '  $env:POSTGRES_PASSWORD="StrongPass123!"'
    Write-Host "  .\debug.ps1"
    exit 1
}

# 检查加密密钥配置
if (-not $env:ENCRYPTION_SECRET) {
    Write-Host ""
    Write-Host "警告: 未设置 ENCRYPTION_SECRET，将自动生成..."
    $randomBytes = [byte[]]::new(32)
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($randomBytes)
    $env:ENCRYPTION_SECRET = [Convert]::ToBase64String($randomBytes)
    Write-Host "  已生成加密密钥 (仅用于开发环境)"
}

$env:POSTGRES_DB = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { 'webaiide' }

Write-Host "  用户名: $env:POSTGRES_USER"
Write-Host "  数据库: $env:POSTGRES_DB"
Write-Host "  加密: 已启用"

# 1. 构建 packages
Write-Host ""
Write-Host "[2/6] 构建 packages..."

$PackagesDir = "$ProjectRoot\packages\electron\"
if (Test-Path "$PackagesDir\package.json") {
    Push-Location $PackagesDir -ErrorAction SilentlyContinue
    try {
        Write-Host "  执行: npm install"
        npm install 2>&1 | ForEach-Object { Write-Host "    $_" }
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  执行: npm run build"
            npm run build 2>&1 | ForEach-Object { Write-Host "    $_" }
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  packages 构建完成"
            } else {
                Write-Host "  packages 构建失败"
                Pop-Location -ErrorAction SilentlyContinue
                exit 1
            }
        } else {
            Write-Host "  packages 构建失败"
            Pop-Location -ErrorAction SilentlyContinue
            exit 1
        }
    } catch {
        Write-Host "  构建失败: $_"
        Pop-Location -ErrorAction SilentlyContinue
        exit 1
    }
    Pop-Location -ErrorAction SilentlyContinue
} else {
    Write-Host "  警告: 未找到 packages/package.json，跳过构建"
}

# 2. 启动 PostgreSQL (Docker)
Write-Host ""
Write-Host "[3/6] 启动 PostgreSQL 数据库..."

try {
    $dockerRunning = docker ps 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  错误: Docker 未运行，请先启动 Docker Desktop"
        exit 1
    }

    $containerExists = docker ps -a --format '{{.Names}}' | Select-String -Pattern "^$DockerContainer$" -Quiet
    $containerRunning = docker ps --format '{{.Names}}' | Select-String -Pattern "^$DockerContainer$" -Quiet

    if ($containerRunning -eq $true) {
        Write-Host "  容器 $DockerContainer 已在运行"
    } elseif ($containerExists -eq $true) {
        Write-Host "  启动已有容器 $DockerContainer..."
        docker start $DockerContainer
    } else {
        Write-Host "  创建并启动新容器..."
        docker run -d --name $DockerContainer `
            -e POSTGRES_USER=$env:POSTGRES_USER `
            -e POSTGRES_PASSWORD=$env:POSTGRES_PASSWORD `
            -e POSTGRES_DB=$env:POSTGRES_DB `
            -p 5432:5432 postgres:16
    }

    Start-Sleep -Seconds 2

    $dbReady = docker exec $DockerContainer pg_isready -U $env:POSTGRES_USER -d $env:POSTGRES_DB 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  PostgreSQL 就绪 (localhost:5432)"
    } else {
        Write-Host "  PostgreSQL 启动中，等待 5 秒..."
        Start-Sleep -Seconds 5
        $dbReady = docker exec $DockerContainer pg_isready -U $env:POSTGRES_USER -d $env:POSTGRES_DB 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  PostgreSQL 就绪 (localhost:5432)"
        } else {
            Write-Host "  警告: PostgreSQL 可能未就绪"
        }
    }
} catch {
    Write-Host "  Docker 操作失败: $_"
}

# 3. 初始化数据库
Write-Host ""
Write-Host "[4/6] 初始化数据库..."

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

# 4. 启动后端服务器（新窗口）
Write-Host ""
Write-Host "[5/6] 启动后端服务器 (http://localhost:3001)..."
# 先关闭可能正在运行的后端进程
Write-Host "  检查并关闭已存在的后端进程..."
$existingNodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*web-ai-ide*" -or $_.CommandLine -like "*server*"
}
if ($existingNodeProcesses) {
    $existingNodeProcesses | Stop-Process -Force
    Write-Host "  已关闭现有后端进程"
    Start-Sleep -Seconds 1
}
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
            $response = Invoke-WebRequest -Uri "http://localhost:3001/api/projects" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            $serverReady = $true
            Write-Host "  后端服务器就绪 (http://localhost:3001)"
            break
        } catch {
            if ($_.Exception.Message -match "Unable to connect" -or $_.Exception.Message -match "No connection could be made") {
                Write-Host "    检查中... ($($i + 1)/10)"
            } else {
                $serverReady = $true
                Write-Host "  后端服务器就绪 (http://localhost:3001)"
                break
            }
        }
    }

    if (-not $serverReady) {
        Write-Host "  后端服务器启动中（可能需要几秒钟）"
    }
}

# 5. 启动桌面应用
Write-Host ""
Write-Host "[6/6] 启动桌面应用..."

$launchBat = "$ProjectRoot\launch.bat"
if (Test-Path $launchBat) {
    Write-Host "  使用 launch.bat 启动桌面应用..."
    Start-Process $launchBat
} else {
    Write-Host "  错误: launch.bat 不存在，请先构建应用"
    Write-Host "  运行: cd packages\electron; npm run build"
}

# 完成信息
Write-Host ""
Write-Host "========================================"
Write-Host "所有服务已启动:"
Write-Host "  - packages:   构建完成"
Write-Host "  - PostgreSQL: localhost:5432"
Write-Host "  - 后端 API:   http://localhost:3001"
Write-Host "  - 桌面应用:   已启动"
Write-Host "========================================"
Write-Host ""
Write-Host "提示: 关闭后端服务器窗口即可停止服务"
Write-Host "========================================"
