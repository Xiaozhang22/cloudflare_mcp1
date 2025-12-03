# 🚀 GitHub Trending Service

一个部署在 Cloudflare Pages 上的 GitHub 热门项目服务，提供 REST API 和 MCP 协议支持，让 AI 助手能够实时获取 GitHub 热门项目数据。

## ✨ 功能特性

- 🔥 **REST API** - 标准 HTTP API，获取 GitHub Trending 项目数据
- 🤖 **MCP Server** - 支持 Model Context Protocol，让 AI 助手（Claude Desktop/Kiro）直接查询
- 📄 **OpenAPI Spec** - 完整的 OpenAPI 3.0 规范，支持 GPT/Gemini Function Calling
- ⚡ **KV 缓存** - 使用 Cloudflare KV 缓存数据，减少 GitHub 请求，提升响应速度
- 🌍 **全球 CDN** - 部署在 Cloudflare 边缘网络，全球访问快速
- 🔄 **自动部署** - GitHub 推送自动触发部署，无需手动操作

## 🌐 在线服务

- **主页**: https://cloudflare-mcp1.zx1993.top
- **REST API**: https://cloudflare-mcp1.zx1993.top/api/trending
- **OpenAPI 规范**: https://cloudflare-mcp1.zx1993.top/api/openapi.json
- **MCP 端点**: https://cloudflare-mcp1.zx1993.top/mcp/message

## 项目结构

```
├── functions/
│   ├── api/
│   │   ├── trending.ts      # GET /api/trending
│   │   └── openapi.json.ts  # GET /api/openapi.json
│   ├── mcp/
│   │   ├── sse.ts           # GET /mcp/sse (MCP 连接)
│   │   └── message.ts       # POST /mcp/message (MCP 消息)
│   └── _middleware.ts       # 全局中间件
├── public/
│   └── index.html           # 首页
├── wrangler.toml
└── package.json
```

## 部署方式

### 方式 1: GitHub 自动部署 (推荐)

1. 将代码推送到 GitHub 仓库
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
3. 进入 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
4. 选择你的 GitHub 仓库
5. 配置构建设置:
   - Build command: `npm run build`
   - Build output directory: `public`
6. 点击 **Save and Deploy**

每次 push 到 main 分支会自动部署。

### 方式 2: 命令行部署

```bash
npm install
npx wrangler pages deploy public --project-name=github-trending-service
```

## 📖 使用指南

### 1️⃣ REST API 使用

#### 基础请求

```bash
# 获取今日热门项目（所有语言）
curl https://cloudflare-mcp1.zx1993.top/api/trending
```

#### 按语言筛选

```bash
# Python 项目
curl "https://cloudflare-mcp1.zx1993.top/api/trending?language=python"

# JavaScript 项目
curl "https://cloudflare-mcp1.zx1993.top/api/trending?language=javascript"

# Go 项目
curl "https://cloudflare-mcp1.zx1993.top/api/trending?language=go"

# Rust 项目
curl "https://cloudflare-mcp1.zx1993.top/api/trending?language=rust"
```

#### 按时间范围筛选

```bash
# 今日热门
curl "https://cloudflare-mcp1.zx1993.top/api/trending?since=daily"

# 本周热门
curl "https://cloudflare-mcp1.zx1993.top/api/trending?since=weekly"

# 本月热门
curl "https://cloudflare-mcp1.zx1993.top/api/trending?since=monthly"
```

#### 组合使用

```bash
# Rust 本月热门
curl "https://cloudflare-mcp1.zx1993.top/api/trending?language=rust&since=monthly"

# TypeScript 本周热门
curl "https://cloudflare-mcp1.zx1993.top/api/trending?language=typescript&since=weekly"
```

#### 响应示例

```json
{
  "data": [
    {
      "rank": 1,
      "username": "owner",
      "reponame": "repo-name",
      "url": "https://github.com/owner/repo-name",
      "description": "项目描述",
      "language": "Python",
      "stars": 12345,
      "forks": 678,
      "starsToday": 1234
    }
  ],
  "cached": true,
  "language": "python",
  "since": "daily"
}
```

### 2️⃣ MCP 配置（AI 客户端使用）

#### Kiro IDE

在 `.kiro/settings/mcp.json` 中添加：

```json
{
  "mcpServers": {
    "github-trending": {
      "type": "sse",
      "url": "https://cloudflare-mcp1.zx1993.top/mcp/message"
    }
  }
}
```

> 注意：虽然 `type` 设置为 `sse`，但 Kiro 会自动检测并使用 StreamableHTTP 传输方式。

#### Claude Desktop

在 `claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "github-trending": {
      "type": "sse",
      "url": "https://cloudflare-mcp1.zx1993.top/mcp/message"
    }
  }
}
```

配置后，AI 助手可以直接调用 `get_trending_repos` 工具查询热门项目。

### 3️⃣ GPT/Gemini Function Calling

#### 获取 OpenAPI 规范

```bash
curl https://cloudflare-mcp1.zx1993.top/api/openapi.json
```

#### Python 示例（OpenAI GPT）

