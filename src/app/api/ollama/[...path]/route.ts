import { NextRequest } from 'next/server';

// 127.0.0.1 (et non localhost) pour éviter une résolution IPv6 (::1) qui fait
// échouer la connexion vers Ollama sur certaines configurations.
const OLLAMA =
  process.env.OLLAMA_HOST ?? process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';

/**
 * Proxy catch-all vers l'API Ollama locale.
 *
 * Le path capturé est joint à l'URL de base OLLAMA : aucune URL externe ne peut
 * être atteinte (pas de SSRF). Le body de la réponse est relayé tel quel pour
 * préserver le streaming NDJSON de bout en bout.
 */
async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path } = await params;
  const target = `${OLLAMA.replace(/\/$/, '')}/${path.join('/')}${req.nextUrl.search}`;

  const method = req.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';

  const init: RequestInit = {
    method,
    headers: { 'content-type': 'application/json' },
    cache: 'no-store',
  };

  if (hasBody) {
    init.body = await req.text();
    // duplex requis par la spec fetch dès qu'un body (potentiellement streamé)
    // est fourni ; non encore présent dans les types DOM.
    // @ts-expect-error duplex n'est pas typé dans RequestInit
    init.duplex = 'half';
  }

  let res: Response;
  try {
    res = await fetch(target, init);
  } catch {
    return Response.json({ error: 'Ollama unreachable' }, { status: 503 });
  }

  return new Response(res.body, {
    status: res.status,
    headers: {
      'content-type': res.headers.get('content-type') ?? 'application/json',
    },
  });
}

export const GET = proxy;
export const POST = proxy;
