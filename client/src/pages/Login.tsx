import { Link, useNavigate } from "react-router-dom";
import "./AuthPage.css";

export default function LoginPage() {
  const navigate = useNavigate();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate("/profile");
  }

  return (
    <div className="auth-root">
      <main className="auth-card">
        <h1>Welcome back</h1>
        <p>Sign in to view your saved plan and profile.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input type="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input type="password" placeholder="••••••••" required />
          </label>
          <button type="submit">Sign In</button>
        </form>

        <div className="auth-links">
          <Link to="/signup">Create an account</Link>
          <Link to="/">Back home</Link>
        </div>
      </main>
    </div>
  );
}
