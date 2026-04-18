import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useSettings } from "@/lib/settings";
import { startAlarmLoop, stopAlarmLoop } from "@/lib/audio";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/timer")({
  component: TimerPage,
  head: () => ({
    meta: [
      { title: "Timer — Precision" },
      { name: "description", content: "Countdown timer with presets." },
    ],
  }),
});

type Preset = { label: string; seconds: number };
const RECENT_KEY = "precision.timer.recent";
const DEFAULT_PRESETS: Preset[] = [
  { label: "Deep", seconds: 10 * 60 },
  { label: "Break", seconds: 5 * 60 },
  { label: "Focus", seconds: 25 * 60 },
];

function loadRecent(): Preset[] {
  if (typeof window === "undefined") return DEFAULT_PRESETS;
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return DEFAULT_PRESETS;
    const arr = JSON.parse(raw) as Preset[];
    return arr.length ? arr : DEFAULT_PRESETS;
  } catch {
    return DEFAULT_PRESETS;
  }
}

function saveRecent(seconds: number) {
  const cur = loadRecent();
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const label = `${mins}m${secs ? ` ${secs}s` : ""}`;
  const next = [{ label, seconds }, ...cur.filter((p) => p.seconds !== seconds)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

function TimerPage() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [totalSec, setTotalSec] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [finished, setFinished] = useState(false);
  const [recent, setRecent] = useState<Preset[]>(DEFAULT_PRESETS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [settings] = useSettings();

  useEffect(() => setRecent(loadRecent()), []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopAlarmLoop();
    };
  }, []);

  const start = (sec: number) => {
    if (sec <= 0) return;
    setTotalSec(sec);
    setRemaining(sec);
    setRunning(true);
    setPaused(false);
    setFinished(false);
    saveRecent(sec);
    setRecent(loadRecent());
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setFinished(true);
          setRunning(false);
          if (settings.soundOn) startAlarmLoop();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  const handleStart = () => start(hours * 3600 + minutes * 60 + seconds);

  const togglePause = () => {
    if (paused) {
      setPaused(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setFinished(true);
            setRunning(false);
            if (settings.soundOn) startAlarmLoop();
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      setPaused(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopAlarmLoop();
    setRunning(false);
    setPaused(false);
    setFinished(false);
    setRemaining(0);
    setTotalSec(0);
  };

  const dismissFinish = () => {
    stopAlarmLoop();
    setFinished(false);
    reset();
  };

  const restart = () => {
    stopAlarmLoop();
    setFinished(false);
    start(totalSec);
  };

  return (
    <AppShell>
      <section className="w-full">
        {!running && !paused && !finished ? (
          <SetupView
            hours={hours}
            minutes={minutes}
            seconds={seconds}
            setHours={setHours}
            setMinutes={setMinutes}
            setSeconds={setSeconds}
            recent={recent}
            onPick={(p) => {
              setHours(Math.floor(p.seconds / 3600));
              setMinutes(Math.floor((p.seconds % 3600) / 60));
              setSeconds(p.seconds % 60);
            }}
            onStart={handleStart}
          />
        ) : (
          <RunView
            remaining={remaining}
            total={totalSec}
            paused={paused}
            finished={finished}
            onTogglePause={togglePause}
            onReset={reset}
            onDismiss={dismissFinish}
            onRestart={restart}
          />
        )}
      </section>
    </AppShell>
  );
}

function SetupView({
  hours,
  minutes,
  seconds,
  setHours,
  setMinutes,
  setSeconds,
  recent,
  onPick,
  onStart,
}: {
  hours: number;
  minutes: number;
  seconds: number;
  setHours: (v: number) => void;
  setMinutes: (v: number) => void;
  setSeconds: (v: number) => void;
  recent: Preset[];
  onPick: (p: Preset) => void;
  onStart: () => void;
}) {
  const total = hours * 3600 + minutes * 60 + seconds;
  return (
    <div className="flex flex-col items-center">
      <p className="font-label text-xs uppercase tracking-[0.3em] text-on-surface-variant mb-8 mt-4">
        Set Duration
      </p>
      <div className="flex items-center gap-3 mb-12">
        <Wheel value={hours} max={23} onChange={setHours} label="H" />
        <span className="text-5xl text-primary font-headline">:</span>
        <Wheel value={minutes} max={59} onChange={setMinutes} label="M" />
        <span className="text-5xl text-primary font-headline">:</span>
        <Wheel value={seconds} max={59} onChange={setSeconds} label="S" />
      </div>

      <Button
        onClick={onStart}
        disabled={total === 0}
        className="w-full py-8 text-base font-headline tracking-[0.2em] uppercase"
      >
        Start
      </Button>

      <div className="w-full mt-12">
        <p className="font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant mb-4">
          Presets
        </p>
        <div className="grid grid-cols-3 gap-3">
          {recent.map((p) => {
            const m = Math.floor(p.seconds / 60);
            const s = p.seconds % 60;
            return (
              <button
                key={p.label + p.seconds}
                onClick={() => onPick(p)}
                className="bg-surface-container-low p-4 rounded-xl text-left hover:bg-surface-variant transition-colors active:scale-95"
              >
                <h4 className="font-headline text-xl text-primary font-bold">
                  {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
                </h4>
                <p className="font-label text-[8px] uppercase tracking-widest text-on-surface-variant mt-1">
                  {p.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Wheel({
  value,
  max,
  onChange,
  label,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const clamp = (v: number) => Math.max(0, Math.min(max, v));
  return (
    <div className="flex flex-col items-center select-none">
      <button
        onClick={() => onChange(value === max ? 0 : value + 1)}
        className="text-on-surface-variant hover:text-primary"
        aria-label="Increase"
      >
        <span className="material-symbols-outlined">expand_less</span>
      </button>
      <input
        type="number"
        value={String(value).padStart(2, "0")}
        onChange={(e) => onChange(clamp(parseInt(e.target.value || "0", 10)))}
        className="w-20 text-center bg-transparent text-5xl font-headline font-bold text-primary outline-none"
      />
      <button
        onClick={() => onChange(value === 0 ? max : value - 1)}
        className="text-on-surface-variant hover:text-primary"
        aria-label="Decrease"
      >
        <span className="material-symbols-outlined">expand_more</span>
      </button>
      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">
        {label}
      </span>
    </div>
  );
}

function RunView({
  remaining,
  total,
  paused,
  finished,
  onTogglePause,
  onReset,
  onDismiss,
  onRestart,
}: {
  remaining: number;
  total: number;
  paused: boolean;
  finished: boolean;
  onTogglePause: () => void;
  onReset: () => void;
  onDismiss: () => void;
  onRestart: () => void;
}) {
  const r = 140;
  const C = 2 * Math.PI * r;
  const progress = total > 0 ? remaining / total : 0;
  const offset = C - progress * C;

  const hh = Math.floor(remaining / 3600);
  const mm = Math.floor((remaining % 3600) / 60);
  const ss = remaining % 60;
  const display =
    hh > 0
      ? `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
      : `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;

  const end = new Date(Date.now() + remaining * 1000);
  const endStr = end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col items-center">
      <p className="font-label text-xs uppercase tracking-[0.3em] text-on-surface-variant mb-6 mt-4">
        {finished ? "Finished" : paused ? "Paused" : "Countdown Active"}
      </p>
      <div
        className={`relative w-80 h-80 max-w-full flex items-center justify-center mb-12 ${
          finished ? "animate-pulse" : ""
        }`}
      >
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 300">
          <circle className="timer-circle-bg" cx="150" cy="150" r={r} />
          <circle
            className="timer-circle"
            cx="150"
            cy="150"
            r={r}
            style={{ strokeDasharray: C, strokeDashoffset: offset }}
          />
        </svg>
        <div className="text-center z-10 flex flex-col items-center">
          <span className="font-headline text-7xl font-bold tracking-tighter text-primary">
            {display}
          </span>
          {!finished && (
            <div className="mt-4 flex flex-col items-center">
              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                Estimated End
              </span>
              <span className="font-body text-sm text-primary mt-1">{endStr}</span>
            </div>
          )}
        </div>
      </div>

      {finished ? (
        <div className="flex gap-4 w-full">
          <button
            onClick={onDismiss}
            className="flex-1 bg-surface-container-low hover:bg-surface-container-high transition-colors py-8 rounded-xl flex flex-col items-center gap-3 active:scale-95"
          >
            <span className="material-symbols-outlined text-3xl text-secondary">close</span>
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary">
              Dismiss
            </span>
          </button>
          <button
            onClick={onRestart}
            className="flex-1 bg-primary text-on-primary hover:opacity-90 transition-opacity py-8 rounded-xl flex flex-col items-center gap-3 active:scale-95"
          >
            <span className="material-symbols-outlined text-3xl">restart_alt</span>
            <span className="font-label text-[10px] uppercase tracking-[0.2em]">Restart</span>
          </button>
        </div>
      ) : (
        <div className="flex gap-4 w-full">
          <button
            onClick={onReset}
            className="flex-1 bg-surface-container-low hover:bg-surface-container-high transition-colors py-8 rounded-xl flex flex-col items-center gap-3 active:scale-95"
          >
            <span className="material-symbols-outlined text-3xl text-secondary">refresh</span>
            <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary">
              Reset
            </span>
          </button>
          <button
            onClick={onTogglePause}
            className="flex-1 bg-primary text-on-primary hover:opacity-90 transition-opacity py-8 rounded-xl flex flex-col items-center gap-3 active:scale-95"
          >
            <span className="material-symbols-outlined text-3xl">
              {paused ? "play_arrow" : "pause"}
            </span>
            <span className="font-label text-[10px] uppercase tracking-[0.2em]">
              {paused ? "Resume" : "Pause"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
