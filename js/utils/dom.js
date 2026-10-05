/** Small shared helpers. */

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Read a CSS custom property from the root element, e.g. cssVar("--c-ai"). */
export const cssVar = (name, el = document.documentElement) =>
  getComputedStyle(el).getPropertyValue(name).trim();

/** Build an element from an HTML string (single root). */
export function html(markup) {
  const tpl = document.createElement("template");
  tpl.innerHTML = markup.trim();
  return tpl.content.firstElementChild;
}

export const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
