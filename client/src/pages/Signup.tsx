import { Link, useNavigate } from "react-router-dom";
import "./AuthPage.css";

export default function SignupPage() {
  const navigate = useNavigate();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate("/profile");
  }

  return (
    <div className="auth-root">
      <main className="auth-card">
        <h1>Create your account</h1>
        <p>Save your profile and regenerate plans any time.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Name
            <input type="text" placeholder="Runner name" required />
          </label>
          <label>
            Email
            <input type="email" placeholder="you@example.com" required />
          </label>
          <label>
            Password
            <input type="password" placeholder="Create a password" required />
          </label>
          <button type="submit">Sign Up</button>
        </form>

        <div className="auth-links">
          <Link to="/login">Already have an account?</Link>
          <Link to="/">Back home</Link>
        </div>
      </main>
    </div>
  );
}
