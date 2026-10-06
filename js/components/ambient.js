import { prefersReducedMotion } from "../utils/dom.js";

/**
 * Desktop-only ambience. Both effects need a mouse, so touch devices
 * never load them and the phone layout stays exactly as it is.
 */
const hasMouse = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** A soft light that trails the cursor, tinted by the active practice (--wash). */
export function initCursorGlow() {
  if (!hasMouse() || prefersReducedMotion() || window.innerWidth < 1024) return;

  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);

  const pos = { x: window.innerWidth / 2, y: window.innerHeight / 3 };
  const target = { ...pos };
  let rafId = 0;

  const tick = () => {
    pos.x += (target.x - pos.x) * 0.14;
    pos.y += (target.y - pos.y) * 0.14;
    glow.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0)`;
    const settled = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) < 0.5;
    rafId = settled ? 0 : requestAnimationFrame(tick);
  };

  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch") return;
      target.x = e.clientX;
      target.y = e.clientY;
      glow.classList.add("is-on");
      if (!rafId) rafId = requestAnimationFrame(tick);
    },
    { passive: true }
  );
  document.addEventListener("pointerout", (e) => {
    if (!e.relatedTarget) glow.classList.remove("is-on");
  });
}

/** Cards matching `selector` get --mx / --my so CSS can light the spot under the cursor. */
export function initSpotlight(selector) {
  if (!hasMouse()) return;
  document.addEventListener(
    "pointermove",
    (e) => {
      const el = e.target instanceof Element && e.target.closest(selector);
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${(e.clientX - r.left).toFixed(0)}px`);
      el.style.setProperty("--my", `${(e.clientY - r.top).toFixed(0)}px`);
    },
    { passive: true }
  );
}
