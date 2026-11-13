/* manual export source: public/src/seo-public.js */
document.documentElement.setAttribute("data-theme", "beauty");
document.documentElement.setAttribute("data-mode", "light");
var root = document.querySelector(".seo-manual-root #seo-public-root");

root.addEventListener("toggle", function (event) {
  var details = event.target;
  if (!details.matches || !details.matches('.seo-faq__item')) return;
  details.classList.toggle("is-open", details.open);
}, true);

document.documentElement.setAttribute("data-seo-enhanced", "true");
