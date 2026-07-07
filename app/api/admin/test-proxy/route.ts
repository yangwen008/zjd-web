export const runtime = 'edge';
export async function GET() {
  const results: any = {};
  
  // 测试1: 直接访问聚土网
  try {
    const start = Date.now();
    const res = await fetch('http://www.jutubao.com/tudi/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    results.jutubao = { status: res.status, size: html.length, elapsed: Date.now() - start, hasContent: html.includes('content-') };
  } catch (e: any) {
    results.jutubao = { error: e.message };
  }

  // 测试2: 直接访问 cdaee
  try {
    const start = Date.now();
    const res = await fetch('https://www.cdaee.com', {
      signal: AbortSignal.timeout(5000),
    });
    results.cdaee = { status: res.status, elapsed: Date.now() - start };
  } catch (e: any) {
    results.cdaee = { error: e.message };
  }

  return Response.json(results);
}
