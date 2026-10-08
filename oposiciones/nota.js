// GENERADO por fitsync-backend/scripts/web/compilar-calculadora.ts desde
// supabase/functions/_shared/puntuar_prueba.ts (el cálculo de la app). No editar.
var TrenziaNota = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // web/calculadora/entrada.ts
  var entrada_exports = {};
  __export(entrada_exports, {
    datosDeMotor: () => datosDeMotor,
    edadEn: () => edadEn,
    elegirBaremo: () => elegirBaremo,
    elegirTramos: () => elegirTramos,
    notaDeConvocatoria: () => notaDeConvocatoria,
    parseScoringRules: () => parseScoringRules,
    pickBaremeFor: () => pickBaremeFor,
    pickTramosFor: () => pickTramosFor,
    puntuarConBaremo: () => puntuarConBaremo,
    puntuarPrueba: () => puntuarPrueba
  });

  // supabase/functions/_shared/bareme_estado.ts
  function estadoBaremo(row) {
    if (row.verified_by_admin === true) return "verificado";
    if (row.trust_status === "disputed") return "en_disputa";
    if (row.trust_status === "community" || row.extraction_method === "admin_seed" || row.extraction_method === "ai_extracted") return "oficial_sin_revisar";
    return "solo_tuyo";
  }
  var pendienteDeVerificar = (row) => {
    const e = estadoBaremo(row);
    return e === "oficial_sin_revisar" || e === "en_disputa";
  };

  // supabase/functions/_shared/marca_unidad.ts
  function marcaEnOtraUnidad(marca, metricaDelUsuario, metricaDelBaremo) {
    return marca !== null && !!metricaDelUsuario && !!metricaDelBaremo && metricaDelUsuario !== metricaDelBaremo;
  }

  // supabase/functions/_shared/points_tramos.ts
  function tramosDe(rows) {
    const out = [];
    for (const r of rows) {
      const umbral = Number(r.metric_value);
      const puntos = Number(r.points);
      if (!Number.isFinite(umbral) || !Number.isFinite(puntos)) continue;
      out.push({ umbral, puntos });
    }
    return out;
  }
  function pointsFromTramos(mark, rows, direction) {
    const tramos = tramosDe(rows);
    if (tramos.length === 0) return null;
    const m = Number(mark);
    if (!Number.isFinite(m)) return { puntos: 0, apto: false };
    let elegido = null;
    for (const t of tramos) {
      if (direction === "Down") {
        if (t.umbral >= m && (elegido === null || t.umbral < elegido.umbral)) elegido = t;
      } else {
        if (t.umbral <= m && (elegido === null || t.umbral > elegido.umbral)) elegido = t;
      }
    }
    if (!elegido) return { puntos: 0, apto: false };
    return { puntos: elegido.puntos, apto: true };
  }
  function maxPointsOf(rows) {
    const t = tramosDe(rows);
    return t.length ? Math.max(...t.map((x) => x.puntos)) : null;
  }
  function minPointsOf(rows) {
    const t = tramosDe(rows);
    return t.length ? Math.min(...t.map((x) => x.puntos)) : null;
  }
  function labelForPoints(puntos, minPoints, maxPoints) {
    const span = maxPoints - minPoints;
    if (puntos >= minPoints + span * 0.85) return "Sobresaliente";
    if (puntos >= minPoints + span * 0.5) return "Notable";
    return "Apto";
  }
  function pickTramosFor(testSubtype, rows) {
    var _a;
    if (rows.length === 0) return null;
    const want = testSubtype != null ? testSubtype : null;
    const grupos = /* @__PURE__ */ new Map();
    for (const r of rows) {
      const k = (_a = r.test_subtype) != null ? _a : null;
      if (!grupos.has(k)) grupos.set(k, []);
      grupos.get(k).push(r);
    }
    const exacto = grupos.get(want);
    if (exacto && exacto.length) return exacto;
    if (grupos.size === 1) return [...grupos.values()][0];
    return null;
  }
  function parseScoringRules(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const o = raw;
    const num = (v) => {
      const n = Number(v);
      return v != null && Number.isFinite(n) && n >= 0 ? n : null;
    };
    const rules = {
      min_points_per_test: num(o.min_points_per_test),
      min_total_points: num(o.min_total_points),
      max_total_points: num(o.max_total_points),
      ...o.nota === "media" ? { nota: "media" } : {}
    };
    if (rules.min_points_per_test === null && rules.min_total_points === null && rules.max_total_points === null) return null;
    return rules;
  }
  function evaluateGlobalRule(perTest, rules) {
    let suma = 0;
    let conPuntos = 0;
    const below = [];
    const sinMarca = [];
    for (const t of perTest) {
      if (t.solo_apto) {
        if (t.is_apto == null) sinMarca.push(t.test_type);
        else if (!t.is_apto) below.push(t.test_type);
        continue;
      }
      if (t.puntos == null) {
        sinMarca.push(t.test_type);
        continue;
      }
      suma += t.puntos;
      conPuntos++;
      if (rules.min_points_per_test != null && t.puntos < rules.min_points_per_test) {
        below.push(t.test_type);
      }
    }
    const total = rules.nota === "media" ? conPuntos > 0 ? Math.round(suma / conPuntos * 100) / 100 : 0 : Math.round(suma * 100) / 100;
    const pointsToApto = rules.min_total_points != null ? Math.max(0, Math.round((rules.min_total_points - total) * 100) / 100) : null;
    let apto;
    if (sinMarca.length > 0) apto = null;
    else {
      apto = below.length === 0 && (rules.min_total_points == null || total >= rules.min_total_points);
    }
    return {
      apto_global: apto,
      total,
      points_to_apto: pointsToApto,
      tests_below_min: below,
      tests_without_mark: sinMarca
    };
  }

  // supabase/functions/_shared/baremes_puros.ts
  function interpolateAptoPoints(mark, aptoMark, maxMark, minPoints, maxPoints, direction, coeficiente = 1) {
    const k = coeficiente > 0 && coeficiente <= 1 ? coeficiente : 1;
    const minBase = minPoints / k;
    const maxBase = maxPoints / k;
    let puntos;
    if (direction === "Up") {
      puntos = mark >= maxMark ? maxBase : minBase + (mark - aptoMark) / (maxMark - aptoMark) * (maxBase - minBase);
    } else {
      puntos = mark <= maxMark ? maxBase : minBase + (aptoMark - mark) / (aptoMark - maxMark) * (maxBase - minBase);
    }
    puntos = Math.round(puntos * 100) / 100;
    if (k !== 1) puntos = Math.round(puntos * k * 1e4) / 1e4;
    return { puntos, label: labelForPoints(puntos, minPoints, maxPoints) };
  }
  function tramosScaleFor(testSubtype, rowsOfType) {
    if (!rowsOfType || rowsOfType.length === 0) return null;
    const rows = pickTramosFor(testSubtype, rowsOfType);
    if (!rows) return null;
    const max = maxPointsOf(rows);
    const min = minPointsOf(rows);
    if (max === null || min === null) return null;
    return { puntos_min: min, puntos_max: max };
  }
  function scoreWithTramos(mark, direction, testSubtype, rowsOfType) {
    if (!rowsOfType || rowsOfType.length === 0) return null;
    const rows = pickTramosFor(testSubtype, rowsOfType);
    if (!rows) return null;
    const r = pointsFromTramos(mark, rows, direction);
    if (!r) return null;
    const maxP = maxPointsOf(rows);
    const minP = minPointsOf(rows);
    const label = r.apto ? labelForPoints(r.puntos, minP, maxP) : "No apto";
    return { puntos: r.puntos, isApto: r.apto, puntos_min: minP, puntos_max: maxP, label };
  }
  function pickBaremeFor(userTest, baremes) {
    var _a;
    const wantSubtype = (_a = userTest.test_subtype) != null ? _a : null;
    const sameType = baremes.filter((b) => b.test_type === userTest.test_type);
    const exact = sameType.find((b) => {
      var _a2;
      return ((_a2 = b.test_subtype) != null ? _a2 : null) === wantSubtype;
    });
    if (exact) return exact;
    if (sameType.length === 1) return sameType[0];
    return null;
  }

  // supabase/functions/_shared/score_totals.ts
  var round2 = (n) => Math.round(n * 100) / 100;
  function aggregateScore(rows, scoringModel, nota = "suma") {
    let totalScore = 0;
    let maxScore = 0;
    let testsWithMark = 0;
    let aptosCount = 0;
    let puntuadas = 0;
    for (const r of rows) {
      if (r.mark !== null) testsWithMark++;
      if (r.is_apto) aptosCount++;
      if (r.puntos !== null) totalScore += r.puntos;
      if (r.puntos !== null && r.points_max !== null) puntuadas++;
      if (r.points_max !== null) {
        maxScore = nota === "media" ? Math.max(maxScore, r.points_max) : maxScore + r.points_max;
      }
    }
    if (nota === "media") totalScore = puntuadas > 0 ? totalScore / puntuadas : 0;
    const testsTotal = rows.length;
    const percent = scoringModel === "points" ? maxScore > 0 ? round2(totalScore / maxScore * 100) : 0 : testsTotal > 0 ? round2(aptosCount / testsTotal * 100) : 0;
    return {
      total_score: round2(totalScore),
      max_score: round2(maxScore),
      percent,
      tests_with_mark: testsWithMark,
      tests_total: testsTotal,
      aptos_count: aptosCount
    };
  }

  // supabase/functions/_shared/puntuar_prueba.ts
  function puntuarConBaremo(p) {
    var _a, _b, _c;
    const { marca, baremo, scoringModel } = p;
    const aptoMark = Number(baremo.marca_apto);
    const maxMark = baremo.marca_max_score !== null ? Number(baremo.marca_max_score) : null;
    const minPoints = baremo.puntos_min !== null ? Number(baremo.puntos_min) : null;
    const maxPoints = baremo.puntos_max !== null ? Number(baremo.puntos_max) : null;
    const pendingVerification = pendienteDeVerificar(baremo);
    const tramosScale = scoringModel === "points" ? tramosScaleFor(baremo.test_subtype, p.tramosDelTipo) : null;
    const linealPuntúa = scoringModel === "points" && maxPoints !== null && maxMark !== null && minPoints !== null;
    const pointsMax = (_a = tramosScale == null ? void 0 : tramosScale.puntos_max) != null ? _a : linealPuntúa ? maxPoints : null;
    const pointsMin = (_b = tramosScale == null ? void 0 : tramosScale.puntos_min) != null ? _b : linealPuntúa ? minPoints : null;
    const enOtraUnidad = marcaEnOtraUnidad(marca, p.metricaDeLaMarca, baremo.metric_type);
    const base = {
      goal_apto: aptoMark,
      marca_max_score: maxMark,
      pending_verification: pendingVerification,
      metric_mismatch: enOtraUnidad
    };
    if (marca === null || enOtraUnidad) {
      return {
        ...base,
        mark: null,
        puntos: null,
        label: "Sin marca",
        is_apto: false,
        percent_of_max: null,
        min_points: pointsMin,
        points_max: pointsMax,
        scored_by: null
      };
    }
    if (scoringModel === "points") {
      const porTramos = scoreWithTramos(marca, baremo.direction, baremo.test_subtype, p.tramosDelTipo);
      if (porTramos) {
        return {
          ...base,
          mark: marca,
          puntos: porTramos.puntos,
          label: porTramos.label,
          is_apto: porTramos.isApto,
          percent_of_max: Math.round(porTramos.puntos / porTramos.puntos_max * 100 * 100) / 100,
          min_points: porTramos.puntos_min,
          points_max: porTramos.puntos_max,
          scored_by: "tramos"
        };
      }
    }
    const isApto = baremo.direction === "Up" ? marca >= aptoMark : marca <= aptoMark;
    if (!linealPuntúa) {
      return {
        ...base,
        mark: marca,
        puntos: null,
        label: isApto ? "Apto" : "No apto",
        is_apto: isApto,
        percent_of_max: isApto ? 100 : 0,
        min_points: null,
        points_max: null,
        scored_by: "binary"
      };
    }
    let puntos;
    let label;
    if (!isApto) {
      puntos = 0;
      label = "No apto";
    } else {
      const r = interpolateAptoPoints(
        marca,
        aptoMark,
        maxMark,
        minPoints,
        maxPoints,
        baremo.direction,
        Number((_c = baremo.score_coefficient_applied) != null ? _c : 1) || 1
      );
      puntos = r.puntos;
      label = r.label;
    }
    return {
      ...base,
      mark: marca,
      puntos,
      label,
      is_apto: isApto,
      percent_of_max: Math.round(puntos / maxPoints * 100 * 100) / 100,
      min_points: minPoints,
      points_max: maxPoints,
      scored_by: "lineal"
    };
  }
  function notaDeConvocatoria(pruebas, scoringModel, rules) {
    var _a;
    let aptoGlobal = null;
    let pointsToApto = null;
    let testsBelowMin = [];
    if (scoringModel === "points" && rules && pruebas.some((b) => b.has_bareme)) {
      const v = evaluateGlobalRule(
        pruebas.filter((b) => b.has_bareme).map(
          (b) => {
            var _a2;
            return (
              // Una prueba de solo apto dentro de una convocatoria por puntos (la
              // apnea de Murcia) no suma, pero no ser apto elimina (encargo 40).
              b.points_max === null ? { test_type: b.test_type, puntos: null, solo_apto: true, is_apto: b.mark === null ? null : b.is_apto } : { test_type: b.test_type, puntos: b.mark === null ? null : (_a2 = b.puntos) != null ? _a2 : 0 }
            );
          }
        ),
        rules
      );
      aptoGlobal = v.apto_global;
      pointsToApto = v.points_to_apto;
      testsBelowMin = v.tests_below_min;
    }
    return {
      totals: aggregateScore(pruebas, scoringModel, (_a = rules == null ? void 0 : rules.nota) != null ? _a : "suma"),
      apto_global: aptoGlobal,
      points_to_apto: pointsToApto,
      tests_below_min: testsBelowMin
    };
  }

  // supabase/functions/_shared/edad.ts
  function esBisiesto(anio) {
    return anio % 4 === 0 && anio % 100 !== 0 || anio % 400 === 0;
  }
  function diasDelMes(anio, mes) {
    if (mes === 2) return esBisiesto(anio) ? 29 : 28;
    return [4, 6, 9, 11].includes(mes) ? 30 : 31;
  }
  function fechaCivil(f) {
    let r;
    if (typeof f === "string") {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(f.trim());
      if (!m) throw new Error(`fecha no válida: «${f}» (se espera AAAA-MM-DD)`);
      r = { anio: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) };
    } else {
      r = f;
    }
    if (!Number.isInteger(r.anio) || !Number.isInteger(r.mes) || !Number.isInteger(r.dia) || r.mes < 1 || r.mes > 12 || r.dia < 1 || r.dia > diasDelMes(r.anio, r.mes)) {
      throw new Error(`fecha no válida: ${r.anio}-${r.mes}-${r.dia}`);
    }
    return r;
  }
  function cumpleEn(nacimiento, anio) {
    if (nacimiento.mes === 2 && nacimiento.dia === 29 && !esBisiesto(anio)) return { mes: 2, dia: 28 };
    return { mes: nacimiento.mes, dia: nacimiento.dia };
  }
  function edadEn(nacimiento, referencia) {
    const n = fechaCivil(nacimiento);
    const r = fechaCivil(referencia);
    const c = cumpleEn(n, r.anio);
    let edad = r.anio - n.anio;
    if (r.mes < c.mes || r.mes === c.mes && r.dia < c.dia) edad -= 1;
    return edad;
  }

  // supabase/functions/_shared/seleccion_baremo.ts
  var EDAD_GENERAL_MIN = 16;
  var EDAD_GENERAL_MAX = 99;
  function distingueEdad(f) {
    var _a, _b;
    const min = (_a = f.edad_min) != null ? _a : null;
    const max = (_b = f.edad_max) != null ? _b : null;
    return min !== null && min > EDAD_GENERAL_MIN || max !== null && max < EDAD_GENERAL_MAX;
  }
  function cubre(f, p) {
    var _a, _b, _c;
    const sexo = (_a = f.sexo) != null ? _a : null;
    if (sexo !== null && sexo !== p.sexo) return false;
    if (p.edad === null) return !distingueEdad(f);
    const min = (_b = f.edad_min) != null ? _b : null;
    const max = (_c = f.edad_max) != null ? _c : null;
    return (min === null || p.edad >= min) && (max === null || p.edad <= max);
  }
  function anchura(f) {
    var _a, _b;
    return ((_a = f.edad_max) != null ? _a : EDAD_GENERAL_MAX) - ((_b = f.edad_min) != null ? _b : 0);
  }
  function elegirFilas(filas, p) {
    const validas = filas.filter((f) => cubre(f, p));
    if (validas.length === 0) return [];
    const conEdad = validas.filter(distingueEdad);
    const base = conEdad.length > 0 ? conEdad : validas;
    const conSexo = base.filter((f) => {
      var _a;
      return ((_a = f.sexo) != null ? _a : null) !== null;
    });
    const base2 = conSexo.length > 0 ? conSexo : base;
    const minAncho = Math.min(...base2.map(anchura));
    return base2.filter((f) => anchura(f) === minAncho);
  }
  function elegirBaremo(baremos, q) {
    const delTipo = baremos.filter((b) => b.test_type === q.test_type);
    const validos = elegirFilas(delTipo, q);
    return pickBaremeFor({ test_type: q.test_type, test_subtype: q.test_subtype }, validos);
  }
  function elegirTramos(tramos, p) {
    var _a;
    const porSubtipo = /* @__PURE__ */ new Map();
    for (const t of tramos) {
      const k = (_a = t.test_subtype) != null ? _a : null;
      if (!porSubtipo.has(k)) porSubtipo.set(k, []);
      porSubtipo.get(k).push(t);
    }
    const out = [];
    for (const filas of porSubtipo.values()) out.push(...elegirFilas(filas, p));
    return out;
  }
  function puntuarPrueba(p) {
    const baremo = elegirBaremo(p.baremos, {
      test_type: p.testType,
      test_subtype: p.testSubtype,
      sexo: p.sexo,
      edad: p.edad
    });
    if (!baremo) return { baremo: null, prueba: null };
    const tramosDelTipo = elegirTramos(p.tramos.filter((t) => t.test_type === p.testType), p);
    return {
      baremo,
      prueba: puntuarConBaremo({
        marca: p.marca,
        metricaDeLaMarca: p.metricaDeLaMarca,
        baremo,
        scoringModel: p.scoringModel,
        tramosDelTipo
      })
    };
  }

  // supabase/functions/_shared/oposiciones_archivo.ts
  var r4 = (x) => Math.round(x * 1e4) / 1e4;
  function marcasDeEstado(estado) {
    switch (estado) {
      case "verificado":
        return { verified_by_admin: true, trust_status: "community", extraction_method: "admin_seed" };
      case "en_disputa":
        return { verified_by_admin: false, trust_status: "disputed", extraction_method: "admin_seed" };
      case "comunidad":
      case "oficial_sin_revisar":
        return { verified_by_admin: false, trust_status: "community", extraction_method: "admin_seed" };
      default:
        return { verified_by_admin: false, trust_status: null, extraction_method: null };
    }
  }
  function coeficienteDeTramo(p, t) {
    var _a, _b;
    const mismo = p.baremos.find(
      (b) => {
        var _a2, _b2, _c, _d;
        return (b.sexo === t.sexo || b.sexo === null || t.sexo === null) && ((_b2 = (_a2 = b.subtipo) != null ? _a2 : p.subtipo) != null ? _b2 : null) === ((_d = (_c = t.subtipo) != null ? _c : p.subtipo) != null ? _d : null);
      }
    );
    return (_b = (_a = mismo != null ? mismo : p.baremos[0]) == null ? void 0 : _a.coeficiente) != null ? _b : 1;
  }
  function datosDeMotor(c) {
    var _a, _b, _c, _d, _e, _f, _g;
    const estado = marcasDeEstado((_b = (_a = c.verificacion) == null ? void 0 : _a.estado) != null ? _b : "");
    const baremos = [];
    const tramos = [];
    const coefs = /* @__PURE__ */ new Set();
    for (const p of c.pruebas) {
      for (const b of p.baremos) {
        const k = (_c = b.coeficiente) != null ? _c : 1;
        coefs.add(k);
        baremos.push({
          test_type: p.codigo,
          test_subtype: (_e = (_d = b.subtipo) != null ? _d : p.subtipo) != null ? _e : null,
          metric_type: b.metrica,
          direction: b.sentido,
          marca_apto: b.marca_apto,
          marca_max_score: b.marca_max,
          puntos_min: b.solo_apto || b.puntos_min === null ? null : r4(b.puntos_min * k),
          puntos_max: b.solo_apto || b.puntos_max === null ? null : r4(b.puntos_max * k),
          score_coefficient_applied: k,
          sexo: b.sexo,
          edad_min: b.edad_min,
          edad_max: b.edad_max,
          ...estado
        });
      }
      for (const t of p.puntuacion === "lineal" ? [] : p.tramos) {
        const k = coeficienteDeTramo(p, t);
        tramos.push({
          test_type: p.codigo,
          test_subtype: (_g = (_f = t.subtipo) != null ? _f : p.subtipo) != null ? _g : null,
          sexo: t.sexo,
          edad_min: t.edad_min,
          edad_max: t.edad_max,
          metric_value: t.valor,
          points: r4(t.puntos * k)
        });
      }
    }
    const g = c.nota.regla_global;
    let rules = null;
    if (c.nota.modelo === "points" && g) {
      if (g.tipo === "media_de_bloques") throw new Error(`${c.clave}: «media_de_bloques» aún no está soportado`);
      if (coefs.size > 1 && g.min_por_prueba !== null) {
        throw new Error(`${c.clave}: coeficientes distintos y min_por_prueba: no se puede traducir a una sola regla`);
      }
      const k = coefs.size === 1 ? [...coefs][0] : 1;
      rules = {
        min_points_per_test: g.min_por_prueba === null ? null : r4(g.min_por_prueba * k),
        min_total_points: g.min_total,
        max_total_points: g.max_total,
        ...g.tipo === "media" ? { nota: "media" } : {}
      };
      if (rules.min_points_per_test === null && rules.min_total_points === null && rules.max_total_points === null) rules = null;
    }
    return { scoringModel: c.nota.modelo, baremos, tramos, rules };
  }
  return __toCommonJS(entrada_exports);
})();
