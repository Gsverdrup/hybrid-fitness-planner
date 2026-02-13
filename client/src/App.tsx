import { useState, useEffect } from "react";

const API_URL = "http://localhost:3001";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Exercise library (mirrors backend liftExercises.ts) ──────────────────────
const EXERCISE_OPTIONS = {
  primaryChest:   ["Barbell Bench Press","Incline Barbell Bench Press","Dumbbell Bench Press","Incline Dumbbell Bench Press","Machine Chest Press"],
  secondaryChest: ["Dumbbell Chest Flyes","Cable Chest Flyes","Machine Chest Flyes","Push-Ups"],
  frontDelt:      ["Standing Overhead Press","Dumbbell Shoulder Press"],
  lateralDelt:    ["Dumbbell Lateral Raises","Cable Lateral Raises"],
  tricep:         ["Tricep Dips","Overhead Tricep Extension","Tricep Pushdowns","Skull Crushers"],
  lat:            ["Lat Pulldowns","Single-Arm Lat Pulldowns","Pull-Ups","Lat Pullovers"],
  midBack:        ["Barbell Rows","Dumbbell Rows","Seated Cable Rows","Chest-Supported Rows"],
  rearDelt:       ["Cable Rear Delt Flyes","Machine Rear Delt Flyes","Face Pulls"],
  bicep:          ["Barbell Curls","Hammer Curls","Dumbbell Curls","Preacher Curls"],
  compoundLeg:    ["Back Squats","Leg Press","Bulgarian Split Squats","Goblet Squats"],
  quad:           ["Leg Extensions","Step-Ups","Lunges"],
  hamstring:      ["Romanian Deadlifts","Hamstring Curls","Good Mornings"],
  glute:          ["Hip Thrusts","Glute Bridges","Hip Abductions","Hip Adductions"],
  calf:           ["Standing Calf Raises","Seated Calf Raises"],
} as const;

type MuscleGroup = keyof typeof EXERCISE_OPTIONS;

// Default preferences = first option per group (matches backend default)
const DEFAULT_PREFS: Record<MuscleGroup, string> = Object.fromEntries(
  Object.entries(EXERCISE_OPTIONS).map(([k, v]) => [k, v[0]])
) as Record<MuscleGroup, string>;

