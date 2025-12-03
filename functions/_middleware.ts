/**
 * 全局中间件 - 处理健康检查、CORS 和根路径
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const method = context.request.method;

  // 全局 CORS 预检处理
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

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
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // 继续处理其他请求，并添加 CORS headers
  const response = await context.next();
  
  // 克隆响应并添加 CORS headers
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
