/**
 * Dark / light theme toggle.
 * The initial theme is set by a tiny inline script in <head> (no flash);
 * this module wires the button, persists the choice and broadcasts a
 * "themechange" event so the WebGL scene can recolor itself.
 */
const STORAGE_KEY = "ic-theme";

export function initTheme(button) {
  const root = document.documentElement;

  const apply = (theme) => {
    root.dataset.theme = theme;
    if (button) {
      button.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) { /* storage unavailable */ }
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  };

  if (button) {
    button.setAttribute("aria-label", root.dataset.theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    button.addEventListener("click", () => apply(root.dataset.theme === "dark" ? "light" : "dark"));
  }
}
