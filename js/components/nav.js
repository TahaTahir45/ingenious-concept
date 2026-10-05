/** Sticky header state + mobile menu. */
export function initNav(header) {
  if (!header) return;
  const toggle = header.querySelector(".menu-toggle");
  const links = header.querySelectorAll(".nav__links a");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setOpen = (open) => {
    header.classList.toggle("is-open", open);
    toggle?.setAttribute("aria-expanded", String(open));
    toggle?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  toggle?.addEventListener("click", () => setOpen(!header.classList.contains("is-open")));
  links.forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("is-open")) {
      setOpen(false);
      toggle?.focus();
    }
  });
}
