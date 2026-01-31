import { useState, useEffect } from "react";

const API_URL = "http://localhost:3001/plan";
const MARATHON_API_URL = "http://localhost:3001/marathon-plan";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function App() {
  const [profile, setProfile] = useState<{
    age: number;
    sex: string;
    runningLevel: string;
    currentWeeklyMileage: number;
    liftingExperience: string;
    runDaysPerWeek: number;
    liftDaysPerWeek: number;
    longRunDay?: number;
    runDays: number[];
    liftDays: number[];
    goal: string;
  }>({
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
  const [marathonResponse, setMarathonResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [marathonWeeks, setMarathonWeeks] = useState(16);

  // Ensure Long Run Day is valid
  useEffect(() => {
    if (profile.runDays.length > 0) {
      if (profile.longRunDay === undefined || !profile.runDays.includes(profile.longRunDay)) {
        setProfile(prev => ({ ...prev, longRunDay: prev.runDays[0] }));
      }
    }
  }, [profile.runDays, profile.longRunDay]);

  // Remove long run day when run days per week is set to 0
  useEffect(() => {
    if (profile.runDaysPerWeek === 0 && profile.longRunDay !== undefined) {
      setProfile(prev => {
        const { longRunDay, ...rest } = prev;
        return rest;
      });
    }
  }, [profile.runDaysPerWeek, profile.longRunDay]);

  // Determine plan type
  const planType = 
    profile.runDaysPerWeek === 0 ? "lifting" :
    profile.liftDaysPerWeek === 0 ? "running" :
    "hybrid";

  const runDaysIncomplete = profile.runDaysPerWeek > 0 && profile.runDays.length !== profile.runDaysPerWeek;
  const liftDaysIncomplete = profile.liftDaysPerWeek > 0 && profile.liftDays.length !== profile.liftDaysPerWeek;
  const noWorkouts = profile.runDaysPerWeek === 0 && profile.liftDaysPerWeek === 0;
  const isInvalid = runDaysIncomplete || liftDaysIncomplete || noWorkouts;

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
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error: ${res.status}`);
      }
      const data = await res.json();
      setResponse(data);
      setMarathonResponse(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateMarathonPlan() {
    if (isInvalid) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(MARATHON_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, numWeeks: marathonWeeks }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP Error: ${res.status}`);
      }
      const data = await res.json();
      setMarathonResponse(data);
      setResponse(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Map run types to colors
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
    "full-body": "#14b8a6",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      padding: "20px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap');
        
        * { box-sizing: border-box; }
        
        .plan-type-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          animation: fadeIn 0.3s ease-out;
        }
        
        .day-button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .day-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.4s, height 0.4s;
        }
        
        .day-button:active::before {
          width: 200px;
          height: 200px;
        }
        
        .workout-card {
          animation: slideUp 0.4s ease-out backwards;
        }
        
        .workout-card:nth-child(1) { animation-delay: 0.05s; }
        .workout-card:nth-child(2) { animation-delay: 0.1s; }
        .workout-card:nth-child(3) { animation-delay: 0.15s; }
        .workout-card:nth-child(4) { animation-delay: 0.2s; }
        .workout-card:nth-child(5) { animation-delay: 0.25s; }
        .workout-card:nth-child(6) { animation-delay: 0.3s; }
        .workout-card:nth-child(7) { animation-delay: 0.35s; }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .section-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s ease;
        }
        
        .section-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        input[type="range"] {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          background: #60a5fa;
        }
        
        select, input[type="number"] {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #fff;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          width: 100%;
        }
        
        select:focus, input[type="number"]:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(255, 255, 255, 0.12);
        }
        
        select option {
          background: #1e293b;
          color: #fff;
        }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ 
          textAlign: "center", 
          marginBottom: "40px",
          animation: "fadeIn 0.6s ease-out"
        }}>
          <h1 style={{ 
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "72px",
            margin: "0 0 8px 0",
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "2px",
            lineHeight: 1
          }}>
            TRAINING PLANNER
          </h1>
          <p style={{ 
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "16px",
            margin: 0,
            fontWeight: 500
          }}>
            Build your perfect{" "}
            <span className="plan-type-badge" style={{
              background: planType === "running" ? "linear-gradient(135deg, #10b981, #059669)" :
                          planType === "lifting" ? "linear-gradient(135deg, #3b82f6, #2563eb)" :
                          "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "#fff"
            }}>
              {planType} plan
            </span>
          </p>
        </div>

        {/* Main Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: "24px", 
          marginBottom: "32px" 
        }}>
          {/* Profile Section */}
          <div className="section-card">
            <h3 style={{ 
              color: "#fff", 
              fontSize: "14px", 
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginTop: 0,
              marginBottom: "20px",
              opacity: 0.9
            }}>
              Profile & Goals
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>
                  Age
                </label>
                <input 
                  type="number" 
                  value={profile.age} 
                  min={13} 
                  max={100} 
                  onChange={e => setProfile({...profile, age: +e.target.value})} 
                />
              </div>

              <div>
                <label style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>
                  Primary Goal
                </label>
                <select value={profile.goal} onChange={e => setProfile({...profile, goal: e.target.value as any})}>
                  <option value="general">General Fitness</option>
                  <option value="5k">5k Race</option>
                  <option value="10k">10k Race</option>
                  <option value="half-marathon">Half Marathon</option>
                  <option value="marathon">Marathon</option>
                  <option value="strength">Strength Focus</option>
                </select>
              </div>

              {profile.runDaysPerWeek > 0 && (
                <>
                  <div>
                    <label style={{ 
                      color: "rgba(255, 255, 255, 0.7)", 
                      fontSize: "12px", 
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px", 
                      fontWeight: 500 
                    }}>
                      <span>Weekly Mileage</span>
                      <span style={{ color: "#3b82f6", fontWeight: 700 }}>{profile.currentWeeklyMileage} mi</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={profile.currentWeeklyMileage} 
                      onChange={e => setProfile({...profile, currentWeeklyMileage: +e.target.value})} 
                    />
                  </div>

                  <div>
                    <label style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>
                      Running Experience
                    </label>
                    <select value={profile.runningLevel} onChange={e => setProfile({...profile, runningLevel: e.target.value as any})}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </>
              )}

              {profile.liftDaysPerWeek > 0 && (
                <div>
                  <label style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "12px", display: "block", marginBottom: "6px", fontWeight: 500 }}>
                    Lifting Experience
                  </label>
                  <select value={profile.liftingExperience} onChange={e => setProfile({...profile, liftingExperience: e.target.value as any})}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Section */}
          <div className="section-card">
            <h3 style={{ 
              color: "#fff", 
              fontSize: "14px", 
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginTop: 0,
              marginBottom: "20px",
              opacity: 0.9
            }}>
              Weekly Schedule
            </h3>

            {/* Run Days */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ 
                color: "rgba(255, 255, 255, 0.7)", 
                fontSize: "12px", 
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px", 
                fontWeight: 500 
              }}>
                <span>Run Days Per Week</span>
                <span style={{ color: "#10b981", fontWeight: 700 }}>{profile.runDaysPerWeek}</span>
              </label>
              <input 
                type="number" 
                min="0" 
                max="6" 
                value={profile.runDaysPerWeek} 
                onChange={e => setProfile({...profile, runDaysPerWeek: +e.target.value})} 
                style={{ marginBottom: "10px" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
                {DAYS.map((name, i) => (
                  <button 
                    key={`run-${i}`}
                    onClick={() => toggleDay(i, "runDays")}
                    className="day-button"
                    disabled={profile.runDaysPerWeek === 0}
                    style={{ 
                      padding: "10px 4px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      cursor: profile.runDaysPerWeek === 0 ? "not-allowed" : "pointer",
                      backgroundColor: profile.runDays.includes(i) ? "#10b981" : "rgba(255, 255, 255, 0.05)",
                      color: profile.runDays.includes(i) ? "#fff" : "rgba(255, 255, 255, 0.5)",
                      fontSize: "11px",
                      fontWeight: 600,
                      opacity: profile.runDaysPerWeek === 0 ? 0.3 : 1
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Long Run Day Selector */}
            {profile.runDaysPerWeek > 0 && profile.runDays.length > 0 && profile.longRunDay !== undefined && (
              <div style={{ 
                marginBottom: "24px", 
                padding: "12px", 
                background: "rgba(16, 185, 129, 0.1)", 
                borderRadius: "8px",
                border: "1px solid rgba(16, 185, 129, 0.2)"
              }}>
                <label style={{ color: "#10b981", fontSize: "12px", display: "block", marginBottom: "8px", fontWeight: 600 }}>
                  Long Run Day
                </label>
                <select 
                  value={profile.longRunDay} 
                  onChange={e => setProfile({...profile, longRunDay: +e.target.value})}
                  style={{ background: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)" }}
                >
                  {profile.runDays.map(dayIdx => (
                    <option key={dayIdx} value={dayIdx}>{DAYS[dayIdx]}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Lift Days */}
            <div>
              <label style={{ 
                color: "rgba(255, 255, 255, 0.7)", 
                fontSize: "12px", 
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px", 
                fontWeight: 500 
              }}>
                <span>Lift Days Per Week</span>
                <span style={{ color: "#3b82f6", fontWeight: 700 }}>{profile.liftDaysPerWeek}</span>
              </label>
              <input 
                type="number" 
                min="0" 
                max="6" 
                value={profile.liftDaysPerWeek} 
                onChange={e => setProfile({...profile, liftDaysPerWeek: +e.target.value})} 
                style={{ marginBottom: "10px" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
                {DAYS.map((name, i) => (
                  <button 
                    key={`lift-${i}`}
                    onClick={() => toggleDay(i, "liftDays")}
                    className="day-button"
                    disabled={profile.liftDaysPerWeek === 0}
                    style={{ 
                      padding: "10px 4px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      cursor: profile.liftDaysPerWeek === 0 ? "not-allowed" : "pointer",
                      backgroundColor: profile.liftDays.includes(i) ? "#3b82f6" : "rgba(255, 255, 255, 0.05)",
                      color: profile.liftDays.includes(i) ? "#fff" : "rgba(255, 255, 255, 0.5)",
                      fontSize: "11px",
                      fontWeight: 600,
                      opacity: profile.liftDaysPerWeek === 0 ? 0.3 : 1
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          {isInvalid && (
            <p style={{ 
              color: "#f59e0b", 
              fontSize: "13px", 
              marginBottom: "16px",
              fontWeight: 500
            }}>
              {noWorkouts ? "⚠️ Select at least one type of workout" :
               `⚠️ Day selection mismatch: ${profile.runDays.length}/${profile.runDaysPerWeek} runs, ${profile.liftDays.length}/${profile.liftDaysPerWeek} lifts`}
            </p>
          )}
          
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
            <button 
              disabled={isInvalid || loading}
              onClick={generatePlan} 
              style={{ 
                padding: "16px 48px",
                fontSize: "16px",
                fontWeight: 700,
                borderRadius: "12px",
                border: "none",
                cursor: isInvalid || loading ? "not-allowed" : "pointer", 
                background: isInvalid || loading ? "rgba(255, 255, 255, 0.1)" : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                color: isInvalid || loading ? "rgba(255, 255, 255, 0.3)" : "#fff",
                transition: "all 0.3s",
                textTransform: "uppercase",
                letterSpacing: "1px",
                boxShadow: isInvalid || loading ? "none" : "0 8px 24px rgba(59, 130, 246, 0.4)"
              }}
              onMouseOver={(e) => {
                if (!isInvalid && !loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(59, 130, 246, 0.5)";
                }
              }}
              onMouseOut={(e) => {
                if (!isInvalid && !loading) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(59, 130, 246, 0.4)";
                }
              }}
            >
              {loading ? "Generating..." : "Generate Weekly Plan"}
            </button>

            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "12px 20px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}>
              <label style={{ 
                color: "rgba(255, 255, 255, 0.7)", 
                fontSize: "13px", 
                fontWeight: 600,
                whiteSpace: "nowrap"
              }}>
                Marathon Plan:
              </label>
              <select 
                value={marathonWeeks} 
                onChange={e => setMarathonWeeks(+e.target.value)}
                style={{ 
                  width: "80px",
                  padding: "8px 10px",
                  fontSize: "14px"
                }}
              >
                {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(w => (
                  <option key={w} value={w}>{w} weeks</option>
                ))}
              </select>
              <button 
                disabled={isInvalid || loading}
                onClick={generateMarathonPlan}
                style={{ 
                  padding: "8px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                  borderRadius: "8px",
                  border: "none",
                  cursor: isInvalid || loading ? "not-allowed" : "pointer", 
                  background: isInvalid || loading ? "rgba(255, 255, 255, 0.1)" : "linear-gradient(135deg, #10b981, #059669)",
                  color: isInvalid || loading ? "rgba(255, 255, 255, 0.3)" : "#fff",
                  transition: "all 0.3s",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
                onMouseOver={(e) => {
                  if (!isInvalid && !loading) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseOut={(e) => {
                  if (!isInvalid && !loading) {
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                Generate
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ 
            marginBottom: "32px",
            padding: "16px 20px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            color: "#fca5a5",
            fontSize: "14px",
            fontWeight: 500
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Generated Plan Display */}
        {response && (
          <div style={{ animation: "fadeIn 0.6s ease-out" }}>
            <h2 style={{ 
              color: "#fff", 
              fontSize: "32px",
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "1px",
              marginBottom: "24px",
              textAlign: "center"
            }}>
              YOUR WEEKLY PLAN
            </h2>

            {/* Calendar View */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", 
              gap: "12px",
              marginBottom: "32px"
            }}>
              {response.days.map((day: any, i: number) => (
                <div 
                  key={i} 
                  className="workout-card"
                  style={{ 
                    background: day.workouts.length > 0 
                      ? "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))"
                      : "rgba(255, 255, 255, 0.03)",
                    border: day.workouts.length > 0 
                      ? "1px solid rgba(255, 255, 255, 0.2)"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    minHeight: "120px",
                    padding: "14px",
                    transition: "all 0.3s"
                  }}
                  onMouseOver={(e) => {
                    if (day.workouts.length > 0) {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = day.workouts.length > 0 
                      ? "rgba(255, 255, 255, 0.2)" 
                      : "rgba(255, 255, 255, 0.08)";
                  }}
                >
                  <div style={{ 
                    fontSize: "12px", 
                    fontWeight: 700,
                    color: "rgba(255, 255, 255, 0.5)",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {DAYS[i]}
                  </div>
                  {day.workouts.length === 0 ? (
                    <div style={{ 
                      color: "rgba(255, 255, 255, 0.3)",
                      fontSize: "11px",
                      fontStyle: "italic",
                      marginTop: "12px"
                    }}>
                      Rest Day
                    </div>
                  ) : (
                    day.workouts.map((w: any, idx: number) => (
                      <div 
                        key={idx} 
                        style={{ 
                          background: w.type === "run" ? runColors[w.runType] : liftColors[w.liftType],
                          color: "#fff",
                          fontSize: "13px",
                          fontWeight: 600,
                          borderRadius: "6px",
                          padding: "8px 10px",
                          marginTop: idx > 0 ? "6px" : "0",
                          textAlign: "center",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
                        }}
                      >
                        {w.type === "run" ? (
                          <>
                            <div style={{ fontSize: "10px", opacity: 0.8, textTransform: "uppercase" }}>
                              {w.runType}
                            </div>
                            <div style={{ fontSize: "16px", fontWeight: 700 }}>
                              {w.miles} mi
                            </div>
                          </>
                        ) : (
                          <div style={{ textTransform: "capitalize" }}>
                            {w.liftType}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
              gap: "16px",
              marginBottom: "24px"
            }}>
              <div style={{ 
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#10b981", fontFamily: "'Bebas Neue', sans-serif" }}>
                  {response.days.reduce((sum: number, d: any) => 
                    sum + d.workouts.filter((w: any) => w.type === "run").reduce((s: number, w: any) => s + w.miles, 0)
                  , 0).toFixed(1)}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(16, 185, 129, 0.8)", textTransform: "uppercase", fontWeight: 600 }}>
                  Total Miles
                </div>
              </div>
              <div style={{ 
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#3b82f6", fontFamily: "'Bebas Neue', sans-serif" }}>
                  {response.days.reduce((sum: number, d: any) => 
                    sum + d.workouts.filter((w: any) => w.type === "lift").length
                  , 0)}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(59, 130, 246, 0.8)", textTransform: "uppercase", fontWeight: 600 }}>
                  Lift Sessions
                </div>
              </div>
              <div style={{ 
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#f59e0b", fontFamily: "'Bebas Neue', sans-serif" }}>
                  {response.days.filter((d: any) => d.workouts.length > 0).length}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(245, 158, 11, 0.8)", textTransform: "uppercase", fontWeight: 600 }}>
                  Active Days
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Marathon Plan Display */}
        {marathonResponse && (
          <div style={{ animation: "fadeIn 0.6s ease-out" }}>
            <h2 style={{ 
              color: "#fff", 
              fontSize: "32px",
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: "1px",
              marginBottom: "16px",
              textAlign: "center"
            }}>
              {marathonWeeks}-WEEK MARATHON PLAN
            </h2>
            <p style={{ 
              color: "rgba(255, 255, 255, 0.6)",
              textAlign: "center",
              marginBottom: "32px",
              fontSize: "14px"
            }}>
              Progressive training plan from {marathonResponse[0].days.reduce((sum: number, d: any) => 
                sum + d.workouts.filter((w: any) => w.type === "run").reduce((s: number, w: any) => s + w.miles, 0)
              , 0).toFixed(1)} to peak {Math.max(...marathonResponse.map((week: any) => 
                week.days.reduce((sum: number, d: any) => 
                  sum + d.workouts.filter((w: any) => w.type === "run").reduce((s: number, w: any) => s + w.miles, 0)
                , 0)
              )).toFixed(1)} miles/week
            </p>

            {/* Week-by-week cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {marathonResponse.map((week: any, weekIdx: number) => {
                const totalMiles = week.days.reduce((sum: number, d: any) => 
                  sum + d.workouts.filter((w: any) => w.type === "run").reduce((s: number, w: any) => s + w.miles, 0)
                , 0);
                
                const weekType = 
                  weekIdx >= marathonWeeks - 2 ? "Taper" :
                  totalMiles < marathonResponse[Math.max(0, weekIdx - 1)]?.days.reduce((sum: number, d: any) => 
                    sum + d.workouts.filter((w: any) => w.type === "run").reduce((s: number, w: any) => s + w.miles, 0)
                  , 0) * 0.9 ? "Deload" :
                  "Build";

                const weekColor = 
                  weekType === "Taper" ? "#f59e0b" :
                  weekType === "Deload" ? "#3b82f6" :
                  "#10b981";

                return (
                  <div 
                    key={weekIdx}
                    style={{ 
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "16px",
                      padding: "20px",
                      transition: "all 0.3s"
                    }}
                  >
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                      gap: "12px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <h3 style={{ 
                          color: "#fff",
                          margin: 0,
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: "24px",
                          letterSpacing: "1px"
                        }}>
                          WEEK {weekIdx + 1}
                        </h3>
                        <span style={{
                          background: weekColor,
                          color: "#fff",
                          padding: "4px 12px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: 600,
                          textTransform: "uppercase"
                        }}>
                          {weekType}
                        </span>
                      </div>
                      <div style={{ 
                        color: "#10b981",
                        fontWeight: 700,
                        fontSize: "18px",
                        fontFamily: "'Bebas Neue', sans-serif"
                      }}>
                        {totalMiles.toFixed(1)} MILES
                      </div>
                    </div>

                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", 
                      gap: "8px"
                    }}>
                      {week.days.map((day: any, i: number) => (
                        <div 
                          key={i} 
                          style={{ 
                            background: day.workouts.length > 0 
                              ? "rgba(255, 255, 255, 0.08)"
                              : "rgba(255, 255, 255, 0.02)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                            padding: "10px",
                            minHeight: "80px"
                          }}
                        >
                          <div style={{ 
                            fontSize: "10px", 
                            fontWeight: 700,
                            color: "rgba(255, 255, 255, 0.5)",
                            marginBottom: "6px",
                            textTransform: "uppercase"
                          }}>
                            {DAYS[i]}
                          </div>
                          {day.workouts.length === 0 ? (
                            <div style={{ 
                              color: "rgba(255, 255, 255, 0.2)",
                              fontSize: "10px",
                              fontStyle: "italic"
                            }}>
                              Rest
                            </div>
                          ) : (
                            day.workouts.map((w: any, idx: number) => (
                              <div 
                                key={idx} 
                                style={{ 
                                  background: w.type === "run" ? runColors[w.runType] : liftColors[w.liftType],
                                  color: "#fff",
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  borderRadius: "4px",
                                  padding: "6px",
                                  marginTop: idx > 0 ? "4px" : "0",
                                  textAlign: "center"
                                }}
                              >
                                {w.type === "run" ? (
                                  <>
                                    <div style={{ fontSize: "9px", opacity: 0.8 }}>
                                      {w.runType}
                                    </div>
                                    <div style={{ fontSize: "13px", fontWeight: 700 }}>
                                      {w.miles}
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ textTransform: "capitalize", fontSize: "10px" }}>
                                    {w.liftType}
                                  </div>
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
        )}
      </div>
    </div>
  );
}