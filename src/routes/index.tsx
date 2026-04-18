import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/")({
  component: ClockPage,
  head: () => ({
    meta: [
      { title: "Precision — Flip Clock" },
      { name: "description", content: "A premium animated flip clock." },
    ],
  }),
});

type DigitObj = {
  el: HTMLDivElement;
  tSpan: HTMLSpanElement;
  bSpan: HTMLSpanElement;
  value: string | null;
};

function ClockPage() {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [settings] = useSettings();
  const use24 = settings.use24Hour;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    wrapper.innerHTML = "";
    const digits: DigitObj[] = [];

    for (let i = 0; i < 6; i++) {
      if (i === 2 || i === 4) {
        const colon = document.createElement("div");
        colon.className = "colon";
        colon.textContent = ":";
        wrapper.appendChild(colon);
      }
      const el = document.createElement("div");
      el.className = "digit";

      const top = document.createElement("div");
      top.className = "digit-half top";
      const tSpan = document.createElement("span");
      top.appendChild(tSpan);

      const bottom = document.createElement("div");
      bottom.className = "digit-half bottom";
      const bSpan = document.createElement("span");
      bottom.appendChild(bSpan);

      el.appendChild(top);
      el.appendChild(bottom);
      wrapper.appendChild(el);
      digits.push({ el, tSpan, bSpan, value: null });
    }

    function flipDigit(d: DigitObj, newNum: string) {
      const oldNum = d.value;
      d.value = newNum;
      if (oldNum === null) {
        d.tSpan.textContent = newNum;
        d.bSpan.textContent = newNum;
        return;
      }
      if (oldNum === newNum) return;
      d.tSpan.textContent = newNum;
      d.bSpan.textContent = oldNum;

      const topFlap = document.createElement("div");
      topFlap.className = "digit-half top flap top-flap";
      const tFlapSpan = document.createElement("span");
      tFlapSpan.textContent = oldNum;
      topFlap.appendChild(tFlapSpan);

      const bottomFlap = document.createElement("div");
      bottomFlap.className = "digit-half bottom flap bottom-flap";
      const bFlapSpan = document.createElement("span");
      bFlapSpan.textContent = newNum;
      bottomFlap.appendChild(bFlapSpan);

      d.el.appendChild(topFlap);
      d.el.appendChild(bottomFlap);
      window.setTimeout(() => {
        d.bSpan.textContent = newNum;
        if (d.el.contains(topFlap)) d.el.removeChild(topFlap);
        if (d.el.contains(bottomFlap)) d.el.removeChild(bottomFlap);
      }, 600);
    }

    function update() {
      const n = new Date();
      let h = n.getHours();
      if (!use24) {
        h = h % 12;
        if (h === 0) h = 12;
      }
      const s =
        h.toString().padStart(2, "0") +
        n.getMinutes().toString().padStart(2, "0") +
        n.getSeconds().toString().padStart(2, "0");
      s.split("").forEach((num, i) => {
        if (digits[i].value !== num) flipDigit(digits[i], num);
      });
    }
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [use24]);

  return (
    <AppShell>
      <section
        id="view-clock"
        className="w-full min-h-[60vh] flex flex-col justify-center items-center"
      >
        <div className="clock-wrapper" ref={wrapperRef} />
        {!use24 && (
          <p className="mt-6 font-label text-xs uppercase tracking-[0.3em] text-on-surface-variant">
            {new Date().getHours() >= 12 ? "PM" : "AM"}
          </p>
        )}
      </section>
    </AppShell>
  );
}
