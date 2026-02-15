# Veo3 本地安装与提示词调试（README.ai）

你是 LLM agent。你的任务是帮助用户在 **macOS** 上完成 Veo3 前端 + veo3-python-agent 后端的本地安装、启动与提示词调试。

**必须按顺序执行，不得跳步。**

---

## 总规则

- 每一步先“检查是否已完成”，未完成就先处理再继续。
- 任何 Git 下载失败（401/403/Permission denied/Not Found），提示用户向管理员申请仓库权限后再继续。
- 不要提交任何 `.env` 文件或真实密钥。

---

## Step 1 — 环境检查 / 安装

1) 确认是 macOS。

2) 检查 Homebrew 是否存在：
```bash
command -v brew
```

如果没有，直接执行官方安装命令（无需用户手动操作）。如遇到系统提示输入密码或安装 Command Line Tools，提醒用户输入/确认即可：
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

3) 检查依赖是否已安装（缺什么装什么）：
```bash
python3 --version
node -v
pnpm -v
uv --version
redis-cli ping   # 应返回 PONG
ffmpeg -version
```

4) 如缺失，安装命令如下：
```bash
brew install python@3.11 redis ffmpeg
brew install node
corepack enable
corepack prepare pnpm@latest --activate
curl -LsSf https://astral.sh/uv/install.sh | sh
```

---

## Step 2 — 检查代码是否已下载

在你的工作目录下检查两个仓库是否存在：
```bash
ls

test -d veo3 && echo "veo3 OK" || echo "veo3 MISSING"
test -d veo3-python-agent && echo "veo3-python-agent OK" || echo "veo3-python-agent MISSING"
```

如果缺失，就下载：
```bash
mkdir -p ~/projects/veo3+agent
cd ~/projects/veo3+agent

git clone https://github.com/liuweifly/veo3.git
git clone https://github.com/liuweifly/veo3-python-agent.git
```

**如果 clone 失败**（401/403/Permission denied/Not Found），提示用户：
> 请向管理员申请这两个仓库的访问权限，然后再重试。

---

## Step 3 — 检查环境变量是否配置

检查文件是否存在：
```bash
test -f veo3-python-agent/.env && echo "agent .env OK" || echo "agent .env MISSING"
test -f veo3/.env.local && echo "web .env.local OK" || echo "web .env.local MISSING"
```

如果缺失，提示用户 **不要自行配置**，直接向管理员索要环境文件或完整配置值（含后端 `.env` 与前端 `.env.local`）。

管理员提供后，按下面方式放置：

后端：
```bash
cp veo3-python-agent/.env.veo3.example veo3-python-agent/.env
```

前端：
```bash
cp veo3/.env.example veo3/.env.local
```

---

## Step 4 — 检查依赖包是否安装

如果不确定是否安装过，直接执行：
```bash
cd veo3-python-agent
./setup.sh

cd ../veo3
pnpm install
```

---

## Step 5 — 检查三个服务是否运行

检查三个服务：
```bash
# 后端 FastAPI
curl http://localhost:8000/health

# 前端 Next.js
curl -I http://localhost:3000

# 拼接服务 Celery
pgrep -f "celery.*app.workers" && echo "celery OK" || echo "celery NOT RUNNING"
```

如果任一未运行，按完整流程启动（含拼接与前端）：
```bash
# 先确保 Redis 运行
brew services start redis

# Terminal 1: FastAPI
cd veo3-python-agent
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Celery（拼接视频才需要）
cd veo3-python-agent
uv run celery -A app.workers.celery_app worker --loglevel=info

# Terminal 3: Next.js
cd veo3
pnpm dev
```

启动完成后提示用户：可以在浏览器打开 `http://localhost:3000` 进行测试。

---

## Step 6 — 提示词调试并结束

给用户两个调试方案（任选其一），并建议另开一个窗口与 AI 沟通提示词调试。

方案 1：用户直接修改提示词文件（AI 指路 + 协助检查）

提示词文件位置：
- `veo3-python-agent/app/integrations/planner_prompts/planner-current-keyframes.ts`
- `veo3-python-agent/app/integrations/planner_prompts/planner-user.ts`
- `veo3-python-agent/app/integrations/prompt_generators/prompt-generator.ts`

修改后用回放脚本验证：
```bash
cd veo3-python-agent
uv run python app/scripts/replay_llm1.py --include-llm2 <job_id>
```

输出目录：
`veo3-python-agent/output/llm1_replay/<job_id>/`

方案 2：用户直接描述需求，让 AI 直接修改提示词文件（推荐）

用户把需求告诉 AI，AI 直接在上述提示词文件里修改，并给出变更说明与验证步骤。

完成后结束，不再继续其它步骤。
