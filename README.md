# mee-personal-insight-site 国内访问可用性优化（Vercel + EdgeOne 镜像）

> 本仓库为静态站点，不改正文内容，仅调整发布/运维接入：
> - 保留 **Vercel** 主链路，不动页面正文与资源原文。
> - 增加 **EdgeOne Pages** 国内镜像作为优先备援（未就绪时可临时切到 COS/Cloudflare Pages）。

## 一、当前目标与角色划分

- 主链路（Production）：`Vercel`
  - 负责全球访问、主域名 `www` 对应域名（或官方 `*.vercel.app` 访问）。
- 镜像链路（China）：`EdgeOne Pages`
  - 负责大陆访问优先，独立部署同一份静态站点产物。
  - 如短期 EdgeOne 不可用，可回退到 `COS + CDN` 或 `Cloudflare Pages`。

## 二、文件检查状态（站点正文保持不变）

- `index.html`：存在
- `script.js`：存在
- `styles.css`：存在
- `public/assets/`：存在（图片资源目录）
- `vercel.json`：存在

## 三、仓库脚本与约定

新增/修正文件：`scripts/publish-dual.sh`

- 默认动作：
  - 同时发布到 Vercel 主链路 + 国内镜像。
- 支持参数：
  - `--vercel`：仅发布 Vercel
  - `--edgeone`：仅发布 EdgeOne
  - 不带参数：默认主+镜像双发

## 四、环境变量约定

### 必选/常用变量（本仓库约定）

- `VERCEL_DEPLOY_CMD`
  - Vercel 发布命令（默认：`vercel --prod`）
  - 建议 CI/本地统一使用该约定，便于脚本兼容。
- `EDGEONE_DEPLOY_CMD`
  - 国内镜像发布命令（必选用于镜像部署）
  - 推荐保持命令与项目参数通过环境变量注入，避免命令泄露。
- `VERCEL_PRIMARY_URL`
  - Vercel 生产域名，用于发布后验收。
- `EDGEONE_MIRROR_URL`
  - EdgeOne 镜像域名，用于发布后验收。

### 建议的扩展变量（如你的 CLI 需要）

- `EDGEONE_PROJECT_ID` / `EDGEONE_PROJECT_NAME`
- `EDGEONE_TOKEN`
- `CLOUDCRAFT_MIRROR_CMD`（仅当你回退到 COS/Cloudflare Pages 时才设置）

## 五、`scripts/publish-dual.sh` 使用说明

```bash
cd /Users/michael/ai/projects/mee-personal-insight-site

# 赋予执行权限
chmod +x scripts/publish-dual.sh

# 仅首次本地准备，后续可复用
./scripts/publish-dual.sh --help
```

发布示例：

```bash
# 默认：Vercel + EdgeOne
VERCEL_DEPLOY_CMD="vercel --prod" \
EDGEONE_DEPLOY_CMD="edgeone pages deploy . --project-id \"$EDGEONE_PROJECT_ID\" --token \"$EDGEONE_TOKEN\"" \
./scripts/publish-dual.sh

# 仅发布 Vercel
VERCEL_DEPLOY_CMD="vercel --prod" \
./scripts/publish-dual.sh --vercel

# 仅发布 EdgeOne
EDGEONE_DEPLOY_CMD="edgeone pages deploy . --project-id \"$EDGEONE_PROJECT_ID\" --token \"$EDGEONE_TOKEN\"" \
./scripts/publish-dual.sh --edgeone
```

## 六、EdgeOne Pages 部署步骤与命令模板

### 方案 A（优先，推荐）

1. 在 EdgeOne 控制台先建好 Pages 项目，并生成可发布 Token。
2. 在项目域名页中绑定大陆访问域名（例如 `insight.mee.cn`）。
3. 配置 CNAME/解析到 EdgeOne 下发的 Pages 目标域名。
4. 在项目目录执行：

