/** Cliente HTTP hacia `/api/*` (rewrite → nara-api gateway). */

export type ApiJson = Record<string, unknown> & {
  ok?: boolean;
  error?: string;
  status?: number;
};

function resolveApiPath(path: string) {
  if (path.startsWith("/api/")) return path;
  if (path.startsWith("/")) return `/api${path}`;
  return `/api/${path}`;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers({ Accept: "application/json" });
  if (init.headers) {
    new Headers(init.headers).forEach((v, k) => headers.set(k, v));
  }
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(resolveApiPath(path), {
    ...init,
    credentials: init.credentials ?? "same-origin",
    headers,
  });
}

export async function apiJson<T extends ApiJson = ApiJson>(
  path: string,
  init: RequestInit = {},
): Promise<{ res: Response; data: T }> {
  const res = await apiFetch(path, init);
  let data = {} as T;
  try {
    data = (await res.json()) as T;
  } catch {
    /* cuerpo vacío o no JSON */
  }
  return { res, data };
}
