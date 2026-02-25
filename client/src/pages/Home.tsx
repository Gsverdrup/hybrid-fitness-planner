import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, type AuthUser } from "../api/planApi";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const year = new Date().getFullYear();

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

    const handleAuthChange = () => void loadUser();
    window.addEventListener("authchange", handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener("authchange", handleAuthChange);
    };
  }, []);

  return (
    <div className="home-root">
      <div className="home-bg">
        <div className="bg-grid" />
        <div className="bg-glow-1" />
        <div className="bg-glow-2" />
        <div className="bg-diagonal" />
      </div>

      <main className="home-content">
        <div className="home-eyebrow">Training Intelligence</div>

        <h1 className="home-title">
          <span className="title-word-normal">Run</span>
          <span className="title-word-accent">Smarter.</span>
          <span className="title-word-normal">Race</span>
          <span className="title-word-accent">Faster.</span>
        </h1>

        <p className="home-sub">
          A personalized training plan built around your schedule, your abilities, and your goal — generated in seconds.
        </p>

        <div className="home-actions">
          <button className="btn-primary" onClick={() => navigate("/quiz")}>
            Build My Plan
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          {user ? (
            <button className="btn-ghost" onClick={() => navigate("/plan")}>View My Plan</button>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => navigate("/login")}>Sign In</button>
              <button className="btn-ghost" onClick={() => navigate("/signup")}>Sign Up</button>
            </>
          )}
        </div>

        <div className="home-stats">
          <div className="stat-item">
            <span className="stat-value">4</span>
            <span className="stat-label">Race Distances</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">Built Around You</span>
            <span className="stat-label">Your Schedule & Goals</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">Run + Lift</span>
            <span className="stat-label">Hybrid Training</span>
          </div>
        </div>

        <div className="home-races">
          {["5K", "10K", "Half Marathon", "Marathon"].map((r) => (
            <div key={r} className="race-chip">{r}</div>
          ))}
        </div>
      </main>

      <footer className="home-footer">
        <span>© {year} MileSmith</span>
        {!user ? (
          <button className="footer-link" onClick={() => navigate("/signup")}>
            Create free account →
          </button>
        ) : null}
      </footer>
    </div>
  );
}