import { useState, useEffect } from "react";

const API_URL = "http://localhost:3001/plan";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function App() {
  const [profile, setProfile] = useState({
    age: 25,
    sex: "male",
    runningLevel: "beginner",
    currentWeeklyMileage: 20,
    liftingExperience: "beginner",
    runDaysPerWeek: 3,
    liftDaysPerWeek: 3,
    longRunDay: 0,
    runDays: [] as number[],
    liftDays: [] as number[],
    goal: "general",
  });

  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Ensure Long Run Day is valid
  useEffect(() => {
    if (profile.runDays.length > 0 && !profile.runDays.includes(profile.longRunDay)) {
      setProfile(prev => ({ ...prev, longRunDay: prev.runDays[0] }));
    }
  }, [profile.runDays, profile.longRunDay]);

  const runDaysIncomplete = profile.runDays.length !== profile.runDaysPerWeek;
  const liftDaysIncomplete = profile.liftDays.length !== profile.liftDaysPerWeek;
  const isInvalid = runDaysIncomplete || liftDaysIncomplete || profile.runDays.length === 0;

  const toggleDay = (dayIndex: number, key: "runDays" | "liftDays") => {
    setProfile((prev) => {
      const currentDays = prev[key];
      const newDays = currentDays.includes(dayIndex)
        ? currentDays.filter((d) => d !== dayIndex)
        : [...currentDays, dayIndex].sort();
      return { ...prev, [key]: newDays };
    });
  };

  async function generatePlan() {
    if (isInvalid) return;
    setError(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  // Map run types to colors
  const runColors: Record<string, string> = {
    long: "#2ecc71",
    workout: "#e74c3c",
    easy: "#f1c40f",
  };

  const liftColors: Record<string, string> = {
    "push": "#3498db",
    "pull": "#9b59b6",
    "legs": "#e67e22",
    "full-body": "#1abc9c",
  };

  return (
    <div style={{ padding: "40px", fontFamily: "system-ui, sans-serif", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Hybrid Planner Tester</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginTop: "20px" }}>
        {/* Profile & Goals */}
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <h3>Profile & Goals</h3>
          <label>Age</label>
          <input type="number" value={profile.age} min={10} max={100} 
                 onChange={e => setProfile({...profile, age: +e.target.value})} />
          <label>Goal</label>
          <select value={profile.goal} onChange={e => setProfile({...profile, goal: e.target.value as any})}>
            <option value="general">General Fitness</option>
            <option value="5k">5k Race</option>
            <option value="10k">10k Race</option>
            <option value="half-marathon">Half Marathon</option>
            <option value="marathon">Marathon</option>
            <option value="strength">Strength Focus</option>
          </select>
          <label>Weekly Mileage: <strong>{profile.currentWeeklyMileage} mi</strong></label>
          <input type="range" min="0" max="100" value={profile.currentWeeklyMileage} 
                 onChange={e => setProfile({...profile, currentWeeklyMileage: +e.target.value})} />
          <label>Running Experience</label>
          <select value={profile.runningLevel} onChange={e => setProfile({...profile, runningLevel: e.target.value as any})}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Schedule Selection */}
        <div style={{ background: "#f5f5f5", padding: "20px", borderRadius: "12px" }}>
          <h3>Schedule</h3>
          <div style={{ marginBottom: "20px" }}>
            <label>Run Days Per Week: <strong>{profile.runDaysPerWeek}</strong></label>
            <input type="number" min="1" max="7" value={profile.runDaysPerWeek} 
                   onChange={e => setProfile({...profile, runDaysPerWeek: +e.target.value})} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "10px" }}>
              {DAYS.map((name, i) => (
                <button 
                  key={`run-${i}`}
                  onClick={() => toggleDay(i, "runDays")}
                  style={{ 
                    padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", cursor: "pointer",
                    backgroundColor: profile.runDays.includes(i) ? "#2ecc71" : "#fff",
                    color: profile.runDays.includes(i) ? "#fff" : "#000"
                  }}
                >{name}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: "20px", padding: "10px", background: "#e0e0e0", borderRadius: "8px" }}>
            <label style={{ fontWeight: "bold" }}>Long Run Day</label>
            {profile.runDays.length === 0 ? (
              <p style={{ fontSize: "12px", color: "red" }}>Select run days first</p>
            ) : (
              <select 
                value={profile.longRunDay} 
                onChange={e => setProfile({...profile, longRunDay: +e.target.value})}
                style={{ display: "block", width: "100%", padding: "8px", marginTop: "5px" }}
              >
                {profile.runDays.map(dayIdx => (
                  <option key={dayIdx} value={dayIdx}>{DAYS[dayIdx]}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label>Lift Days Per Week: <strong>{profile.liftDaysPerWeek}</strong></label>
            <input type="number" min="0" max="7" value={profile.liftDaysPerWeek} 
                   onChange={e => setProfile({...profile, liftDaysPerWeek: +e.target.value})} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "10px" }}>
              {DAYS.map((name, i) => (
                <button 
                  key={`lift-${i}`}
                  onClick={() => toggleDay(i, "liftDays")}
                  style={{ 
                    padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", cursor: "pointer",
                    backgroundColor: profile.liftDays.includes(i) ? "#3498db" : "#fff",
                    color: profile.liftDays.includes(i) ? "#fff" : "#000"
                  }}
                >{name}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div style={{ marginTop: "30px", textAlign: "center" }}>
        {isInvalid && (
          <p style={{ color: "#e67e22", fontSize: "14px", marginBottom: "10px" }}>
            Check counts: {profile.runDays.length}/{profile.runDaysPerWeek} Runs, {profile.liftDays.length}/{profile.liftDaysPerWeek} Lifts
          </p>
        )}
        <button 
          disabled={isInvalid}
          onClick={generatePlan} 
          style={{ 
            padding: "15px 40px", fontSize: "18px", borderRadius: "30px", border: "none",
            cursor: isInvalid ? "not-allowed" : "pointer", 
            background: isInvalid ? "#ccc" : "#000", color: "#fff"
          }}
        >
          Generate Weekly Plan
        </button>
      </div>

      {/* Output JSON */}
      {response && (
        <div style={{ marginTop: "40px" }}>
          <h2 style={{ borderBottom: "2px solid #333" }}>Generated Plan</h2>
          <div style={{ background: "#1e1e1e", color: "#61dafb", padding: "20px", borderRadius: "12px", overflowX: "auto" }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(response, null, 2)}</pre>
          </div>

          {/* Calendar View */}
          <div style={{ marginTop: "30px" }}>
            <h3 style={{ marginBottom: "10px" }}>Weekly Calendar</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }}>
              {response.days.map((day: any, i: number) => (
                <div key={i} style={{ border: "1px solid #ccc", borderRadius: "8px", minHeight: "80px", padding: "5px" }}>
                  <strong>{DAYS[i]}</strong>
                  {day.workouts.map((w: any, idx: number) => (
                    <div key={idx} style={{ 
                      backgroundColor: w.type === "run" ? runColors[w.runType] : liftColors[w.liftType],
                      color: "#fff",
                      fontSize: "12px",
                      borderRadius: "4px",
                      padding: "2px 4px",
                      marginTop: "4px",
                      textAlign: "center"
                    }}>
                      {w.type === "run" ? `${w.runType} ${w.miles}mi` : w.liftType}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: "20px", color: "red" }}>
          <p>Error: {error}</p>
        </div>
      )}
    </div>
  );
}
