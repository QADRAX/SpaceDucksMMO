export function makeHeaders(init?: Record<string, string | undefined>) {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(init ?? {})) {
    if (value !== undefined) normalized[key.toLowerCase()] = value;
  }

  return {
    get(name: string) {
      return normalized[name.toLowerCase()] ?? null;
    },
  };
}

export function makeCookies(init?: Record<string, string | undefined>) {
  const cookies: Record<string, string> = {};
  for (const [key, value] of Object.entries(init ?? {})) {
    if (value !== undefined) cookies[key] = value;
  }

  return {
    get(name: string) {
      const value = cookies[name];
      if (value === undefined) return undefined;
      return { value };
    },
  };
}

export function makeJsonRequest(
  body: unknown,
  options?: {
    url?: string;
    cookies?: Record<string, string | undefined>;
    headers?: Record<string, string | undefined>;
  }
) {
  const url = options?.url ?? 'http://localhost/api';
  return {
    url,
    nextUrl: new URL(url),
    headers: makeHeaders(options?.headers),
    cookies: makeCookies(options?.cookies),
    json: async () => body,
  } as any;
}

export function makeJsonRequestThatThrows(
  error: unknown,
  options?: {
    url?: string;
    cookies?: Record<string, string | undefined>;
    headers?: Record<string, string | undefined>;
  }
) {
  const url = options?.url ?? 'http://localhost/api';
  return {
    url,
    nextUrl: new URL(url),
    headers: makeHeaders(options?.headers),
    cookies: makeCookies(options?.cookies),
    json: async () => {
      throw error;
    },
  } as any;
}

export function makeFormDataRequest(
  formData: FormData,
  options?: {
    url?: string;
    contentType?: string;
    cookies?: Record<string, string | undefined>;
    headers?: Record<string, string | undefined>;
  }
) {
  const contentType = options?.contentType ?? 'multipart/form-data; boundary=jest';
  const url = options?.url ?? 'http://localhost/api';
  return {
    url,
    nextUrl: new URL(url),
    headers: makeHeaders({ 'content-type': contentType, ...(options?.headers ?? {}) }),
    cookies: makeCookies(options?.cookies),
    formData: async () => formData,
    json: async () => {
      throw new Error('json() should not be called for multipart/form-data requests');
    },
  } as any;
}

export function makeContext(params: Record<string, string>) {
  return { params: Promise.resolve(params) } as any;
}
