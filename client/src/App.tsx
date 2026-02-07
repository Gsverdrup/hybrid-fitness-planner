import { useState, useEffect } from "react";

const API_URL = "http://localhost:3001";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatPace(paceMinPerMile?: number): string {
  if (!paceMinPerMile) return "";
  const minutes = Math.floor(paceMinPerMile);
  const seconds = Math.round((paceMinPerMile - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function parseTimeToMinutes(value: string): number {
  // Supports mm:ss or hh:mm:ss
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

  // Auto-select first run day as long run day
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

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
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

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "20px", color: "#fff" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        <h1 style={{ textAlign: "center", marginBottom: "40px" }}>Training Plan Generator</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
          
          {/* Profile */}
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

                {/* Distance */}
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

                {/* Time */}
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

          {/* Schedule */}
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

        {/* Generate Button */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          {!isValid && (
            <p style={{ color: "#f59e0b", marginBottom: "16px" }}>
              ⚠️ Please select the correct number of days
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

        {/* Error */}
        {error && (
          <div style={{ padding: "16px", background: "#7f1d1d", borderRadius: "8px", marginBottom: "32px", border: "1px solid #991b1b" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Display Plan */}
        {plan && (
          <div>
            {Array.isArray(plan) ? (
              // Multi-week race plan
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
                                day.workouts.map((w: any, idx: number) => (
                                  <div
                                    key={idx}
                                    style={{
                                      background: w.type === "run" ? runColors[w.runType] : liftColors[w.liftType],
                                      padding: "6px",
                                      borderRadius: "4px",
                                      marginTop: idx > 0 ? "4px" : "0",
                                      fontSize: "11px",
                                      textAlign: "center"
                                    }}
                                  >
                                    {w.type === "run" ? (
                                      <>
                                        <div style={{ fontSize: "9px", opacity: 0.8 }}>{w.runType}</div>
                                        <div style={{ fontWeight: 700, fontSize: "13px" }}>{w.miles}</div>
                                        {w.paceMinPerMile && (
                                          <div style={{ fontSize: "9px", opacity: 0.9 }}>{formatPace(w.paceMinPerMile)}</div>
                                        )}
                                      </>
                                    ) : (
                                      <div>{w.liftType}</div>
                                    )}
                                  </div>
                                ))
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
              // Single week plan
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
                        day.workouts.map((w: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              background: w.type === "run" ? runColors[w.runType] : liftColors[w.liftType],
                              padding: "8px",
                              borderRadius: "6px",
                              marginTop: idx > 0 ? "6px" : "0",
                              fontSize: "13px",
                              textAlign: "center"
                            }}
                          >
                            {w.type === "run" ? (
                              <>
                                <div style={{ fontSize: "10px", opacity: 0.8 }}>{w.runType}</div>
                                <div style={{ fontWeight: 700 }}>{w.miles} mi</div>
                                {w.paceMinPerMile && (
                                  <div style={{ fontSize: "10px", opacity: 0.9 }}>{formatPace(w.paceMinPerMile)}</div>
                                )}
                              </>
                            ) : (
                              <div>{w.liftType}</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}