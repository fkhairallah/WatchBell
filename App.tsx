import React, { ReactNode, useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CrewManagement } from './pages/CrewManagement';
import { WatchConfiguration } from './pages/WatchConfiguration';
import { CrewDetail } from './pages/CrewDetail';
import { SettingsPage } from './pages/Settings';
import { SupportModal } from './components/SupportModal';

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-slate-900">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full border border-red-100">
            <h1 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-4">The application encountered a critical error.</p>
            
            <div className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32 mb-4 border border-gray-200">
              {this.state.error?.message || "Unknown error"}
            </div>
            
            <div className="flex gap-3">
                <button 
                onClick={() => window.location.hash = '#/'}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                Go Home
                </button>
                <button 
                onClick={() => { localStorage.clear(); window.location.reload(); }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                Reset Data
                </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainContent = () => {
  const { currentRoute } = useApp();
  const [showSupport, setShowSupport] = useState(false);

  useEffect(() => {
    // Record first use
    const firstUsed = localStorage.getItem('wm_first_used');
    if (!firstUsed) {
      localStorage.setItem('wm_first_used', String(Date.now()));
      return;
    }
    // Show modal once, 2 weeks after first use
    const shown = localStorage.getItem('wm_support_shown');
    if (!shown && Date.now() - Number(firstUsed) >= TWO_WEEKS_MS) {
      setShowSupport(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('wm_support_shown', '1');
    setShowSupport(false);
  };

  let page: React.ReactNode;
  if (currentRoute === '/crew') page = <CrewManagement />;
  else if (currentRoute.startsWith('/crew/')) page = <CrewDetail />;
  else if (currentRoute === '/config') page = <WatchConfiguration />;
  else if (currentRoute === '/settings') page = <SettingsPage />;
  else page = <Dashboard />;

  return <>{page}{showSupport && <SupportModal onClose={handleClose} />}</>;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Layout>
          <MainContent />
        </Layout>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;