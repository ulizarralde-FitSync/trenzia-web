// Página de un organismo: selector de convocatorias y calculadora (encargos
// web-01 y web-05).
//
// Solo pinta. La edad, qué baremo toca, los puntos, el apto y la nota los
// calcula TrenziaNota (nota.js, el código de la app), a través de TrenziaWeb
// (logica.js). La edad, la fecha de nacimiento y las marcas no salen del
// navegador ni se guardan.
(function () {
  "use strict";
  const N = TrenziaNota, W = TrenziaWeb, T = TrenziaTextos;
  const D = JSON.parse(document.getElementById("datos").textContent);
  const convs = D.organismo.convocatorias;
  const cat = D.pruebas_catalogo;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  let conv = W.convocatoriaPorDefecto(convs);
  let sexo = "M";
  let nacimiento = null, edadEscrita = null;
  const marcasTxt = {};

  // ── Selector de convocatorias ───────────────────────────────────────────────
  function eligeConvocatoria(i) {
    conv = i;
    document.querySelectorAll("[data-conv]").forEach((b) => b.setAttribute("aria-checked", String(Number(b.dataset.conv) === i)));
    document.querySelectorAll("[data-detalle]").forEach((s) => (s.hidden = Number(s.dataset.detalle) !== i));
    pintaCalculadora();
  }
  document.querySelectorAll("[data-conv]").forEach((b) => b.addEventListener("click", () => eligeConvocatoria(Number(b.dataset.conv))));

  // ── Edad ────────────────────────────────────────────────────────────────────
  function edadActual(c) {
    const ref = c.edad_referencia || {};
    if (ref.fecha) return W.edadEn(N, nacimiento, ref.fecha);
    return edadEscrita;
  }
  function pintaEdad(c) {
    const caja = $("edad-caja");
    if (!W.necesitaEdad(c)) { caja.innerHTML = ""; return; }
    const ref = c.edad_referencia || {};
    if (ref.fecha) {
      const sinConfirmar = ref.confirmada === false ? ` ${T.SIN_CONFIRMAR}.` : "";
      caja.innerHTML = `<div class="fecha-nac"><label for="nac">Fecha de nacimiento</label>
        <input id="nac" type="date" value="${esc(nacimiento ?? "")}" autocomplete="off">
        <span class="unidad" id="edad-dice"></span></div>
        <p class="nota-edad">Las marcas cambian según la edad que tengas el ${esc(T.fecha(ref.fecha))}.${esc(sinConfirmar)} Tu fecha no sale de este navegador.</p>`;
      $("nac").addEventListener("input", (e) => { nacimiento = e.target.value || null; pintaPruebas(); });
    } else {
      const cuando = T.cuando(ref.regla);
      caja.innerHTML = `<div class="fecha-nac"><label for="edad">¿Qué edad tendrás ${esc(cuando)}?</label>
        <input id="edad" inputmode="numeric" autocomplete="off" value="${esc(edadEscrita ?? "")}" style="max-width:90px"> <span class="unidad">años</span></div>
        <p class="nota-edad">Las bases cuentan la edad ${esc(cuando)} y todavía no tenemos esa fecha. No sale de este navegador.</p>`;
      $("edad").addEventListener("input", (e) => {
        const v = parseInt(e.target.value, 10);
        edadEscrita = Number.isFinite(v) && v > 0 && v < 120 ? v : null;
        pintaPruebas();
      });
    }
  }

  // ── Calculadora ─────────────────────────────────────────────────────────────
  function pintaCalculadora() {
    const c = convs[conv];
    $("calc").hidden = false;
    if (!W.tieneMarcas(c)) {
      $("calc-cuerpo").innerHTML = `<p class="msg">Esta convocatoria aún no tiene marcas cargadas.</p>`;
      $("edad-caja").innerHTML = "";
      $("total").hidden = true;
      return;
    }
    pintaEdad(c);
    pintaPruebas();
  }

  function pintaPruebas() {
    const c = convs[conv];
    if (!W.tieneMarcas(c)) return pintaCalculadora();
    const necesita = W.necesitaEdad(c);
    const edad = necesita ? edadActual(c) : null;
    if ($("edad-dice")) $("edad-dice").textContent = edad != null ? `${edad} años` : "";
    if (necesita && edad == null) {
      $("calc-cuerpo").innerHTML = `<p class="msg">Escribe tu ${c.edad_referencia && c.edad_referencia.fecha ? "fecha de nacimiento" : "edad"} para ver tus marcas.</p>`;
      $("total").hidden = true;
      return;
    }
    const res = W.puntuar(N, c, sexo, edad, {});
    if (res.pruebas.every((p) => !p.baremo)) {
      $("calc-cuerpo").innerHTML = `<p class="msg">Esta convocatoria no tiene marcas para ${sexo === "M" ? "hombres" : "mujeres"}${edad != null ? ` de ${edad} años` : ""}.</p>`;
      $("total").hidden = true;
      return;
    }
    $("calc-cuerpo").innerHTML = res.pruebas.map((p) => {
      const nombre = (cat[p.codigo] && cat[p.codigo].nombre) || p.codigo;
      if (!p.baremo) {
        return `<section class="prueba"><h3>${esc(nombre)}</h3><p class="msg">No hay marca para ${sexo === "M" ? "hombres" : "mujeres"}${edad != null ? ` de ${edad} años` : ""} en esta prueba.</p></section>`;
      }
      const b = p.baremo, uni = cat[p.codigo] && cat[p.codigo].unidad;
      const ayuda = b.metrica === "Time" ? "p. ej. 31,5 o 3:45" : b.metrica === "Periods" ? "p. ej. 9,5" : b.metrica === "Reps" ? "p. ej. 30" : "";
      return `<section class="prueba" aria-labelledby="t-${p.codigo}">
        <div class="prueba-cab"><h3 id="t-${p.codigo}">${esc(nombre)}</h3><span class="pts" id="pts-${p.codigo}"></span></div>
        <p class="cond">${esc(T.condicion(b, uni))}</p>
        <div class="entrada"><input id="in-${p.codigo}" inputmode="decimal" autocomplete="off" placeholder="${ayuda}" value="${esc(marcasTxt[p.codigo] ?? "")}" aria-label="Tu marca en ${esc(nombre)}, en ${esc(T.unidadCampo(b.metrica, uni))}" aria-describedby="msg-${p.codigo}"><span class="unidad">${esc(T.unidadCampo(b.metrica, uni))}</span></div>
        <div class="barra" aria-hidden="true"><i id="bar-${p.codigo}"></i></div>
        <p class="msg" id="msg-${p.codigo}" aria-live="polite"></p>
      </section>`;
    }).join("");
    res.pruebas.forEach((p) => {
      const i = $("in-" + p.codigo);
      if (i) i.addEventListener("input", (e) => { marcasTxt[p.codigo] = e.target.value; calcula(); });
    });
    calcula();
  }

  const faltan = (x, met, uni) => `${x === 1 ? "Te falta" : "Te faltan"} ${T.cantidad(x, met, uni)}`;

  function mensaje(p, marcaTxt) {
    const b = p.baremo, met = b.metrica, uni = cat[p.codigo] && cat[p.codigo].unidad;
    if (marcaTxt && Number.isNaN(p.marcaLeida)) {
      return { cls: "msg no", txt: met === "Reps" ? "Escribe un número entero de repeticiones." : met === "Periods" ? "Escribe los periodos en medios (9 o 9,5)." : met === "Time" ? "Escribe segundos (31,5) o minutos y segundos (3:45)." : "Escribe solo el número." };
    }
    const q = W.queFalta(p);
    if (!q) return { cls: "msg", txt: "Escribe tu marca." };
    if (!q.apto) return { cls: "msg no", txt: `No apto. ${faltan(q.falta, met, uni)} para el apto.` };
    if (q.maximo) return { cls: "msg ok", txt: "Apto con la nota máxima." };
    if (q.falta != null) return { cls: "msg ok", txt: `Apto. Con ${T.cantidad(q.falta, met, uni)} ${q.up ? "más" : "menos"} subes a ${T.num(q.puntos)} puntos.` };
    return { cls: "msg ok", txt: "Apto." };
  }

  function calcula() {
    const c = convs[conv];
    const edad = W.necesitaEdad(c) ? edadActual(c) : null;
    const marcas = {}, leidas = {};
    for (const p of c.pruebas) {
      const b = p.baremos[0];
      const v = W.leeMarca(marcasTxt[p.codigo], b && b.metrica);
      leidas[p.codigo] = v;
      marcas[p.codigo] = Number.isNaN(v) ? null : v;
    }
    const res = W.puntuar(N, c, sexo, edad, marcas);
    for (const p of res.pruebas) {
      if (!p.baremo) continue;
      p.marcaLeida = leidas[p.codigo];
      const ptsEl = $("pts-" + p.codigo), bar = $("bar-" + p.codigo), msg = $("msg-" + p.codigo);
      if (!p.soloApto && res.modelo === "points") {
        ptsEl.innerHTML = `${p.puntos == null ? "–" : T.num(p.puntos)}<small> / ${T.num(p.puntosMax)}</small>`;
        const span = p.puntosMax - (p.puntosMin ?? 0);
        bar.style.width = p.r.is_apto && p.puntos != null && span > 0 ? `${Math.max(4, ((p.puntos - p.puntosMin) / span) * 100)}%` : "0";
      } else {
        ptsEl.textContent = p.r.label === "Sin marca" ? "–" : p.r.is_apto ? "Apto" : "No apto";
        bar.style.width = p.r.is_apto ? "100%" : "0";
      }
      const m = mensaje(p, marcasTxt[p.codigo]);
      msg.className = m.cls;
      msg.textContent = m.txt;
    }
    pintaTotal(c, res);
  }

  function pintaTotal(c, res) {
    const n = res.nota, regla = c.nota.regla_global;
    $("total").hidden = false;
    if (res.modelo === "points") {
      const etiqueta = n.tipo === "media" ? "Tu media" : "Tu nota";
      $("total-titulo").textContent = etiqueta;
      $("tot").innerHTML = `${n.valor == null ? "–" : T.num(n.valor)}<small> / ${T.num(n.maximo)}</small>`;
    } else {
      $("total-titulo").textContent = "Pruebas aptas";
      $("tot").innerHTML = `${n.aptas}<small> de ${n.total}</small>`;
    }
    const li = [];
    if (regla && regla.min_por_prueba != null) {
      li.push(`<li class="${n.porDebajo.length ? "no" : n.completas ? "ok" : ""}">Al menos ${T.num(regla.min_por_prueba)} puntos en cada prueba</li>`);
    }
    if (regla && regla.min_total != null) {
      const cls = n.porDebajo.length ? "" : !n.completas ? "" : n.apto ? "ok" : "no";
      const falta = n.valor != null && n.faltan > 0 ? ` (te faltan ${T.num(n.faltan)})` : "";
      li.push(`<li class="${cls}">${n.tipo === "media" ? "Media" : "Total"} de al menos ${T.num(regla.min_total)}${falta}</li>`);
    }
    if (res.pruebas.some((p) => p.baremo && p.soloApto && res.modelo === "points")) {
      li.push(`<li class="${n.porDebajo.length ? "no" : n.completas ? "ok" : ""}">Apto en las pruebas que no dan puntos</li>`);
    }
    if (!regla || res.modelo !== "points") li.push(`<li class="${!n.completas ? "" : n.apto ? "ok" : "no"}">Apto en todas las pruebas</li>`);
    $("regla").innerHTML = li.join("");
    $("veredicto").textContent = n.faltanBaremos ? "No podemos decirte si apruebas: alguna prueba no tiene marca para tu sexo o tu edad."
      : n.apto === true ? "Con estas marcas aprobarías las pruebas físicas."
      : n.apto === false ? "Con estas marcas no aprobarías las pruebas físicas."
      : `Escribe tus marcas en las ${n.total} pruebas para saber si apruebas.`;
  }

  document.querySelectorAll("[data-sexo]").forEach((b) => b.addEventListener("click", () => {
    sexo = b.dataset.sexo;
    document.querySelectorAll("[data-sexo]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    pintaPruebas();
  }));

  eligeConvocatoria(conv);
})();
