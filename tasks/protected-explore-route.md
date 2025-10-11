# Protected Explore Route

## Problem

The `/explore` route and its nested routes needed to be protected, meaning only authenticated users should be able to access them. Initial attempts to implement this led to confusion regarding the correct placement of the `loader` function within the project's specific React Router v7 setup.

## Solution

To properly protect the `/explore` route and all its nested children, a server-side `loader` function was implemented directly within the `app/routes/app/app.tsx` component file. This ensures that any access to `/app/*` (including `/app/explore` and its sub-routes) will first go through an authentication check, redirecting unauthenticated users to the home page (`/`).

### Changes Made:

1.  **Reverted all previous changes in `app/routes.ts`:**
    - Removed any `authLoader` imports.
    - Removed any `loader` properties from `route` definitions.
    - Removed `import { type LoaderFunction } from "react-router";`.

2.  **Reverted all previous changes in `app/routes/app/explore.tsx`:**
    - Removed the `loader` function and its imports from `app/routes/app/explore.tsx`.

3.  **Implemented `loader` directly in `app/routes/app/app.tsx`:**
    The `loader` function was added to `app/routes/app/app.tsx` along with necessary imports (`redirect`, `apiClient`, `API_ENDPOINTS`). This `loader` performs the authentication check:

    ```typescript
    import { useState } from "react";
    import { Navigate, Outlet, useLocation, useNavigate, redirect } from "react-router";
    import { AppHeader } from "@/components/app/AppHeader";
    import { Sidebar } from "@/components/app/Sidebar";
    import { apiClient } from "@/lib/api/client";
    import { API_ENDPOINTS } from "@/lib/api/config";

    /**
     * Loader function for the /app route.
     * Checks if the user is authenticated. If not, redirects to the home page.
     */
    export async function loader() {
      try {
        const response = await apiClient.get(API_ENDPOINTS.GET_USER);
        if (!response.success || !response.data?.user) {
          throw redirect("/"); // Redirect to home page if not authenticated
        }
        return null; // User is authenticated, proceed to render the component
      } catch (error) {
        console.error("App route loader authentication error:", error);
        throw redirect("/"); // Redirect to home page on any authentication error
      }
    }

    export default function App() {
      const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
      const location = useLocation();

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
            <main className="h-full bg-[#131414]  px-4 w-full  lg:w-[82%] flex-col py-3">
              <div className="h-[5%] w-full">
                <AppHeader
                  onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />
              </div>
              <div className="h-[95%] overflow-y-auto  w-full  ">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      );
    }
    ```

## Review

- The `/explore` route and all its nested routes are now protected using a server-side `loader` defined directly in `app/routes/app/app.tsx`.
- Unauthenticated users attempting to access any route under `/app` will be redirected to the home page (`/`).
- This approach is compatible with SSR and prevents content flashing.
- The authentication check leverages the existing `apiClient` and `API_ENDPOINTS.GET_USER` for consistency.
- This implementation correctly follows the project's specific React Router v7 loader pattern for protecting a group of nested routes.
