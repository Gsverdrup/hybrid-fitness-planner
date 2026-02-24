import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/planApi";
import "./AuthPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
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
      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-root">
      <main className="auth-card">
        <h1>Welcome back</h1>
        <p>Sign in to view your saved plan and profile.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="auth-error">{error}</p> : null}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/signup">Create an account</Link>
          <Link to="/">Back home</Link>
        </div>
      </main>
    </div>
  );
}
