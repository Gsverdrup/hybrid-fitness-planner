import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { login } from "../api/planApi";
import "./AuthPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-root">
      <main className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-dot" />
          <span className="auth-brand-name">MileSmith</span>
        </div>

        <h1>Welcome back</h1>
        <p>Sign in to view your training plan and progress.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <hr className="auth-divider" />

        <div className="auth-links">
          <Link to={`/signup${returnTo !== "/profile" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}>Create an account</Link>
          <Link to="/">← Back home</Link>
        </div>
      </main>
    </div>
  );
}