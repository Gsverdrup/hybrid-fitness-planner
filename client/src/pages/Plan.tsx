import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentPlan, getCurrentUser, savePlan, signup, login, GOAL_TO_SERVER_GOAL, type ServerGoal, type AuthUser } from "../api/planApi";
import "./PlanPage.css";

type Goal = "5k" | "10k" | "half" | "marathon";
type WeekType = "B" | "D" | "T";
type RunType = "easy" | "workout" | "long";
type LiftType = "push" | "pull" | "legs" | "upper";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const GOAL_LABELS: Record<Goal, string> = {
  "5k": "5K",
  "10k": "10K",
  half: "Half Marathon",
  marathon: "Marathon",
};

type RunWorkout = {
  type: "run";
  runType: RunType;
  miles: number;
  name?: string;
  paceMinPerMile?: number;
  segments?: Array<{
    distanceMiles: number;
    pace: number;
    description?: string;
  }>;
};

type LiftWorkout = {
  type: "lift";
  liftType: LiftType;
  exercises?: Array<{ name: string; sets: number; reps: number }>;
};

type Workout = RunWorkout | LiftWorkout;

type CalendarDay = {
  day: number;
  workouts: Workout[];
};

type CalendarWeek = {
  days: CalendarDay[];
  weekType?: WeekType;
};

type PlanData = unknown;

type LocationState = {
  plan?: PlanData;
  goal?: Goal;
};

type CachedPlan = {
  plan: PlanData;
  goal?: Goal;
  profileSnapshot?: unknown;
  createdAt?: string;
};

export default function PlanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;
  const [plan, setPlan] = useState<PlanData | undefined>(state.plan);
  const [goal, setGoal] = useState<Goal | undefined>(state.goal);
  const [isLoadingPlan, setIsLoadingPlan] = useState(!state.plan);
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined); // undefined = still loading
  const [planSaved, setPlanSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedPlan() {
      const currentUser = await getCurrentUser().catch(() => null);
      if (isMounted) {
        setUser(currentUser);
      }

      if (state.plan) {
        setIsLoadingPlan(false);
        return;
      }

      if (!currentUser) {
        const cachedPlan = getCachedPlan();
        if (isMounted) {
          setPlan(cachedPlan?.plan);
          setGoal(cachedPlan?.goal);
          setIsLoadingPlan(false);
        }
        return;
      }

      try {
        const current = await getCurrentPlan();
        if (!isMounted) {
          return;
        }

        if (current) {
          setPlan(current.planJson);
          setGoal(fromServerGoal(current.goal));
        } else {
          const cachedPlan = getCachedPlan();
          setPlan(cachedPlan?.plan);
          setGoal(cachedPlan?.goal);
        }
      } catch {
        if (!isMounted) {
          return;
        }

        const cachedPlan = getCachedPlan();
        setPlan(cachedPlan?.plan);
        setGoal(cachedPlan?.goal);
      } finally {
        if (isMounted) {
          setIsLoadingPlan(false);
        }
      }
    }

    void loadSavedPlan();

    return () => {
      isMounted = false;
    };
  }, [state.goal, state.plan]);

  if (isLoadingPlan) {
    return (
      <div className="plan-root plan-empty">
        <div className="plan-empty-inner">
          <p>Loading your plan…</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="plan-root plan-empty">
        <div className="plan-empty-inner">
          <p>No training plan found.</p>
          <button onClick={() => navigate("/quiz")}>Build My Plan →</button>
        </div>
      </div>
    );
  }

  const weeks = normalizeWeeks(plan);
  const summary = extractSummary(plan);
  const goalLabel = goal ? GOAL_LABELS[goal] : "Race";
  const title = extractTitle(plan) ?? `Your ${goalLabel} Training Plan`;

  // Show banner if: user is definitely logged out and plan hasn't been saved yet
  const showSaveBanner = user === null && !planSaved;

  return (
    <div className="plan-root">
      {showSaveBanner && (
        <SavePlanBanner
          plan={plan}
          goal={goal}
          onSaved={() => setPlanSaved(true)}
        />
      )}

      <header className="plan-header">
        <div className="plan-header-inner">
          <div>
            <div className="plan-eyebrow">Training Plan</div>
            <h1 className="plan-title">{title}</h1>
            {summary && <p className="plan-summary">{summary}</p>}
          </div>
          <div className="plan-header-actions">
            <button className="btn-outline" onClick={() => navigate("/quiz")}>
              Rebuild Plan
            </button>
            <button className="btn-outline" onClick={() => window.print()}>
              Print / Save
            </button>
          </div>
        </div>
      </header>

      {weeks.length > 0 && (
        <section className="plan-weeks">
          {weeks.map((week, weekIndex) => (
            <WeekCard key={weekIndex} week={week} index={weekIndex} />
          ))}
        </section>
      )}

      {weeks.length === 0 && (
        <section className="plan-empty-grid">
          <p>We couldn't render this plan format yet. Try rebuilding your plan.</p>
        </section>
      )}
    </div>
  );
}

