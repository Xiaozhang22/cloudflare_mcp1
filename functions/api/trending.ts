/**
 * GitHub Trending API - Cloudflare Pages Function
 * GET /api/trending?language=python&since=daily
 */

interface Env {
  TRENDING_CACHE?: KVNamespace;
}

interface TrendingRepo {
  rank: number;
  username: string;
  reponame: string;
  url: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  starsToday: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const language = url.searchParams.get('language') || '';
  const since = (url.searchParams.get('since') || 'daily') as 'daily' | 'weekly' | 'monthly';

  if (!['daily', 'weekly', 'monthly'].includes(since)) {
    return jsonResponse({ error: 'Invalid since parameter. Use: daily, weekly, monthly' }, 400);
  }

  const cacheKey = `trending:${language || 'all'}:${since}`;

  // 尝试从缓存读取
  if (context.env.TRENDING_CACHE) {
    const cached = await context.env.TRENDING_CACHE.get(cacheKey);
    if (cached) {
      return jsonResponse({
        data: JSON.parse(cached),
        cached: true,
        language: language || 'all',
        since,
      });
    }
  }

  // 获取新数据
  try {
    const repos = await fetchTrendingRepos(language, since);

    // 写入缓存（1小时过期）
    if (context.env.TRENDING_CACHE) {
      await context.env.TRENDING_CACHE.put(cacheKey, JSON.stringify(repos), { expirationTtl: 31536000 });
    }

    return jsonResponse({
      data: repos,
      cached: false,
      language: language || 'all',
      since,
    });
  } catch (error) {
    console.error('Error fetching trending:', error);
    return jsonResponse({ error: 'Failed to fetch trending repos' }, 500);
  }
};

async function fetchTrendingRepos(
  language: string = '',
  since: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<TrendingRepo[]> {
  let url = 'https://github.com/trending';
  if (language) {
    url += `/${encodeURIComponent(language)}`;
  }
  url += `?since=${since}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; GitHubTrendingBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch trending: ${response.status}`);
  }

  const html = await response.text();
  return parseTrendingHtml(html);
}

function parseTrendingHtml(html: string): TrendingRepo[] {
  const repos: TrendingRepo[] = [];
  const articleRegex = /<article class="Box-row"[^>]*>([\s\S]*?)<\/article>/g;
  let match;
  let rank = 0;

  while ((match = articleRegex.exec(html)) !== null) {
    rank++;
    const articleHtml = match[1];

    try {
      const repo = parseRepoArticle(articleHtml, rank);
      if (repo) repos.push(repo);
    } catch (e) {
      console.error(`Failed to parse repo at rank ${rank}:`, e);
    }
  }

  return repos;
}

function parseRepoArticle(html: string, rank: number): TrendingRepo | null {
  const repoLinkMatch = html.match(/href="\/([^/]+)\/([^/"]+)"/);
  if (!repoLinkMatch) return null;

  const username = repoLinkMatch[1];
  const reponame = repoLinkMatch[2];

  const descMatch = html.match(/<p class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
  const description = descMatch ? descMatch[1].trim().replace(/<[^>]+>/g, '').trim() : '';

  const langMatch = html.match(/itemprop="programmingLanguage">([^<]+)</);
  const language = langMatch ? langMatch[1].trim() : '';

  const starsMatch = html.match(/href="[^"]*stargazers"[^>]*>[\s\S]*?<\/svg>\s*([\d,]+)/i);
  const stars = starsMatch ? parseNumber(starsMatch[1]) : 0;

  const forksMatch = html.match(/href="[^"]*forks"[^>]*>[\s\S]*?<\/svg>\s*([\d,]+)/i);
  const forks = forksMatch ? parseNumber(forksMatch[1]) : 0;

  const starsTodayMatch = html.match(/([\d,]+)\s*stars?\s*(today|this week|this month)/i);
  const starsToday = starsTodayMatch ? parseNumber(starsTodayMatch[1]) : 0;

  return {
    rank,
    username,
    reponame,
    url: `https://github.com/${username}/${reponame}`,
    description,
    language,
    stars,
    forks,
    starsToday,
  };
}

function parseNumber(str: string): number {
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
