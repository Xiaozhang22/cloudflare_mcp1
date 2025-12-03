/**
 * 全局中间件 - 处理健康检查和根路径
 */

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  // 健康检查
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({
      status: 'ok',
      service: 'github-trending-service',
      endpoints: {
        api: '/api/trending',
        openapi: '/api/openapi.json',
        mcp: '/mcp/sse',
      },
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 继续处理其他请求
  return context.next();
};
