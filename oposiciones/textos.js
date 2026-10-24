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
  // Con `aviso` (A-20), el aviso sustituye al texto del estado donde se le enseña a
  // una persona (web-18); el estado del archivo sigue sirviendo para filtrar.
  const estadoCompleto = (c) => c.aviso ? String(c.aviso).trim().replace(/\.$/, "") : `${estado(c.estado)}${c.estado_sin_fecha ? ", sin fecha" : ""}`;
  /** La clase de la etiqueta de estado: la del estado o, con aviso, «aviso». */
  const claseEstado = (c) => (c.aviso ? "aviso" : c.estado);
  const TIPO = { bomberos: "Bomberos", policia: "Policía", policia_local: "Policía local", ejercito: "Ejército" };
  const tipo = (t) => TIPO[t] ?? legible(t);
  // Solo en el índice (filtro y título del grupo), para que se vea que la Guardia
  // Civil está dentro (web-24). Las fichas siguen diciendo «Policía».
  const TIPO_INDICE = { ...TIPO, policia: "Policía y Guardia Civil", ejercito: "Fuerzas Armadas" };
  const tipoIndice = (t) => TIPO_INDICE[t] ?? legible(t);
  const AMBITO = { municipal: "Ayuntamiento", local: "Ayuntamiento", provincial: "Diputación o consorcio", autonomico: "Comunidad autónoma", estatal: "Estatal" };
  const ambito = (a) => AMBITO[a] ?? legible(a);

  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function fecha(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
    return m ? `${+m[3]} de ${MESES[+m[2] - 1]} de ${m[1]}` : null;
  }

  function num(n) { return String(Math.round(n * 100) / 100).replace(".", ","); }
  /** «1 punto», «5 puntos», «1,5 puntos». */
  const puntos = (n) => `${num(n)} ${Number(n) === 1 ? "punto" : "puntos"}`;
  /** Un texto libre del archivo como frase: con punto final si no lo trae. */
  const conPunto = (s) => { const t = String(s).trim(); return /[.!?…]$/.test(t) ? t : `${t}.`; };

  /**
   * Una marca con su unidad: «52 s», «7:10», «22 repeticiones», «9,5 periodos», «2,15 m».
   * mmss: en m:ss aunque baje de 100 s, para no mezclar formas en una prueba (enMinutos, web-27).
   */
  function marca(v, metrica, unidad, mmss) {
    if (metrica === "Time") {
      if (v >= 100 || mmss) {
        const m = Math.floor(v / 60), s = Math.round((v - m * 60) * 100) / 100;
        return `${m}:${s < 10 ? "0" : ""}${num(s)}`;
      }
      return `${num(v)} s`;
    }
    return cantidad(v, metrica, unidad);
  }
  /** Si alguna marca de la prueba (de cualquier sexo) llega a 100 s, todas van en m:ss (web-27). */
  function enMinutos(p) {
    const bs = (p && p.baremos) || [];
    if (!bs.length || bs[0].metrica !== "Time") return false;
    const v = [...bs.flatMap((b) => [b.marca_apto, b.marca_max]), ...(p.tramos || []).map((t) => t.valor)];
    return v.some((x) => x != null && Number(x) >= 100);
  }
  /** «1 repetición», «3 repeticiones», «0,01 segundos», «1 periodo», «5 cm». */
  function cantidad(x, metrica, unidad) {
    const uno = x === 1;
    if (metrica === "Time") return `${num(x)} ${uno ? "segundo" : "segundos"}`;
    if (metrica === "Reps") return `${num(x)} ${uno ? "repetición" : "repeticiones"}`;
    if (metrica === "Periods") return `${num(x)} ${uno ? "periodo" : "periodos"}`;
    // Metros enteros de cuatro cifras con punto de miles: «2.700 m» (el Cooper, web-35).
    if (unidad === "m" && Number.isInteger(x) && x >= 1000) return `${String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} m`;
    return `${num(x)} ${unidad ?? ""}`.trim();
  }
  /** La unidad que se ve junto al campo. */
  function unidadCampo(metrica, unidad) {
    if (metrica === "Time") return "segundos o min:seg";
    if (metrica === "Reps") return "repeticiones";
    if (metrica === "Periods") return "periodos";
    return unidad ?? "";
  }

  /** «Hombres», «Mujeres, de 18 a 29 años»… conEdad: si la fila es un tramo de edad (distingueEdad de nota.js). */
  function sexoEdad(f, conEdad) {
    const s = f.sexo === "M" ? "Hombres" : f.sexo === "F" ? "Mujeres" : "Todos";
    if (!conEdad) return s;
    // 99 es «sin límite» (formato, 3.7): el último grupo de edad queda abierto.
    if (f.edad_min != null && (f.edad_max == null || f.edad_max >= 99)) return `${s}, ${f.edad_min} años o más`;
    // Tramo de una sola edad (Guardia Civil: 40 es la edad máxima de la convocatoria).
    if (f.edad_min != null && f.edad_min === f.edad_max) return `${s}, ${f.edad_min} años`;
    if (f.edad_min != null && f.edad_max != null) return `${s}, de ${f.edad_min} a ${f.edad_max} años`;
    if (f.edad_min != null) return `${s}, desde ${f.edad_min} años`;
    return `${s}, hasta ${f.edad_max} años`;
  }
  /** «A», «A y B», «A, B y C». */
  function lista(xs) {
    return xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;
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

  /**
   * La condición corta de un baremo, para cada fila de marcas: «100 m», «35 kg»;
   * null si no hay valor. El texto largo de las bases (`condicion.texto`) no va
   * aquí sino una vez por prueba, con comoSeHace (web-21).
   */
  function condicionTexto(cond) {
    if (!cond || cond.valor == null) return null;
    return `${num(cond.valor)}${cond.unidad ? ` ${cond.unidad}` : ""}`;
  }

  /** «Cómo se hace: …», una vez por cada texto distinto de los baremos de una prueba (web-21). */
  function comoSeHace(baremos) {
    const textos = [...new Set((baremos || []).map((b) => b.condicion && b.condicion.texto).filter(Boolean).map((t) => String(t).trim()))];
    return textos.map((t) => `Cómo se hace: ${conPunto(t)}`);
  }

  /**
   * Con puntos, sin mínimo por prueba y con nota mínima (Generalitat 81/26, web-26):
   * no llegar a la tabla da 0 en esa prueba y cuenta en la nota, no elimina.
   * Es la misma regla con la que nota.js decide qué pruebas eliminan.
   */
  function noElimina(c) {
    const g = c && c.nota && c.nota.regla_global;
    if (!g || c.nota.modelo !== "points" || g.min_por_prueba != null || g.min_total == null) return false;
    return !(c.pruebas || []).every((p) => p.baremos.every((b) => b.solo_apto));
  }

  /**
   * Cómo se mide y qué hace falta para el apto, en una frase. sinEliminar: noElimina(c)
   * de su convocatoria; mmss: enMinutos(prueba).
   */
  function condicion(b, unidad, sinEliminar, mmss) {
    const c = condicionTexto(b.condicion);
    let que;
    if (b.metrica === "Time") que = c ? `Tiempo (${c})` : "Tiempo";
    // «con 40 kg», pero «en 30 s» si la condición es un tiempo (saltos laterales, web-35).
    else if (b.metrica === "Reps") que = c ? `Repeticiones ${/\b(s|min)$/.test(c) ? "en" : "con"} ${c}` : "Repeticiones";
    else if (b.metrica === "Periods") que = "Periodos completados, en medios periodos";
    // Con su condición, que puede cambiar por sexo (balón de 4 kg hombres y 3 kg mujeres, web-30).
    else if (b.metrica === "Distance") que = `Distancia en ${unidad ?? "cm"}${c ? ` (${c})` : ""}`;
    else if (b.metrica === "Height") que = `Altura en ${unidad ?? "cm"}`;
    else que = `Marca en ${unidad ?? ""}`.trim();
    const mejor = b.sentido === "Up" ? "más es mejor" : "menos es mejor";
    const hasta = `${b.sentido === "Up" ? "desde" : "hasta"} ${marca(Number(b.marca_apto), b.metrica, unidad, mmss)}`;
    if (sinEliminar && !b.solo_apto && b.puntos_min != null) {
      return `${que}, ${mejor}. Puntúa: ${puntos(b.puntos_min)} ${hasta}; ${b.sentido === "Up" ? "por debajo" : b.metrica === "Time" ? "con más tiempo" : "por encima"}, 0 puntos, pero no elimina.`;
    }
    const apto = `apto ${hasta}`;
    return `${que}, ${mejor}. ${b.solo_apto ? "Solo apto o no apto" : "Puntúa"}: ${apto}.`;
  }

  /**
   * Avisos obligatorios de una convocatoria (encargo web-01, apartado 2).
   * opciones.cotejo (web-13, punto 5; DECISIÓN DE URKO, apagado por defecto):
   * en las convocatorias verificadas, la frase de que Trenzia las ha cotejado
   * con el boletín.
   */
  function avisos(conv, convocatorias, opciones) {
    const out = [];
    const nombreDe = (clave) => (convocatorias.find((c) => c.clave === clave) || {}).nombre_oficial || clave;
    if (conv.estado_sin_fecha && !conv.aviso) out.push({ tipo: "fecha", texto: `${estado(conv.estado)}, sin fecha.` });
    // El aviso de la app sobre la convocatoria (A-20), tal cual, con su punto final.
    if (conv.aviso) out.push({ tipo: "aviso", texto: conPunto(conv.aviso) });
    // Con aviso de la app, el genérico de referencia sobra: la app ya explica de dónde
    // salen las marcas y si pueden cambiar (tropa y marinería 2027, web-28).
    if (conv.marcas && conv.marcas.relacion === "referencia" && !conv.aviso) {
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
    } else if (opciones && opciones.cotejo) {
      const bolTxt = (b) => `${b.nombre}${b.numero != null ? ` n.º ${b.numero}` : ""}${b.fecha ? `, de ${fecha(b.fecha)}` : ""}`;
      const norma = normaDeMarcas(conv);
      if (norma && conv.verificacion.fecha) {
        // Las marcas salen de una norma, no del boletín de la convocatoria (tropa y marinería, web-29).
        out.push({ tipo: "cotejo", texto: `Marcas transcritas de ${norma} y cotejadas por Trenzia el ${fecha(conv.verificacion.fecha)}. Manda siempre la convocatoria oficial.` });
      } else if (conv.boletin && conv.boletin.nombre && conv.verificacion.fecha) {
        out.push({ tipo: "cotejo", texto: `Marcas transcritas de ${bolTxt(conv.boletin)} y cotejadas por Trenzia el ${fecha(conv.verificacion.fecha)}. Manda siempre la convocatoria oficial.` });
      } else {
        // Sin bases propias (P36): las marcas son las de otra convocatoria, y la
        // frase dice de cuál, con su boletín y su fecha de cotejo (web-21).
        const src = origenDeMarcas(conv, convocatorias);
        if (src && src.boletin && src.boletin.nombre && src.verificacion && src.verificacion.estado === "verificado" && src.verificacion.fecha) {
          const de = conv.marcas.relacion === "referencia" ? "Marcas de referencia transcritas" : "Marcas transcritas";
          out.push({ tipo: "cotejo", texto: `${de} de ${bolTxt(src.boletin)} (${src.nombre_oficial}) y cotejadas por Trenzia el ${fecha(src.verificacion.fecha)}. Manda siempre la convocatoria oficial.` });
        }
      }
    }
    return out;
  }

  /**
   * La norma de la que salen las marcas cuando es otro documento que el boletín de
   * la convocatoria («la Orden DEF/15/2026 (anexo III)»), o null (web-29). Por datos:
   * `fuentes.baremos` con enlace, y el boletín con otro enlace o sin boletín. Si el
   * boletín no trae enlace no se puede saber, y se queda la frase del boletín.
   */
  function normaDeMarcas(conv) {
    const fb = conv.fuentes && conv.fuentes.baremos;
    if (!fb || !fb.referencia || !fb.url) return null;
    const b = conv.boletin;
    if (b && (!b.url || b.url === fb.url)) return null;
    let ref = String(fb.referencia).trim().replace(/\.$/, "");
    // «Bases de 27/02/2025 …» (Policía Municipal de Madrid, web-32): «las bases de …».
    if (/^Bases\b/.test(ref)) ref = `las b${ref.slice(1)}`;
    const art = /^(Orden|Resolución|Ley|Instrucción)\b/.test(ref) ? "la " : /^(Real Decreto|Decreto|Acuerdo|Reglamento)\b/.test(ref) ? "el " : "";
    // La primera coma fuera de paréntesis: «… (BOPZ 287, 14/12/2024), Policía C1, …» (web-35).
    let corte = -1;
    for (let i = 0, prof = 0; i < ref.length - 1; i++) {
      if (ref[i] === "(") prof++;
      else if (ref[i] === ")") prof--;
      else if (prof === 0 && ref[i] === "," && ref[i + 1] === " ") { corte = i; break; }
    }
    const m = corte > 0 ? [ref, ref.slice(0, corte), ref.slice(corte + 2)] : null;
    if (!m) return `${art}${ref}`;
    // Si la primera parte ya acaba en paréntesis («(BOAM 9.829)»), el resto va entre comas, no en otro paréntesis.
    return /\)$/.test(m[1]) ? `${art}${m[1]}, ${m[2]},` : `${art}${m[1]} (${m[2]})`;
  }

  /** Policía local con baremo de toda una comunidad (Andalucía, Decreto 8/2026): no es un examen con fecha (web-29). */
  const baremoComun = (o) => !!o && o.tipo === "policia_local" && o.ambito === "autonomico";

  /** La convocatoria de la que salen las marcas de otra («referencia» o «iguales»), o null. */
  function origenDeMarcas(conv, convocatorias) {
    const m = conv.marcas;
    if (!m || !["referencia", "iguales"].includes(m.relacion) || !m.de) return null;
    return (convocatorias || []).find((c) => c.clave === m.de) || null;
  }

  /**
   * Si las bases aplican un coeficiente a los puntos (Cuenca: 0,05), la frase
   * que lo explica, con el coeficiente y el máximo sacados del archivo; si no,
   * null. Ejemplo: «La nota de la prueba física es la suma de los puntos × 0,05 (máximo 3).»
   */
  function coeficiente(conv) {
    const ks = [...new Set(conv.pruebas.flatMap((p) => p.baremos.map((b) => Number(b.coeficiente ?? 1) || 1)))];
    if (ks.every((k) => k === 1)) return null;
    const g = conv.nota && conv.nota.regla_global;
    const como = g && g.tipo === "media" ? "la media de los puntos" : "la suma de los puntos";
    const por = ks.length === 1 ? `× ${num(ks[0])}` : "× el coeficiente de cada prueba";
    const max = g && g.max_total != null ? ` (máximo ${num(g.max_total)})` : "";
    return `La nota de la prueba física es ${como} ${por}${max}.`;
  }

  /**
   * La frase del veredicto. Solo elige el texto: si se aprueba o no lo dice
   * nota.js (nota.apto) y qué pruebas eliminan también (nota.porDebajo).
   * nombre: código de prueba → nombre que ve la persona.
   */
  function veredicto(nota, nombre) {
    if (nota.noAptoSeguro) {
      const una = nota.porDebajo.length === 1;
      const cuales = lista(nota.porDebajo.map(nombre));
      const aunque = !nota.completas ? "aunque te falten otras"
        : nota.sinCargar && nota.sinCargar.length ? "aunque falten pruebas que aún no calculamos"
        : "aunque alguna prueba no tenga marca para tu sexo o tu edad";
      return `Con ${una ? "esta marca" : "estas marcas"} en ${cuales} no aprobarías: ${una ? "esa prueba elimina" : "esas pruebas eliminan"} por sí ${una ? "sola" : "solas"}, ${aunque}.`;
    }
    if (nota.apto === true) return "Con estas marcas aprobarías las pruebas físicas.";
    if (nota.apto === false) return "Con estas marcas no aprobarías las pruebas físicas.";
    if (nota.sinCargar && nota.sinCargar.length) return faltanPruebas(nota.sinCargar);
    if (nota.sinBaremo > 0) return "No podemos decirte si apruebas: alguna prueba no tiene marca para tu sexo o tu edad.";
    return `Escribe tus marcas en las ${nota.total} pruebas para saber si apruebas.`;
  }

  /** «Faltan 2 pruebas oficiales que aún no calculamos: circuito de bombero y vértigo.» (nombres del archivo). */
  function faltanPruebas(nombres) {
    const n = nombres.length;
    const lista_ = lista(nombres.map((x) => String(x).replace(/^\p{Lu}(?!\p{Lu})/u, (c) => c.toLowerCase())));
    return n === 1 ? `Falta 1 prueba oficial que aún no calculamos: ${lista_}.` : `Faltan ${n} pruebas oficiales que aún no calculamos: ${lista_}.`;
  }

  return { faltanPruebas, conPunto, condicionTexto, comoSeHace, origenDeMarcas, estado, estadoCompleto, claseEstado, tipo, tipoIndice, ambito, fecha, num, puntos, noElimina, enMinutos, baremoComun, marca, cantidad, unidadCampo, sexoEdad, condicion, avisos, legible, cuando, edadReferencia, SIN_CONFIRMAR, lista, veredicto, coeficiente };
})();
if (typeof module !== "undefined") module.exports = TrenziaTextos;
