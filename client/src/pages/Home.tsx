import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  return (
    <div className="home-root">
      <div className="home-bg">
        <div className="track-lines">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="track-line" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>

      <main className="home-content">
        <div className="home-eyebrow">Training Intelligence</div>
        <h1 className="home-title">
          <span className="title-line">Run</span>
          <span className="title-line accent">Smarter.</span>
          <span className="title-line">Race</span>
          <span className="title-line accent">Faster.</span>
        </h1>
        <p className="home-sub">
          A personalized training plan built around your body, your schedule, and your goal — generated in seconds.
        </p>

        <div className="home-actions">
          <button className="btn-primary" onClick={() => navigate("/quiz")}>
            <span>Build My Plan</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <button className="btn-ghost" onClick={() => navigate("/login")}>
            Sign In
          </button>
          <button className="btn-ghost" onClick={() => navigate("/signup")}>
            Sign Up
          </button>
        </div>

        <button className="profile-link" onClick={() => navigate("/profile")}>
          Go to Profile
        </button>

        <div className="home-races">
          {["5K", "10K", "Half Marathon", "Marathon"].map((r) => (
            <div key={r} className="race-chip">{r}</div>
          ))}
        </div>
      </main>

      <footer className="home-footer">
        <span>© {year} PaceForge</span>
        <button className="footer-link" onClick={() => navigate("/signup")}>Create account</button>
      </footer>
    </div>
  );
}