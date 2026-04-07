import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Loader2, RefreshCcw } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NewMarking from "./pages/NewMarking";
import MarkingPage from "./pages/MarkingPage";
import EditPage from "./pages/EditPage";
import ExportPage from "./pages/ExportPage";
import HistoryPage from "./pages/HistoryPage";
import MyAccountPage from "./pages/MyAccountPage";
import AuthPage from "./pages/AuthPage";
import FinishDetailsPage from "./pages/FinishDetailsPage";
import InspectionListPage from "./pages/InspectionListPage";
import AbstractViewPage from "./pages/AbstractViewPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-muted-foreground gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="font-bold tracking-widest uppercase text-xs animate-pulse">Initializing Session...</p>
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function GlobalLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-muted-foreground gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="font-bold tracking-widest uppercase text-xs animate-pulse">Authenticating...</p>
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center">
          <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
            <RefreshCcw className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-black mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-8 text-sm max-w-xs mx-auto">
            The application encountered an unexpected error. Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="h-14 w-full max-w-xs bg-primary text-primary-foreground font-bold rounded-xl shadow-lg"
          >
            REFRESH APP
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppRoutes = () => {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-24 safe-bottom selection:bg-primary/30">
      <ErrorBoundary>
        <Routes>
          <Route path="/auth" element={loading ? <GlobalLoading /> : user ? <Navigate to="/" replace /> : <AuthPage />} />
          <Route path="/auth/callback" element={loading ? <GlobalLoading /> : user ? <Navigate to="/" replace /> : <AuthPage />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/new" element={<ProtectedRoute><NewMarking /></ProtectedRoute>} />
          <Route path="/marking" element={<ProtectedRoute><MarkingPage /></ProtectedRoute>} />
          <Route path="/finish-details" element={<ProtectedRoute><FinishDetailsPage /></ProtectedRoute>} />
          <Route path="/inspection-list" element={<ProtectedRoute><InspectionListPage /></ProtectedRoute>} />
          <Route path="/marking/:id/edit" element={<ProtectedRoute><EditPage /></ProtectedRoute>} />
          <Route path="/abstract-view/:id" element={<ProtectedRoute><AbstractViewPage /></ProtectedRoute>} />
          <Route path="/export" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/my-account" element={<ProtectedRoute><MyAccountPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
      {user && <BottomNav />}
    </div>
  );
};

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