```python
import openai
import requests

# 定义工具
tools = [{
    "type": "function",
    "function": {
        "name": "get_trending_repos",
        "description": "获取 GitHub 热门项目",
        "parameters": {
            "type": "object",
            "properties": {
                "language": {
                    "type": "string",
                    "description": "编程语言，如 python, javascript"
                },
                "since": {
                    "type": "string",
                    "enum": ["daily", "weekly", "monthly"],
                    "description": "时间范围"
                }
            }
        }
    }
}]

# 调用 GPT
response = openai.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "最近有什么热门的 Python 项目？"}],
    tools=tools
)

# 当 GPT 调用 function 时，请求 API
if response.choices[0].message.tool_calls:
    result = requests.get(
        "https://cloudflare-mcp1.zx1993.top/api/trending",
        params={"language": "python"}
    ).json()
    # 将结果返回给 GPT 继续对话
```

#### JavaScript 示例

```javascript
const response = await fetch(
  'https://cloudflare-mcp1.zx1993.top/api/trending?language=python&since=weekly'
);
const data = await response.json();

console.log(`找到 ${data.data.length} 个热门项目`);
data.data.forEach(repo => {
  console.log(`${repo.rank}. ${repo.username}/${repo.reponame} - ⭐ ${repo.starsToday}`);
});
```

## 🛠️ 本地开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:8788 查看效果。

### 本地测试 API

```bash
# 测试 REST API
curl http://localhost:8788/api/trending

# 测试 OpenAPI
curl http://localhost:8788/api/openapi.json
```

## 🔧 技术栈

- **运行时**: Cloudflare Pages Functions
- **语言**: TypeScript
- **协议**: HTTP REST API + MCP (Model Context Protocol)
- **缓存**: Cloudflare KV
- **部署**: GitHub Actions 自动部署

## 📊 API 参数说明

### GET /api/trending

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `language` | string | 否 | all | 编程语言（如 python, javascript, go, rust, typescript 等） |
| `since` | string | 否 | daily | 时间范围：`daily`（今日）、`weekly`（本周）、`monthly`（本月） |

### 响应字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `data` | array | 热门项目列表 |
| `data[].rank` | number | 排名 |
| `data[].username` | string | 项目所有者 |
| `data[].reponame` | string | 项目名称 |
| `data[].url` | string | 项目 URL |
| `data[].description` | string | 项目描述 |
| `data[].language` | string | 主要编程语言 |
| `data[].stars` | number | 总星标数 |
| `data[].forks` | number | 总 Fork 数 |
| `data[].starsToday` | number | 时间段内新增星标数 |
| `cached` | boolean | 是否来自缓存 |
| `language` | string | 筛选的语言 |
| `since` | string | 时间范围 |

## 🎯 MCP 工具说明

配置 MCP 后，AI 助手可以使用以下工具：

### get_trending_repos

获取 GitHub 热门项目。

**参数**:
- `language` (可选): 编程语言筛选
- `since` (可选): 时间范围（daily/weekly/monthly）

**示例对话**:
- "最近有什么热门的 Python 项目？"
- "本周 JavaScript 有哪些热门仓库？"
- "给我看看本月 Rust 的热门项目"

## 🚀 部署到你自己的 Cloudflare

详细部署步骤请查看 [DEPLOY.md](./DEPLOY.md)

### 快速部署

1. Fork 本仓库
2. 在 Cloudflare Dashboard 连接你的 GitHub 仓库
3. 配置构建命令：`npm run build`
4. 部署完成！

## 🔐 可选配置

### KV 缓存（推荐）

启用 KV 缓存可以：
- 减少对 GitHub 的请求频率
- 提升 API 响应速度
- 避免触发 GitHub 速率限制

**配置步骤**:
1. Cloudflare Dashboard → Workers & Pages → KV
2. 创建 Namespace，名称：`TRENDING_CACHE`
3. 进入 Pages 项目 → Settings → Functions → KV namespace bindings
4. 添加绑定：Variable name = `TRENDING_CACHE`

缓存时效：1 小时

### 自定义域名

1. 进入 Pages 项目 → Custom domains
2. 添加你的域名
3. 按提示配置 DNS 记录

## 📝 常见问题

### Q: API 返回空数据或错误？
A: 可能是 GitHub 临时限制了请求。建议配置 KV 缓存，或稍后重试。

### Q: MCP 连接失败？
A: 确认 URL 正确使用 `https://` 协议，路径为 `/mcp/message`。如果遇到 CORS 或超时问题，请检查服务端的 CORS 配置是否正确。

### Q: 如何查看日志？
A: Cloudflare Dashboard → 你的项目 → Functions → Logs

### Q: 支持哪些编程语言？
A: 支持 GitHub 上所有编程语言，常见的如：python, javascript, typescript, go, rust, java, c++, c#, php, ruby, swift, kotlin 等。

### Q: 数据更新频率？
A: 启用缓存后每小时更新一次，未启用缓存则实时获取。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 🔗 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [GitHub Trending](https://github.com/trending)
- [OpenAPI Specification](https://swagger.io/specification/)

---

**Made with ❤️ | Powered by Cloudflare Pages**
