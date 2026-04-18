import { useEffect, useState } from "react";
import { startAlarmLoop, stopAlarmLoop } from "./audio";

export type Alarm = {
  id: string;
  hour: number; // 0-23
  minute: number; // 0-59
  label: string;
  days: number[]; // 0=Sun..6=Sat. Empty = one-shot (every day until disabled)
  enabled: boolean;
};

const KEY = "precision.alarms";
const SEED_KEY = "precision.alarms.seeded";

const SEED: Alarm[] = [
  {
    id: crypto.randomUUID(),
    hour: 6,
    minute: 30,
    label: "Early Rising Routine",
    days: [1, 2, 3, 4, 5, 6, 0],
    enabled: true,
  },
  {
    id: crypto.randomUUID(),
    hour: 9,
    minute: 0,
    label: "Deep Rest",
    days: [0, 6],
    enabled: false,
  },
  {
    id: crypto.randomUUID(),
    hour: 17,
    minute: 45,
    label: "Technical Review",
    days: [1, 3, 5],
    enabled: true,
  },
];

function read(): Alarm[] {
  if (typeof window === "undefined") return [];
  try {
    if (!localStorage.getItem(SEED_KEY)) {
      localStorage.setItem(KEY, JSON.stringify(SEED));
      localStorage.setItem(SEED_KEY, "1");
      return SEED;
    }
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Alarm[]) : [];
  } catch {
    return [];
  }
}

function write(list: Alarm[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("precision:alarms"));
}

export function useAlarms() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  useEffect(() => {
    setAlarms(read());
    const handler = () => setAlarms(read());
    window.addEventListener("precision:alarms", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("precision:alarms", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const upsert = (a: Alarm) => {
    const list = read();
    const idx = list.findIndex((x) => x.id === a.id);
    if (idx >= 0) list[idx] = a;
    else list.unshift(a);
    write(list);
  };
  const remove = (id: string) => write(read().filter((a) => a.id !== id));
  const toggle = (id: string) =>
    write(read().map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));

  return { alarms, upsert, remove, toggle };
}

// Global ticker — fires custom event when an alarm matches current time.
let tickerStarted = false;
export function ensureAlarmTicker() {
  if (typeof window === "undefined" || tickerStarted) return;
  tickerStarted = true;
  let lastFiredKey = "";
  setInterval(() => {
    const now = new Date();
    const key = `${now.getHours()}:${now.getMinutes()}`;
    if (key === lastFiredKey || now.getSeconds() !== 0) return;
    let list: Alarm[] = [];
    try {
      list = JSON.parse(localStorage.getItem(KEY) || "[]") as Alarm[];
    } catch {
      return;
    }
    const today = now.getDay();
    const hit = list.find(
      (a) =>
        a.enabled &&
        a.hour === now.getHours() &&
        a.minute === now.getMinutes() &&
        (a.days.length === 0 || a.days.includes(today)),
    );
    if (hit) {
      lastFiredKey = key;
      window.dispatchEvent(new CustomEvent<Alarm>("precision:alarm-fire", { detail: hit }));
    }
  }, 1000);
}

export { startAlarmLoop, stopAlarmLoop };
