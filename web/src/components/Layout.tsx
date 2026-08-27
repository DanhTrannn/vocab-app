import { Link, useLocation } from 'react-router-dom';

interface Breadcrumb {
  label: string;
  to?: string;
}

const buildBreadcrumbs = (pathname: string): Breadcrumb[] => {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: Breadcrumb[] = [{ label: 'Trang chủ', to: '/' }];

  if (parts[0] === 'day-sets' && parts[1]) {
    crumbs.push({ label: 'Bộ từ', to: '/' });
    if (parts[2] === 'quiz') {
      crumbs.push({ label: `Bộ #${parts[1]}`, to: `/day-sets/${parts[1]}` });
      crumbs.push({ label: 'Làm test' });
    } else if (parts[2] === 'results') {
      crumbs.push({ label: `Bộ #${parts[1]}`, to: `/day-sets/${parts[1]}` });
      crumbs.push({ label: 'Kết quả' });
    } else {
      crumbs.push({ label: `Bộ #${parts[1]}` });
    }
  }

  return crumbs;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold text-slate-900 hover:text-primary-600 transition-colors cursor-pointer"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-sm text-white">
              V
            </span>
            <span className="hidden sm:inline">Từ Vựng</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link to="/" className="btn-ghost text-sm">
              Bộ từ
            </Link>
          </nav>
        </div>
      </header>

      {breadcrumbs.length > 1 && (
        <nav className="mx-auto max-w-3xl px-4 sm:px-6 pt-4" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm text-slate-500">
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-300">/</span>}
                {crumb.to ? (
                  <Link
                    to={crumb.to}
                    className="hover:text-primary-600 transition-colors cursor-pointer"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-900 font-medium">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <main className="page-container">{children}</main>
    </div>
  );
}
