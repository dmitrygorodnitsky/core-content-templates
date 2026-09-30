// customer-portal/runtime/src/routes/AuthPage.js — production transfer module.
import { h } from "../dom.js";
import { state } from "../state.js";
import { validateCode, validatePhone } from "../actions.js";
import { render } from "../app.js";
import { ActionButton } from "../components/primitives/ActionButton.js";

function pitchRow(dot, bg, text) {
  return h("div", { style: "display:flex;align-items:center;gap:12px" }, [
    h("div", { style: "width:34px;height:34px;border-radius:10px;background:" + bg + ";display:grid;place-items:center" }, h("i", { style: "width:12px;height:12px;border-radius:4px;background:" + dot + ";display:block" })),
    h("div", { style: "font-size:14px;color:var(--ink-2)" }, text)
  ]);
}

export function Auth() {
  var page = h("section", { "class": "page auth-page", "data-route": state.route, "data-visual-id": state.route });
  var grid = h("div", { "class": "auth-grid" });

  /* left pitch */
  grid.appendChild(h("div", { "class": "auth-pitch" }, [
    h("span", { "class": "eyebrow" }, "Your customer account"),
    h("h1", { "class": "auth-pitch__title" }, "Sign in to track every visit."),
    h("p", { "class": "auth-pitch__sub" }, "One account for all your properties \u2014 bookings, live tracking, invoices and your membership in one place."),
    h("div", { style: "display:flex;flex-direction:column;gap:14px;max-width:360px" }, [
      pitchRow("var(--accent)", "rgba(var(--accent-rgb),.12)", "Book in under a minute"),
      pitchRow("#1f8a44", "rgba(52,199,89,.16)", "Track your technician live"),
      pitchRow("#7a52e0", "rgba(122,82,224,.16)", "Save with a membership")
    ])
  ]));

  /* auth card — route drives which step renders (auth.phone | auth.code) */
  var step = state.route === "auth.code" ? "code" : "phone";
  var card = h("div", { "class": "auth-card", "data-module": "auth-card", "data-visual-id": "auth-card", "data-state": "auth-" + step });
  if (step === "phone") card.appendChild(AuthPhone());
  else card.appendChild(AuthCode());
  grid.appendChild(card);
  page.appendChild(grid);
  return page;
}

export function AuthPhone() {
  var err = state.authError;
  var input = h("input", { "class": "auth-phone__input", placeholder: "(555) 000-0000", value: state.phone, inputmode: "tel", "aria-label": "Phone number" });
  input.addEventListener("input", function () { state.phone = input.value; }); /* no re-render: keep focus */
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") validatePhone(); });
  return h("div", { "data-state": "auth-phone" }, [
    h("div", { "class": "brand-logo brand-logo--lg", style: "margin-bottom:18px" }),
    h("div", { style: "font-weight:800;font-size:22px;letter-spacing:-.02em" }, "Welcome to Aircove"),
    h("div", { style: "font-size:14px;color:var(--ink-2);margin:4px 0 22px" }, "Enter your phone to get a one-time code."),
    h("div", { style: "font-weight:600;font-size:12px;color:var(--ink-3);letter-spacing:.04em;text-transform:uppercase;margin-bottom:8px" }, "Phone number"),
    h("div", { "class": "auth-phone" + (err ? " auth-phone--error" : "") }, [
      h("div", { "class": "auth-phone__cc" }, "\ud83c\uddfa\ud83c\uddf8 +1"),
      input
    ]),
    err ? h("div", { "class": "auth-error", "data-state": "validation-error" }, err) : null,
    h("div", { style: "margin-top:18px" }, ActionButton({ variant: "btn--primary", label: "Send code", action: "auth.sendCode", block: true, lg: true, visualId: "send-code" })),
    h("div", { "class": "auth-divider" }, [h("span", { "class": "auth-divider__line" }), h("span", { style: "font-size:12px;color:var(--ink-3)" }, "or"), h("span", { "class": "auth-divider__line" })]),
    h("div", { "class": "auth-apple", "data-action": "auth.apple", "data-visual-id": "apple-signin" }, [h("span", { "class": "auth-apple__mark" }), "Continue with Apple"]),
    h("div", { style: "text-align:center;font-size:12px;line-height:1.5;color:var(--ink-3);margin-top:18px" }, "By continuing you agree to our Terms & Privacy Policy.")
  ]);
}

export function AuthCode() {
  var err = state.authError;
  var code = state.code || "";
  var boxEls = [];
  var boxes = h("div", { "class": "otp" }, [0, 1, 2, 3].map(function (i) {
    var filled = i < code.length;
    var active = i === code.length;
    var el = h("div", { "class": "otp__box" + (filled ? " otp__box--filled" : "") + (active && !err ? " otp__box--active" : "") + (err ? " otp__box--error" : "") }, filled ? code[i] : (active ? "" : ""));
    boxEls.push(el);
    return el;
  }));
  /* transparent overlay input drives the boxes without a full re-render */
  var input = h("input", { "class": "otp__input", inputmode: "numeric", maxlength: "4", value: code, "aria-label": "Verification code", autocomplete: "one-time-code" });
  input.addEventListener("input", function () {
    var v = input.value.replace(/\D/g, "").slice(0, 4);
    input.value = v; state.code = v;
    boxEls.forEach(function (el, i) {
      el.className = "otp__box" + (i < v.length ? " otp__box--filled" : "") + (i === v.length ? " otp__box--active" : "");
      el.textContent = i < v.length ? v[i] : "";
    });
  });
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") validateCode(); });

  return h("div", { "data-state": "auth-code" }, [
    h("div", { "class": "auth-back", "data-action": "auth.back" }, "\u2039 Back"),
    h("div", { style: "font-weight:800;font-size:22px;letter-spacing:-.02em" }, "Enter the code"),
    h("div", { style: "font-size:14px;color:var(--ink-2);margin:4px 0 22px" }, "We sent a 4-digit code to " + (state.phone ? "+1 " + state.phone : "+1 (555) \u2022\u2022\u2022-\u20220000") + "."),
    h("div", { "class": "otp-wrap" }, [boxes, input]),
    err ? h("div", { "class": "auth-error", "data-state": "validation-error", style: "margin-top:14px" }, err) : null,
    h("div", { style: "margin-top:22px" }, ActionButton({ variant: "btn--primary", label: "Verify & continue", action: "auth.verifyCode", block: true, lg: true, visualId: "verify-code" })),
    h("div", { style: "text-align:center;font-size:13px;color:var(--ink-2);margin-top:18px" }, ["Didn\u2019t get it? ", h("span", { style: "color:var(--accent);font-weight:600;cursor:pointer", "data-action": "auth.resend" }, "Resend")])
  ]);
}

/* placeholder for not-yet-built routes (keeps shell navigable) */
