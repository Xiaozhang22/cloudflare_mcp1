/**
 * MCP Server - SSE Endpoint
 * GET /mcp/sse - 建立 SSE 连接
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const sessionId = crypto.randomUUID();
  const messageUrl = `${url.protocol}//${url.host}/mcp/message?sessionId=${sessionId}`;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // 发送 endpoint 事件 - 不带引号的纯 URL
  const init = async () => {
    await writer.write(encoder.encode(`event: endpoint\ndata: ${messageUrl}\n\n`));
  };
  init();

  // 心跳保持连接
  const keepAlive = setInterval(async () => {
    try {
      await writer.write(encoder.encode(': keepalive\n\n'));
    } catch {
      clearInterval(keepAlive);
    }
  }, 30000);

  context.request.signal.addEventListener('abort', () => {
    clearInterval(keepAlive);
    writer.close();
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...corsHeaders,
    },
  });
};
