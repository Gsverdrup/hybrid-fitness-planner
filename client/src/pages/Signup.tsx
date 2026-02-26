import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { signup } from "../api/planApi";
import "./AuthPage.css";

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/profile";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signup({ name, email, password });
      window.dispatchEvent(new Event("authchange"));
      navigate(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
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

        <h1>Create account</h1>
        <p>Save your profile and access your plan anywhere.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Name
            <input
              type="text"
              placeholder="Your name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
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
              placeholder="Min. 8 characters"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <hr className="auth-divider" />

        <div className="auth-links">
          <Link to={`/login${returnTo !== "/profile" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}>Already have an account?</Link>
          <Link to="/">← Back home</Link>
        </div>
      </main>
    </div>
  );
}