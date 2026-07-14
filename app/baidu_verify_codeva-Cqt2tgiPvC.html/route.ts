export const runtime = 'edge';

export async function GET() {
  return new Response('0bda9ec773dd028497ef7930b420129e', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
