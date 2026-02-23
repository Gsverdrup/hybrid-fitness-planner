import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";

export default function ProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="profile-root">
      <main className="profile-card">
        <h1>Your Profile</h1>
        <p>This page is ready for auth integration later. For now, use it as your training hub.</p>

        <div className="profile-actions">
          <button onClick={() => navigate("/plan")}>View Current Plan</button>
          <button onClick={() => navigate("/quiz")} className="secondary">
            Generate New Plan
          </button>
        </div>

        <button className="back-home" onClick={() => navigate("/")}>
          Back Home
        </button>
      </main>
    </div>
  );
}
