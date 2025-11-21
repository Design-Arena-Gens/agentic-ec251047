"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

type TimerPreset = {
  id: string;
  label: string;
  minutes: number;
  description: string;
  accent: string;
};

type SessionRecord = {
  id: string;
  presetLabel: string;
  durationMinutes: number;
  completedAt: Date;
};

const PRESETS: TimerPreset[] = [
  {
    id: "deep-focus",
    label: "Deep Focus",
    minutes: 50,
    description: "Long-form concentration sprint",
    accent: "#6c5ce7",
  },
  {
    id: "pomodoro",
    label: "Pomodoro",
    minutes: 25,
    description: "Classic rhythm for flow work",
    accent: "#00cec9",
  },
  {
    id: "micro-sprint",
    label: "Micro Sprint",
    minutes: 10,
    description: "Quick burst when momentum counts",
    accent: "#ff7675",
  },
  {
    id: "restorative",
    label: "Restorative Break",
    minutes: 15,
    description: "Reset breathing & nervous system",
    accent: "#74b9ff",
  },
];

const toMilliseconds = (minutes: number) => minutes * 60 * 1000;

const formatTime = (ms: number) => {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

const formatTimeOfDay = (date: Date) =>
  date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function HomePage() {
  const [selectedPreset, setSelectedPreset] = useState<TimerPreset>(PRESETS[0]);
  const [customMinutes, setCustomMinutes] = useState<number>(PRESETS[0].minutes);
  const [remainingMs, setRemainingMs] = useState<number>(
    toMilliseconds(PRESETS[0].minutes)
  );
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [sessionNotes, setSessionNotes] = useState("Clarify your next sprint goal");
  const [cycleCount, setCycleCount] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationMs = useMemo(() => {
    if (selectedPreset.id === "custom") {
      return toMilliseconds(customMinutes);
    }
    return toMilliseconds(selectedPreset.minutes);
  }, [customMinutes, selectedPreset]);

  const progress = 1 - remainingMs / durationMs;

  const stopTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetTimer = (targetDuration = durationMs) => {
    stopTimer();
    setRemainingMs(targetDuration);
  };

  const handlePresetSelect = (preset: TimerPreset) => {
    setSelectedPreset(preset);
    setCustomMinutes(preset.minutes);
    resetTimer(toMilliseconds(preset.minutes));
  };

  const handleCustomMinutesChange = (minutes: number) => {
    const bounded = Math.min(120, Math.max(1, Math.round(minutes)));
    setCustomMinutes(bounded);
    setSelectedPreset({
      id: "custom",
      label: "Custom Session",
      minutes: bounded,
      description: "Tailored duration for your workflow",
      accent: "#fdcb6e",
    });
    resetTimer(toMilliseconds(bounded));
  };

  const pushHistory = (duration: number, label: string) => {
    setHistory((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        presetLabel: label,
        durationMinutes: Math.round(duration / 60000),
        completedAt: new Date(),
      },
      ...prev,
    ]);
  };

  const handleTick = () => {
    setRemainingMs((prev) => {
      const next = Math.max(prev - 1000, 0);
      if (next === 0) {
        stopTimer();
        setCycleCount((count) => count + 1);
        pushHistory(durationMs, selectedPreset.label);
      }
      return next;
    });
  };

  const toggleTimer = () => {
    setIsRunning((prev) => {
      if (!prev && remainingMs === 0) {
        setRemainingMs(durationMs);
      }
      return !prev;
    });
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(handleTick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) {
      document.title = "PulseTimer";
      return;
    }
    document.title = `${formatTime(remainingMs)} • ${selectedPreset.label} | PulseTimer`;
  }, [isRunning, remainingMs, selectedPreset.label]);

  const remainingMinutes = Math.floor(remainingMs / 60000);
  const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);

  return (
    <main>
      <nav className="nav">
        <div className="brand">
          <div className="orb" aria-hidden />
          <span>PulseTimer</span>
        </div>
        <div className="tagline">Design your rhythm for deep focus</div>
      </nav>

      <header className="hero">
        <div>
          <p className="eyebrow">INTENTIONAL FLOW</p>
          <h1>Orchestrate focused work with a living timer studio.</h1>
          <p className="subhead">
            Craft immersive work sessions, intuitive break cadences, and a
            personal ritual board that evolves with your creative energy.
          </p>
        </div>
        <div className="summary">
          <div>
            <span className="summary-label">Completed cycles</span>
            <span className="summary-value">{cycleCount}</span>
          </div>
          <div>
            <span className="summary-label">Last session</span>
            <span className="summary-value">
              {history.length > 0
                ? `${history[0].durationMinutes} min • ${formatTimeOfDay(
                    history[0].completedAt
                  )}`
                : "Not yet"}
            </span>
          </div>
        </div>
      </header>

      <section className="grid">
        <article className="timer-card">
          <div className="timer-top">
            <div>
              <p className="timer-mode">{selectedPreset.label}</p>
              <h2 className="timer-display">{formatTime(remainingMs)}</h2>
              <p className="timer-description">{selectedPreset.description}</p>
            </div>
            <div className="custom-input">
              <label htmlFor="custom-minutes">Custom minutes</label>
              <div className="custom-control">
                <input
                  id="custom-minutes"
                  type="range"
                  min={5}
                  max={120}
                  value={customMinutes}
                  onChange={(event) =>
                    handleCustomMinutesChange(Number(event.target.value))
                  }
                />
                <span>{customMinutes}m</span>
              </div>
            </div>
          </div>

          <div className="progress-shell">
            <div className="progress-track">
              <div
                className="progress-meter"
                style={{
                  width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                  background: selectedPreset.accent,
                }}
                aria-hidden
              />
            </div>
            <div className="time-chips">
              <span>{String(remainingMinutes).padStart(2, "0")}</span>
              <span>:</span>
              <span>{String(remainingSeconds).padStart(2, "0")}</span>
            </div>
          </div>

          <div className="timer-actions">
            <button
              onClick={toggleTimer}
              className={clsx("primary", { running: isRunning })}
            >
              {isRunning ? "Pause" : "Start"}
            </button>
            <button onClick={() => resetTimer()} disabled={remainingMs === durationMs}>
              Reset
            </button>
            <button onClick={() => handlePresetSelect(PRESETS[1])}>
              Quick 25
            </button>
          </div>

          <footer className="ritual">
            <h3>Session intention</h3>
            <p>
              {sessionNotes}
            </p>
            <textarea
              value={sessionNotes}
              onChange={(event) => setSessionNotes(event.target.value)}
              placeholder={'Outline what "deep work" means for the next sprint.'}
            />
          </footer>
        </article>

        <aside className="stack">
          <section className="panel">
            <h3>Session palette</h3>
            <div className="preset-grid">
              {PRESETS.map((preset) => {
                const active = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    className={clsx("preset", { active })}
                    style={{ borderColor: preset.accent }}
                  >
                    <span className="preset-label">{preset.label}</span>
                    <span className="preset-minute">{preset.minutes} min</span>
                    <span className="preset-description">{preset.description}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h3>Focus journal</h3>
            {history.length === 0 ? (
              <p className="empty">No sessions recorded yet. Start the clock to chart your momentum.</p>
            ) : (
              <ul className="history">
                {history.slice(0, 6).map((entry) => (
                  <li key={entry.id}>
                    <span className="history-time">{formatTimeOfDay(entry.completedAt)}</span>
                    <div>
                      <p>{entry.presetLabel}</p>
                      <span>{entry.durationMinutes} minute ritual</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </section>

      <section className="insights">
        <div className="insight-card">
          <h4>Flow cadence</h4>
          <p>
            Alternate between a <strong>50 • 10</strong> deep focus rhythm and short recovery
            breaths. Celebrate micro-wins after each cycle to reinforce the habit loop.
          </p>
        </div>
        <div className="insight-card">
          <h4>Somatic reset</h4>
          <p>
            During breaks, hydrate, stretch shoulders, and recalibrate your posture before stepping back into high attention.
          </p>
        </div>
        <div className="insight-card">
          <h4>Review ritual</h4>
          <p>
            Capture a single sentence reflection in the journal to build a personal blueprint of what sparks flow states.
          </p>
        </div>
      </section>

      <style jsx>{`
        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.75rem;
          border-radius: 1.5rem;
          backdrop-filter: blur(12px);
          background: linear-gradient(135deg, rgba(19, 26, 49, 0.85), rgba(13, 19, 36, 0.65));
          border: 1px solid rgba(108, 92, 231, 0.25);
          margin-bottom: 2.5rem;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .orb {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #a29bfe, rgba(162, 155, 254, 0));
          box-shadow: 0 0 25px rgba(108, 92, 231, 0.4);
        }

        .tagline {
          font-size: 0.95rem;
          color: var(--text-muted);
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .hero h1 {
          font-size: clamp(2.8rem, 3.3vw, 3.75rem);
          margin: 0.35rem 0 0.85rem;
          line-height: 1.1;
        }

        .hero .subhead {
          max-width: 38ch;
          color: var(--text-muted);
          margin: 0;
          font-size: 1.05rem;
        }

        .eyebrow {
          letter-spacing: 0.4em;
          font-size: 0.85rem;
          color: rgba(245, 247, 255, 0.55);
          margin-bottom: 1rem;
        }

        .summary {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          padding: 1.25rem;
          border-radius: 1.25rem;
          background: rgba(15, 22, 40, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.08);
          align-self: flex-start;
          min-width: 240px;
        }

        .summary-label {
          display: block;
          font-size: 0.85rem;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }

        .summary-value {
          font-size: 1.45rem;
          font-weight: 600;
        }

        .grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 2.5rem;
        }

        .timer-card {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding: 2.25rem;
          border-radius: 2rem;
          background: linear-gradient(145deg, rgba(17, 25, 46, 0.92), rgba(10, 15, 30, 0.88));
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 40px 120px rgba(11, 17, 39, 0.45);
        }

        .timer-mode {
          letter-spacing: 0.35em;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .timer-display {
          font-size: clamp(3.75rem, 11vw, 6.5rem);
          letter-spacing: 0.08em;
          margin: 0.35rem 0;
        }

        .timer-description {
          color: var(--text-muted);
          margin: 0;
        }

        .timer-top {
          display: flex;
          justify-content: space-between;
          gap: 1.5rem;
          align-items: center;
        }

        .custom-input {
          min-width: 170px;
          padding: 1.25rem 1rem;
          border-radius: 1.25rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .custom-input label {
          display: block;
          font-size: 0.8rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(245, 247, 255, 0.65);
          margin-bottom: 0.75rem;
        }

        .custom-control {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .custom-control input[type="range"] {
          flex: 1;
          accent-color: var(--accent);
        }

        .custom-control span {
          font-weight: 600;
          min-width: 3.5ch;
          text-align: right;
        }

        .progress-shell {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .progress-track {
          position: relative;
          width: 100%;
          height: 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .progress-meter {
          height: 100%;
          border-radius: inherit;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .time-chips {
          display: grid;
          grid-auto-flow: column;
          gap: 0.35rem;
          align-items: center;
          font-family: "JetBrains Mono", "SFMono-Regular", ui-monospace, monospace;
          font-size: 1.5rem;
          letter-spacing: 0.35em;
        }

        .timer-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .timer-actions button {
          flex: 1;
          min-width: 120px;
          border-radius: 999px;
          padding: 0.75rem 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
          cursor: pointer;
          transition: transform 0.2s ease, background 0.2s ease, border 0.2s ease;
        }

        .timer-actions button:hover:not(:disabled) {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.12);
        }

        .timer-actions button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .timer-actions .primary {
          background: linear-gradient(135deg, var(--accent), rgba(108, 92, 231, 0.55));
          border-color: rgba(108, 92, 231, 0.65);
          box-shadow: 0 12px 35px rgba(108, 92, 231, 0.35);
        }

        .timer-actions .primary.running {
          background: linear-gradient(135deg, rgba(255, 71, 133, 0.8), rgba(255, 119, 77, 0.8));
          border-color: rgba(255, 119, 77, 0.65);
          box-shadow: 0 14px 40px rgba(255, 119, 77, 0.3);
        }

        .ritual {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 1.5rem;
        }

        .ritual h3 {
          margin: 0 0 0.75rem;
        }

        .ritual p {
          margin: 0 0 1rem;
          color: var(--text-muted);
        }

        .ritual textarea {
          width: 100%;
          min-height: 90px;
          resize: vertical;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 0.75rem 1rem;
          background: rgba(8, 12, 25, 0.85);
          color: inherit;
          font-family: inherit;
        }

        .stack {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .panel {
          padding: 1.75rem;
          border-radius: 1.75rem;
          background: linear-gradient(160deg, rgba(12, 19, 39, 0.92), rgba(8, 12, 25, 0.8));
          border: 1px solid rgba(255, 255, 255, 0.04);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .panel h3 {
          margin-top: 0;
        }

        .preset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1rem;
          margin-top: 1.25rem;
        }

        .preset {
          position: relative;
          border-radius: 1.25rem;
          padding: 1rem;
          text-align: left;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid transparent;
          color: inherit;
          cursor: pointer;
          transition: transform 0.18s ease, border 0.18s ease, background 0.18s ease;
        }

        .preset.active {
          transform: translateY(-3px);
          background: rgba(255, 255, 255, 0.08);
        }

        .preset:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .preset-label {
          display: block;
          font-weight: 600;
        }

        .preset-minute {
          font-size: 0.9rem;
          margin-top: 0.35rem;
        }

        .preset-description {
          display: block;
          margin-top: 0.3rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .history {
          list-style: none;
          padding: 0;
          margin: 1.25rem 0 0;
          display: grid;
          gap: 0.95rem;
        }

        .history li {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: center;
          padding: 0.9rem 1rem;
          border-radius: 1.1rem;
          background: rgba(255, 255, 255, 0.04);
        }

        .history-time {
          font-family: "JetBrains Mono", monospace;
          color: rgba(245, 247, 255, 0.6);
          letter-spacing: 0.18em;
          font-size: 0.8rem;
        }

        .history span {
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .empty {
          margin: 1.25rem 0 0;
          color: var(--text-muted);
        }

        .insights {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          margin-top: 3.5rem;
        }

        .insight-card {
          padding: 1.75rem;
          border-radius: 1.5rem;
          background: linear-gradient(160deg, rgba(14, 20, 36, 0.9), rgba(10, 15, 28, 0.85));
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .insight-card h4 {
          margin-top: 0;
        }

        .insight-card p {
          color: var(--text-muted);
        }

        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .timer-top {
            flex-direction: column;
            align-items: stretch;
          }

          .custom-input {
            align-self: stretch;
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .nav {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .hero {
            flex-direction: column;
          }

          .summary {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
