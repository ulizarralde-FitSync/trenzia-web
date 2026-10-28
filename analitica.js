/*
 * Estadísticas de la web, sin cookies (encargo web-52; privacidad 1.12, apartado 3.5).
 *
 * Las páginas apuntan sus eventos en una cola, window.trz, con
 *   (window.trz = window.trz || []).push(["nombre", { propiedades }]);
 * y este script los manda a PostHog (UE) cuando la página ya ha cargado. Si no
 * carga (bloqueador, sin red), la cola se queda en memoria y la web funciona igual.
 *
 * - Sin cookies, sin localStorage ni sessionStorage: cookieless_mode "always" y
 *   persistencia en memoria. PostHog cuenta las visitas con un hash diario en su servidor.
 * - Sin perfiles de persona, sin autocapture, sin grabación, encuestas, heatmaps ni flags.
 * - Nada personal: solo códigos y números. La URL va sin query, salvo ref y utm_*.
 * - Con «No rastrear» o Global Privacy Control, no se carga nada.
 * - Solo en trenzia.es: en local o en una vista previa no sale nada.
 *
 * Lo cargan la portada, probar y /oposiciones/. Las páginas con token
 * (probar-confirmar, probar-gestionar, opinion), la 404 y los legales, no.
 */
(function () {
  "use strict";
  var cola = (window.trz = window.trz || []);
  if (location.hostname !== "trenzia.es") return;
  if (navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true) return;

  // La clave del proyecto de PostHog es pública por diseño (la misma que la app).
  var CLAVE = "phc_yRTtga2LAWvUN36LqptvYWZK4M4sUm7QMctCectn5o5i";
  var ref = new URLSearchParams(location.search).get("ref");
  if (!ref || !/^[a-z0-9-]{1,40}$/.test(ref)) ref = null;

  // La URL sin query, salvo ref y utm_*, y sin hash.
  function limpiaUrl(s) {
    try {
      var u = new URL(s), q = new URLSearchParams();
      u.searchParams.forEach(function (v, k) { if (k === "ref" || /^utm_[a-z_]+$/.test(k)) q.append(k, v); });
      var qs = q.toString();
      return u.origin + u.pathname + (qs ? "?" + qs : "");
    } catch (e) { return null; }
  }
  // De la página de la que se llega, solo el sitio y la ruta.
  function limpiaReferrer(s) {
    try { var u = new URL(s); return u.origin + u.pathname; } catch (e) { return s === "$direct" ? s : null; }
  }
  function antesDeEnviar(ev) {
    var p = ev && ev.properties;
    if (p) {
      ["$current_url", "$initial_current_url"].forEach(function (k) { if (p[k]) p[k] = limpiaUrl(p[k]); });
      ["$referrer", "$initial_referrer"].forEach(function (k) { if (p[k]) p[k] = limpiaReferrer(p[k]); });
    }
    return ev;
  }

  function enviar(ph, e) {
    if (!e || typeof e[0] !== "string") return;
    // Un clic que lleva a otra página: el evento sale aunque la página se vaya.
    ph.capture(e[0], e[1] || {}, e[0] === "clic_probar" ? { transport: "sendBeacon" } : undefined);
  }

  // Clics en cualquier enlace a probar.html. La portada marca los suyos con data-origen.
  document.addEventListener("click", function (ev) {
    var a = ev.target && ev.target.closest && ev.target.closest("a[href]");
    if (!a) return;
    var u;
    try { u = new URL(a.getAttribute("href"), location.href); } catch (e) { return; }
    if (u.origin !== location.origin || !/^\/probar(\.html)?$/.test(u.pathname) || /^\/probar(\.html)?$/.test(location.pathname)) return;
    var datos = document.getElementById("datos"), props = {};
    if (a.dataset.origen) props.origen = a.dataset.origen;
    else if (datos) props.origen = "ficha";
    else if (/^\/oposiciones\/(index\.html)?$/.test(location.pathname)) props.origen = "indice";
    else props.origen = "otro";
    if (datos) { try { props.organismo = JSON.parse(datos.textContent).organismo.codigo; } catch (e) { /* sin organismo */ } }
    cola.push(["clic_probar", props]);
  }, true);

  function cargar() {
    var s = document.createElement("script");
    s.src = "https://eu-assets.i.posthog.com/static/array.js";
    s.async = true;
    s.onload = function () {
      var ph = window.posthog;
      if (!ph || typeof ph.init !== "function") return;
      ph.init(CLAVE, {
        api_host: "https://eu.i.posthog.com",
        ui_host: "https://eu.posthog.com",
        cookieless_mode: "always",
        persistence: "memory",
        person_profiles: "never",
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_dead_clicks: false,
        rageclick: false,
        enable_heatmaps: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_web_experiments: true,
        advanced_disable_feature_flags: true,
        disable_compression: true,
        before_send: antesDeEnviar,
        loaded: function (ph) {
          ph.register(ref ? { canal: "web", ref: ref } : { canal: "web" });
          ph.capture("$pageview");
          // Lo que se apuntó antes de cargar, y desde ahora, directo.
          for (var i = 0; i < cola.length; i++) enviar(ph, cola[i]);
          cola.length = 0;
          cola.push = function (e) { enviar(ph, e); return 0; };
        },
      });
    };
    s.onerror = function () { /* bloqueado o sin red: la web sigue igual */ };
    document.head.appendChild(s);
  }
  // Después de load y, si el navegador lo permite, cuando quede ocioso: no compite con la página.
  function cuandoOcioso() {
    if (window.requestIdleCallback) window.requestIdleCallback(cargar, { timeout: 3000 });
    else setTimeout(cargar, 0);
  }
  if (document.readyState === "complete") cuandoOcioso();
  else window.addEventListener("load", cuandoOcioso);
})();
