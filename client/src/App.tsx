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
    longRunDay: 0, // Will be updated by useEffect
    runDays: [] as number[],
    liftDays: [] as number[],
    goal: "general",
  });

  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // VALIDATION: Ensure Long Run Day is actually a Run Day
  useEffect(() => {
    if (profile.runDays.length > 0 && !profile.runDays.includes(profile.longRunDay)) {
      // Auto-set Long Run Day to the first available run day if current choice is invalid
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

  return (
    <div style={{ padding: "40px", fontFamily: "system-ui, sans-serif", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ borderBottom: "2px solid #eee", paddingBottom: "10px" }}>Hybrid Planner Tester</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginTop: "20px" }}>
        
        {/* Left Column: Basic Stats & Goal */}
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <h3>Profile & Goals</h3>
          
          <label>Age</label>
          <input type="number" value={profile.age} onChange={e => setProfile({...profile, age: +e.target.value})} />

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

        {/* Right Column: Schedule Selection */}
        <div style={{ background: "#878787", padding: "20px", borderRadius: "12px" }}>
          <h3>Schedule Logic</h3>

          {/* Running Section */}
          <div style={{ marginBottom: "20px" }}>
            <label>Run Days Per Week: <strong>{profile.runDaysPerWeek}</strong></label>
            <input type="number" min="1" max="7" value={profile.runDaysPerWeek} 
                   onChange={e => setProfile({...profile, runDaysPerWeek: +e.target.value})} style={{ display: "block", marginBottom: "10px" }} />
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {DAYS.map((name, i) => (
                <button 
                  key={`run-${i}`}
                  onClick={() => toggleDay(i, "runDays")}
                  style={{ 
                    padding: "8px", borderRadius: "4px", border: "1px solid #ccc", cursor: "pointer",
                    backgroundColor: profile.runDays.includes(i) ? "#2ecc71" : "#fff",
                    color: profile.runDays.includes(i) ? "#fff" : "#000"
                  }}
                >{name}</button>
              ))}
            </div>
          </div>

          {/* Long Run Selection - Filtered to only allow picked run days */}
          <div style={{ marginBottom: "20px", padding: "10px", background: "#fff", border: "1px dashed #ccc", borderRadius: "8px" }}>
            <label style={{ fontWeight: "bold" }}>Assign Long Run Day:</label>
            {profile.runDays.length === 0 ? (
              <p style={{ fontSize: "12px", color: "red" }}>Select your run days above first.</p>
            ) : (
              <select 
                style={{ display: "block", width: "100%", padding: "8px", marginTop: "5px" }}
                value={profile.longRunDay} 
                onChange={e => setProfile({...profile, longRunDay: +e.target.value})}
              >
                {profile.runDays.map(dayIdx => (
                  <option key={dayIdx} value={dayIdx}>{DAYS[dayIdx]}</option>
                ))}
              </select>
            )}
          </div>

          {/* Lifting Section */}
          <div style={{ marginBottom: "10px" }}>
            <label>Lift Days Per Week: <strong>{profile.liftDaysPerWeek}</strong></label>
            <input type="number" min="0" max="7" value={profile.liftDaysPerWeek} 
                   onChange={e => setProfile({...profile, liftDaysPerWeek: +e.target.value})} style={{ display: "block", marginBottom: "10px" }} />
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {DAYS.map((name, i) => (
                <button 
                  key={`lift-${i}`}
                  onClick={() => toggleDay(i, "liftDays")}
                  style={{ 
                    padding: "8px", borderRadius: "4px", border: "1px solid #ccc", cursor: "pointer",
                    backgroundColor: profile.liftDays.includes(i) ? "#3498db" : "#fff",
                    color: profile.liftDays.includes(i) ? "#fff" : "#000"
                  }}
                >{name}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

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

      {response && (
        <div style={{ marginTop: "40px" }}>
          <h2 style={{ borderBottom: "2px solid #333" }}>Generated Output</h2>
          <div style={{ background: "#1e1e1e", color: "#61dafb", padding: "20px", borderRadius: "12px", overflowX: "auto" }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(response, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}