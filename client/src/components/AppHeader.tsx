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
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      }
    }

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  return (
    <header className="app-header">
      <nav className="app-header-nav" aria-label="Primary">
        <Link to="/" className="app-header-brand">
          PaceForge
        </Link>

        <div className="app-header-links">
          {!user ? (
            <>
              <Link to="/login" className="app-header-link">
                Login
              </Link>
              <Link to="/signup" className="app-header-link">
                Sign Up
              </Link>
            </>
          ) : (
            <Link to="/profile" className="app-header-link">
              Profile
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
