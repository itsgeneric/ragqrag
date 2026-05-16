import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useSessionStore } from './hooks/useSessionStore';
import HomePage from './pages/HomePage';
import ComparisonPage from './pages/ComparisonPage';
import MetricsPage from './pages/MetricsPage';
import SettingsPage from './pages/SettingsPage';
import Header from './components/layout/Header';
import QuantumResearchPage from './pages/QuantumResearchPage';

const AppShell: React.FC = () => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useSessionStore((s) => s.reduceMotion);

  useEffect(() => {
    if (reduceMotion || !containerRef.current) return;
    const el = containerRef.current;
    el.classList.add('page-enter');
    // Use CSS transitions rather than JS for reduced overhead
    requestAnimationFrame(() => {
      el.classList.add('page-enter-active');
    });
    const timeout = setTimeout(() => {
      el.classList.remove('page-enter');
      el.classList.remove('page-enter-active');
    }, 350);
    return () => clearTimeout(timeout);
  }, [location.pathname, reduceMotion]);

  return (
    <div className="min-h-screen bg-background text-text-main">
      <Header />
      <main
        ref={containerRef}
        className="pb-8 pt-4 lg:pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 w-full"
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/comparison" element={<ComparisonPage />} />
          <Route path="/metrics" element={<MetricsPage />} />
          <Route path="/quantum-research" element={<QuantumResearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return <AppShell />;
};

export default App;
