// Progressive enhancement only. The page is fully functional without it:
// submission is a native form POST and both message regions are shown or hidden
// by core-auth substituting block|none into their inline display.
(function () {
  var input = document.getElementById("password");
  var toggle = document.querySelector("[data-password-toggle]");
  if (!input || !toggle) return;
  toggle.hidden = false;
  toggle.addEventListener("click", function () {
    var shown = toggle.getAttribute("aria-pressed") === "true";
    toggle.setAttribute("aria-pressed", shown ? "false" : "true");
    input.type = shown ? "password" : "text";
    input.focus();
  });
})();
