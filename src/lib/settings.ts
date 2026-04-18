import { useEffect, useState } from "react";

export type Settings = {
  use24Hour: boolean;
  soundOn: boolean;
};

const KEY = "precision.settings";
const DEFAULTS: Settings = { use24Hour: true, soundOn: true };

function read(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

function write(s: Settings) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("precision:settings", { detail: s }));
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [s, setS] = useState<Settings>(DEFAULTS);
  useEffect(() => {
    setS(read());
    const onChange = (e: Event) => {
      const ce = e as CustomEvent<Settings>;
      if (ce.detail) setS(ce.detail);
      else setS(read());
    };
    window.addEventListener("precision:settings", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("precision:settings", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  const update = (patch: Partial<Settings>) => {
    const next = { ...read(), ...patch };
    write(next);
    setS(next);
  };
  return [s, update];
}
