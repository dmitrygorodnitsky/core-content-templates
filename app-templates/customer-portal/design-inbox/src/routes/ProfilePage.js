// customer-portal-design/src/routes/ProfilePage.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../../data/fixtures.js";
import { h } from "../dom.js";
import { cmdPhase, currentContact, state } from "../state.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { Tabs } from "../components/primitives/Tabs.js";
import { Toggle } from "../components/primitives/Toggle.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { InlineFailure, routeStateBody, skel } from "../components/primitives/RouteStates.js";
import { OrderCard } from "../components/orders/OrderCard.js";
import { statCard } from "../components/profile/StatCard.js";

/* wave 13 — contact-details editor: field validation → saving → server-confirmed
   readback or explicit save failure. Values shown are the last server-confirmed
   ones (currentContact) until a save is confirmed — never an optimistic claim. */
function ContactPanel() {
  var cKey = "profile.saveContact:contact";
  var cPhase = cmdPhase(cKey);
  var saved = currentContact();
  var draft = state.contactDraft || saved;
  var errs = state.contactErrors || {};
  var panelState = cPhase === "pending" ? "saving" : cPhase === "failed" ? "save-failed" : (errs.phone || errs.email) ? "invalid" : "idle";

  function fieldRow(label, key, bind, type) {
    var input = h("input", { "class": "field", type: type || "text", value: draft[key] || "", "aria-label": label, "data-bind": bind, "data-state": errs[key] ? "invalid" : undefined, disabled: cPhase === "pending" ? true : undefined });
    input.addEventListener("input", function () { state.contactDraft = Object.assign({}, state.contactDraft || saved); state.contactDraft[key] = input.value; }); /* no re-render: preserve focus */
    return h("div", { "class": "field-row" }, [
      h("span", { "class": "field-label" }, label),
      input,
      errs[key] ? h("div", { "class": "field-error", role: "alert" }, errs[key]) : null
    ]);
  }

  return h("div", { "class": "list-panel", "data-module": "contact-details", "data-visual-id": "contact-details", "data-state": panelState }, [
    h("div", { "class": "list-panel__head" }, [
      h("div", { "class": "list-panel__title", style: "flex:1" }, "Contact details"),
      cPhase === "pending" ? h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, "Saving\u2026") : null
    ]),
    h("div", { "class": "contact-form" }, [
      fieldRow("Phone", "phone", "customer.phone", "tel"),
      fieldRow("Email", "email", "customer.email", "email")
    ]),
    cPhase === "failed" ? h("div", { style: "margin-top:12px" }, InlineFailure({ msg: "Your changes weren\u2019t saved \u2014 the details on file are unchanged.", retryAction: "profile.saveContact", retryLabel: "Retry save" })) : null,
    h("div", { style: "margin-top:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap" }, [
      ActionButton({ variant: "btn--primary", label: "Save changes", action: "profile.saveContact", visualId: "save-contact", pending: cPhase === "pending", pendingLabel: "Saving\u2026" }),
      h("span", { style: "font-size:12px;color:var(--ink-3)" }, "Changes apply only once the server confirms them.")
    ])
  ]);
}