function formatPace(paceMinPerMile?: number): string {
  if (!paceMinPerMile) return "";
  const minutes = Math.floor(paceMinPerMile);
  const seconds = Math.round((paceMinPerMile - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function parseTimeToMinutes(value: string): number {
  const parts = value.split(":").map(Number);
  if (parts.some(isNaN)) return 0;

  if (parts.length === 2) {
    const [m, s] = parts;
    return m + s / 60;
  }

  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 60 + m + s / 60;
  }

  return 0;
}

function getRunLabel(workout: any): string {
  if (workout.name) return workout.name;
  if (workout.runType === "long") return "Long Run";
  if (workout.runType === "workout") return "Workout";
  if (workout.runType === "easy") return "Easy Run";
  return "Run";
}

export default function App() {
  const [profile, setProfile] = useState({
    age: 25,
    sex: "male",
    runningLevel: "intermediate",
    startingWeeklyMileage: 20,
    currentWeeklyMileage: 20,
    liftingExperience: "beginner",
    runDaysPerWeek: 6,
    liftDaysPerWeek: 0,
    longRunDay: 0,
    runDays: [] as number[],
    liftDays: [] as number[],
    goal: "marathon",
    trainingLengthWeeks: 16,
    providedRaceTime: {
      distanceKm: 5,
      timeMinutes: 25,
    },
  });

  const [plan, setPlan] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [selectedLift, setSelectedLift] = useState<any>(null);
  const [showExercisePrefs, setShowExercisePrefs] = useState(false);
  const [exercisePrefs, setExercisePrefs] = useState<Record<MuscleGroup, string>>(DEFAULT_PREFS);

  useEffect(() => {
    if (profile.runDays.length > 0 && !profile.runDays.includes(profile.longRunDay)) {
      setProfile(p => ({ ...p, longRunDay: p.runDays[0] }));
    }
  }, [profile.runDays, profile.longRunDay]);

  const isRaceGoal = ["5k", "10k", "half-marathon", "marathon"].includes(profile.goal);
  const isValid =
    profile.runDaysPerWeek === profile.runDays.length &&
    profile.liftDaysPerWeek === profile.liftDays.length &&
    (profile.runDaysPerWeek > 0 || profile.liftDaysPerWeek > 0) &&
    (!isRaceGoal ||
      (profile.providedRaceTime?.distanceKm &&
      profile.providedRaceTime?.timeMinutes &&
      profile.providedRaceTime.timeMinutes > 0));

  const toggleDay = (day: number, type: "runDays" | "liftDays") => {
    setProfile(p => ({
      ...p,
      [type]: p[type].includes(day) 
        ? p[type].filter(d => d !== day)
        : [...p[type], day].sort()
    }));
  };

  async function generate() {
    if (!isValid) return;
    
    setError("");
    setLoading(true);
    setPlan(null);

    try {
      let endpoint = "/plan";
      
      if (profile.goal === "5k") endpoint = "/race-plan/5k";
      else if (profile.goal === "10k") endpoint = "/race-plan/10k";
      else if (profile.goal === "half-marathon") endpoint = "/race-plan/half";
      else if (profile.goal === "marathon") endpoint = "/race-plan/marathon";

      // Build preferredLiftExercises in the shape the backend expects
      // Each key maps to an Exercise[] with sets/reps omitted (backend supplies those)
      const preferredLiftExercises = profile.liftDaysPerWeek > 0 ? {
        primaryChestExercises:   [{ name: exercisePrefs.primaryChest,   sets: 4, reps: 8  }],
        secondaryChestExercises: [{ name: exercisePrefs.secondaryChest, sets: 3, reps: 12 }],
        frontDeltExercises:      [{ name: exercisePrefs.frontDelt,      sets: 3, reps: 10 }],
        lateralDeltExercises:    [{ name: exercisePrefs.lateralDelt,    sets: 3, reps: 12 }],
        tricepExercises:         [{ name: exercisePrefs.tricep,         sets: 3, reps: 10 }],
        latExercises:            [{ name: exercisePrefs.lat,            sets: 4, reps: 8  }],
        midBackExercises:        [{ name: exercisePrefs.midBack,        sets: 4, reps: 8  }],
        rearDeltExercises:       [{ name: exercisePrefs.rearDelt,       sets: 3, reps: 12 }],
        bicepExercises:          [{ name: exercisePrefs.bicep,          sets: 3, reps: 10 }],
        compoundLegExercises:    [{ name: exercisePrefs.compoundLeg,    sets: 4, reps: 8  }],
        quadExercises:           [{ name: exercisePrefs.quad,           sets: 3, reps: 10 }],
        hamstringExercises:      [{ name: exercisePrefs.hamstring,      sets: 3, reps: 10 }],
        gluteExercises:          [{ name: exercisePrefs.glute,          sets: 3, reps: 10 }],
        calfExercises:           [{ name: exercisePrefs.calf,           sets: 3, reps: 15 }],
      } : undefined;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, preferredLiftExercises }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setPlan(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const runColors: Record<string, string> = {
    long: "#10b981",
    workout: "#f43f5e",
    easy: "#f59e0b",
  };

  const liftColors: Record<string, string> = {
    push: "#3b82f6",
    pull: "#8b5cf6",
    legs: "#ec4899",
    upper: "#06b6d4",
  };

  const WorkoutCard = ({ workout, onClick }: { workout: any; onClick?: () => void }) => {
    if (workout.type === "run") {
      return (
        <div
          onClick={onClick}
          style={{
            background: runColors[workout.runType],
            padding: "6px",
            borderRadius: "4px",
            fontSize: "11px",
            textAlign: "center",
            cursor: onClick ? "pointer" : "default",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = "scale(1)")}
        >
          <div style={{ fontSize: "9px", opacity: 0.8 }}>{getRunLabel(workout)}</div>
          <div style={{ fontWeight: 700, fontSize: "13px" }}>{workout.miles} mi</div>
          {workout.paceMinPerMile && (
            <div style={{ fontSize: "9px", opacity: 0.9 }}>{formatPace(workout.paceMinPerMile)}</div>
          )}
        </div>
      );
    } else {
      return (
        <div
          onClick={onClick}
          style={{
            background: liftColors[workout.liftType],
            padding: "6px",
            borderRadius: "4px",
            fontSize: "11px",
            textAlign: "center",
            cursor: onClick ? "pointer" : "default",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = "scale(1)")}
        >
          <div style={{ textTransform: "capitalize" }}>{workout.liftType}</div>
          {workout.exercises?.length > 0 && (
            <div style={{ fontSize: "9px", opacity: 0.7, marginTop: "2px" }}>
              {workout.exercises.length} exercises
            </div>
          )}
        </div>
      );
    }
  };

  const WorkoutDetailModal = ({ workout, onClose }: { workout: any; onClose: () => void }) => {
    if (!workout || workout.type !== "run") return null;

    return (
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#1e293b",
            borderRadius: "12px",
            padding: "32px",
            maxWidth: "600px",
            width: "100%",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <button
            onClick={onClose}
            style={{
              float: "right",
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0 8px",
            }}
          >
            ×
          </button>

          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "6px 12px",
                background: runColors[workout.runType],
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "12px",
              }}
            >
              {workout.runType.toUpperCase()}
            </div>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "28px" }}>{getRunLabel(workout)}</h2>
            <div style={{ color: "#94a3b8", fontSize: "14px" }}>
              {workout.miles} miles
              {workout.paceMinPerMile && ` @ ${formatPace(workout.paceMinPerMile)} /mi`}
            </div>
          </div>

          {workout.segments && workout.segments.length > 0 && (
            <div>
              <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Workout Structure</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {workout.segments.map((seg: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      background: "#0f172a",
                      padding: "16px",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                        {seg.description || `Segment ${idx + 1}`}
                      </div>
                      <div style={{ fontSize: "14px", color: "#94a3b8" }}>
                        {seg.distanceMiles} miles @ {formatPace(seg.pace)} /mi
                      </div>
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "#3b82f6" }}>
                      {formatPace(seg.pace)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!workout.segments || workout.segments.length === 0) && (
            <div style={{ background: "#0f172a", padding: "20px", borderRadius: "8px" }}>
              <div style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "8px" }}>
                Total Distance
              </div>
              <div style={{ fontSize: "32px", fontWeight: 700, marginBottom: "16px" }}>
                {workout.miles} miles
              </div>
              {workout.paceMinPerMile && (
                <>
                  <div style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "8px" }}>
                    Target Pace
                  </div>
                  <div style={{ fontSize: "32px", fontWeight: 700, color: "#3b82f6" }}>
                    {formatPace(workout.paceMinPerMile)} /mi
                  </div>
                </>
              )}
            </div>
          )}

          <div style={{ marginTop: "24px", padding: "16px", background: "#0f172a", borderRadius: "8px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
              💡 Tips
            </div>
            <div style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.6 }}>
              {workout.runType === "easy" && "Keep this run conversational. You should be able to chat comfortably."}
              {workout.runType === "long" && "Start slow and maintain steady effort. Fuel and hydrate appropriately."}
              {workout.runType === "workout" && "Warm up thoroughly before starting. Focus on consistent effort and good form."}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const liftTips: Record<string, string> = {
    push: "Focus on chest, shoulders, and triceps. Control the eccentric (lowering) phase for maximum stimulus.",
    pull: "Focus on back and biceps. Initiate each pull from the lats, not the arms.",
    legs: "Prioritize full range of motion on squats and deadlifts. Don't skip the posterior chain.",
    upper: "Balanced push/pull ratio. Aim for roughly equal volume on each to protect shoulder health.",
  };

  const LiftDetailModal = ({ workout, onClose }: { workout: any; onClose: () => void }) => {
    if (!workout || workout.type !== "lift") return null;

    return (
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#1e293b",
            borderRadius: "12px",
            padding: "32px",
            maxWidth: "600px",
            width: "100%",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <button
            onClick={onClose}
            style={{
              float: "right",
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0 8px",
            }}
          >
            ×
          </button>

          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "6px 12px",
                background: liftColors[workout.liftType],
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "12px",
                textTransform: "uppercase",
              }}
            >
              {workout.liftType}
            </div>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "28px", textTransform: "capitalize" }}>
              {workout.liftType} Day
            </h2>
            {workout.exercises?.length > 0 && (
              <div style={{ color: "#94a3b8", fontSize: "14px" }}>
                {workout.exercises.length} exercises
              </div>
            )}
          </div>

          {workout.exercises && workout.exercises.length > 0 ? (
            <div>
              <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Exercises
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {workout.exercises.map((ex: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      background: "#0f172a",
                      padding: "14px 16px",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderLeft: `3px solid ${liftColors[workout.liftType]}`,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: "15px" }}>{ex.name}</div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "13px",
                        color: "#94a3b8",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ex.sets} × {ex.reps}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: "#0f172a", padding: "20px", borderRadius: "8px", color: "#94a3b8", textAlign: "center" }}>
              No exercise details available for this session.
            </div>
          )}

          <div style={{ marginTop: "24px", padding: "16px", background: "#0f172a", borderRadius: "8px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>💡 Tips</div>
            <div style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.6 }}>
              {liftTips[workout.liftType] ?? "Focus on form and controlled movement throughout each set."}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        <h1 style={{ textAlign: "center", marginBottom: "40px" }}>Training Plan Generator</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
          
          {/* Profile - keeping the same from your document */}
          <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px" }}>
            <h3 style={{ marginTop: 0 }}>Profile</h3>
            
            <label style={{ display: "block", marginBottom: "16px" }}>
              <div style={{ marginBottom: "4px", fontSize: "14px", color: "#94a3b8" }}>Age</div>
              <input 
                type="number" 
                value={profile.age}
                onChange={e => setProfile({...profile, age: +e.target.value})}
                style={{ width: "100%", padding: "8px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "16px" }}>
              <div style={{ marginBottom: "4px", fontSize: "14px", color: "#94a3b8" }}>Sex</div>
              <select 
                value={profile.sex}
                onChange={e => setProfile({...profile, sex: e.target.value})}
                style={{ width: "100%", padding: "8px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>

            <label style={{ display: "block", marginBottom: "16px" }}>
              <div style={{ marginBottom: "4px", fontSize: "14px", color: "#94a3b8" }}>Goal</div>
              <select 
                value={profile.goal}
                onChange={e => setProfile({...profile, goal: e.target.value})}
                style={{ width: "100%", padding: "8px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
              >
                <option value="general">General</option>
                <option value="5k">5k</option>
                <option value="10k">10k</option>
                <option value="half-marathon">Half Marathon</option>
                <option value="marathon">Marathon</option>
                <option value="strength">Strength</option>
              </select>
            </label>

            {isRaceGoal && (
              <div style={{ marginBottom: "16px", padding: "12px", background: "#0f172a", borderRadius: "8px" }}>
                <div style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "8px" }}>
                  Recent Race Result
                </div>

                <label style={{ display: "block", marginBottom: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>Distance</div>
                  <select
                    value={profile.providedRaceTime.distanceKm}
                    onChange={e =>
                      setProfile(p => ({
                        ...p,
                        providedRaceTime: {
                          ...p.providedRaceTime!,
                          distanceKm: +e.target.value,
                        },
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "#020617",
                      border: "1px solid #334155",
                      borderRadius: "6px",
                      color: "#fff",
                    }}
                  >
                    <option value={1.60934}>1 Mile</option>
                    <option value={5}>5K</option>
                    <option value={10}>10K</option>
                    <option value={21.097}>Half Marathon</option>
                    <option value={42.195}>Marathon</option>
                  </select>
                </label>

                <label style={{ display: "block" }}>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>Time (mm:ss or hh:mm:ss)</div>
                  <input
                    type="text"
                    placeholder="25:30"
                    onChange={e =>
                      setProfile(p => ({
                        ...p,
                        providedRaceTime: {
                          ...p.providedRaceTime!,
                          timeMinutes: parseTimeToMinutes(e.target.value),
                        },
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "#020617",
                      border: "1px solid #334155",
                      borderRadius: "6px",
                      color: "#fff",
                    }}
                  />
                </label>
              </div>
            )}

            {isRaceGoal && (
              <label style={{ display: "block", marginBottom: "16px" }}>
                <div style={{ marginBottom: "4px", fontSize: "14px", color: "#94a3b8" }}>Weeks</div>
                <select 
                  value={profile.trainingLengthWeeks}
                  onChange={e => setProfile({...profile, trainingLengthWeeks: +e.target.value})}
                  style={{ width: "100%", padding: "8px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
                >
                  {[8,9,10,11,12,13,14,15,16,17,18,19,20].map(w => (
                    <option key={w} value={w}>{w} weeks</option>
                  ))}
                </select>
              </label>
            )}

            {profile.runDaysPerWeek > 0 && (
              <>
                <label style={{ display: "block", marginBottom: "16px" }}>
                  <div style={{ marginBottom: "4px", fontSize: "14px", color: "#94a3b8" }}>
                    Weekly Mileage: {profile.startingWeeklyMileage} mi
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="50"
                    value={profile.startingWeeklyMileage}
                    onChange={e => setProfile({...profile, startingWeeklyMileage: +e.target.value})}
                    style={{ width: "100%" }}
                  />
                </label>

                <label style={{ display: "block", marginBottom: "16px" }}>
                  <div style={{ marginBottom: "4px", fontSize: "14px", color: "#94a3b8" }}>Running Level</div>
                  <select 
                    value={profile.runningLevel}
                    onChange={e => setProfile({...profile, runningLevel: e.target.value})}
                    style={{ width: "100%", padding: "8px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff" }}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </label>
              </>
            )}
          </div>

          {/* Schedule - keeping the same */}
          <div style={{ background: "#1e293b", padding: "24px", borderRadius: "12px" }}>
            <h3 style={{ marginTop: 0 }}>Schedule</h3>

            <label style={{ display: "block", marginBottom: "16px" }}>
              <div style={{ marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
                Run Days: {profile.runDaysPerWeek}/week
              </div>
              <input 
                type="number" 
                min="0" 
                max="7"
                value={profile.runDaysPerWeek}
                onChange={e => setProfile({...profile, runDaysPerWeek: +e.target.value})}
                style={{ width: "100%", padding: "8px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff", marginBottom: "8px" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {DAYS.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i, "runDays")}
                    disabled={profile.runDaysPerWeek === 0}
                    style={{
                      padding: "8px 4px",
                      background: profile.runDays.includes(i) ? "#10b981" : "#334155",
                      border: "none",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: "12px",
                      cursor: profile.runDaysPerWeek === 0 ? "not-allowed" : "pointer",
                      opacity: profile.runDaysPerWeek === 0 ? 0.5 : 1
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </label>

            {profile.runDays.length > 0 && (
              <label style={{ display: "block", marginBottom: "16px", padding: "12px", background: "rgba(16,185,129,0.1)", borderRadius: "8px" }}>
                <div style={{ marginBottom: "8px", fontSize: "14px", color: "#10b981" }}>Long Run Day</div>
                <select 
                  value={profile.longRunDay}
                  onChange={e => setProfile({...profile, longRunDay: +e.target.value})}
                  style={{ width: "100%", padding: "8px", background: "#0f172a", border: "1px solid #10b981", borderRadius: "6px", color: "#fff" }}
                >
                  {profile.runDays.map(d => (
                    <option key={d} value={d}>{DAYS[d]}</option>
                  ))}
                </select>
              </label>
            )}

            <label style={{ display: "block" }}>
              <div style={{ marginBottom: "8px", fontSize: "14px", color: "#94a3b8" }}>
                Lift Days: {profile.liftDaysPerWeek}/week
              </div>
              <input 
                type="number" 
                min="0" 
                max="7"
                value={profile.liftDaysPerWeek}
                onChange={e => setProfile({...profile, liftDaysPerWeek: +e.target.value})}
                style={{ width: "100%", padding: "8px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff", marginBottom: "8px" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
                {DAYS.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i, "liftDays")}
                    disabled={profile.liftDaysPerWeek === 0}
                    style={{
                      padding: "8px 4px",
                      background: profile.liftDays.includes(i) ? "#3b82f6" : "#334155",
                      border: "none",
                      borderRadius: "4px",
                      color: "#fff",
                      fontSize: "12px",
                      cursor: profile.liftDaysPerWeek === 0 ? "not-allowed" : "pointer",
                      opacity: profile.liftDaysPerWeek === 0 ? 0.5 : 1
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </label>
          </div>
        </div>

        {/* Exercise Preferences (only shown when lifting) */}
        {profile.liftDaysPerWeek > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <button
              onClick={() => setShowExercisePrefs(p => !p)}
              style={{
                width: "100%",
                padding: "14px 20px",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: showExercisePrefs ? "12px 12px 0 0" : "12px",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>⚙️ Exercise Preferences</span>
              <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                {showExercisePrefs ? "▲ collapse" : "▼ expand"}
              </span>
            </button>

            {showExercisePrefs && (
              <div style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderTop: "1px solid #0f172a",
                borderRadius: "0 0 12px 12px",
                padding: "20px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px",
              }}>
                {/* Push */}
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px", paddingBottom: "6px", borderBottom: "1px solid #334155" }}>
                    Push
                  </div>
                  {([
                    ["primaryChest",   "Primary Chest"],
                    ["secondaryChest", "Secondary Chest"],
                    ["frontDelt",      "Front Delts"],
                    ["lateralDelt",    "Lateral Delts"],
                    ["tricep",         "Triceps"],
                  ] as [MuscleGroup, string][]).map(([key, label]) => (
                    <label key={key} style={{ display: "block", marginBottom: "10px" }}>
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>{label}</div>
                      <select
                        value={exercisePrefs[key]}
                        onChange={e => setExercisePrefs(p => ({ ...p, [key]: e.target.value }))}
                        style={{ width: "100%", padding: "7px 8px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff", fontSize: "13px" }}
                      >
                        {EXERCISE_OPTIONS[key].map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>

                {/* Pull */}
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px", paddingBottom: "6px", borderBottom: "1px solid #334155" }}>
                    Pull
                  </div>
                  {([
                    ["lat",     "Lats"],
                    ["midBack", "Mid Back"],
                    ["rearDelt","Rear Delts"],
                    ["bicep",   "Biceps"],
                  ] as [MuscleGroup, string][]).map(([key, label]) => (
                    <label key={key} style={{ display: "block", marginBottom: "10px" }}>
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>{label}</div>
                      <select
                        value={exercisePrefs[key]}
                        onChange={e => setExercisePrefs(p => ({ ...p, [key]: e.target.value }))}
                        style={{ width: "100%", padding: "7px 8px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff", fontSize: "13px" }}
                      >
                        {EXERCISE_OPTIONS[key].map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>

                {/* Legs */}
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#ec4899", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px", paddingBottom: "6px", borderBottom: "1px solid #334155" }}>
                    Legs
                  </div>
                  {([
                    ["compoundLeg", "Compound"],
                    ["quad",        "Quads"],
                    ["hamstring",   "Hamstrings"],
                    ["glute",       "Glutes"],
                    ["calf",        "Calves"],
                  ] as [MuscleGroup, string][]).map(([key, label]) => (
                    <label key={key} style={{ display: "block", marginBottom: "10px" }}>
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "4px" }}>{label}</div>
                      <select
                        value={exercisePrefs[key]}
                        onChange={e => setExercisePrefs(p => ({ ...p, [key]: e.target.value }))}
                        style={{ width: "100%", padding: "7px 8px", background: "#0f172a", border: "1px solid #334155", borderRadius: "6px", color: "#fff", fontSize: "13px" }}
                      >
                        {EXERCISE_OPTIONS[key].map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate Button */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          {!isValid && (
            <p style={{ color: "#f59e0b", marginBottom: "16px" }}>
              ⚠️ {isRaceGoal && (!profile.providedRaceTime?.timeMinutes || profile.providedRaceTime.timeMinutes <= 0)
                ? "Please provide a valid race time"
                : "Please select the correct number of days"}
            </p>
          )}
          <button
            onClick={generate}
            disabled={!isValid || loading}
            style={{
              padding: "16px 48px",
              background: !isValid || loading ? "#334155" : "#3b82f6",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 600,
              cursor: !isValid || loading ? "not-allowed" : "pointer",
              opacity: !isValid || loading ? 0.5 : 1
            }}
          >
            {loading ? "Generating..." : "Generate Plan"}
          </button>
        </div>

        {error && (
          <div style={{ padding: "16px", background: "#7f1d1d", borderRadius: "8px", marginBottom: "32px", border: "1px solid #991b1b" }}>
            ⚠️ {error}
          </div>
        )}

        {selectedWorkout && (
          <WorkoutDetailModal
            workout={selectedWorkout}
            onClose={() => setSelectedWorkout(null)}
          />
        )}

        {selectedLift && (
          <LiftDetailModal
            workout={selectedLift}
            onClose={() => setSelectedLift(null)}
          />
        )}

        {plan && (
          <div>
            {Array.isArray(plan) ? (
              <div>
                <h2 style={{ textAlign: "center", marginBottom: "24px" }}>
                  {profile.trainingLengthWeeks}-Week {profile.goal.toUpperCase()} Plan
                </h2>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {plan.map((week: any, weekIdx: number) => {
                    const totalMiles = week.days.reduce((sum: number, d: any) => 
                      sum + d.workouts.filter((w: any) => w.type === "run").reduce((s: number, w: any) => s + (w.miles || 0), 0), 0
                    );
                    
                    const longRun = week.days
                      .flatMap((d: any) => d.workouts)
                      .find((w: any) => w.type === "run" && w.runType === "long");

                    return (
                      <div key={weekIdx} style={{ background: "#1e293b", padding: "16px", borderRadius: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center" }}>
                          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <h3 style={{ margin: 0 }}>Week {weekIdx + 1}</h3>
                            {longRun && (
                              <span style={{ background: "#10b981", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                                {longRun.miles} mi long
                              </span>
                            )}
                          </div>
                          <div style={{ color: "#10b981", fontWeight: 700 }}>
                            {totalMiles.toFixed(1)} mi
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
                          {week.days.map((day: any, i: number) => (
                            <div key={i} style={{ background: "#0f172a", padding: "8px", borderRadius: "6px", minHeight: "80px" }}>
                              <div style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "6px", fontWeight: 600 }}>
                                {DAYS[i]}
                              </div>
                              {day.workouts.length === 0 ? (
                                <div style={{ color: "#475569", fontSize: "11px", fontStyle: "italic" }}>Rest</div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                  {day.workouts.map((w: any, idx: number) => (
                                    <WorkoutCard 
                                      key={idx} 
                                      workout={w}
                                      onClick={
                                        w.type === "run" ? () => setSelectedWorkout(w) :
                                        w.type === "lift" ? () => setSelectedLift(w) :
                                        undefined
                                      }
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ textAlign: "center", marginBottom: "24px" }}>Weekly Plan</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px" }}>
                  {plan.days.map((day: any, i: number) => (
                    <div key={i} style={{ background: "#1e293b", padding: "12px", borderRadius: "8px", minHeight: "120px" }}>
                      <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "8px", fontWeight: 600 }}>
                        {DAYS[i]}
                      </div>
                      {day.workouts.length === 0 ? (
                        <div style={{ color: "#475569", fontSize: "12px", fontStyle: "italic" }}>Rest</div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {day.workouts.map((w: any, idx: number) => (
                            <WorkoutCard 
                              key={idx} 
                              workout={w}
                              onClick={
                                w.type === "run" ? () => setSelectedWorkout(w) :
                                w.type === "lift" ? () => setSelectedLift(w) :
                                undefined
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
  );
}