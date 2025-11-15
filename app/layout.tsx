import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'tiny-url | Short link service',
  description: 'Create and manage branded short links with analytics.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_DOMAIN ?? 'http://localhost:3000')
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-brand">tiny-url</h1>
            <p className="text-slate-300 text-sm">Secure short links with built-in analytics.</p>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
