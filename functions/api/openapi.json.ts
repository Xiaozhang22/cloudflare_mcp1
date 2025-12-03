/**
 * OpenAPI Spec - 供 GPT/Gemini Function Calling 使用
 * GET /api/openapi.json
 */

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'GitHub Trending API',
      version: '1.0.0',
      description: 'API to fetch GitHub trending repositories',
    },
    servers: [{ url: baseUrl }],
    paths: {
      '/api/trending': {
        get: {
          operationId: 'getTrendingRepos',
          summary: 'Get trending repositories',
          description: 'Fetch GitHub trending repositories with optional language and time range filters',
          parameters: [
            {
              name: 'language',
              in: 'query',
              schema: { type: 'string' },
              description: 'Programming language filter (e.g., python, javascript, go, rust)',
            },
            {
              name: 'since',
              in: 'query',
              schema: { type: 'string', enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
              description: 'Time range: daily, weekly, or monthly',
            },
          ],
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/TrendingRepo' },
                      },
                      cached: { type: 'boolean' },
                      language: { type: 'string' },
                      since: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        TrendingRepo: {
          type: 'object',
          properties: {
            rank: { type: 'number', description: 'Ranking position' },
            username: { type: 'string', description: 'Repository owner' },
            reponame: { type: 'string', description: 'Repository name' },
            url: { type: 'string', description: 'Repository URL' },
            description: { type: 'string', description: 'Repository description' },
            language: { type: 'string', description: 'Primary programming language' },
            stars: { type: 'number', description: 'Total star count' },
            forks: { type: 'number', description: 'Total fork count' },
            starsToday: { type: 'number', description: 'Stars gained in the time period' },
          },
        },
      },
    },
  };

  return new Response(JSON.stringify(spec, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
