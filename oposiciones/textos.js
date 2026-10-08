// Textos y formatos de la web (encargo web-01). Los usan el generador (HTML
// estático) y la calculadora (navegador), para que digan lo mismo.
var TrenziaTextos = (function () {
  "use strict";

  const ESTADO = {
    inscripcion_abierta: "Inscripción abierta",
    pruebas_pendientes: "Pruebas pendientes",
    proximamente: "Próximamente",
    cerrada: "Cerrada",
    anulada: "Anulada",
    suspendida: "Suspendida",
  };
  // Valores abiertos: lo que no se conoce se enseña tal cual, sin romper nada.
  const legible = (s) => String(s ?? "").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
  const estado = (e) => ESTADO[e] ?? legible(e);
  // El estado se pinta tal cual llega del archivo, sin calcular nada (A-08).
  const estadoCompleto = (c) => `${estado(c.estado)}${c.estado_sin_fecha ? ", sin fecha" : ""}`;
  const TIPO = { bomberos: "Bomberos", policia: "Policía", policia_local: "Policía local", ejercito: "Ejército" };
  const tipo = (t) => TIPO[t] ?? legible(t);
  const AMBITO = { municipal: "Ayuntamiento", local: "Ayuntamiento", provincial: "Diputación o consorcio", autonomico: "Comunidad autónoma", estatal: "Estatal" };
  const ambito = (a) => AMBITO[a] ?? legible(a);

  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function fecha(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? `${+m[3]} de ${MESES[+m[2] - 1]} de ${m[1]}` : null;
  }

  function num(n) { return String(Math.round(n * 100) / 100).replace(".", ","); }

  /** Una marca con su unidad: «52 s», «7:10», «22 repeticiones», «9,5 periodos», «2,15 m». */
  function marca(v, metrica, unidad) {
    if (metrica === "Time") {
      if (v >= 100) {
        const m = Math.floor(v / 60), s = Math.round((v - m * 60) * 100) / 100;
        return `${m}:${s < 10 ? "0" : ""}${num(s)}`;
      }
      return `${num(v)} s`;
    }
    return cantidad(v, metrica, unidad);
  }
  /** «1 repetición», «3 repeticiones», «0,01 segundos», «1 periodo», «5 cm». */
  function cantidad(x, metrica, unidad) {
    const uno = x === 1;
    if (metrica === "Time") return `${num(x)} ${uno ? "segundo" : "segundos"}`;
    if (metrica === "Reps") return `${num(x)} ${uno ? "repetición" : "repeticiones"}`;
    if (metrica === "Periods") return `${num(x)} ${uno ? "periodo" : "periodos"}`;
    return `${num(x)} ${unidad ?? ""}`.trim();
  }
  /** La unidad que se ve junto al campo. */
  function unidadCampo(metrica, unidad) {
    if (metrica === "Time") return "segundos o min:seg";
    if (metrica === "Reps") return "repeticiones";
    if (metrica === "Periods") return "periodos";
    return unidad ?? "";
  }

  function sexoEdad(f) {
    const s = f.sexo === "M" ? "Hombres" : f.sexo === "F" ? "Mujeres" : "Todos";
    const conEdad = TrenziaWebTieneEdad(f);
    if (!conEdad) return s;
    if (f.edad_min != null && f.edad_max != null) return `${s}, de ${f.edad_min} a ${f.edad_max} años`;
    if (f.edad_min != null) return `${s}, desde ${f.edad_min} años`;
    return `${s}, hasta ${f.edad_max} años`;
  }
  // Mismo criterio que logica.js y nota.js (16 a 99 no es un tramo de edad).
  function TrenziaWebTieneEdad(f) {
    return (f.edad_min != null && f.edad_min > 16) || (f.edad_max != null && f.edad_max < 99);
  }

  // A qué fecha cuentan las bases la edad (formato, 5.1).
  const CUANDO = {
    dia_pruebas: "el día de las pruebas",
    fin_inscripcion: "el último día de la inscripción",
    "31_diciembre": "el 31 de diciembre",
    fecha_fija: "en la fecha que fijan las bases",
    otra: "en la fecha que fijan las bases",
  };
  const cuando = (regla) => CUANDO[regla] ?? "en la fecha que fijan las bases";
  const SIN_CONFIRMAR = "Fecha sin confirmar en las bases";
  /** «se cuenta a 28 de julio de 2026» (+ aviso si la fecha es una suposición), o null. */
  function edadReferencia(conv) {
    const r = conv.edad_referencia;
    if (!r) return null;
    if (r.texto_bases) return r.texto_bases;
    if (r.fecha) return `se cuenta a ${fecha(r.fecha)}${r.confirmada === false ? ` (${SIN_CONFIRMAR.toLowerCase()})` : ""}`;
    if (r.regla) return `se cuenta ${cuando(r.regla)}`;
    return null;
  }

  /** Cómo se mide y qué hace falta para el apto, en una frase. */
  function condicion(b, unidad) {
    const c = b.condicion ? `${num(b.condicion.valor)} ${b.condicion.unidad}` : null;
    let que;
    if (b.metrica === "Time") que = c ? `Tiempo (${c})` : "Tiempo";
    else if (b.metrica === "Reps") que = c ? `Repeticiones con ${c}` : "Repeticiones";
    else if (b.metrica === "Periods") que = "Periodos completados, en medios periodos";
    else que = `Marca en ${unidad ?? ""}`.trim();
    const mejor = b.sentido === "Up" ? "más es mejor" : "menos es mejor";
    const apto = `apto ${b.sentido === "Up" ? "desde" : "hasta"} ${marca(Number(b.marca_apto), b.metrica, unidad)}`;
    return `${que}, ${mejor}. ${b.solo_apto ? "Solo apto o no apto" : "Puntúa"}: ${apto}.`;
  }

  /** Avisos obligatorios de una convocatoria (encargo web-01, apartado 2). */
  function avisos(conv, convocatorias) {
    const out = [];
    const nombreDe = (clave) => (convocatorias.find((c) => c.clave === clave) || {}).nombre_oficial || clave;
    if (conv.estado_sin_fecha) out.push({ tipo: "fecha", texto: `${estado(conv.estado)}, sin fecha.` });
    if (conv.marcas && conv.marcas.relacion === "referencia") {
      out.push({ tipo: "referencia", texto: `Aún no hay bases de esta convocatoria. Usamos las marcas de ${nombreDe(conv.marcas.de)} como referencia.` });
    }
    if (conv.marcas && conv.marcas.relacion === "iguales") {
      out.push({ tipo: "iguales", texto: `Las marcas son las mismas que las de ${nombreDe(conv.marcas.de)}.` });
    }
    // La web no enseña nada como oficial sin decir que no está revisado (3.4).
    const v = conv.verificacion && conv.verificacion.estado;
    if (v === "comunidad") {
      out.push({ tipo: "verificacion", texto: "Marcas leídas de las bases de forma automática y todavía no revisadas por Trenzia. Compruébalas en la convocatoria oficial." });
    } else if (v === "en_disputa") {
      out.push({ tipo: "verificacion", texto: "Hay dudas sobre alguna de estas marcas y las estamos revisando. Compruébalas en la convocatoria oficial." });
    } else if (v !== "verificado") {
      out.push({ tipo: "verificacion", texto: "Marcas sacadas de las bases oficiales, pero todavía no revisadas por Trenzia." });
    }
    return out;
  }

  return { estado, estadoCompleto, tipo, ambito, fecha, num, marca, cantidad, unidadCampo, sexoEdad, condicion, avisos, legible, cuando, edadReferencia, SIN_CONFIRMAR };
})();
if (typeof module !== "undefined") module.exports = TrenziaTextos;
