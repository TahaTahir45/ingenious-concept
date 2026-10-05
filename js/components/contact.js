import { pillars } from "../data/pillars.js";
import { escapeHtml } from "../utils/dom.js";

/**
 * Contact form. There is no backend on a static deploy, so "Draft email"
 * validates the brief and opens the visitor's email app with it filled in.
 * Swap `submitBrief` for a fetch() to Formspree / a serverless function later.
 */
export function initContact(form, { email }) {
  if (!form) return;

  const picks = form.querySelector("[data-practice-picks]");
  const status = form.querySelector("[data-form-status]");

  picks.innerHTML = pillars
    .map(
      (p) => `
      <span class="practice-pick" style="--pc: var(${p.color})">
        <input type="checkbox" id="pick-${p.id}" name="practice" value="${escapeHtml(p.title)}">
        <label for="pick-${p.id}">${escapeHtml(p.short)}</label>
      </span>`
    )
    .join("");

  const rules = {
    name: (v) => (v ? "" : "Add your name so we know who to reply to."),
    email: (v) => {
      if (!v) return "Add a work email so we can reply.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "This email looks incomplete. Check the @ and the domain.";
    },
    message: (v) => (v.length >= 10 ? "" : "Describe the project in a sentence or two."),
  };

  const setError = (name, msg) => {
    const input = form.elements[name];
    const field = input.closest(".field");
    const out = field.querySelector(".field__error");
    if (msg) {
      field.setAttribute("data-invalid", "");
      input.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("data-invalid");
      input.removeAttribute("aria-invalid");
    }
    out.textContent = msg;
  };

  // Clear an error as soon as the visitor fixes it
  Object.keys(rules).forEach((name) => {
    form.elements[name].addEventListener("input", (e) => {
      if (e.target.closest(".field").hasAttribute("data-invalid")) {
        setError(name, rules[name](e.target.value.trim()));
      }
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(Object.keys(rules).map((k) => [k, form.elements[k].value.trim()]));
    let firstInvalid = null;
    Object.entries(rules).forEach(([name, check]) => {
      const msg = check(data[name]);
      setError(name, msg);
      if (msg && !firstInvalid) firstInvalid = form.elements[name];
    });
    if (firstInvalid) {
      firstInvalid.focus();
      status.textContent = "";
      return;
    }

    const company = form.elements.company.value.trim();
    const practices = [...form.querySelectorAll('input[name="practice"]:checked')].map((i) => i.value);
    const subject = `Project brief from ${data.name}${company ? ` at ${company}` : ""}`;
    const lines = [`Name: ${data.name}`, `Email: ${data.email}`];
    if (company) lines.push(`Company: ${company}`);
    if (practices.length) lines.push(`Practices: ${practices.join(", ")}`);
    lines.push("", data.message);
    const body = lines.join("\n");

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = `Your email app should open with this brief filled in. If it doesn't, write to ${email}.`;
  });
}
