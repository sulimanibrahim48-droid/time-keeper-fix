import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/lib/settings";
import { ensureAlarmTicker, startAlarmLoop, stopAlarmLoop, type Alarm, useAlarms } from "@/lib/alarms";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, updateSettings] = useSettings();
  const [firedAlarm, setFiredAlarm] = useState<Alarm | null>(null);
  const { toggle } = useAlarms();
  const location = useLocation();

  useEffect(() => {
    ensureAlarmTicker();
    const onFire = (e: Event) => {
      const ce = e as CustomEvent<Alarm>;
      setFiredAlarm(ce.detail);
      if (settings.soundOn) startAlarmLoop();
    };
    window.addEventListener("precision:alarm-fire", onFire);
    return () => window.removeEventListener("precision:alarm-fire", onFire);
  }, [settings.soundOn]);

  // Material Symbols font (load once)
  useEffect(() => {
    const id = "material-symbols-link";
    if (document.getElementById(id)) return;
    const l1 = document.createElement("link");
    l1.id = id;
    l1.rel = "stylesheet";
    l1.href =
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
    document.head.appendChild(l1);
    const l2 = document.createElement("link");
    l2.rel = "stylesheet";
    l2.href =
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap";
    document.head.appendChild(l2);
  }, []);

  const dismissAlarm = () => {
    stopAlarmLoop();
    setFiredAlarm(null);
  };
  const snoozeAlarm = () => {
    if (firedAlarm) {
      // Disable the original (one-time snooze: re-enable after 5 min by toggling twice via timeout)
      toggle(firedAlarm.id);
      setTimeout(() => toggle(firedAlarm.id), 5 * 60 * 1000);
    }
    dismissAlarm();
  };

  const path = location.pathname;
  const tabs = [
    { to: "/", icon: "public", label: "Clock" },
    { to: "/alarm", icon: "alarm", label: "Alarm" },
    { to: "/timer", icon: "hourglass_empty", label: "Timer" },
  ] as const;

  return (
    <div className="bg-background text-foreground font-body min-h-dvh">
      {/* Top App Bar */}
      <header className="fixed top-0 z-50 w-full bg-[#0a0e14]/80 backdrop-blur-md">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-lg mx-auto">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="text-primary active:scale-95 transition-transform"
          >
            <Icon name="menu" />
          </button>
          <h1 className="font-headline tracking-[0.2em] uppercase text-sm font-medium text-primary">
            PRECISION
          </h1>
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            className="text-primary active:scale-95 transition-transform"
          >
            <Icon name="settings" />
          </button>
        </div>
        <div className="bg-gradient-to-b from-surface-container-low to-transparent h-px" />
      </header>

      <main className="pt-24 pb-32 px-6 max-w-lg mx-auto w-full">{children}</main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center pb-8 pt-4 px-10 bg-[#0a0e14]/90 backdrop-blur-2xl shadow-[0_-20px_40px_rgba(0,0,0,0.6)] z-50 border-t border-white/5">
        {tabs.map((t) => {
          const active = path === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`relative flex flex-col items-center justify-center transition-all duration-300 ${
                active ? "text-primary opacity-100" : "text-on-surface-variant opacity-60"
              }`}
            >
              <Icon name={t.icon} className="mb-1" />
              <span className="text-[10px] uppercase tracking-widest font-semibold">{t.label}</span>
              {active && (
                <span className="absolute -bottom-2 w-4 h-0.5 bg-tertiary rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[60] opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage:
            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBeJMKnXSAd8wK9TIf_c0Yx3PcPAJXkdwTkMMiWD95-gj8uLEgcMhNr5G49s5QL5-WPmKCUhrV4TubLHAhakbUT-r6oUW5_MMM9rltJ7Jh2dTefnrsLKYSkmtA5N0tBTWqRJaMsTXiUAOJIgl8HHzOS8kt-c4qBCvSVG7SFcKohsYlEA8FiQ8Jy1wS_w2ZrCjHMKXc8qaTYkezkliBlry1kYpsaLkox8lCHt7J_UnJEA3_E1HZ1QgWqqDnv5A4lO4nO5LuVKknwv4w')",
        }}
      />

      {/* Menu Sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="bg-surface-container border-white/10">
          <SheetHeader>
            <SheetTitle className="font-headline tracking-widest uppercase text-primary">
              Menu
            </SheetTitle>
            <SheetDescription>Quick preferences and info.</SheetDescription>
          </SheetHeader>
          <PreferencesPanel />
          <div className="mt-8 px-4">
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-2">About</p>
            <p className="text-sm text-foreground/80">
              Precision — a flip clock, alarm, and countdown timer. All data is stored locally on
              your device.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings Sheet */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="right" className="bg-surface-container border-white/10">
          <SheetHeader>
            <SheetTitle className="font-headline tracking-widest uppercase text-primary">
              Settings
            </SheetTitle>
            <SheetDescription>Preferences are saved on this device.</SheetDescription>
          </SheetHeader>
          <PreferencesPanel />
        </SheetContent>
      </Sheet>

      {/* Alarm fire dialog */}
      <Dialog open={firedAlarm !== null} onOpenChange={(o) => !o && dismissAlarm()}>
        <DialogContent className="bg-surface-container border-white/10">
          <DialogHeader>
            <DialogTitle className="font-headline text-3xl tracking-tight">
              ⏰ {firedAlarm?.label || "Alarm"}
            </DialogTitle>
            <DialogDescription>
              {firedAlarm
                ? `${String(firedAlarm.hour).padStart(2, "0")}:${String(firedAlarm.minute).padStart(2, "0")}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={snoozeAlarm}>
              Snooze 5 min
            </Button>
            <Button onClick={dismissAlarm}>Dismiss</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function PreferencesPanel() {
    return (
      <div className="mt-6 space-y-5 px-4">
        <Row
          label="24-hour time"
          hint="Disable for 12-hour with AM/PM"
          checked={settings.use24Hour}
          onChange={(v) => updateSettings({ use24Hour: v })}
        />
        <Row
          label="Sound"
          hint="Alarm and timer tones"
          checked={settings.soundOn}
          onChange={(v) => updateSettings({ soundOn: v })}
        />
      </div>
    );
  }
}

function Row({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-on-surface-variant mt-0.5">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
