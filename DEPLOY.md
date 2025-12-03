# 部署指南 - Cloudflare Pages (GitHub 自动部署)

## 前置条件

- GitHub 账号
- Cloudflare 账号 (免费即可)

## 步骤 1: 推送代码到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/github-trending-service.git
git push -u origin main
```

## 步骤 2: 在 Cloudflare 连接 GitHub

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 左侧菜单选择 **Workers & Pages**
3. 点击 **Create** 按钮
4. 选择 **Pages** 标签
5. 点击 **Connect to Git**

## 步骤 3: 授权并选择仓库

1. 点击 **Connect GitHub**
2. 授权 Cloudflare 访问你的 GitHub
3. 选择 `github-trending-service` 仓库
4. 点击 **Begin setup**

## 步骤 4: 配置构建设置

填写以下配置:

| 设置项 | 值 |
|--------|-----|
| Project name | `github-trending-service` |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `public` |

点击 **Save and Deploy**

## 步骤 5: 等待部署完成

部署通常需要 1-2 分钟。完成后你会看到:

```
✅ Success! Your site is live at:
https://cloudflare-mcp1.pages.dev
```

## 步骤 6: 验证部署

```bash
# 测试 API
curl https://cloudflare-mcp1.zx1993.top/api/trending

# 测试健康检查
curl https://cloudflare-mcp1.zx1993.top/health
```

## 步骤 7: 配置 MCP (可选)

在你的 MCP 客户端配置文件中添加:

**Kiro** (`.kiro/settings/mcp.json`):
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

**Claude Desktop** (`claude_desktop_config.json`):
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

## 可选: 配置 KV 缓存

如果想启用缓存减少对 GitHub 的请求:

1. 在 Cloudflare Dashboard 进入 **Workers & Pages** → **KV**
2. 点击 **Create a namespace**
3. 名称填 `TRENDING_CACHE`，点击 **Add**
4. 进入你的 Pages 项目 → **Settings** → **Functions**
5. 找到 **KV namespace bindings**，点击 **Add binding**
6. Variable name: `TRENDING_CACHE`
7. KV namespace: 选择刚创建的 namespace
8. 点击 **Save**

下次部署后缓存就会生效。

## 自动部署

配置完成后，每次你 push 代码到 GitHub:

```bash
git add .
git commit -m "Update something"
git push
```

Cloudflare 会自动检测并重新部署。

## 常见问题

### Q: 部署失败 "Build failed"
A: 检查 Build command 是否正确填写为 `npm run build`

### Q: API 返回空数据
A: GitHub 可能临时限制了请求，稍后重试或配置 KV 缓存

### Q: MCP 连接失败
A: 确认 URL 使用 `https://` 且路径正确 `/mcp/message`

### Q: 如何查看日志
A: Cloudflare Dashboard → 你的项目 → Functions → Logs

## 自定义域名 (可选)

1. 进入项目 → **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名，按提示配置 DNS
