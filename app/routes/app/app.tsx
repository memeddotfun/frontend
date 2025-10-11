import { useState, useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { AppHeader } from "@/components/app/AppHeader";
import { Sidebar } from "@/components/app/Sidebar";
import { useAuthStore } from "@/store/auth";

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Select all necessary state, including the new _hasHydrated flag
  const { isAuthenticated, isLoading, verifySession, _hasHydrated } =
    useAuthStore();

  // This effect still runs to ensure the session is validated against the backend,
  // but the UI won't be blocked by it if the state is already persisted.
  useEffect(() => {
    verifySession();
  }, [verifySession]);

  // This effect handles redirection, but only runs AFTER hydration is complete.
  useEffect(() => {
    // Wait for hydration and any initial loading to be done
    if (_hasHydrated && !isLoading && !isAuthenticated) {
      navigate("/", {
        replace: true,
      });
    }
  }, [_hasHydrated, isLoading, isAuthenticated, navigate, location.pathname]);

  // Show a loading spinner if the store hasn't rehydrated from localStorage yet,
  // OR if an active session verification is in progress.
  if (!_hasHydrated || isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading session...</div>
      </div>
    );
  }

  // If hydration is done and we are not loading, but the user is still not
  // authenticated, render null. The useEffect above will handle the redirect.
  if (!isAuthenticated) {
    return null;
  }

  // Redirect /app to /app/explore
  if (location.pathname === "/app") {
    return <Navigate to="/app/explore" replace />;
  }

  return (
    <div className="h-screen bg-black flex flex-col w-full">
      <div className="flex h-full relative w-full">
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="h-full bg-[#131414] px-4 w-full lg:w-[82%] flex-col py-3">
          <div className="h-[5%] w-full">
            <AppHeader
              onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </div>
          <div className="h-[95%] overflow-y-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
