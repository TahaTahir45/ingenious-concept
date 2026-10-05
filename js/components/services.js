import { pillars } from "../data/pillars.js";
import { html, escapeHtml, prefersReducedMotion } from "../utils/dom.js";

/**
 * Services section.
 * - Accessible tablist (arrow keys, Home/End) for the five pillars
 * - CSS 3D pentagonal prism that rotates to the selected pillar
 *   (click a face, swipe it, or use the tabs)
 * - Expandable deliverable rows for the active pillar
 *
 * Returns { select(index) } so other modules (the hero rays) can drive it.
 */
export function initServices(root) {
  if (!root) return null;

  const tabsEl = root.querySelector("[data-pillar-tabs]");
  const viewport = root.querySelector("[data-prism-viewport]");
  const tiltEl = root.querySelector("[data-prism-tilt]");
  const prismEl = root.querySelector("[data-prism]");
  const panelEl = root.querySelector("[data-pillar-panel]");
  const count = pillars.length;
  const step = 360 / count;

  let active = -1;
  let angle = 0;

  /* ---- Tabs ---- */
  const tabs = pillars.map((p, i) => {
    const tab = html(
      `<button class="pillar-tab" type="button" role="tab" id="tab-${p.id}" aria-controls="pillar-panel"
        aria-selected="false" tabindex="-1" style="--pc: var(${p.color})">
        <span class="pillar-tab__swatch" aria-hidden="true"></span>${escapeHtml(p.short)}
      </button>`
    );
    tab.addEventListener("click", () => select(i));
    tab.addEventListener("keydown", (e) => {
      const moves = { ArrowRight: 1, ArrowLeft: -1 };
      let next = null;
      if (e.key in moves) next = (active + moves[e.key] + count) % count;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = count - 1;
      if (next === null) return;
      e.preventDefault();
      select(next, { focusTab: true });
    });
    tabsEl.appendChild(tab);
    return tab;
  });

  /* ---- 3D prism faces ---- */
  const faces = pillars.map((p, i) => {
    const face = html(
      `<div class="prism5__face" style="--i:${i}; --pc: var(${p.color})">${p.icon}<span>${escapeHtml(p.short)}</span></div>`
    );
    prismEl.appendChild(face);
    return face;
  });
  prismEl.insertAdjacentHTML(
    "beforeend",
    '<div class="prism5__cap prism5__cap--top"></div><div class="prism5__cap prism5__cap--bottom"></div>'
  );

  /* Click a face, or swipe the prism left/right */
  let dragStartX = null;
  let dragged = false;
  viewport.addEventListener("pointerdown", (e) => {
    dragStartX = e.clientX;
    dragged = false;
  });
  viewport.addEventListener("pointerup", (e) => {
    if (dragStartX === null) return;
    const dx = e.clientX - dragStartX;
    dragStartX = null;
    if (Math.abs(dx) > 40) {
      dragged = true;
      select((active + (dx < 0 ? 1 : -1) + count) % count);
    }
  });
  faces.forEach((face, i) =>
    face.addEventListener("click", () => {
      if (!dragged) select(i);
    })
  );

  /* Pointer tilt adds depth while hovering */
  if (!prefersReducedMotion()) {
    viewport.addEventListener("pointermove", (e) => {
      const r = viewport.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tiltEl.style.setProperty("--tilt-y", `${x * 22}deg`);
      tiltEl.style.setProperty("--tilt-x", `${-y * 12}deg`);
    });
    viewport.addEventListener("pointerleave", () => {
      tiltEl.style.setProperty("--tilt-y", "0deg");
      tiltEl.style.setProperty("--tilt-x", "0deg");
    });
  }

  /* ---- Deliverables accordion (event delegation) ---- */
  panelEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".deliv__toggle");
    if (!btn) return;
    const item = btn.closest(".deliv__item");
    const open = !item.classList.contains("is-open");
    item.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", String(open));
    item.querySelector(".deliv__body").inert = !open;
  });

  function renderPanel(p) {
    panelEl.setAttribute("aria-labelledby", `tab-${p.id}`);
    panelEl.style.setProperty("--pc", `var(${p.color})`);
    panelEl.innerHTML = `
      <h3 class="pillar-panel__title">${escapeHtml(p.title)}</h3>
      <p class="pillar-panel__summary">${escapeHtml(p.summary)}</p>
      <ul class="deliv">
        ${p.deliverables
          .map((d, j) => {
            const open = j === 0;
            return `
          <li class="deliv__item${open ? " is-open" : ""}">
            <h4>
              <button class="deliv__toggle" type="button" id="dt-${p.id}-${j}"
                aria-expanded="${open}" aria-controls="d-${p.id}-${j}">
                <span>${escapeHtml(d.title)}</span>
                <span class="deliv__icon" aria-hidden="true"></span>
              </button>
            </h4>
            <div class="deliv__body" id="d-${p.id}-${j}" role="region" aria-labelledby="dt-${p.id}-${j}"${open ? "" : " inert"}>
              <div class="deliv__inner"><div>
                <p>${escapeHtml(d.body)}</p>
                <ul class="chips" aria-label="Includes">${d.chips.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
              </div></div>
            </div>
          </li>`;
          })
          .join("")}
      </ul>`;

    if (!prefersReducedMotion()) {
      panelEl.classList.remove("is-entering");
      void panelEl.offsetWidth; // restart the animation
      panelEl.classList.add("is-entering");
    }
  }

  function select(i, { focusTab = false } = {}) {
    if (i === active) {
      if (focusTab) tabs[i].focus();
      return;
    }
    const p = pillars[i];

    // Rotate the shortest way round the pentagon
    if (active >= 0) {
      let delta = (i - active) % count;
      if (delta > count / 2) delta -= count;
      if (delta < -count / 2) delta += count;
      angle -= delta * step;
    } else {
      angle = -i * step;
    }
    active = i;

    prismEl.style.setProperty("--angle", `${angle}deg`);
    root.style.setProperty("--pc", `var(${p.color})`);

    tabs.forEach((t, k) => {
      const on = k === i;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    faces.forEach((f, k) => f.classList.toggle("is-active", k === i));

    // Keep the active pill visible when the tab row scrolls on mobile
    const tab = tabs[i];
    if (tabsEl.scrollWidth > tabsEl.clientWidth) {
      tabsEl.scrollTo({
        left: tab.offsetLeft - tabsEl.clientWidth / 2 + tab.offsetWidth / 2,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    }

    renderPanel(p);
    if (focusTab) tab.focus();
  }

  select(0);
  return { select };
}
