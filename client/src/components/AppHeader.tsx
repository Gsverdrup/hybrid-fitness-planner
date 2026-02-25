import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCurrentUser, type AuthUser } from "../api/planApi";
import "./AppHeader.css";

export default function AppHeader() {
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (isMounted) setUser(currentUser);
      } catch {
        if (isMounted) setUser(null);
      }
    }

    void loadUser();

    // Re-check auth whenever login happens on the same page (e.g. plan save banner)
    const handleAuthChange = () => void loadUser();
    window.addEventListener("authchange", handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener("authchange", handleAuthChange);
    };
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="app-header">
      <nav className="app-header-nav" aria-label="Primary">
        <Link to="/" className="app-header-brand">
          <span className="brand-dot" />
          MileSmith
        </Link>

        <div className="app-header-links">
          {!user ? (
            <>
              <Link
                to="/login"
                className={`app-header-link${isActive("/login") ? " active" : ""}`}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="app-header-link cta"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/plan"
                className={`app-header-link${isActive("/plan") ? " active" : ""}`}
              >
                My Plan
              </Link>
              <Link
                to="/profile"
                className={`app-header-link${isActive("/profile") ? " active" : ""}`}
              >
                Profile
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}