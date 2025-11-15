import { AdminDashboard } from '@/components/AdminDashboard';

export default function AdminPage() {
  return (
    <section className="space-y-6">
      <p className="text-sm text-slate-300">
        Admin access required. Provide the shared token to list, delete, and inspect analytics for all short links.
      </p>
      <AdminDashboard />
    </section>
  );
}
