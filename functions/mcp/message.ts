/**
 * MCP Server - Message Endpoint
 * POST /mcp/message - 处理 MCP 协议请求
 */

interface Env {
  // 如果需要，可以在这里添加环境变量
}

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}

const TOOLS = [
  {
    name: 'get_trending_repos',
    description: '获取 GitHub 上最近热门的开源项目。可以按编程语言筛选，按时间范围（每日/每周/每月）查看。返回项目名称、星星数、今日新增星星、描述等信息。',
    inputSchema: {
      type: 'object',
      properties: {
        language: {
          type: 'string',
          description: '编程语言筛选，如 python, javascript, typescript, go, rust, java 等。留空则返回所有语言的热门项目。',
        },
        since: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly'],
          description: '时间范围：daily(今日热门), weekly(本周热门), monthly(本月热门)',
          default: 'daily',
        },
      },
    },
  },
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as MCPRequest;
    const response = await processRequest(body, context);
    return jsonResponse(response);
  } catch (error) {
    return jsonResponse({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error' },
    }, 400);
  }
};

async function processRequest(
  req: MCPRequest,
  context: EventContext<Env, string, unknown>
): Promise<MCPResponse> {
  const { id, method, params } = req;

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'github-trending-mcp',
            version: '1.0.0',
          },
        },
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS },
      };

    case 'tools/call':
      return handleToolCall(id, params as { name: string; arguments?: Record<string, unknown> }, context);

    case 'notifications/initialized':
    case 'ping':
      return { jsonrpc: '2.0', id, result: {} };

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

async function handleToolCall(
  id: string | number,
  params: { name: string; arguments?: Record<string, unknown> },
  context: EventContext<Env, string, unknown>
): Promise<MCPResponse> {
  const { name, arguments: args = {} } = params;

  if (name === 'get_trending_repos') {
    try {
      const language = (args.language as string) || '';
      const since = (args.since as string) || 'daily';

      // 调用同域的 API 端点
      const url = new URL(context.request.url);
      const apiUrl = `${url.protocol}//${url.host}/api/trending?since=${since}${language ? `&language=${language}` : ''}`;

      const response = await fetch(apiUrl);
      const data = await response.json() as {
        data: Array<{
          rank: number;
          username: string;
          reponame: string;
          description: string;
          language: string;
          stars: number;
          starsToday: number;
          url: string;
        }>;
        language: string;
        since: string;
      };

      // 格式化输出给 LLM
      let text = `GitHub Trending 项目 (语言: ${data.language}, 范围: ${data.since}):\n\n`;
      
      data.data.slice(0, 15).forEach((repo, i) => {
        text += `${i + 1}. ${repo.username}/${repo.reponame}\n`;
        text += `   ⭐ ${repo.stars.toLocaleString()} 总星 (+${repo.starsToday} 新增)\n`;
        if (repo.language) text += `   语言: ${repo.language}\n`;
        if (repo.description) text += `   简介: ${repo.description}\n`;
        text += `   链接: ${repo.url}\n\n`;
      });

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text }],
        },
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: `Failed to fetch trending: ${error}` },
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32602, message: `Unknown tool: ${name}` },
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
