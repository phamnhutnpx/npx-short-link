"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

type LinkItem = {
  id: string;
  slug: string;
  destination: string;
  createdAt: string;
  expiresAt: string | null;
  clickCount: number;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
};

type ClickItem = {
  id: string;
  createdAt: string;
  ip: string | null;
  country: string | null;
  userAgent: string | null;
  referrer: string | null;
};

const TOKEN_KEY = 'tiny-url-admin-token';

export function AdminDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ClickItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setToken(stored);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    window.localStorage.setItem(TOKEN_KEY, token);
    void fetchLinks();
  }, [token]);

  const fetchLinks = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/links', {
        headers: {
          'x-admin-token': token
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to load links');
      }
      setLinks(data.data ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchAnalytics = useCallback(
    async (slug: string) => {
      if (!token) return;
      try {
        setIsLoadingAnalytics(true);
        setError(null);
        const response = await fetch(`/api/links/${slug}/analytics`, {
          headers: {
            'x-admin-token': token
          }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? 'Failed to load analytics');
        }
        setAnalytics(data.data ?? []);
        setSelectedSlug(slug);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoadingAnalytics(false);
      }
    },
    [token]
  );

  const deleteLink = useCallback(
    async (slug: string) => {
      if (!token) return;
      if (!window.confirm(`Delete link ${slug}?`)) return;
      try {
        setError(null);
        const response = await fetch(`/api/links/${slug}`, {
          method: 'DELETE',
          headers: {
            'x-admin-token': token
          }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? 'Failed to delete link');
        }
        await fetchLinks();
        setAnalytics((prev) => (selectedSlug === slug ? [] : prev));
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [token, fetchLinks, selectedSlug]
  );

  const logout = useCallback(() => {
    setToken(null);
    window.localStorage.removeItem(TOKEN_KEY);
    setLinks([]);
    setAnalytics([]);
    setSelectedSlug(null);
  }, []);

  const shortDomain = useMemo(() => process.env.NEXT_PUBLIC_DOMAIN ?? 'http://localhost:3000', []);

  if (!token) {
    return <AdminLogin onSubmit={setToken} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Admin dashboard</h2>
        <button type="button" onClick={logout} className="bg-red-600 hover:bg-red-500">
          Logout
        </button>
      </div>
      {error && <p className="rounded bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Links</h3>
          <button type="button" onClick={() => fetchLinks()} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-950/60 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left">Slug</th>
                <th className="px-3 py-2 text-left">Destination</th>
                <th className="px-3 py-2 text-left">Clicks</th>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Expires</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {links.map((link) => (
                <tr key={link.id}>
                  <td className="px-3 py-2 font-mono text-xs text-brand">
                    <a href={`/r/${link.slug}`} target="_blank" rel="noreferrer">
                      {link.slug}
                    </a>
                  </td>
                  <td className="px-3 py-2 max-w-sm truncate" title={link.destination}>
                    {link.destination}
                  </td>
                  <td className="px-3 py-2">{link.clickCount}</td>
                  <td className="px-3 py-2">{new Date(link.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    {link.expiresAt ? new Date(link.expiresAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-3 py-2 space-x-2">
                    <button type="button" onClick={() => fetchAnalytics(link.slug)}>
                      Analytics
                    </button>
                    <button type="button" className="bg-red-600 hover:bg-red-500" onClick={() => deleteLink(link.slug)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {links.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-center text-slate-400" colSpan={6}>
                    No links yet. Create one at {shortDomain}/
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedSlug && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent analytics for {selectedSlug}</h3>
            <span className="text-xs text-slate-400">Showing latest {analytics.length} events</span>
          </div>
          {isLoadingAnalytics ? (
            <p className="text-sm text-slate-300">Loading analytics...</p>
          ) : analytics.length === 0 ? (
            <p className="text-sm text-slate-300">No analytics data yet for this slug.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-950/60 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Timestamp</th>
                    <th className="px-3 py-2 text-left">IP</th>
                    <th className="px-3 py-2 text-left">Country</th>
                    <th className="px-3 py-2 text-left">Referrer</th>
                    <th className="px-3 py-2 text-left">User Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {analytics.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">{new Date(item.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2 font-mono text-xs">{item.ip ?? 'Unknown'}</td>
                      <td className="px-3 py-2">{item.country ?? '—'}</td>
                      <td className="px-3 py-2 max-w-[12rem] truncate" title={item.referrer ?? ''}>
                        {item.referrer ?? '—'}
                      </td>
                      <td className="px-3 py-2 max-w-[16rem] truncate" title={item.userAgent ?? ''}>
                        {item.userAgent ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type AdminLoginProps = {
  onSubmit: (token: string) => void;
};

function AdminLogin({ onSubmit }: AdminLoginProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!value) {
        setError('Admin token is required.');
        return;
      }
      setError(null);
      onSubmit(value.trim());
    },
    [value, onSubmit]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-sm space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-sm shadow"
    >
      <h2 className="text-xl font-semibold text-white">Admin sign-in</h2>
      <p className="text-slate-300">
        Enter the admin token to manage links. The token is never stored server-side; we compare it on each API call.
      </p>
      <div>
        <label htmlFor="adminToken">Admin token</label>
        <input
          id="adminToken"
          name="adminToken"
          type="password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button type="submit">Unlock dashboard</button>
    </form>
  );
}
