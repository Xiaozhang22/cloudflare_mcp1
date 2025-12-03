/**
 * MCP Debug Endpoint - 记录所有请求信息
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, X-Requested-With',
};

export const onRequest: PagesFunction = async (context) => {
  const request = context.request;
  const url = new URL(request.url);
  
  let body = null;
  try {
    body = await request.text();
  } catch {}
  
  const debugInfo = {
    method: request.method,
    url: request.url,
    pathname: url.pathname,
    search: url.search,
    headers: Object.fromEntries(request.headers.entries()),
    body: body,
  };
  
  return new Response(JSON.stringify(debugInfo, null, 2), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
};
