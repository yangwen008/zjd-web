export const runtime = 'edge';
export async function GET() {
  const start = Date.now();
  try {
    const res = await fetch('http://112.44.232.181:8443/health', {
      signal: AbortSignal.timeout(5000),
    });
    const elapsed = Date.now() - start;
    const text = await res.text();
    return Response.json({ ok: true, status: res.status, elapsed, body: text.substring(0, 100) });
  } catch (e: any) {
    return Response.json({ ok: false, elapsed: Date.now() - start, error: e.message });
  }
}
