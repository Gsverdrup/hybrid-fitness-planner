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
        if (!isMounted) {
          return;
        }

        setUser(currentUser);
        setError(null);

        try {
          const plan = await getCurrentPlan();
          if (isMounted) {
            setSavedPlan(plan);
            setCachedPlan(null);
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
          setError("Sign in to access your saved profile and plans.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  }

  if (loading) {
    return (
      <div className="profile-root">
        <main className="profile-card">
          <h1>Your Profile</h1>
          <p>Loading profile...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="profile-root">
      <main className="profile-card">
        <h1>Your Profile</h1>
        {user ? (
          <p>Signed in as {user.name} ({user.email}).</p>
        ) : (
          <p>{error ?? "Sign in to access your training hub."}</p>
        )}

        {user && savedPlan ? (
          <p>
            Last saved plan: {savedPlan.goal} ({new Date(savedPlan.createdAt).toLocaleDateString()})
          </p>
        ) : user && cachedPlan ? (
          <p>
            Last generated plan: {cachedPlan.goal ?? "race"}
            {cachedPlan.createdAt ? ` (${new Date(cachedPlan.createdAt).toLocaleDateString()})` : ""}
          </p>
        ) : null}

        <div className="profile-actions">
          <button
            onClick={() => {
              if (savedPlan) {
                navigate("/plan", {
                  state: {
                    plan: savedPlan.planJson,
                    goal: fromServerGoal(savedPlan.goal),
                  },
                });
                return;
              }

              if (cachedPlan?.plan) {
                navigate("/plan", {
                  state: {
                    plan: cachedPlan.plan,
                    goal: cachedPlan.goal,
                  },
                });
                return;
              }

              navigate("/plan");
            }}
          >
            View Current Plan
          </button>
          <button onClick={() => navigate("/quiz")} className="secondary">
            Generate New Plan
          </button>
        </div>

        {user ? (
          <button className="back-home" onClick={handleLogout}>
            Sign Out
          </button>
        ) : (
          <button className="back-home" onClick={() => navigate("/login")}>
            Sign In
          </button>
        )}

        <button className="back-home" onClick={() => navigate("/")}>
          Back Home
        </button>
      </main>
    </div>
  );
}

function fromServerGoal(goal: SavedPlan["goal"]): LocalPlanGoal {
  switch (goal) {
    case "half-marathon":
      return "half";
    default:
      return goal;
  }
}

function getCachedPlan(): CachedPlan | null {
  const raw = localStorage.getItem("hf_last_plan");

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CachedPlan;
    if (typeof parsed !== "object" || parsed === null || !("plan" in parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
