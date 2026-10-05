/** Brand system page: reuses the site's theme/nav modules and pillar data. */
import { initTheme } from "./components/theme.js";
import { initNav } from "./components/nav.js";
import { pillars } from "./data/pillars.js";
import { escapeHtml } from "./utils/dom.js";

document.documentElement.classList.remove("no-js");
initTheme(document.querySelector(".theme-toggle"));
initNav(document.querySelector(".site-header"));

// Render the same live components inside a dark tile and a light tile
const sample = pillars[1];
const deliverable = sample.deliverables[0];

document.querySelectorAll(".theme-demo").forEach((demo) => {
  const name = demo.dataset.theme === "dark" ? "Prism Ink" : "Lumen";
  demo.innerHTML = `
    <p class="theme-demo__label">${name}</p>
    <div class="theme-demo__tabs" aria-hidden="true">
      ${pillars
        .slice(0, 3)
        .map(
          (p, i) =>
            `<span class="pillar-tab" aria-selected="${i === 1}" style="--pc: var(${p.color})"><span class="pillar-tab__swatch"></span>${escapeHtml(p.short)}</span>`
        )
        .join("")}
    </div>
    <div class="deliv__item is-open" style="--pc: var(${sample.color})">
      <div class="deliv__toggle" aria-hidden="true">
        <span>${escapeHtml(deliverable.title)}</span><span class="deliv__icon"></span>
      </div>
      <div class="deliv__body"><div class="deliv__inner"><div>
        <p>${escapeHtml(deliverable.body)}</p>
        <ul class="chips">${deliverable.chips.slice(0, 3).map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
      </div></div></div>
    </div>
    <div class="theme-demo__actions">
      <span class="btn btn--primary">Start a project</span>
      <span class="btn btn--ghost">Explore services</span>
    </div>`;
});
