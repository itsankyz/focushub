import { Customer, Product, Sale, UserProfile } from '../types';

export type PersistedData = {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  profile?: UserProfile | null;
};

type Session = {
  token: string;
  user: UserProfile;
};

const LOCAL_DATA_STORE = 'focushub-local-data-v2';
const LOCAL_SESSION_STORE = 'focushub-session-v1';

function getApiBase(): string {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';
}

function localEmptyData(): PersistedData {
  return { products: [], sales: [], customers: [], profile: null };
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function isCloudEnabled(): boolean {
  return getApiBase().length > 0;
}

export function getSession(): Session | null {
  return parseJson<Session>(localStorage.getItem(LOCAL_SESSION_STORE));
}

export function setSession(session: Session): void {
  localStorage.setItem(LOCAL_SESSION_STORE, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(LOCAL_SESSION_STORE);
}

export function loadLocalData(): PersistedData {
  const parsed = parseJson<Partial<PersistedData>>(localStorage.getItem(LOCAL_DATA_STORE));
  if (!parsed) return localEmptyData();
  return {
    products: Array.isArray(parsed.products) ? parsed.products : [],
    sales: Array.isArray(parsed.sales) ? parsed.sales : [],
    customers: Array.isArray(parsed.customers) ? parsed.customers : [],
    profile: (parsed.profile as UserProfile | null | undefined) ?? null,
  };
}

export function saveLocalData(data: PersistedData): void {
  localStorage.setItem(LOCAL_DATA_STORE, JSON.stringify(data));
}

async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function generateLocalSession(displayName: string, email: string): Session {
  const id = crypto.randomUUID();
  const id2 = crypto.randomUUID();
  return {
    token: id,
    user: {
      uid: id2,
      displayName,
      email,
      role: 'admin',
    },
  };
}

export async function login(email: string, password: string): Promise<Session> {
  if (isCloudEnabled()) {
    const result = await apiRequest<Session>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setSession(result);
    return result;
  }
  const localSession = generateLocalSession(email.split('@')[0] || 'Local Admin', email);
  setSession(localSession);
  return localSession;
}

export async function register(name: string, email: string, password: string): Promise<Session> {
  if (isCloudEnabled()) {
    const result = await apiRequest<Session>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setSession(result);
    return result;
  }
  const localSession = generateLocalSession(name || 'Local Admin', email);
  setSession(localSession);
  return localSession;
}

export async function pullFromCloudOrLocal(token?: string): Promise<PersistedData> {
  const local = loadLocalData();
  if (!isCloudEnabled() || !token) return local;

  try {
    const remote = await apiRequest<PersistedData>('/sync/pull', { method: 'GET' }, token);
    saveLocalData(remote);
    return remote;
  } catch {
    return local;
  }
}

export async function pushToCloudBestEffort(data: PersistedData, token?: string): Promise<void> {
  saveLocalData(data);
  if (!isCloudEnabled() || !token) return;

  try {
    await apiRequest<{ ok: boolean }>(
      '/sync/push',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      token,
    );
  } catch {
    // local copy already saved; cloud sync can be retried later
  }
}
