import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api/planApi";
import "./AuthPage.css";

export default function SignupPage() {
  const navigate = useNavigate();
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
      navigate("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-root">
      <main className="auth-card">
        <h1>Create your account</h1>
        <p>Save your profile and regenerate plans any time.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Name
            <input
              type="text"
              placeholder="Runner name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
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
              placeholder="Create a password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="auth-error">{error}</p> : null}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Already have an account?</Link>
          <Link to="/">Back home</Link>
        </div>
      </main>
    </div>
  );
}
