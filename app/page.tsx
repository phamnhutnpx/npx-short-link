import { LinkForm } from '@/components/LinkForm';

export default function HomePage() {
  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Shorten your links</h2>
        <p className="text-sm text-slate-300">
          Create branded short URLs with optional expiration and campaign tagging. Monitor performance via the admin
          dashboard.
        </p>
      </div>
      <LinkForm />
      <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-300">
        <h3 className="text-lg font-semibold text-white">How it works</h3>
        <ul className="list-disc space-y-1 pl-5 pt-2">
          <li>Submit a valid <code>http(s)</code> URL. We block unsupported schemes to prevent open redirects.</li>
          <li>Optionally set a custom slug (4-64 chars, alphanumeric + - _). Otherwise we generate a 6 char slug.</li>
          <li>All requests are rate-limited (60 per hour per IP). Contact the admin for higher quotas.</li>
          <li>Admins can view analytics and manage links at <code>/admin</code>.</li>
        </ul>
      </div>
    </section>
  );
}
