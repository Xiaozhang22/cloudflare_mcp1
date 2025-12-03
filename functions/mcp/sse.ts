/**
 * MCP Server - SSE Endpoint (Streamable HTTP Transport)
 * 
 * 这个实现使用简化的 SSE 传输：
 * - GET /mcp/sse: 返回 endpoint URL，然后保持连接用于接收服务器推送
 * - POST /mcp/message: 直接返回 JSON-RPC 响应（同步模式）
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: corsHeaders });
};

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const sessionId = crypto.randomUUID();
  const messageUrl = `${url.protocol}//${url.host}/mcp/message?sessionId=${sessionId}`;

  // 使用 ReadableStream 来创建 SSE 响应
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // 发送 endpoint 事件
      controller.enqueue(encoder.encode(`event: endpoint\ndata: ${JSON.stringify(messageUrl)}\n\n`));
      
      // 设置心跳
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepAlive);
        }
      }, 15000); // 每 15 秒发送心跳
      
      // 监听连接关闭
      context.request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // 禁用 nginx 缓冲
      ...corsHeaders,
    },
  });
};