function fromServerGoal(goal: ServerGoal): Goal {
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

// ─── Save Plan Banner ────────────────────────────────────────────────────────

type SavePlanBannerProps = {
  plan: PlanData;
  goal: Goal | undefined;
  onSaved: () => void;
};

type BannerMode = "prompt" | "signup" | "login" | "saving" | "success";

function SavePlanBanner({ plan, goal, onSaved }: SavePlanBannerProps) {
  const [mode, setMode] = useState<BannerMode>("prompt");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  async function handleSavePlanForUser() {
    if (!goal) {
      throw new Error("Missing goal for this plan. Please regenerate your plan from the quiz.");
    }

    const cached = getCachedPlan();
    if (!cached?.profileSnapshot) {
      throw new Error("Missing profile details for this plan. Please regenerate your plan from the quiz.");
    }

    await savePlan({
      goal: GOAL_TO_SERVER_GOAL[goal],
      profileSnapshot: cached.profileSnapshot,
      plan: plan as Record<string, unknown>,
      planType: "race",
    });
    localStorage.removeItem("hf_last_plan");
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signup({ name, email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
      setIsSubmitting(false);
      return;
    }
    // Account created — now try to save the plan, but don't block success on it
    setMode("saving");
    try {
      await handleSavePlanForUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save plan.");
      setMode("signup");
      setIsSubmitting(false);
      return;
    }

    setMode("success");
    window.dispatchEvent(new Event("authchange"));
    setTimeout(onSaved, 2000);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setIsSubmitting(false);
      return;
    }
    // Logged in — now try to save the plan, but don't block success on it
    setMode("saving");
    try {
      await handleSavePlanForUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save plan.");
      setMode("login");
      setIsSubmitting(false);
      return;
    }

    setMode("success");
    window.dispatchEvent(new Event("authchange"));
    setTimeout(onSaved, 2000);
  }

  if (mode === "success") {
    return (
      <div className="save-banner save-banner--success">
        <div className="save-banner-inner">
          <div className="save-banner-success-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div>
            <p className="save-banner-title">Plan saved to your account!</p>
            <p className="save-banner-sub">You can access it any time from your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "saving") {
    return (
      <div className="save-banner">
        <div className="save-banner-inner">
          <div className="save-banner-spinner" />
          <p className="save-banner-title">Saving your plan…</p>
        </div>
      </div>
    );
  }

  if (mode === "signup" || mode === "login") {
    const isSignup = mode === "signup";
    return (
      <div className="save-banner save-banner--form">
        <div className="save-banner-form-inner">
          <div className="save-banner-form-header">
            <div>
              <p className="save-banner-eyebrow">Save your plan</p>
              <h2 className="save-banner-form-title">
                {isSignup ? "Create a free account" : "Sign in to your account"}
              </h2>
            </div>
            <button className="save-banner-dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={isSignup ? handleSignup : handleLogin} className="save-banner-form">
            {isSignup && (
              <input
                className="save-banner-input"
                type="text"
                placeholder="Your name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            )}
            <input
              className="save-banner-input"
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              className="save-banner-input"
              type="password"
              placeholder={isSignup ? "Create a password (min. 8 chars)" : "Password"}
              required
              minLength={isSignup ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
            {error && <p className="save-banner-error">{error}</p>}
            <div className="save-banner-form-actions">
              <button type="submit" className="save-banner-submit" disabled={isSubmitting}>
                {isSubmitting
                  ? (isSignup ? "Creating account…" : "Signing in…")
                  : (isSignup ? "Create Account & Save Plan" : "Sign In & Save Plan")}
              </button>
              <button
                type="button"
                className="save-banner-switch"
                onClick={() => { setMode(isSignup ? "login" : "signup"); setError(null); }}
              >
                {isSignup ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // "prompt" mode — the default teaser bar
  return (
    <div className="save-banner save-banner--prompt">
      <div className="save-banner-inner">
        <div className="save-banner-prompt-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        </div>
        <div className="save-banner-prompt-text">
          <span className="save-banner-title">Your plan isn't saved yet.</span>
          <span className="save-banner-sub">Create a free account to keep it and access it anywhere.</span>
        </div>
        <div className="save-banner-prompt-actions">
          <button className="save-banner-cta" onClick={() => setMode("signup")}>
            Save My Plan
          </button>
          <button className="save-banner-secondary" onClick={() => setMode("login")}>
            Sign In
          </button>
          <button className="save-banner-dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function WeekCard({ week, index }: { week: CalendarWeek; index: number }) {
  const weekNumber = index + 1;
  const totalMiles = week.days.reduce(
    (sum, day) =>
      sum +
      day.workouts.reduce(
        (inner, workout) => (workout.type === "run" ? inner + (workout.miles ?? 0) : inner),
        0
      ),
    0
  );

  return (
    <div className="week-card">
      <div className="week-header">
        <div className="week-number">Week {weekNumber}</div>
        {week.weekType && <div className="week-theme">{labelWeekType(week.weekType)}</div>}
        <div className="week-miles">{totalMiles.toFixed(1)} mi</div>
      </div>

      <div className="calendar-grid">
        {DAYS.map((dayName, idx) => {
          const day = week.days.find((entry) => entry.day === idx) ?? { day: idx, workouts: [] };
          return <DayCell key={dayName} dayName={dayName} day={day} />;
        })}
      </div>
    </div>
  );
}

function DayCell({ dayName, day }: { dayName: string; day: CalendarDay }) {
  const [expandedWorkoutIndex, setExpandedWorkoutIndex] = useState<number | null>(null);
  const workouts = Array.isArray(day.workouts) ? day.workouts : [];
  const isRest = workouts.length === 0;

  const toggleExpanded = (index: number) => {
    setExpandedWorkoutIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className={`day-cell ${isRest ? "rest" : ""}`}>
      <div className="day-label">{dayName}</div>

      {isRest && <div className="rest-pill">Rest</div>}

      <div className="day-workouts">
        {workouts.map((workout, idx) => {
          const isExpanded = expandedWorkoutIndex === idx;

          return (
            <div key={`${workout.type}-${idx}`}>
              <button
                type="button"
                className="workout-chip-button"
                onClick={() => toggleExpanded(idx)}
                aria-expanded={isExpanded}
              >
                <WorkoutChip workout={workout} />
              </button>
              {isExpanded && <WorkoutDetails workout={workout} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkoutChip({ workout }: { workout: Workout }) {
  if (workout.type === "run") {
    return (
      <div className={`workout-chip run ${workout.runType}`}>
        <span>{workout.name ?? `${capitalize(workout.runType)} Run`}</span>
        <strong>{workout.miles} mi</strong>
      </div>
    );
  }

  return (
    <div className={`workout-chip lift ${workout.liftType}`}>
      <span>{capitalize(workout.liftType)} Lift</span>
      {workout.exercises?.length ? <strong>{workout.exercises.length} Exercises</strong> : null}
    </div>
  );
}

function WorkoutDetails({ workout }: { workout: Workout }) {
  if (workout.type === "run") {
    const groupedSegments = workout.segments?.length ? groupConsecutiveSegments(workout.segments) : null;

    return (
      <div className="workout-detail">
        {workout.paceMinPerMile ? <div>Pace: {formatPace(workout.paceMinPerMile)} /mi</div> : null}
        {groupedSegments?.length ? (
          <ul className="detail-list">
            {groupedSegments.map((group, idx) => (
              <li key={idx}>
                {group.segment.description ?? "Segment"}: {group.segment.distanceMiles} mi @ {formatPace(group.segment.pace)}
                {group.count > 1 && <span className="repeat-count"> ×{group.count}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <div>Distance: {workout.miles} mi</div>
        )}
      </div>
    );
  }

  return (
    <div className="workout-detail">
      {workout.exercises?.length ? (
        <ul className="detail-list">
          {workout.exercises.map((exercise, idx) => (
            <li key={idx}>
              {exercise.name} — {exercise.sets}x{exercise.reps}
            </li>
          ))}
        </ul>
      ) : (
        <div>Lift session details unavailable.</div>
      )}
    </div>
  );
}

type SegmentGroup = {
  segment: {
    distanceMiles: number;
    pace: number;
    description?: string;
  };
  count: number;
};

function segmentEquals(
  a: { distanceMiles: number; pace: number; description?: string },
  b: { distanceMiles: number; pace: number; description?: string }
): boolean {
  return (
    a.distanceMiles === b.distanceMiles &&
    a.pace === b.pace &&
    (a.description ?? "") === (b.description ?? "")
  );
}

function groupConsecutiveSegments(
  segments: Array<{ distanceMiles: number; pace: number; description?: string }>
): SegmentGroup[] {
  if (segments.length <= 1) return segments.map(seg => ({ segment: seg, count: 1 }));

  // Try to find repeating block patterns at any position in the segment list
  for (let blockSize = 1; blockSize <= Math.floor(segments.length / 2); blockSize++) {
    for (let startIdx = 0; startIdx <= segments.length - blockSize * 2; startIdx++) {
      const blockPattern = segments.slice(startIdx, startIdx + blockSize);
      let repeatCount = 1;
      let endIdx = startIdx + blockSize;

      // Check how many times the pattern repeats consecutively
      while (endIdx + blockSize <= segments.length) {
        const nextBlock = segments.slice(endIdx, endIdx + blockSize);
        if (blockPattern.every((seg, idx) => segmentEquals(seg, nextBlock[idx]))) {
          repeatCount++;
          endIdx += blockSize;
        } else {
          break;
        }
      }

      // If pattern repeats at least twice and we haven't found a better one yet
      if (repeatCount > 1) {
        const groups: SegmentGroup[] = [];

        // Add prefix (non-repeating segments before the pattern)
        for (let i = 0; i < startIdx; i++) {
          groups.push({ segment: segments[i], count: 1 });
        }

        // Add repeating block (each segment with its repeat count)
        blockPattern.forEach(seg => {
          groups.push({ segment: seg, count: repeatCount });
        });

        // Add suffix (non-repeating segments after the pattern)
        for (let i = endIdx; i < segments.length; i++) {
          groups.push({ segment: segments[i], count: 1 });
        }

        return groups;
      }
    }
  }

  // Fall back to consecutive identical segments
  const groups: SegmentGroup[] = [];
  let currentGroup: SegmentGroup = {
    segment: segments[0],
    count: 1,
  };

  for (let i = 1; i < segments.length; i++) {
    if (segmentEquals(segments[i], segments[i - 1])) {
      currentGroup.count++;
    } else {
      groups.push(currentGroup);
      currentGroup = { segment: segments[i], count: 1 };
    }
  }

  groups.push(currentGroup);
  return groups;
}

function normalizeWeeks(plan: unknown): CalendarWeek[] {
  if (Array.isArray(plan)) {
    return plan.filter(isCalendarWeek);
  }

  if (typeof plan === "object" && plan !== null) {
    const weeks = (plan as { weeks?: unknown }).weeks;
    if (Array.isArray(weeks)) {
      return weeks.filter(isCalendarWeek);
    }

    const schedule = (plan as { schedule?: unknown }).schedule;
    if (Array.isArray(schedule)) {
      return schedule
        .map((entry) => {
          if (isCalendarWeek(entry)) return entry;

          if (typeof entry === "object" && entry !== null) {
            const days = (entry as { days?: unknown; sessions?: unknown }).days ?? (entry as { sessions?: unknown }).sessions;
            if (Array.isArray(days)) {
              const normalizedDays: CalendarDay[] = days
                .map((day, idx) => {
                  if (typeof day !== "object" || day === null) {
                    return { day: idx, workouts: [] };
                  }
                  const workoutText = String(
                    (day as { workout?: string; description?: string; type?: string }).workout ??
                      (day as { description?: string }).description ??
                      (day as { type?: string }).type ??
                      ""
                  );

                  return {
                    day: idx,
                    workouts: workoutText && !/rest/i.test(workoutText)
                      ? [{ type: "run", runType: "easy", miles: Number((day as { miles?: number; distance?: number }).miles ?? (day as { distance?: number }).distance ?? 0), name: workoutText }]
                      : [],
                  } as CalendarDay;
                })
                .slice(0, 7);

              return {
                days: normalizedDays,
              };
            }
          }

          return null;
        })
        .filter((entry): entry is CalendarWeek => entry !== null);
    }
  }

  return [];
}

function isCalendarWeek(value: unknown): value is CalendarWeek {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { days?: unknown }).days)
  );
}

function extractTitle(plan: unknown): string | null {
  if (typeof plan === "object" && plan !== null && "title" in plan) {
    const title = (plan as { title?: unknown }).title;
    return typeof title === "string" ? title : null;
  }
  return null;
}

function extractSummary(plan: unknown): string | null {
  if (typeof plan === "object" && plan !== null) {
    const summary = (plan as { summary?: unknown }).summary;
    if (typeof summary === "string") return summary;

    const description = (plan as { description?: unknown }).description;
    if (typeof description === "string") return description;
  }
  return null;
}

function labelWeekType(weekType: WeekType): string {
  if (weekType === "B") return "Build";
  if (weekType === "D") return "Deload";
  return "Taper";
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatPace(minutesPerMile: number): string {
  const minutes = Math.floor(minutesPerMile);
  const seconds = Math.round((minutesPerMile - minutes) * 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}