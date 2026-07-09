// customer-portal/runtime/src/routes/LandingPage.js — production transfer module.
import { F } from "../../data/fixtures.js";
import { h } from "../dom.js";
import { activeProfile, state } from "../state.js";
import { ActionButton } from "../components/primitives/ActionButton.js";

export function Landing() {
  var v = F.themes[state.theme];
  var profile = activeProfile();
  var storm = profile.weatherCalendar;
  var page = h("section", { "class": "page", "data-route": "landing", "data-visual-id": "landing" });

  /* hero */
  var quoteCard = h("div", { "class": "landing-quote", "data-module": "quote-card", "data-visual-id": "quote-card" }, [
    h("div", { style: "font-weight:700;font-size:17px;margin-bottom:14px" }, storm ? "Protect your property this season" : "Get a quote in 30s"),
    h("div", { style: "display:flex;flex-direction:column;gap:10px" }, [
      quoteField("What do you need?", v.svc[0].name),
      quoteField("When?", storm ? "This season" : "Today"),
      h("div", { "class": "quote-addr", "data-action": profile.primary.action }, "Your address\u2026"),
      ActionButton({ variant: "btn--primary", label: storm ? "Get seasonal quote" : "See price & book", action: profile.primary.action, block: true, lg: true, visualId: "landing-quote-cta" }),
      h("div", { style: "text-align:center;font-size:11.5px;color:var(--ink-3)" }, "No card needed to get a quote")
    ])
  ]);
  page.appendChild(h("div", { "class": "landing-hero", "data-module": "landing-hero", "data-visual-id": "landing-hero" },
    h("div", { "class": "landing-hero__inner" }, [
      h("div", null, [
        h("span", { "class": "eyebrow landing-hero__badge", "data-bind": "hero.badge" }, v.hero.badge),
        h("h1", { "class": "landing-hero__title", "data-bind": "hero.title" }, v.hero.title),
        h("p", { "class": "landing-hero__sub", "data-bind": "hero.sub" }, v.hero.sub),
        h("div", { style: "display:flex;gap:11px;align-items:center;flex-wrap:wrap" }, [
          ActionButton({ variant: "btn--onaccent", label: "Sign in to portal", action: "auth.gotoSignin", lg: true, visualId: "hero-signin" }),
          ActionButton({ variant: "btn--glass-hero", label: storm ? "See plans" : "See pricing", action: "auth.gotoSignin", lg: true, visualId: "hero-pricing" })
        ]),
        h("div", { "class": "landing-social" }, [
          h("div", { "class": "avatar-stack" }, [
            h("div", { "class": "avatar-stack__a", style: "background:linear-gradient(160deg,#ffd27a,#ff9b6a)" }),
            h("div", { "class": "avatar-stack__a", style: "background:linear-gradient(160deg,#c7e0ff,#88b4ff)" }),
            h("div", { "class": "avatar-stack__a", style: "background:linear-gradient(160deg,#b7f5d0,#6fd99a)" })
          ]),
          h("div", { style: "font-size:13px;color:rgba(255,255,255,.85)" }, "\u2605 4.9 \u2014 loved by 12k customers")
        ])
      ]),
      quoteCard
    ])
  ));

  /* service teasers */
  var cat = v.svc.slice(0, 3);
  page.appendChild(h("div", { "class": "landing-services" }, cat.map(function (s, i) {
    var pal = F.PAL[i % 4];
    return h("div", { "class": "landing-svc", "data-module": "service-card", "data-visual-id": "landing-service-card", "data-action": profile.primary.action, "data-id": s.name }, [
      h("div", { "class": "landing-svc__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
      h("div", { style: "font-weight:700;font-size:16px" }, s.name),
      h("div", { style: "font-size:13px;color:var(--ink-2);margin-top:4px" }, "From " + s.price)
    ]);
  })));
  return page;
}

export function quoteField(label, value) {
  return h("div", { "class": "quote-field", "data-action": activeProfile().primary.action }, [
    label, h("span", { style: "font-weight:700;color:var(--ink)" }, value + " \u25be")
  ]);
}

export function pitchRow(dot, bg, text) {
  return h("div", { style: "display:flex;align-items:center;gap:12px" }, [
    h("div", { style: "width:34px;height:34px;border-radius:10px;background:" + bg + ";display:grid;place-items:center" }, h("i", { style: "width:12px;height:12px;border-radius:4px;background:" + dot + ";display:block" })),
    h("div", { style: "font-size:14px;color:var(--ink-2)" }, text)
  ]);
}
