"use client";

import { useState, useTransition } from 'react';
import { createLinkAction } from '@/app/actions/createLink';

const utmFields = [
  { name: 'utmSource', label: 'UTM Source' },
  { name: 'utmMedium', label: 'UTM Medium' },
  { name: 'utmCampaign', label: 'UTM Campaign' },
  { name: 'utmTerm', label: 'UTM Term' },
  { name: 'utmContent', label: 'UTM Content' }
];

export function LinkForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      setMessage(null);
      setError(null);
      setShortUrl(null);
      const result = await createLinkAction(formData);
      if (result.ok) {
        setMessage(result.message);
        setShortUrl(result.shortUrl);
        form.reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-xl backdrop-blur">
      <h2 className="text-xl font-semibold text-white mb-4">Create a short link</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="destination">Destination URL *</label>
          <input
            id="destination"
            name="destination"
            type="url"
            required
            placeholder="https://example.com"
            autoComplete="off"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="slug">Custom slug</label>
            <input id="slug" name="slug" placeholder="optional-slug" pattern="^[A-Za-z0-9-_]{4,64}$" />
            <p className="mt-1 text-xs text-slate-500">Leave blank to auto-generate a 6 character slug.</p>
          </div>
          <div>
            <label htmlFor="expiresAt">Expiration</label>
            <input id="expiresAt" name="expiresAt" type="datetime-local" />
          </div>
        </div>
        <div>
          <label htmlFor="title">Title</label>
          <input id="title" name="title" placeholder="Internal title" maxLength={120} />
        </div>
        <details className="rounded border border-slate-800 bg-slate-950/40 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-200">UTM parameters</summary>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {utmFields.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name}>{field.label}</label>
                <input id={field.name} name={field.name} maxLength={120} />
              </div>
            ))}
          </div>
        </details>
        <button type="submit" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create short link'}
        </button>
        {message && (
          <div className="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            <p>{message}</p>
            {shortUrl && (
              <p className="mt-1 break-all">
                Short URL: <a href={shortUrl}>{shortUrl}</a>
              </p>
            )}
          </div>
        )}
        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
