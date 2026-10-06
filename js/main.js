/**
 * Entry point. Each feature lives in its own module; this file only wires
 * them together so sections can be added or removed independently.
 */
import { initTheme } from "./components/theme.js";
import { initNav } from "./components/nav.js";
import { initReveal } from "./components/reveal.js";
import { initServices } from "./components/services.js";
import { initContact } from "./components/contact.js";
import { initCursorGlow, initSpotlight } from "./components/ambient.js";
import { initPrismScene } from "./scene/prism-scene.js";
import { prefersReducedMotion } from "./utils/dom.js";

const CONTACT_EMAIL = "hello@ingeniousconcepts.com";

document.documentElement.classList.remove("no-js");

initTheme(document.querySelector(".theme-toggle"));
initNav(document.querySelector(".site-header"));
initReveal();
initReveal("[data-reveal-line]");
initCursorGlow();
initSpotlight(".deliv__item");

const servicesSection = document.querySelector("#services");
const services = initServices(servicesSection);

initContact(document.querySelector("#brief-form"), { email: CONTACT_EMAIL });

const scene = initPrismScene({
  canvas: document.querySelector(".hero__canvas"),
  labelLayer: document.querySelector(".hero__labels"),
  onSelect: (index) => {
    services?.select(index);
    servicesSection.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  },
});
if (!scene) document.documentElement.classList.add("no-webgl");

// Kick off the hero's one orchestrated entrance
requestAnimationFrame(() => document.body.classList.add("is-loaded"));
