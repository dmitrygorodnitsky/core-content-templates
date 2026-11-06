// customer-portal-design/src/routes/SpaProfilePage.js — Wave 16: the Calm
// Harbor Profile (route profile, Beauty only — other verticals keep the
// accepted generic Profile). LEAST DATA BY DESIGN: this subsection shows and
// edits ONLY what the scoped API returns — phone, email and the explicitly
// approved communication/appointment preferences. No spend, savings, order
// stats, addresses, saved cards, plan claims, member-since claims, raw ids,
// roles, permissions or organization render anywhere on this page.
// Values are ALWAYS the last server-confirmed readback until a save succeeds;
// a failed save keeps the old confirmed values; a version conflict blocks
// further edits until an explicit reload (profile.reload). Save is the
// entity-scoped command profile.save:profile (pending | failed | conflict |
// session-lost). profile.saveContact remains a preserved ALIAS with its
// legacy generic-panel meaning — it is not used here.
import { h } from "../dom.js";
import { F } from "../../data/fixtures.js";
import { ACTIONS } from "../actions.js";
import { cmdPhase, spaCapability, spaProfileValues, state } from "../state.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { InlineFailure, skel } from "../components/primitives/RouteStates.js";
import { spaGate } from "../components/spa/CommerceBits.js";

function isDirty(d, v) {
  if (d.phone !== v.phone || d.email !== v.email) return true;
  return Object.keys(d.prefs).some(function (k) { return d.prefs[k] !== v.prefs[k]; });
}

