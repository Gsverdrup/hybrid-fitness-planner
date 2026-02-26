import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentPlan, getCurrentUser, logout, type AuthUser, type SavedPlan } from "../api/planApi";
import "./ProfilePage.css";

type LocalPlanGoal = "5k" | "10k" | "half" | "marathon";

type CachedPlan = {
  plan: unknown;
  goal?: LocalPlanGoal;
  createdAt?: string;
};

const GOAL_LABELS: Record<string, string> = {
  "5k": "5K",
  "10k": "10K",
  "half": "Half Marathon",
  "half-marathon": "Half Marathon",
  "marathon": "Marathon",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);
  const [cachedPlan, setCachedPlan] = useState<CachedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const currentUser = await getCurrentUser();
        if (!isMounted) return;

        if (!currentUser) {
          setUser(null);
          setSavedPlan(null);
          setCachedPlan(getCachedPlan());
          setError("Sign in to sync your plans across devices.");
          return;
        }

        setUser(currentUser);
        setError(null);

        try {
          const plan = await getCurrentPlan();
          if (isMounted) {
            if (plan) {
              setSavedPlan(plan);
              setCachedPlan(null);
            } else {
              setSavedPlan(null);
              setCachedPlan(getCachedPlan());
            }
          }
        } catch {
          if (isMounted) {
            setSavedPlan(null);
            setCachedPlan(getCachedPlan());
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setSavedPlan(null);
          setCachedPlan(getCachedPlan());
          setError("Sign in to sync your plans across devices.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadProfile();
    return () => { isMounted = false; };
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  }

  function viewPlan() {
    if (savedPlan) {
      navigate("/plan", { state: { plan: savedPlan.planJson, goal: fromServerGoal(savedPlan.goal) } });
      return;
    }
    if (cachedPlan?.plan) {
      navigate("/plan", { state: { plan: cachedPlan.plan, goal: cachedPlan.goal } });
      return;
    }
    navigate("/plan");
  }

  const activePlan = savedPlan ?? cachedPlan;
  const planGoal = savedPlan?.goal ?? cachedPlan?.goal;
  const planDate = savedPlan?.createdAt ?? cachedPlan?.createdAt;
  const isCachedOnlyPlan = !user && !!cachedPlan && !savedPlan;
  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) ?? "?";

  if (loading) {
    return (
      <div className="profile-root">
        <div className="profile-inner">
          <div className="profile-guest-card">
            <p>Loading…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-root">
      <div className="profile-inner">

        {/* User Card */}
        {user ? (
          <div className="profile-header-card">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-user-info">
              <p className="profile-name">{user.name}</p>
              <p className="profile-email">{user.email}</p>
            </div>
            <button className="profile-sign-out" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        ) : (
          <div className="profile-guest-card">
            <h2>Your Profile</h2>
            <p>{error ?? "Sign in to save and sync your training plans."}</p>
            <div className="profile-guest-actions">
              <button className="btn-view-plan" onClick={() => navigate("/login")}>Sign In</button>
              <button className="btn-new-plan" onClick={() => navigate("/signup")}>Create Account</button>
            </div>
          </div>
        )}

        {/* Plan Card */}
        {activePlan ? (
          <div className="profile-plan-card">
            <p className="profile-card-label">{isCachedOnlyPlan ? "Local Device Plan" : "Training Plan"}</p>
            {isCachedOnlyPlan && (
              <p className="plan-date">This plan is saved on this device only until you sign in.</p>
            )}
            <p className="plan-goal-badge">
              {planGoal ? GOAL_LABELS[planGoal] ?? planGoal : "Race"}
            </p>
            {planDate && (
              <p className="plan-date">Generated {new Date(planDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
            )}
            <div className="plan-actions">
              <button className="btn-view-plan" onClick={viewPlan}>
                View Plan
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button className="btn-new-plan" onClick={() => navigate("/quiz")}>
                Generate New
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-no-plan">
            <p>No training plan yet. Build one to get started.</p>
            <button className="btn-view-plan" onClick={() => navigate("/quiz")}>
              Build My Plan
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        <button className="profile-back" onClick={() => navigate("/")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to home
        </button>
      </div>
    </div>
  );
}

function fromServerGoal(goal: SavedPlan["goal"]): LocalPlanGoal {
  switch (goal) {
    case "half-marathon": return "half";
    default: return goal;
  }
}

function getCachedPlan(): CachedPlan | null {
  const raw = localStorage.getItem("hf_last_plan");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedPlan;
    if (typeof parsed !== "object" || parsed === null || !("plan" in parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}