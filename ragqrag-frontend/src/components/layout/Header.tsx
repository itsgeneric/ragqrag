import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DatabaseStats from '../common/DatabaseStats';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 border-b border-medium-gray/50 bg-gradient-to-r from-background/95 via-card/90 to-light-gray/95 backdrop-blur">
      <div className="mx-auto flex max-w-full items-center justify-between px-4 py-3 lg:px-8">
        {/* Left Section - Logo, Branding and Navigation */}
        <div className="flex items-center gap-8 flex-shrink-0">
          {/* Logo and Branding */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-colorful overflow-hidden">
              <img
                src="/neural.png"
                alt="Logo"
                className="h-8 object-contain"
              />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-text-main sm:text-base">
                Knowledge Graph Studio
              </h1>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden items-center gap-4 text-sm md:flex">
            {[
              ['/', 'Query'],
              ['/comparison', 'Comparison'],
              ['/metrics', 'Metrics'],
              ['/quantum-research', 'Quantum Research'],
            ].map(([to, label]) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`rounded-full px-3 py-1 transition-colors ${isActive
                      ? 'bg-primary text-white shadow-soft'
                      : 'text-text-muted hover:bg-slate-100 hover:text-text-main'
                    }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section - Database Stats */}
        <div className="flex items-center gap-4 flex-shrink-0 pr-4">
          <DatabaseStats />

          {/* Mobile Menu Toggle Button */}
          <button
            className="md:hidden ml-2 p-2 text-text-main hover:bg-slate-200 rounded-md transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isMobileMenuOpen && (
        <nav className="md:hidden border-t border-medium-gray/50 bg-background px-4 py-4 flex flex-col gap-3 shadow-lg absolute w-full left-0 top-full">
          {[
            ['/', 'Query'],
            ['/comparison', 'Comparison'],
            ['/metrics', 'Metrics'],
            ['/quantum-research', 'Quantum Research'],
          ].map(([to, label]) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`rounded-md px-4 py-3 transition-colors ${isActive
                    ? 'bg-primary text-white shadow-soft'
                    : 'text-text-muted hover:bg-slate-100 hover:text-text-main'
                  }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
};

export default Header;
