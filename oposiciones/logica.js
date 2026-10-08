// Lógica de la web para el buscador y la calculadora (encargos web-05 y web-06, 08/10/2026).
//
// Todo el cálculo es de nota.js (TrenziaNota), el código de la app, sin tocar:
// traducir la convocatoria (datosDeMotor), elegir baremo y tabla por sexo y
// edad y puntuar cada prueba (puntuarPrueba, elegirTramos), la nota de toda la
// convocatoria con su regla y el veredicto (notaDeConvocatoria), la edad
// (edadEn) y si hay que pedirla (necesitaEdad, distingueEdad).
//
// Aquí solo queda lo que necesita la página para pintar: qué convocatoria se
// enseña primero, leer lo que escribe la persona y el texto de ayuda «te
// faltan…». Ninguna de esas cosas cambia una nota.
//
// Se carga igual en el navegador (deja `TrenziaWeb`) y en Node (module.exports)
// para que las pruebas usen exactamente este código.
var TrenziaWeb = (function () {
  "use strict";

  // ── Edad ────────────────────────────────────────────────────────────────────
  /** Años cumplidos a la fecha de referencia (nota.js); null si alguna fecha no vale. */
  function edadEn(N, nacimiento, referencia) {
    if (!nacimiento || !referencia) return null;
    try { return N.edadEn(nacimiento, referencia); } catch (e) { return null; }
  }

  // ── Puntuar a una persona ───────────────────────────────────────────────────
  /**
   * Una fila por prueba (lo que dice nota.js, más lo que la página necesita
   * para pintar) y la nota de la convocatoria, también de nota.js.
   * marcas: { [codigoPrueba]: número | null }.
   */
  function puntuar(N, conv, sexo, edad, marcas) {
    const motor = N.datosDeMotor(conv);
    // datosDeMotor recorre pruebas y baremos en el orden del archivo: así se
    // sabe de qué baremo del archivo sale el que elige nota.js.
    const origen = [];
    for (const p of conv.pruebas) for (const b of p.baremos) origen.push(b);

    const pruebas = conv.pruebas.slice().sort((a, b) => a.orden - b.orden).map((p) => {
      const marca = marcas[p.codigo] ?? null;
      const r = N.puntuarPrueba({
        baremos: motor.baremos, tramos: motor.tramos, testType: p.codigo, testSubtype: p.subtipo ?? null,
        sexo, edad, marca, metricaDeLaMarca: null, scoringModel: motor.scoringModel,
      });
      if (!r.baremo) return { codigo: p.codigo, prueba: p, baremo: null };
      const original = origen[motor.baremos.indexOf(r.baremo)];
      // La tabla con la que ha puntuado nota.js, para «te faltan…».
      const tabla = r.prueba.scored_by === "tramos"
        ? N.pickTramosFor(r.baremo.test_subtype, N.elegirTramos(motor.tramos.filter((t) => t.test_type === p.codigo), { sexo, edad }))
        : null;
      return {
        codigo: p.codigo, prueba: p, baremo: original, marca, r: r.prueba, tabla,
        lineal: p.puntuacion === "lineal",
        // Ya con el coeficiente de las bases: nota.js lo aplica.
        puntos: r.prueba.puntos, puntosMax: r.prueba.points_max, puntosMin: r.prueba.min_points,
        soloApto: !!original.solo_apto || r.prueba.points_max == null,
      };
    });

    // A nota.js van TODAS las pruebas, también las que no tienen baremo para
    // este sexo o esta edad (has_bareme: false): con completa, sin baremo no
    // hay veredicto; con noAptoSeguro, una prueba que elimina da «no apto»
    // aunque falten otras. El veredicto es siempre el de nota.js.
    const filas = pruebas.map((p) => p.baremo
      ? { test_type: p.codigo, has_bareme: true, mark: p.r.mark, puntos: p.puntos, points_max: p.puntosMax, is_apto: p.r.is_apto }
      : { test_type: p.codigo, has_bareme: false, mark: null, puntos: null, points_max: null, is_apto: false });
    const n = N.notaDeConvocatoria(filas, motor.scoringModel, motor.rules, { completa: true, noAptoSeguro: true });
    const conBaremo = filas.filter((f) => f.has_bareme);
    const conMarca = conBaremo.filter((f) => f.mark != null).length;
    const completas = conMarca === conBaremo.length;
    const sinBaremo = filas.length - conBaremo.length;
    const apto = n.apto_global;
    const nota = {
      tipo: motor.rules && motor.rules.nota === "media" ? "media" : "suma",
      completas, conMarca, total: conBaremo.length, aptas: conBaremo.filter((f) => f.is_apto).length,
      valor: n.totals.tests_with_mark ? n.totals.total_score : null,
      maximo: n.totals.max_score,
      faltan: n.points_to_apto,
      // Las pruebas que eliminan, según nota.js.
      porDebajo: [...n.tests_below_min],
      apto,
      // Solo para elegir el texto del veredicto, no lo cambian:
      sinBaremo,
      noAptoSeguro: apto === false && (!completas || sinBaremo > 0),
    };
    return { modelo: motor.scoringModel, pruebas, nota };
  }

  // ── Convocatoria por defecto (encargo web-01) ───────────────────────────────
  const PRIORIDAD = ["inscripcion_abierta", "pruebas_pendientes", "proximamente", "cerrada"];
  function convocatoriaPorDefecto(convs) {
    let mejor = 0, rango = Infinity;
    convs.forEach((c, i) => {
      const r = PRIORIDAD.indexOf(c.estado);
      const v = r < 0 ? PRIORIDAD.length : r;
      if (v < rango) { rango = v; mejor = i; }
    });
    return mejor;
  }
  function tieneMarcas(conv) {
    return !!conv.marcas && ["propias", "iguales", "referencia"].includes(conv.marcas.relacion) &&
      !!conv.pruebas && conv.pruebas.some((p) => p.baremos && p.baremos.length);
  }

  // ── Marcas que escribe la persona ───────────────────────────────────────────
  /** «31,5», «7:10», «7:10,5» → número; null si está vacío; NaN si no vale para esa métrica. */
  function leeMarca(txt, metrica) {
    const t = String(txt ?? "").trim().replace(",", ".");
    if (!t) return null;
    let v;
    if (metrica === "Time" && t.includes(":")) {
      const [m, s] = t.split(":");
      if (!/^\d+$/.test(m) || !/^\d+(\.\d+)?$/.test(s) || Number(s) >= 60) return NaN;
      v = Number(m) * 60 + Number(s);
    } else {
      if (!/^\d+(\.\d+)?$/.test(t)) return NaN;
      v = Number(t);
    }
    if (metrica === "Reps" && !Number.isInteger(v)) return NaN;
    if (metrica === "Periods" && !Number.isInteger(v * 2)) return NaN;
    return v;
  }

  // ── Cuánto falta (texto de ayuda, no es nota) ───────────────────────────────
  function redondea(n) { return Math.round(n * 100) / 100; }
  /** Redondeado hacia lo que hay que hacer de verdad: repeticiones enteras, medios periodos, centésimas. */
  function redondeaFalta(x, metrica) {
    if (metrica === "Reps") return Math.ceil(x - 1e-9);
    if (metrica === "Periods") return Math.ceil(x * 2 - 1e-9) / 2;
    return Math.ceil(x * 100 - 1e-9) / 100;
  }
  /**
   * Para una prueba ya puntuada (una fila de puntuar): si no es apta, cuánto
   * falta para el apto; si lo es y hay tabla, cuánto para el siguiente tramo.
   * Usa la misma tabla que ha usado nota.js.
   */
  function queFalta(p) {
    if (!p.baremo || p.marca == null || p.r.label === "Sin marca") return null;
    const b = p.baremo, up = b.sentido === "Up", m = p.marca, met = b.metrica;
    if (p.tabla && p.r.scored_by === "tramos") {
      const f = p.tabla.map((t) => ({ u: Number(t.metric_value), pts: Number(t.points) }))
        .sort((x, y) => (up ? y.u - x.u : x.u - y.u)); // de mejor a peor
      if (!p.r.is_apto) {
        const apto = f[f.length - 1].u;
        return { apto: false, falta: redondeaFalta(up ? apto - m : m - apto, met) };
      }
      const i = f.findIndex((x) => (up ? x.u <= m : x.u >= m));
      const sig = i > 0 ? f[i - 1] : null;
      if (!sig) return { apto: true, maximo: true };
      return { apto: true, falta: redondeaFalta(up ? sig.u - m : m - sig.u, met), puntos: redondea(sig.pts), up };
    }
    if (!p.r.is_apto) return { apto: false, falta: redondeaFalta(Math.abs(m - Number(b.marca_apto)), met) };
    if (p.r.scored_by === "lineal" && p.puntosMax != null && p.puntos >= p.puntosMax) return { apto: true, maximo: true };
    return { apto: true };
  }

  return { edadEn, puntuar, convocatoriaPorDefecto, tieneMarcas, leeMarca, queFalta };
})();
if (typeof module !== "undefined") module.exports = TrenziaWeb;
