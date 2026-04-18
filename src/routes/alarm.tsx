import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAlarms, type Alarm } from "@/lib/alarms";
import { useSettings } from "@/lib/settings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/alarm")({
  component: AlarmPage,
  head: () => ({
    meta: [
      { title: "Alarms — Precision" },
      { name: "description", content: "Create, edit, and manage your alarms." },
    ],
  }),
});

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const FULL_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function describeDays(days: number[]): string {
  if (days.length === 0) return "Once";
  if (days.length === 7) return "Everyday";
  const weekdays = [1, 2, 3, 4, 5];
  const weekend = [0, 6];
  const eq = (a: number[], b: number[]) =>
    a.length === b.length && a.every((x) => b.includes(x));
  if (eq(days, weekdays)) return "Weekdays";
  if (eq(days, weekend)) return "Weekends";
  return [...days].sort().map((d) => FULL_DAYS[d]).join(", ");
}

function AlarmPage() {
  const { alarms, upsert, remove, toggle } = useAlarms();
  const [settings] = useSettings();
  const [editing, setEditing] = useState<Alarm | null>(null);

  const openNew = () =>
    setEditing({
      id: crypto.randomUUID(),
      hour: 7,
      minute: 0,
      label: "New Alarm",
      days: [1, 2, 3, 4, 5],
      enabled: true,
    });

  const formatHour = (h: number) => {
    if (settings.use24Hour) return String(h).padStart(2, "0");
    let hh = h % 12;
    if (hh === 0) hh = 12;
    return String(hh).padStart(2, "0");
  };

  return (
    <AppShell>
      <section className="w-full">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-headline text-5xl font-bold tracking-tight text-primary">
              Alarms
            </h2>
            <p className="font-label text-xs uppercase tracking-[0.3em] text-on-surface-variant mt-2">
              Sequential Precision
            </p>
          </div>
          <button
            onClick={openNew}
            aria-label="Add alarm"
            className="w-12 h-12 bg-primary text-on-primary flex items-center justify-center active:scale-95 transition-transform rounded-lg"
          >
            <span className="material-symbols-outlined text-3xl">add</span>
          </button>
        </div>

        <div className="space-y-4">
          {alarms.length === 0 && (
            <p className="text-on-surface-variant text-sm text-center py-12">
              No alarms yet. Tap + to add one.
            </p>
          )}
          {alarms.map((a) => {
            const ampm = a.hour >= 12 ? "PM" : "AM";
            return (
              <div
                key={a.id}
                className={`p-6 relative overflow-hidden transition-all duration-300 rounded-xl group cursor-pointer ${
                  a.enabled
                    ? "bg-surface-container-low hover:bg-surface-variant"
                    : "hover:bg-surface-container-low"
                }`}
                onClick={() => setEditing(a)}
              >
                <div className="flex justify-between items-start">
                  <div className={`space-y-1 ${a.enabled ? "" : "opacity-40"}`}>
                    <span
                      className={`font-label text-[10px] uppercase tracking-widest ${
                        a.enabled ? "text-tertiary" : "text-on-surface-variant"
                      }`}
                    >
                      {describeDays(a.days)}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <h3 className="font-headline text-5xl font-bold tracking-tighter text-primary">
                        {formatHour(a.hour)}:{String(a.minute).padStart(2, "0")}
                      </h3>
                      {!settings.use24Hour && (
                        <span className="font-headline text-xl font-light text-secondary">
                          {ampm}
                        </span>
                      )}
                    </div>
                    <p className="font-body text-sm text-on-surface-variant">{a.label}</p>
                  </div>
                  <div
                    className="flex flex-col items-end gap-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => toggle(a.id)}
                      aria-label="Toggle alarm"
                      className={`w-14 h-7 rounded-full relative flex items-center px-1 transition-colors ${
                        a.enabled ? "bg-outline-variant" : "bg-surface-container-highest opacity-60"
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full transition-transform ${
                          a.enabled ? "bg-primary translate-x-7" : "bg-outline"
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => remove(a.id)}
                      aria-label="Delete alarm"
                      className="text-on-surface-variant hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {editing && (
        <AlarmEditor
          alarm={editing}
          onClose={() => setEditing(null)}
          onSave={(a) => {
            upsert(a);
            setEditing(null);
          }}
        />
      )}
    </AppShell>
  );
}

function AlarmEditor({
  alarm,
  onClose,
  onSave,
}: {
  alarm: Alarm;
  onClose: () => void;
  onSave: (a: Alarm) => void;
}) {
  const [draft, setDraft] = useState<Alarm>(alarm);
  const toggleDay = (d: number) =>
    setDraft((p) => ({
      ...p,
      days: p.days.includes(d) ? p.days.filter((x) => x !== d) : [...p.days, d].sort(),
    }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-surface-container border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl tracking-tight">
            {alarm.label === "New Alarm" ? "New Alarm" : "Edit Alarm"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="flex items-center justify-center gap-3">
            <NumberWheel
              value={draft.hour}
              min={0}
              max={23}
              onChange={(v) => setDraft({ ...draft, hour: v })}
            />
            <span className="text-5xl font-headline text-primary">:</span>
            <NumberWheel
              value={draft.minute}
              min={0}
              max={59}
              onChange={(v) => setDraft({ ...draft, minute: v })}
            />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-3">
              Repeat
            </p>
            <div className="flex justify-between gap-1">
              {DAY_LABELS.map((lbl, i) => {
                const on = draft.days.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-full text-sm font-semibold transition-colors ${
                      on
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-highest text-on-surface-variant"
                    }`}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-2">
              Label
            </p>
            <Input
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              className="bg-surface-container-low border-white/10"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(draft)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NumberWheel({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div className="flex flex-col items-center select-none">
      <button
        onClick={() => onChange(value === max ? min : value + 1)}
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
        onClick={() => onChange(value === min ? max : value - 1)}
        className="text-on-surface-variant hover:text-primary"
        aria-label="Decrease"
      >
        <span className="material-symbols-outlined">expand_more</span>
      </button>
    </div>
  );
}
