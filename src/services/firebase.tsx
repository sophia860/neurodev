import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, _operationType: OperationType, _path: string | null) {
  const msg = error instanceof Error ? error.message : String(error);
  console.error('DB Error:', msg);
}

// ─── Fake Firestore-compatible layer ──────────────────────────────────────────
// Maps the Firebase path convention  "users/{uid}/collection/{docId}"
// to the matching Supabase table + filters.

const TABLE_MAP: Record<string, string> = {
  chats: 'chats',
  dump: 'dump_items',
  tasks: 'tasks',
  templates: 'task_templates',
  jobs: 'jobs',
  invoices: 'invoices',
  clients: 'clients',
};

function parsePath(path: string) {
  const parts = path.split('/');
  // "users/{uid}" → profile
  if (parts.length === 2 && parts[0] === 'users') return { table: 'profiles', uid: parts[1], docId: null };
  // "users/{uid}/{collection}" → table with user_id filter
  if (parts.length === 3) return { table: TABLE_MAP[parts[2]] || parts[2], uid: parts[1], docId: null };
  // "users/{uid}/{collection}/{docId}"
  if (parts.length === 4) return { table: TABLE_MAP[parts[2]] || parts[2], uid: parts[1], docId: parts[3] };
  return null;
}

// Minimal Firestore-API shims
export const db = {
  _supabase: supabase,
};

// Converts snake_case DB row → camelCase for components
function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = obj[key];
  }
  return out;
}

function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const snake = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    out[snake] = obj[key];
  }
  return out;
}

// doc() — returns a ref object
export function doc(_db: typeof db, path: string, ...extra: string[]) {
  const fullPath = extra.length ? `${path}/${extra.join('/')}` : path;
  return { path: fullPath };
}

// collection() — returns a ref object
export function collection(_db: typeof db, path: string) {
  return { path };
}

// setDoc — upsert a document
export async function setDoc(ref: { path: string }, data: Record<string, unknown>, options?: { merge?: boolean }) {
  const parsed = parsePath(ref.path);
  if (!parsed) return;

  const { table, uid, docId } = parsed;

  if (table === 'profiles') {
    const row = { id: uid, ...camelToSnake(data) };
    const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
    if (error) throw new Error(error.message);
    return;
  }

  const row = camelToSnake({ ...data, userId: uid });
  if (docId) {
    const { error } = await supabase.from(table).upsert({ id: docId, ...row }, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from(table).upsert(row);
    if (error) throw new Error(error.message);
  }
}

// addDoc — insert a new document, returns fake doc ref
export async function addDoc(ref: { path: string }, data: Record<string, unknown>) {
  const parsed = parsePath(ref.path);
  if (!parsed) return { id: '' };
  const { table, uid } = parsed;
  const row = camelToSnake({ ...data, userId: uid });
  const { data: inserted, error } = await supabase.from(table).insert(row).select('id').single();
  if (error) throw new Error(error.message);
  return { id: inserted?.id || '' };
}

// updateDoc — update specific fields
export async function updateDoc(ref: { path: string }, data: Record<string, unknown>) {
  const parsed = parsePath(ref.path);
  if (!parsed) return;
  const { table, uid, docId } = parsed;

  if (table === 'profiles') {
    const { error } = await supabase.from('profiles').update(camelToSnake(data)).eq('id', uid);
    if (error) throw new Error(error.message);
    return;
  }
  if (!docId) return;
  const { error } = await supabase.from(table).update(camelToSnake(data)).eq('id', docId).eq('user_id', uid);
  if (error) throw new Error(error.message);
}

// deleteDoc — delete a document
export async function deleteDoc(ref: { path: string }) {
  const parsed = parsePath(ref.path);
  if (!parsed) return;
  const { table, uid, docId } = parsed;
  if (!docId) return;
  const { error } = await supabase.from(table).delete().eq('id', docId).eq('user_id', uid);
  if (error) throw new Error(error.message);
}

// query / orderBy / limit — passthrough shims that return a fake query object
export function query(ref: { path: string }, ..._modifiers: unknown[]) {
  return ref;
}
export function orderBy(_field: string, _dir?: string) { return {}; }
export function limit(_n: number) { return {}; }
export function serverTimestamp() { return new Date().toISOString(); }

// onSnapshot — polls every 3s and calls callback with fake Firestore snapshot
export function onSnapshot(
  ref: { path: string },
  callback: (snapshot: { docs: { id: string; data: () => Record<string, unknown> }[], exists: () => boolean, data: () => Record<string, unknown> | null }) => void,
  onError?: (err: Error) => void
) {
  const parsed = parsePath(ref.path);
  if (!parsed) return () => {};

  const { table, uid, docId } = parsed;

  const fetch = async () => {
    try {
      if (table === 'profiles') {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
        if (error) throw new Error(error.message);
        const row = data ? snakeToCamel(data as Record<string, unknown>) : null;
        callback({
          docs: row ? [{ id: uid, data: () => row }] : [],
          exists: () => !!row,
          data: () => row,
        });
        return;
      }

      let q = supabase.from(table).select('*').eq('user_id', uid);
      if (docId) q = q.eq('id', docId) as typeof q;
      if (table === 'chats') q = q.order('timestamp', { ascending: true }).limit(50) as typeof q;
      if (table === 'tasks') q = q.order('sort_order', { ascending: true }) as typeof q;
      if (table === 'task_templates') q = q.order('created_at', { ascending: false }) as typeof q;

      const { data, error } = await q;
      if (error) throw new Error(error.message);

      const rows = (data || []).map((r) => snakeToCamel(r as Record<string, unknown>));
      callback({
        docs: rows.map((r) => ({ id: r.id as string, data: () => r })),
        exists: () => rows.length > 0,
        data: () => (rows[0] || null),
      });
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  fetch();
  const interval = setInterval(fetch, 3000);
  return () => clearInterval(interval);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function sessionToUser(session: Session | null): AuthUser | null {
  if (!session) return null;
  const u = session.user;
  return {
    uid: u.id,
    email: u.email || null,
    displayName: u.user_metadata?.full_name || u.user_metadata?.name || u.email || null,
    photoURL: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
  };
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(sessionToUser(session));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(sessionToUser(session));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) console.error('Sign in error:', error);
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within FirebaseProvider');
  return context;
};
