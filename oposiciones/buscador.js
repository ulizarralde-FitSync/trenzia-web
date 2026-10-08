// Buscador de /oposiciones/ (encargo web-01). La lista ya está escrita en el
// HTML (se lee sin JavaScript); aquí solo se filtra. Sin red ni almacenamiento.
(function () {
  "use strict";
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const q = document.getElementById("q");
  const tarjetas = [...document.querySelectorAll("[data-buscar]")];
  let fTipo = "todas", fEstado = "todas";

  function pasaEstado(t) {
    const est = (t.dataset.estados || "").split(" ").filter(Boolean);
    if (fEstado === "todas") return true;
    if (fEstado === "cerrada") return est.length > 0 && est.every((e) => e === "cerrada");
    return est.includes(fEstado);
  }

  function pinta() {
    const palabras = norm(q.value.trim()).split(/\s+/).filter(Boolean);
    let vistas = 0;
    for (const t of tarjetas) {
      const ok = (fTipo === "todas" || t.dataset.tipo === fTipo) && pasaEstado(t) &&
        palabras.every((w) => t.dataset.buscar.includes(w));
      t.hidden = !ok;
      if (ok) vistas++;
    }
    // Los títulos de grupo y comunidad se esconden si se quedan sin tarjetas.
    document.querySelectorAll("[data-grupo]").forEach((g) => {
      g.hidden = !g.querySelector("[data-buscar]:not([hidden])");
    });
    document.getElementById("vacio").hidden = vistas > 0;
  }

  function chips(atributo, alElegir) {
    document.querySelectorAll(`[${atributo}]`).forEach((b) => b.addEventListener("click", () => {
      document.querySelectorAll(`[${atributo}]`).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      alElegir(b.getAttribute(atributo));
      pinta();
    }));
  }
  chips("data-f-tipo", (v) => (fTipo = v));
  chips("data-f-estado", (v) => (fEstado = v));
  q.addEventListener("input", pinta);
  document.getElementById("filtros").hidden = false;
  pinta();
})();
