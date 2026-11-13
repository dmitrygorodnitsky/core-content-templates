var root = document.getElementById("seo-public-root");

root.addEventListener("toggle", function (event) {
  var details = event.target;
  if (!details.matches || !details.matches('.seo-faq__item')) return;
  details.classList.toggle("is-open", details.open);
}, true);

document.documentElement.setAttribute("data-seo-enhanced", "true");
