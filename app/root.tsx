/**
 * ROOT COMPONENT - The foundation of the entire Memed.fun application
 *
 * This file serves as the entry point for the React Router application.
 * It sets up three critical pieces:
 * 1. Layout - The HTML shell that wraps every page
 * 2. App - The main application with Web3 providers
 * 3. ErrorBoundary - Catches and displays errors gracefully
 *
 * IMPORTANT FOR JUNIOR DEVS:
 * - This component runs on EVERY page load
 * - Changes here affect the entire application
 * - The Layout wraps both successful renders AND error states
 */

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { Web3Provider } from "./providers/Web3Provider";
import "./app.css";
import { Toaster, toast } from "sonner";

/**
 * LINKS FUNCTION
 *
 * Defines additional <link> tags to inject into the <head>.
 * Currently empty because we're using Tailwind CSS (imported in app.css).
 *
 * Example use cases:
 * - Adding external stylesheets
 * - Preloading fonts
 * - Adding favicons
 */
export const links: Route.LinksFunction = () => [];

/**
 * LAYOUT COMPONENT
 *
 * This is the HTML shell that wraps EVERY page in the application.
 * It provides the basic HTML structure and injects necessary scripts/styles.
 *
 * WHAT IT DOES:
 * - Sets up the <html> and <body> tags
 * - Injects meta tags, stylesheets, and scripts
 * - Handles scroll restoration between page navigations
 * - Works for both successful renders AND error states
 *
 * KEY COMPONENTS:
 * - <Meta /> - Injects meta tags defined in route files (SEO, og:image, etc.)
 * - <Links /> - Injects <link> tags (stylesheets, fonts, favicons)
 * - <ScrollRestoration /> - Remembers scroll position when navigating back
 * - <Scripts /> - Injects JavaScript bundles needed for React hydration
 *
 * @param children - Either the App component (success) or ErrorBoundary (error)
 */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

import { useEffect } from "react";
import { useAuthStore } from "./store/auth";

/**
 * APP COMPONENT - The main application wrapper
 *
 * This component runs on every successful page load (not on errors).
 * It sets up three essential things:
 *
 * 1. SESSION VERIFICATION
 *    - Checks if user has a valid authentication token on page load
 *    - Automatically logs in users who previously authenticated
 *    - Runs once when the app first mounts
 *
 * 2. WEB3 PROVIDER
 *    - Initializes Wagmi (for blockchain interactions)
 *    - Sets up React Query (for caching blockchain data)
 *    - Configures ConnectKit (wallet connection UI)
 *
 * 3. TOAST NOTIFICATIONS
 *    - Provides the <Toaster /> component for success/error messages
 *    - Used throughout the app via toast.success(), toast.error(), etc.
 *
 * WHY THESE PROVIDERS?
 * - Web3Provider must wrap everything because wallet state is needed app-wide
 * - Session verification runs early so auth state is ready before routes load
 * - Toaster is rendered once at root level, controlled by toast() calls anywhere
 *
 * @see Web3Provider for blockchain setup details
 * @see useAuthStore for authentication logic
 */
export default function App() {
  // SESSION VERIFICATION EFFECT
  // This runs once on mount to check if the user is already logged in.
  // It looks for a stored auth token and validates it with the backend.
  // If valid, the user is automatically logged in without needing to reconnect wallet.
  useEffect(() => {
    useAuthStore.getState().verifySession();
  }, []); // Empty deps = runs only once on mount

  return (
    <Web3Provider>
      {/* OUTLET - This is where route components render */}
      {/* React Router will inject the current page component here */}
      <Outlet />

      {/* TOASTER - Global notification system */}
      {/* Call toast.success("Message") or toast.error("Error") from anywhere */}
      <Toaster />
    </Web3Provider>
  );
}

/**
 * ERROR BOUNDARY - Catches and displays errors gracefully
 *
 * This component renders when something goes wrong in the application.
 * It replaces the normal App component to show a user-friendly error page.
 *
 * TYPES OF ERRORS HANDLED:
 *
 * 1. ROUTE ERRORS (404, etc.)
 *    - User navigates to /nonexistent-page
 *    - Shows "404 - Page not found"
 *
 * 2. LOADER ERRORS (data fetching)
 *    - API fails during route data loading
 *    - Shows error message from the loader
 *
 * 3. COMPONENT ERRORS (runtime crashes)
 *    - JavaScript error in React component
 *    - In DEV: Shows full stack trace for debugging
 *    - In PROD: Shows generic error message (no stack for security)
 *
 * WHY THIS IS IMPORTANT:
 * - Without ErrorBoundary, the entire app would crash and show a blank screen
 * - This catches errors and keeps the app partially functional
 * - Still wrapped in Layout, so the HTML shell and styles remain intact
 *
 * DEBUGGING TIP:
 * - Stack traces only show in development mode (import.meta.env.DEV)
 * - In production, users see a clean error message without technical details
 *
 * @param error - The error object thrown somewhere in the app
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  // CHECK: Is this a route-specific error (404, 500, etc.)?
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  }
  // CHECK: Is this a JavaScript error AND are we in development mode?
  else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack; // Full stack trace for debugging
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>

      {/* STACK TRACE - Only visible in development mode */}
      {/* Helps developers debug errors during development */}
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