export function SpaProfile() {
  var live = state.config.dataMode === "live";
  var view = live ? (state.moduleStatus.profile || "loading") : state.view;
  var page = h("section", { "class": "page page--narrow", "data-route": "profile", "data-state": view, "data-visual-id": "spa-profile", "data-module": "spa-profile", "data-capability": spaCapability(), "data-screen-label": "Profile (Calm Harbor)" });
  page.appendChild(h("div", { "class": "detail-back" }, h("span", { "class": "link-action", "data-action": "account.open" }, "\u2039 Account")));
  page.appendChild(PageHeader({ title: "Profile", sub: live ? "Your email from Core. Phone and preferences are not exposed by the current API." : "Your contact details and preferences \u2014 nothing else is stored here." }));

  var gate = spaGate({
    view: view,
    states: ["loading", "error", "unauthorized"],
    skeleton: function () {
      return h("div", { "data-state": "loading", "aria-busy": "true" }, [
        skel("height:210px;border-radius:22px"),
        skel("height:160px;border-radius:22px;margin-top:16px")
      ]);
    },
    error: { title: "Couldn\u2019t load your profile", desc: "Your details didn\u2019t load, so nothing is shown \u2014 we never show stale or guessed values. Nothing was changed; try again.", retryId: "profile" },
    scope: "your profile", backRoute: "account",
    unavailable: { title: "Profile isn\u2019t available yet", desc: "Profile editing isn\u2019t connected on this portal yet \u2014 our team can update your details for you." }
  });
  if (gate) { page.appendChild(gate); return page; }

  var confirmed = spaProfileValues();
  var draft = state.spaProfileDraft;
  var errs = state.spaProfileErrors || {};
  var phase = cmdPhase("profile.save:profile");
  var conflict = phase === "conflict";
  var saving = phase === "pending";
  var editing = !!draft;
  var dirty = editing && isDirty(draft, confirmed);
  var panelState = conflict ? "conflict" : saving ? "saving" : phase === "failed" ? "save-failed" : (errs.phone || errs.email) ? "invalid" : editing ? (dirty ? "dirty" : "unchanged") : "ready";
  var canEdit = live ? confirmed.allowedActions.indexOf("edit-email") !== -1 : F.spaProfileSrv.allowedActions.indexOf("edit") !== -1;

  /* ---- contact details ---- */
  var panel = h("div", { "class": "list-panel", "data-module": "spa-profile-contact", "data-visual-id": "spa-profile-contact", "data-state": panelState, "data-profile-version": live ? undefined : F.spaProfileSrv.version }, [
    h("div", { "class": "list-panel__head" }, [
      h("div", { "class": "list-panel__title", style: "flex:1" }, "Contact details"),
      saving ? h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, "Saving\u2026") : null,
      editing && !saving && !conflict ? h("span", { "class": "readonly-chip", "data-dirty-chip": "true", "data-state": dirty ? "dirty" : "unchanged" }, dirty ? "Unsaved changes" : "No changes yet") : null
    ])
  ]);

  if (conflict) {
    panel.appendChild(h("div", { "class": "conflict-banner", "data-module": "conflict-banner", "data-visual-id": "profile-conflict", "data-state": "conflict", role: "alert" }, [
      h("div", { "class": "conflict-banner__icon" }, "\u21ba"),
      h("div", { "class": "conflict-banner__body" }, [
        h("div", { style: "font-weight:700;font-size:13.5px" }, "Your profile changed since you opened it"),
        h("div", { style: "font-size:12.5px;line-height:1.45;color:var(--ink-2);margin-top:2px" }, "Nothing was saved. Reload the latest details and review them before editing again.")
      ]),
      ActionButton({ variant: "btn--primary", label: "Reload profile", action: "profile.reload", visualId: "profile-conflict-reload" })
    ]));
  }

  if (!editing) {
    /* READ — the last server-confirmed values, nothing optimistic */
    var ro = h("div", { "class": "appt-details" });
    if (confirmed.phone != null) ro.appendChild(h("div", { "class": "appt-details__row" }, [h("div", { "class": "appt-details__label" }, "Phone"), h("div", { "class": "appt-details__val" }, h("b", { "data-bind": "profile.phone" }, confirmed.phone))]));
    ro.appendChild(h("div", { "class": "appt-details__row" }, [h("div", { "class": "appt-details__label" }, "Email"), h("div", { "class": "appt-details__val" }, h("b", { "data-bind": "profile.email" }, confirmed.email))]));
    panel.appendChild(ro);
    if (canEdit) panel.appendChild(h("div", { style: "margin-top:14px" }, ActionButton({ variant: "btn--ghost", label: "Edit details", action: "profile.edit", visualId: "profile-edit" })));
  } else {
    /* EDIT — draft buffer; confirmed values stay untouched until the readback */
    var form = h("div", { "class": "contact-form" });
    (live ? [["Email", "email", "email"]] : [["Phone", "phone", "tel"], ["Email", "email", "email"]]).forEach(function (fd) {
      var label = fd[0], key = fd[1], type = fd[2];
      var input = h("input", { "class": "field", type: type, value: draft[key] || "", "aria-label": label, "data-action": "profile.changeField", "data-field": key, "data-bind": "profile." + key, "data-state": errs[key] ? "invalid" : undefined, disabled: (saving || conflict) ? true : undefined, "aria-invalid": errs[key] ? "true" : undefined, "aria-describedby": errs[key] ? "profile-err-" + key : undefined });
      input.addEventListener("input", function () {
        ACTIONS["profile.changeField"](key + "|" + input.value); /* input-event hook — no re-render (focus preserved) */
        var chip = page.querySelector("[data-dirty-chip]");
        if (chip) {
          var d2 = state.spaProfileDraft, dr = d2 && isDirty(d2, spaProfileValues());
          chip.textContent = dr ? "Unsaved changes" : "No changes yet";
          chip.setAttribute("data-state", dr ? "dirty" : "unchanged");
        }
      });
      form.appendChild(h("div", { "class": "field-row" }, [
        h("span", { "class": "field-label" }, label),
        input,
        errs[key] ? h("div", { "class": "field-error", id: "profile-err-" + key, role: "alert" }, errs[key]) : null
      ]));
    });
    panel.appendChild(form);

    if (phase === "failed") panel.appendChild(h("div", { style: "margin-top:12px" }, InlineFailure({
      msg: "Your changes weren\u2019t saved \u2014 the details on file are unchanged.",
      retryAction: "profile.save", retryLabel: "Retry save"
    })));

    panel.appendChild(h("div", { style: "margin-top:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap" }, [
      ActionButton({ variant: "btn--primary", label: "Save changes", action: "profile.save", visualId: "profile-save", pending: saving, pendingLabel: "Saving\u2026", disabled: conflict }),
      ActionButton({ variant: "btn--ghost", label: "Discard", action: "profile.reload", visualId: "profile-discard", disabled: saving }),
      h("span", { style: "font-size:12px;color:var(--ink-3)" }, "Changes apply only once the studio\u2019s system confirms them.")
    ]));
  }
  page.appendChild(panel);

  /* ---- approved preferences (scoped API list — never invented) ---- */
  if (!live) {
  var prefsPanel = h("div", { "class": "list-panel", "data-module": "spa-profile-preferences", "data-visual-id": "spa-profile-preferences", "data-state": editing ? "editing" : "ready" }, [
    h("div", { "class": "list-panel__head" }, [
      h("div", { "class": "list-panel__title", style: "flex:1" }, "Preferences"),
      h("span", { style: "font-size:12px;color:var(--ink-3)" }, "about your visits only")
    ])
  ]);
  F.spaProfileSrv.preferences.forEach(function (p) {
    var val = editing ? draft.prefs[p.key] : confirmed.prefs[p.key];
    prefsPanel.appendChild(h("div", { "class": "pref-row", "data-module": "profile-preference", "data-visual-id": "profile-preference", "data-pref-key": p.key, "data-state": val ? "on" : "off" }, [
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:600;font-size:14px", "data-bind": "profile.preferences[].label" }, p.label),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, p.desc)
      ]),
      editing
        ? h("div", { "class": "toggle" + (val ? " toggle--on" : ""), "data-action": "profile.changeField", "data-id": "pref:" + p.key, role: "switch", "aria-checked": val ? "true" : "false", "aria-label": p.label, disabled: (saving || conflict) ? true : undefined, "data-state": val ? "on" : "off" }, h("div", { "class": "toggle__knob" }))
        : h("span", { "class": "readonly-chip", "data-bind": "profile.preferences[].value" }, val ? "On" : "Off")
    ]));
  });
  if (!editing) prefsPanel.appendChild(h("div", { "class": "purch-ful__note", style: "margin-top:10px" }, "Use Edit details above to change these."));
  page.appendChild(prefsPanel);
  } else {
    page.appendChild(h("div", { "class": "purch-ful__note", "data-state": "unavailable" }, "Phone and visit preferences are not returned by the current Core User API, so this portal does not show or edit them."));
  }

  page.appendChild(h("div", { "class": "catalog-note" }, live ? "The email above is read from the signed-in Core User and saved back only after Core confirms it." : "This page holds only your contact details and the preferences above \u2014 exactly as the studio\u2019s system returns them."));
  return page;
}