```bash
export EDGEONE_PROJECT_ID="<你的 EdgeOne Project ID>"
export EDGEONE_TOKEN="<你的 EdgeOne API Token>"
export EDGEONE_MIRROR_URL="https://insight.mee.cn"

export EDGEONE_DEPLOY_CMD='edgeone pages deploy . --project-id "$EDGEONE_PROJECT_ID" --token "$EDGEONE_TOKEN"'
./scripts/publish-dual.sh --edgeone
```

### 方案 B（备选：COS + CDN/Cloudflare Pages）

```bash
# 例如：上传构建产物到 COS 后回源到 CDN 或 Cloudflare Pages 部署目录
export CLOUDCRAFT_MIRROR_CMD='sh ./scripts/deploy-cos-cdn.sh'
$CLOUDCRAFT_MIRROR_CMD
```

> 说明：仓库当前只提供 EdgeOne 优先命令模板。COS/Cloudflare 为补充通道，需要你已有对应流水线后再接入。

## 七、发布后验收清单

1. 记录发布起始时间

```bash
export RELEASE_AT_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "Release at: $RELEASE_AT_UTC"
```

2. 同时验证两个 URL

```bash
curl -I "$VERCEL_PRIMARY_URL"
curl -I "$EDGEONE_MIRROR_URL"
```

3. 验证关键页面可用（推荐）

```bash
curl -L "$VERCEL_PRIMARY_URL" | head -n 5
curl -L "$EDGEONE_MIRROR_URL" | head -n 5
```

4. 记录首次发布时间（可选）

```bash
VERCEL_DEPLOY_TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "Vercel+EdgeOne deployed at $VERCEL_DEPLOY_TS"
```

## 八、回滚说明

- Vercel 回滚
  - 在 Vercel 控制台选择目标 Project -> Deployments -> 选择稳定版本 "Promote to Production"
  - 或 CLI：`vercel rollback <deployment-id>`（按你当前项目 CLI 用法为准）
- EdgeOne 回滚
  - 在 EdgeOne Pages 历史版本中选择上一个成功版本执行回滚。
  - 如果无法回滚，重新运行上一次通过 `EDGEONE_DEPLOY_CMD` 的发布命令，或切回 COS/Cloudflare 备援域名。

## 九、建议对外展示文案（可直接用于站内说明或对接页面）

- 「全球访问优先走 Vercel，国内访问请使用镜像域名」
- 「本站采用双链路发布：Vercel 负责全球可用性，EdgeOne Pages 负责大陆加速与可访问性」

## 十、当前可直接执行命令清单（按顺序）

```bash
cd /Users/michael/ai/projects/mee-personal-insight-site

# 1) 创建发布环境变量（按你的真实值替换）
export VERCEL_DEPLOY_CMD="vercel --prod"
export EDGEONE_DEPLOY_CMD='edgeone pages deploy . --project-id "$EDGEONE_PROJECT_ID" --token "$EDGEONE_TOKEN"'
export VERCEL_PRIMARY_URL="https://<你的 vercel 主域名或自定义域名>"
export EDGEONE_MIRROR_URL="https://<你的 edgeone 镜像域名>"

# 2) 生成/确认脚本
chmod +x scripts/publish-dual.sh

# 3) 双链路发布（默认）
./scripts/publish-dual.sh

# 4) 逐链路验证
curl -I "$VERCEL_PRIMARY_URL"
curl -I "$EDGEONE_MIRROR_URL"

# 5) 如需只发主链路或镜像链路，单独触发
./scripts/publish-dual.sh --vercel
./scripts/publish-dual.sh --edgeone
```

## 十一、你需要配置的账号 / Token / CNAME 清单

- Vercel 账户与项目权限（有 Deploy 权限）
- EdgeOne 账户与 Pages 项目权限（可创建/更新部署）
- `EDGEONE_TOKEN`（建议新建只用于部署的最小权限 token）
- `EDGEONE_PROJECT_ID` 或对应项目标识（与你的 EdgeOne 项目绑定）
- 镜像域名 CNAME 解析：
  - `insight.mee.cn` -> EdgeOne 提供的目标 CNAME
  - 视域名提供商允许，保持 TTL 短期可回退
- 可选：COS/Cloudflare 备援的 bucket、API key、CDN 站点配置
