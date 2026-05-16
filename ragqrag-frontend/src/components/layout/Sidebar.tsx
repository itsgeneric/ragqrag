import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Query', description: 'Search documents & graph', icon: '🔍' },
    { to: '/comparison', label: 'Comparison', description: 'Compare answers & metrics', icon: '📊' },
    { to: '/metrics', label: 'Metrics', description: 'History of feedback & scores', icon: '📁' },
    { to: '/settings', label: 'Settings', description: 'Session & motion controls', icon: '⚙️' },
  ];

  return (
    <aside className="hidden h-[calc(100vh-56px)] w-64 shrink-0 border-r border-slate-200/70 bg-background/60 px-4 py-4 lg:flex lg:flex-col">
      <div className="space-y-2 text-xs text-text-muted">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
        <div className="space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-soft'
                    : 'text-text-muted hover:bg-slate-100 hover:text-text-main'
                }`}
              >
                <span className="text-base">{link.icon}</span>
                <div className="flex flex-col">
                  <span className="text-xs font-medium">{link.label}</span>
                  <span className="text-[11px] text-slate-500 group-hover:text-slate-600">{link.description}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;