export function Profile() {
  var v = F.themes[state.theme];
  var c = F.customer;
  var page = h("section", { "class": "page page--narrow", "data-route": "profile", "data-state": state.view, "data-visual-id": "profile" });

  /* wave 13 — profile is customer-scoped (contact fields, addresses, PSP
     references): none of it renders while unresolved/failed/unauthorized */
  var gate = routeStateBody({
    states: ["loading", "error", "unauthorized"],
    skeleton: function () {
      return h("div", { "data-state": "loading", "aria-busy": "true" }, [
        skel("height:120px;border-radius:22px;margin-bottom:16px"),
        h("div", { "class": "stats-grid" }, [skel("height:86px;border-radius:16px"), skel("height:86px;border-radius:16px"), skel("height:86px;border-radius:16px")]),
        skel("height:280px;border-radius:22px;margin-top:16px")
      ]);
    },
    error: { title: "Couldn\u2019t load your profile", desc: "Your contact details, addresses and payment references didn\u2019t load. Nothing was changed \u2014 try again.", retryId: "profile" },
    scope: "your profile"
  });
  if (gate) { page.appendChild(gate); return page; }

  var contact = currentContact();

  /* hero */
  page.appendChild(h("div", { "class": "profile-hero", "data-module": "profile-hero", "data-visual-id": "profile-hero" }, [
    h("div", { "class": "profile-hero__avatar" }),
    h("div", { style: "flex:1" }, [
      h("div", { "class": "profile-hero__name", "data-bind": "customer.fullName" }, c.fullName),
      h("div", { "class": "profile-hero__meta", "data-bind": "customer.phone customer.email" }, contact.phone + " \u00b7 " + contact.email),
      h("span", { "class": "profile-hero__badge" }, v.plan.name + " member \u00b7 since " + c.memberSince)
    ]),
    ActionButton({ variant: "btn--onaccent", label: "Manage plan", action: "profile.managePlan", visualId: "manage-plan" })
  ]));

  /* stats */
  page.appendChild(h("div", { "class": "stats-grid", "data-module": "profile-stats" }, [
    statCard("Orders", c.stats.orders, null),
    statCard("Spent this year", c.stats.spent, null),
    statCard("Plan savings", c.stats.savings, "var(--ok)")
  ]));

  /* contact details (wave 13) */
  page.appendChild(ContactPanel());

  /* order history */
  var history = state.profileFilter === "all" ? state.orders : state.orders.filter(function (o) { return o.status === state.profileFilter; });
  var hist = h("div", { "class": "list-panel", "data-module": "order-list", "data-visual-id": "profile-history" }, [
    h("div", { "class": "list-panel__head" }, [
      h("div", { "class": "list-panel__title", style: "margin-right:4px" }, "Order history"),
      Tabs({ items: [
        { key: "all", label: "All" }, { key: "inprogress", label: "Active" },
        { key: "scheduled", label: "Scheduled" }, { key: "completed", label: "Done" }
      ], active: state.profileFilter, action: "profile.filter" })
    ])
  ]);
  var histList = h("div", { style: "display:flex;flex-direction:column" });
  if (history.length === 0) histList.appendChild(EmptyState({ glyph: "\ud83d\uddd3", title: "Nothing here", desc: "No orders in this filter." }));
  else history.forEach(function (o) { histList.appendChild(OrderCard(o)); });
  hist.appendChild(histList);
  page.appendChild(hist);

  /* saved addresses */
  var addrPanel = h("div", { "class": "list-panel" }, [
    h("div", { "class": "list-panel__head" }, [
      h("div", { "class": "list-panel__title", style: "flex:1" }, "Saved addresses"),
      h("div", { "class": "link-action", "data-action": "profile.addAddress" }, "+ Add address")
    ])
  ]);
  var addrList = h("div", { style: "display:flex;flex-direction:column;gap:10px" });
  F.addresses.forEach(function (a) {
    var isDefault = a.id === state.addrId;
    addrList.appendChild(h("div", { "class": "saved-row", "data-module": "address-card", "data-visual-id": "profile-address" }, [
      h("div", { "class": "saved-row__icon", style: "background:" + a.iconBg }, h("i", { style: "background:" + a.dot })),
      h("div", { "class": "saved-row__body" }, [
        h("div", { style: "display:flex;align-items:center;gap:8px" }, [
          h("div", { style: "font-weight:600;font-size:14px" }, a.label),
          isDefault ? h("span", { "class": "default-tag" }, "Default") : null
        ]),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, a.line + " \u00b7 " + a.city)
      ]),
      isDefault
        ? h("div", { "class": "link-action", style: "color:var(--ink-3)", "data-action": "profile.updateAddress", "data-id": a.id }, "Edit")
        : h("div", { "class": "link-action", "data-action": "profile.setDefaultAddress", "data-id": a.id }, "Make default")
    ]));
  });
  addrPanel.appendChild(addrList);
  page.appendChild(addrPanel);

  /* payment methods */
  var payPanel = h("div", { "class": "list-panel" }, [
    h("div", { "class": "list-panel__head" }, [
      h("div", { "class": "list-panel__title", style: "flex:1" }, "Payment methods"),
      h("div", { "class": "link-action", "data-action": "profile.addCard" }, "+ Add card")
    ])
  ]);
  var payList = h("div", { style: "display:flex;flex-direction:column;gap:10px" });
  F.cards.forEach(function (cd) {
    var isDefault = cd.id === state.payId;
    payList.appendChild(h("div", { "class": "saved-row", "data-module": "payment-method-card", "data-visual-id": "profile-card" }, [
      h("div", { "class": "card-chip card-chip--lg" }),
      h("div", { "class": "saved-row__body" }, [
        h("div", { style: "display:flex;align-items:center;gap:8px" }, [
          h("div", { style: "font-weight:600;font-size:14px" }, cd.brand + " \u00b7\u00b7\u00b7\u00b7 " + cd.last4),
          isDefault ? h("span", { "class": "default-tag" }, "Default") : null
        ]),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, "Expires " + cd.exp)
      ]),
      isDefault ? null : h("div", { "class": "link-action", "data-action": "profile.setDefaultPayment", "data-id": cd.id }, "Make default")
    ]));
  });
  payPanel.appendChild(payList);
  page.appendChild(payPanel);

  /* preferences */
  var prefs = [
    { key: "receipts", title: "Email receipts", desc: "Invoice & payment confirmations" },
    { key: "sms", title: "SMS technician updates", desc: "Live ETA & arrival alerts" },
    { key: "marketing", title: "Offers & tips", desc: "Seasonal deals and home care tips" }
  ];
  var prefPanel = h("div", { "class": "list-panel", "data-module": "preferences" }, [h("div", { "class": "list-panel__title", style: "margin-bottom:16px" }, "Notifications")]);
  prefs.forEach(function (p) {
    prefPanel.appendChild(h("div", { "class": "pref-row" }, [
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:600;font-size:14px" }, p.title),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, p.desc)
      ]),
      Toggle(state.prefs[p.key], p.key)
    ]));
  });
  page.appendChild(prefPanel);

  page.appendChild(h("div", { "class": "signout-btn", "data-action": "auth.signOut", "data-visual-id": "sign-out" }, "Sign out"));
  return page;
}
