# GitHub Trending Service

GitHub 热门项目 API + MCP 服务，部署在 Cloudflare Pages 上。

## 功能

- 🔥 **REST API** - 获取 GitHub Trending 项目数据
- 🤖 **MCP Server** - 让 AI 助手（Claude/Kiro）直接查询热门项目
- 📄 **OpenAPI Spec** - 支持 GPT/Gemini Function Calling

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

## API 使用

### REST API

```bash
# 获取今日热门项目
curl https://cloudflare-mcp1.zx1993.top/api/trending

# 按语言筛选
curl "https://cloudflare-mcp1.zx1993.top/api/trending?language=python"

# 按时间范围 (daily/weekly/monthly)
curl "https://cloudflare-mcp1.zx1993.top/api/trending?since=weekly"

# 组合使用
curl "https://cloudflare-mcp1.zx1993.top/api/trending?language=rust&since=monthly"
```

### MCP 配置

在 Kiro 或 Claude Desktop 中添加:

```json
{
  "mcpServers": {
    "github-trending": {
      "type": "sse",
      "url": "https://cloudflare-mcp1.zx1993.top/mcp/sse"
    }
  }
}
```

### GPT/Gemini Function Calling

获取 OpenAPI 规范:
```
https://cloudflare-mcp1.zx1993.top/api/openapi.json
```

## 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:8788

## 可选: 配置 KV 缓存

1. 在 Cloudflare Dashboard 创建 KV Namespace
2. 进入 Pages 项目 → Settings → Functions → KV namespace bindings
3. 添加绑定: Variable name = `TRENDING_CACHE`

## License

MIT
