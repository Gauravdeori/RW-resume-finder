import { useEffect, useId, useState, type FormEvent } from 'react';
import {
  activeThisWeek,
  clearAdminStorage,
  isValidEmail,
  loadActivity,
  loadUsers,
  newId,
  storeActivity,
  storeUsers,
  type Activity,
  type ActivityKind,
  type AdminUser,
  type AppSettings,
  type Role,
} from '../lib/admin';
import { CURRENT_USER } from '../lib/conversions';
import { useI18n } from '../lib/i18n';
import { cx } from './controls';
import { Modal } from './Modal';
import { DotHeading, PillSwitch, Segmented, StudioCard, TrashIcon } from './studio';

const ROLES: Role[] = ['admin', 'recruiter', 'viewer'];
const initials = (name: string) =>
  name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

const inputCls =
  'h-11 w-full rounded-[10px] border border-tile-line bg-card px-3 text-[16px] text-ink outline-none focus:border-ink/60 sm:text-[14px]';

/**
 * Admin (dummy). Users and activity are sample data kept in the browser.
 * Search settings are real: they change the Search page straight away.
 */
export function AdminPage({
  settings,
  onSettings,
  conversionsCount,
  onResetOthers,
}: {
  settings: AppSettings;
  onSettings: (patch: Partial<AppSettings>) => void;
  conversionsCount: number;
  /** Resets saved searches, conversions and settings owned by the app. */
  onResetOthers: () => void;
}) {
  const { t } = useI18n();
  const a = t.admin;

  const [users, setUsers] = useState<AdminUser[]>(loadUsers);
  const [activity, setActivity] = useState<Activity[]>(loadActivity);
  useEffect(() => storeUsers(users), [users]);
  useEffect(() => storeActivity(activity), [activity]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'recruiter' as Role });
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const nameId = useId();
  const emailId = useId();
  const resetTitleId = useId();

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(id);
  }, [notice]);

  const log = (kind: ActivityKind, x?: string, y?: string) =>
    setActivity((list) => [{ id: newId('a'), at: new Date().toISOString(), kind, a: x, b: y }, ...list]);

  const updateUser = (id: string, patch: Partial<AdminUser>) =>
    setUsers((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const submitInvite = (e: FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    if (!name) return setFormError(a.errName);
    if (!isValidEmail(email)) return setFormError(a.errEmail);
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return setFormError(a.errDuplicate);
    setUsers((list) => [...list, { id: newId('u'), name, email, role: form.role, status: 'invited', lastActive: null }]);
    log('invite', name);
    setNotice(a.invited(name));
    setForm({ name: '', email: '', role: 'recruiter' });
    setFormError(null);
    setInviteOpen(false);
  };

  const setSetting = (key: 'gender' | 'jd', on: boolean) => {
    onSettings(key === 'gender' ? { showGender: on } : { showJdFill: on });
    log(on ? 'settingOn' : 'settingOff', key);
  };

  const reset = () => {
    onResetOthers();
    clearAdminStorage();
    setUsers(loadUsers());
    setActivity([{ id: newId('a'), at: new Date().toISOString(), kind: 'reset' }, ...loadActivity()]);
    setInviteOpen(false);
    setConfirmReset(false);
  };

  const describe = (x: Activity): string => {
    switch (x.kind) {
      case 'export':
      case 'search':
        return a.act[x.kind](x.a ?? '', x.b ?? '');
      case 'role':
        return a.act.role(x.a ?? '', a.role[(x.b as Role) ?? 'viewer'] ?? x.b ?? '');
      case 'settingOn':
      case 'settingOff':
        return a.act[x.kind](a.setting[x.a as 'gender' | 'jd'] ?? x.a ?? '');
      case 'lang':
        return a.act.lang(a.langName[x.a as 'en' | 'ja'] ?? x.a ?? '');
      case 'reset':
        return a.act.reset;
      default:
        return a.act[x.kind](x.a ?? '');
    }
  };

  const stats = [
    { label: a.statUsers, value: users.length, accent: false },
    { label: a.statActive, value: users.filter(activeThisWeek).length, accent: true },
    { label: a.statInvites, value: users.filter((u) => u.status === 'invited').length, accent: false },
    { label: a.statConversions, value: conversionsCount, accent: false },
  ];

  return (
    <div className="mx-auto max-w-[1220px]">
      <p className="mono-caps text-[11px] text-muted">{a.eyebrow}</p>
      <h1 className="mt-2 text-[34px] leading-tight font-extrabold tracking-tight sm:text-[44px]">{a.title}</h1>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((x) => (
          <div key={x.label} className="rounded-[14px] border border-card-line bg-card px-5 py-5 sm:px-6">
            <div className={cx('text-[30px] leading-none font-medium', x.accent && 'text-accent')}>{x.value}</div>
            <div className="mono-caps mt-3 text-[10px] leading-snug text-muted">{x.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Users */}
        <StudioCard>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <DotHeading>{a.usersTitle}</DotHeading>
              <p className="mt-1 text-[13px] text-muted">{a.usersSub}</p>
            </div>
            {!inviteOpen && (
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="h-10 rounded-full bg-accent px-5 text-[14px] font-bold text-on-accent hover:brightness-95"
              >
                {a.invite}
              </button>
            )}
          </div>

          {notice && (
            <p role="status" className="mt-4 rounded-[10px] border border-ok/40 bg-ok/10 px-3.5 py-2.5 text-[13px]">
              {notice}
            </p>
          )}

          {inviteOpen && (
            <form onSubmit={submitInvite} noValidate className="mt-4 rounded-[12px] border border-tile-line bg-tile p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={nameId} className="mb-1.5 block text-[12px] text-muted">
                    {a.inviteName}
                  </label>
                  <input
                    id={nameId}
                    autoFocus
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor={emailId} className="mb-1.5 block text-[12px] text-muted">
                    {a.inviteEmail}
                  </label>
                  <input
                    id={emailId}
                    type="email"
                    autoComplete="off"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1.5 text-[12px] text-muted">{a.inviteRole}</div>
                <Segmented
                  label={a.inviteRole}
                  size="sm"
                  value={form.role}
                  onChange={(role) => setForm({ ...form, role })}
                  options={ROLES.map((r) => ({ value: r, label: a.role[r] }))}
                />
              </div>
              {formError && (
                <p role="alert" className="mt-3 text-[13px] text-accent">
                  {formError}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <button type="submit" className="h-10 rounded-full bg-accent px-5 text-[14px] font-bold text-on-accent hover:brightness-95">
                  {a.sendInvite}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInviteOpen(false);
                    setFormError(null);
                  }}
                  className="h-10 rounded-full border border-card-line bg-card px-5 text-[14px] hover:border-ink/50"
                >
                  {t.cancel}
                </button>
              </div>
            </form>
          )}

          <ul className="mt-4">
            {users.map((u) => {
              const self = u.name === CURRENT_USER;
              return (
                <li key={u.id} className="flex flex-col gap-3 border-t border-card-line py-4 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      aria-hidden
                      className={cx(
                        'flex h-10 w-10 flex-none items-center justify-center rounded-full border border-tile-line bg-tile text-[13px] font-semibold',
                        u.status === 'deactivated' && 'opacity-50',
                      )}
                    >
                      {initials(u.name)}
                    </span>
                    <div className="min-w-0">
                      <div className={cx('truncate text-[14px] font-medium', u.status === 'deactivated' && 'text-muted')}>
                        {u.name} {self && <span className="font-normal text-muted">{a.you}</span>}
                      </div>
                      <div className="truncate text-[12.5px] text-muted">{u.email}</div>
                      <div className="mt-0.5 text-[11.5px] text-muted">
                        {u.lastActive ? a.lastActive(a.ago(u.lastActive)) : a.neverActive}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pl-[52px] md:pl-0">
                    <span
                      className={cx(
                        'mono-caps inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[9.5px] whitespace-nowrap',
                        u.status === 'active' && 'border-ok/70 text-ok',
                        u.status === 'invited' && 'border-warn/70 text-warn',
                        u.status === 'deactivated' && 'border-tile-line text-muted',
                      )}
                    >
                      {a.status[u.status]}
                    </span>
                    {self ? (
                      <span className="inline-flex h-8 items-center rounded-full border border-tile-line px-3 text-[12.5px] font-semibold">
                        {a.role.admin}
                      </span>
                    ) : (
                      <Segmented
                        label={a.roleFor(u.name)}
                        size="sm"
                        value={u.role}
                        onChange={(role) => {
                          updateUser(u.id, { role });
                          log('role', u.name, role);
                        }}
                        options={ROLES.map((r) => ({ value: r, label: a.role[r] }))}
                      />
                    )}
                    {!self && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (u.status === 'invited') {
                              log('resend', u.name);
                              setNotice(a.invited(u.name));
                            } else {
                              const next = u.status === 'active' ? 'deactivated' : 'active';
                              updateUser(u.id, { status: next });
                              log(next === 'active' ? 'activate' : 'deactivate', u.name);
                            }
                          }}
                          className="h-9 rounded-full border border-card-line bg-card px-3.5 text-[12.5px] font-semibold whitespace-nowrap hover:border-ink/50"
                        >
                          {u.status === 'invited' ? a.resend : u.status === 'active' ? a.deactivate : a.activate}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUsers((list) => list.filter((x) => x.id !== u.id));
                            log('remove', u.name);
                          }}
                          aria-label={a.removeUser(u.name)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-card-line bg-card hover:border-accent hover:text-accent"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </StudioCard>

        <div className="flex flex-col gap-4 sm:gap-5">
          {/* Search settings: these really change the Search page */}
          <StudioCard>
            <DotHeading>{a.settingsTitle}</DotHeading>
            <p className="mt-1 text-[13px] text-muted">{a.settingsSub}</p>
            <ul className="mt-3">
              {(['gender', 'jd'] as const).map((key) => {
                const on = key === 'gender' ? settings.showGender : settings.showJdFill;
                return (
                  <li key={key} className="flex items-start justify-between gap-4 border-t border-card-line py-4">
                    <div>
                      <div className="text-[14px] font-medium">{a.setting[key]}</div>
                      <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{a.settingHelp[key]}</p>
                    </div>
                    <PillSwitch checked={on} onChange={(v) => setSetting(key, v)} label={a.setting[key]} />
                  </li>
                );
              })}
              <li className="border-t border-card-line pt-4">
                <div className="text-[14px] font-medium">{a.defaultLang}</div>
                <div className="mt-2.5">
                  <Segmented
                    label={a.defaultLang}
                    size="sm"
                    value={settings.defaultLang}
                    onChange={(l) => {
                      onSettings({ defaultLang: l });
                      log('lang', l);
                    }}
                    options={[
                      { value: 'en', label: a.langName.en },
                      { value: 'ja', label: a.langName.ja },
                    ]}
                  />
                </div>
              </li>
            </ul>
          </StudioCard>

          {/* Activity */}
          <StudioCard>
            <DotHeading>{a.activityTitle}</DotHeading>
            {activity.length === 0 ? (
              <p className="mt-3 text-[13px] text-muted">{a.activityEmpty}</p>
            ) : (
              <ol className="mt-3">
                {activity.slice(0, 8).map((x) => (
                  <li key={x.id} className="flex gap-3 border-t border-card-line py-3 first:border-t-0">
                    <span aria-hidden className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-accent" />
                    <div className="min-w-0">
                      <p className="text-[13px] leading-snug break-words">{describe(x)}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted">{a.ago(x.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </StudioCard>

          {/* Demo data */}
          <StudioCard>
            <DotHeading>{a.demoTitle}</DotHeading>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{a.demoSub}</p>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="mt-4 h-10 rounded-full border border-ink/70 px-5 text-[14px] font-semibold hover:border-accent hover:text-accent"
            >
              {a.reset}
            </button>
          </StudioCard>
        </div>
      </div>

      {confirmReset && (
        <Modal labelledBy={resetTitleId} onClose={() => setConfirmReset(false)} className="mt-[12vh] max-w-[380px] rounded-[16px] p-6">
          <h2 id={resetTitleId} className="text-[18px] font-semibold">
            {a.resetTitle}
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{a.resetBody}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="h-10 rounded-full border border-card-line px-5 text-[14px] hover:border-ink/50"
            >
              {t.cancel}
            </button>
            <button type="button" onClick={reset} className="h-10 rounded-full bg-accent px-5 text-[14px] font-bold text-on-accent">
              {a.resetConfirm}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
