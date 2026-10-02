/**
 * Dummy Admin data: workspace users, search settings and an activity log.
 * Stored in the browser. Every person and email address is invented (example.com).
 */

import { CURRENT_USER } from './conversions';

export type Role = 'admin' | 'recruiter' | 'viewer';
export type UserStatus = 'active' | 'invited' | 'deactivated';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  lastActive: string | null; // ISO date-time
}

/** Settings that change how the Search page behaves. */
export interface AppSettings {
  /** Some countries do not allow filtering by gender (open question in the requirements). */
  showGender: boolean;
  /** "Start from a job description" panel. */
  showJdFill: boolean;
  defaultLang: 'en' | 'ja';
}

export type ActivityKind =
  | 'login'
  | 'export'
  | 'search'
  | 'invite'
  | 'resend'
  | 'role'
  | 'activate'
  | 'deactivate'
  | 'remove'
  | 'settingOn'
  | 'settingOff'
  | 'lang'
  | 'reset';

export interface Activity {
  id: string;
  at: string; // ISO date-time
  kind: ActivityKind;
  /** Usually a person's name; for settings, the setting key; for lang, the language. */
  a?: string;
  /** Second detail: a file or search name, or a role key. */
  b?: string;
}

const USERS_KEY = 'resumeFinder.admin.users.v1';
const SETTINGS_KEY = 'resumeFinder.admin.settings.v1';
const ACTIVITY_KEY = 'resumeFinder.admin.activity.v1';
const MAX_ACTIVITY = 30;

export const DEFAULT_SETTINGS: AppSettings = { showGender: true, showJdFill: true, defaultLang: 'en' };

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

function seedUsers(): AdminUser[] {
  return [
    { id: 'u-1', name: CURRENT_USER, email: 'resume-tester@example.com', role: 'admin', status: 'active', lastActive: ago(2) },
    { id: 'u-2', name: 'Aiko Mori', email: 'aiko.mori@example.com', role: 'recruiter', status: 'active', lastActive: ago(25) },
    { id: 'u-3', name: 'Daniel Hughes', email: 'daniel.hughes@example.com', role: 'recruiter', status: 'active', lastActive: ago(130) },
    { id: 'u-4', name: 'Kenta Fujiwara', email: 'kenta.fujiwara@example.com', role: 'viewer', status: 'active', lastActive: ago(60 * 24 * 9) },
    { id: 'u-5', name: 'Sara Lindqvist', email: 'sara.lindqvist@example.com', role: 'recruiter', status: 'invited', lastActive: null },
    { id: 'u-6', name: 'Hiroshi Nakano', email: 'hiroshi.nakano@example.com', role: 'recruiter', status: 'deactivated', lastActive: ago(60 * 24 * 41) },
  ];
}

function seedActivity(): Activity[] {
  return [
    { id: 'a-1', at: ago(2), kind: 'login', a: CURRENT_USER },
    { id: 'a-2', at: ago(25), kind: 'export', a: 'Aiko Mori', b: 'Haruki Tanabe.pdf' },
    { id: 'a-3', at: ago(130), kind: 'search', a: 'Daniel Hughes', b: 'Bilingual finance leaders' },
    { id: 'a-4', at: ago(60 * 26), kind: 'invite', a: 'Sara Lindqvist' },
    { id: 'a-5', at: ago(60 * 24 * 9), kind: 'login', a: 'Kenta Fujiwara' },
  ];
}

function load<T>(key: string, seed: () => T, valid: (v: unknown) => boolean): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return seed();
    const parsed: unknown = JSON.parse(raw);
    return valid(parsed) ? (parsed as T) : seed();
  } catch {
    return seed();
  }
}

function store(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: changes last for this visit only */
  }
}

export const loadUsers = () => load<AdminUser[]>(USERS_KEY, seedUsers, Array.isArray);
export const storeUsers = (v: AdminUser[]) => store(USERS_KEY, v);
export const loadActivity = () => load<Activity[]>(ACTIVITY_KEY, seedActivity, Array.isArray);
export const storeActivity = (v: Activity[]) => store(ACTIVITY_KEY, v.slice(0, MAX_ACTIVITY));
export const loadSettings = (): AppSettings => ({
  ...DEFAULT_SETTINGS,
  ...load<Partial<AppSettings>>(SETTINGS_KEY, () => DEFAULT_SETTINGS, (v) => !!v && typeof v === 'object'),
});
export const storeSettings = (v: AppSettings) => store(SETTINGS_KEY, v);

/** Forget everything the admin page stored, so the next load returns the seed data. */
export function clearAdminStorage(): void {
  try {
    for (const k of [USERS_KEY, SETTINGS_KEY, ACTIVITY_KEY]) localStorage.removeItem(k);
  } catch {
    /* nothing stored */
  }
}

export const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export const activeThisWeek = (u: AdminUser) =>
  u.status === 'active' && !!u.lastActive && Date.now() - new Date(u.lastActive).getTime() < 7 * 24 * 60 * 60_000;
