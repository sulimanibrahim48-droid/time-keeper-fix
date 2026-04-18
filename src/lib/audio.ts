// Web Audio beep utility — no asset files needed.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      (window.AudioContext as typeof AudioContext) ||
      ((window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext as typeof AudioContext);
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function beep(freq = 880, durationMs = 200, volume = 0.25) {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain).connect(c.destination);
  const t = c.currentTime;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000);
  osc.start(t);
  osc.stop(t + durationMs / 1000);
}

export function alarmTone() {
  beep(880, 250);
  setTimeout(() => beep(660, 250), 300);
  setTimeout(() => beep(880, 350), 600);
}

let alarmInterval: ReturnType<typeof setInterval> | null = null;
export function startAlarmLoop() {
  stopAlarmLoop();
  alarmTone();
  alarmInterval = setInterval(alarmTone, 1200);
}
export function stopAlarmLoop() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}
