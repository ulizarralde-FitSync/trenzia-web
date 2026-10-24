/*
 * El ?ref= de una campaña, de enlace en enlace (encargo web-37).
 *
 * Quien llega con ?ref=X a la portada, a probar o a /oposiciones/ lo lleva en los
 * enlaces a esas mismas páginas, para que el alta en probar salga atribuida a X.
 * Solo por la URL y solo durante la visita: sin cookies ni almacenamiento en el
 * navegador, que necesitarían consentimiento. Sin ?ref= válido, no toca nada.
 *
 * Lo publica el generador en /oposiciones/ref.js y lo cargan también las páginas
 * de la raíz (index, 404, opinion, probar).
 */
(function () {
  var ref = new URLSearchParams(location.search).get("ref");
  // Solo [a-z0-9-] y hasta 40: lo demás se ignora, nunca se pega tal cual.
  if (!ref || !/^[a-z0-9-]{1,40}$/.test(ref)) return;
  // La portada, probar y /oposiciones/ (índice y fichas). Los legales, probar-confirmar y probar-gestionar, no.
  var DESTINOS = /^\/(index\.html|probar(\.html)?|oposiciones\/([a-z0-9-]+\.html)?)?$/;
  var enlaces = document.querySelectorAll("a[href]");
  for (var i = 0; i < enlaces.length; i++) {
    var a = enlaces[i];
    var u;
    try { u = new URL(a.getAttribute("href"), location.href); } catch (e) { continue; }
    if (u.origin !== location.origin || !DESTINOS.test(u.pathname) || u.searchParams.has("ref")) continue;
    u.searchParams.set("ref", ref);
    a.setAttribute("href", u.pathname + u.search + u.hash);
  }
})();
