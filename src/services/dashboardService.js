import { ApiError, api } from "./api";
import {
  normalizeActivo,
  normalizeActivosList,
  normalizeUsuario as normalizeEntityUsuario,
} from "../utils/entityFields";

function normalizeText(value) {
  return (value ?? "").toString().trim();
}

function normalizeStatus(value) {
  return normalizeText(value).toLowerCase().replace(/\s+/g, " ");
}

function getPath(source, path) {
  if (!source || typeof source !== "object") return undefined;
  if (!path) return source;

  return path.split(".").reduce((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    return acc[key];
  }, source);
}

function firstObject(...values) {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
  }
  return null;
}

function extractCollection(payload, candidates = []) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  for (const candidate of candidates) {
    const value = getPath(payload, candidate);
    if (Array.isArray(value)) {
      return value;
    }
  }

  const fallbackValues = [
    payload.data,
    payload.content,
    payload.items,
    payload.results,
    payload.activos,
    payload.reportes,
    payload.usuarios,
    payload.historial,
    payload.mantenimientos,
  ];

  for (const value of fallbackValues) {
    if (Array.isArray(value)) return value;
  }

  return [];
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readNumber(sources, paths, fallback = 0) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;

    for (const path of paths) {
      const value = getPath(source, path);
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function normalizeReporte(raw = {}) {
  const activo = normalizeActivo(raw.activo ?? {});
  const usuario = normalizeEntityUsuario(raw.usuario ?? {});
  const prioridad = raw.prioridad ?? {};

  return {
    id_reporte: raw.id_reporte ?? raw.idReporte ?? raw.id ?? null,
    folio: normalizeText(raw.folio ?? raw.codigo ?? raw.numero ?? `REP-${raw.id_reporte ?? raw.idReporte ?? raw.id ?? ""}`),
    tipo_falla: normalizeText(raw.tipo_falla ?? raw.tipoFalla ?? raw.tipo ?? raw.descripcion),
    descripcion: normalizeText(raw.descripcion ?? raw.observacion ?? raw.motivo ?? ""),
    fecha_reporte: raw.fecha_reporte ?? raw.fechaReporte ?? raw.fecha ?? raw.createdAt ?? null,
    fecha_resolucion: raw.fecha_resolucion ?? raw.fechaResolucion ?? null,
    estatus: normalizeText(raw.estatus ?? raw.estado ?? "PENDIENTE").toUpperCase(),
    prioridad: normalizeText(prioridad.nombre ?? prioridad.prioridad ?? raw.prioridad ?? "MEDIA").toUpperCase(),
    activo,
    usuario,
  };
}

function normalizeHistorial(raw = {}) {
  const activo = normalizeActivo(raw.activo ?? {});
  const usuario = normalizeEntityUsuario(raw.usuario ?? {});

  return {
    id_historial: raw.id_historial ?? raw.idHistorial ?? raw.id ?? null,
    tipo_evento: normalizeText(raw.tipo_evento ?? raw.tipoEvento ?? "cambio_estatus").toLowerCase(),
    estatus_anterior: normalizeText(raw.estatus_anterior ?? raw.estatusAnterior ?? ""),
    estatus_nuevo: normalizeText(raw.estatus_nuevo ?? raw.estatusNuevo ?? ""),
    fecha: raw.fecha ?? raw.fecha_cambio ?? raw.fechaCambio ?? raw.createdAt ?? null,
    motivo: normalizeText(raw.motivo ?? raw.observacion ?? raw.descripcion ?? ""),
    activo,
    usuario,
  };
}

function normalizeMantenimiento(raw = {}) {
  const activo = normalizeActivo(raw.activo ?? {});
  const usuario = normalizeEntityUsuario(raw.usuario ?? {});

  return {
    id_mantenimiento: raw.id_mantenimiento ?? raw.idMantenimiento ?? raw.id ?? null,
    fecha_solicitud: raw.fecha_solicitud ?? raw.fechaSolicitud ?? raw.fecha ?? raw.createdAt ?? null,
    fecha_resolucion: raw.fecha_resolucion ?? raw.fechaResolucion ?? null,
    estatus: normalizeText(raw.estatus ?? raw.estado ?? "PENDIENTE").toUpperCase(),
    descripcion: normalizeText(raw.descripcion ?? raw.observacion ?? raw.motivo ?? ""),
    activo,
    usuario,
  };
}

function isAssetAvailable(activo) {
  const status = normalizeStatus(activo?.estatus);
  return status === "disponible";
}

function isAssetAssigned(activo) {
  const status = normalizeStatus(activo?.estatus);
  return status === "resguardado" || status === "asignado" || status === "confirmado";
}

function isMaintenanceOpen(item) {
  const status = normalizeStatus(item?.estatus);
  return status === "pendiente" || status === "asignado" || status === "en_proceso" || status === "en mantenimiento" || status === "en_mantenimiento";
}

function isReporteOpen(reporte) {
  const status = normalizeStatus(reporte?.estatus);
  return status === "pendiente" || status === "asignado" || status === "en_proceso" || status === "en mantenimiento" || status === "en_mantenimiento";
}

function sortByDateDesc(list, dateSelector) {
  return [...list].sort((a, b) => {
    const left = new Date(dateSelector(a) ?? 0).getTime();
    const right = new Date(dateSelector(b) ?? 0).getTime();
    return right - left;
  });
}

function monthKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function buildMonthlySeries(list, dateSelector, valueSelector = () => 1) {
  const byMonth = new Map();

  list.forEach((item) => {
    const key = monthKey(dateSelector(item));
    if (!key) return;

    const current = byMonth.get(key) ?? 0;
    byMonth.set(key, current + toNumber(valueSelector(item), 1));
  });

  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  return [...byMonth.entries()]
    .sort(([a], [b]) => {
      const [yearA, monthA] = a.split("-").map(Number);
      const [yearB, monthB] = b.split("-").map(Number);

      if (yearA !== yearB) return yearA - yearB;
      return monthA - monthB;
    })
    .slice(-6)
    .map(([key, value]) => {
      const [, monthIndex] = key.split("-").map(Number);
      return {
        name: months[monthIndex] ?? `Mes ${monthIndex + 1}`,
        value,
      };
    });
}

function buildStatusSeries(activos) {
  const counts = new Map();

  activos.forEach((activo) => {
    const status = normalizeText(activo?.estatus || "SIN_ESTATUS").toUpperCase();
    const current = counts.get(status) ?? 0;
    counts.set(status, current + 1);
  });

  const preferredOrder = ["DISPONIBLE", "RESGUARDADO", "MANTENIMIENTO", "BAJA", "SIN_ESTATUS"];
  const series = [];

  preferredOrder.forEach((status) => {
    const value = counts.get(status);
    if (value) {
      series.push({
        name: status
          .replace(/_/g, " ")
          .toLowerCase()
          .replace(/\b\w/g, (match) => match.toUpperCase()),
        value,
      });
      counts.delete(status);
    }
  });

  counts.forEach((value, status) => {
    series.push({
      name: status
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (match) => match.toUpperCase()),
      value,
    });
  });

  return series;
}

function buildTopProductsSeries(activos) {
  const counts = new Map();

  activos.forEach((activo) => {
    const productLabel = normalizeText(
      activo?.producto?.completo ||
        activo?.producto?.nombre ||
        activo?.producto?.modelo ||
        activo?.producto?.marca ||
        activo?.tipo_activo ||
        "Sin producto"
    );

    const key = productLabel || "Sin producto";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function buildRecentActivity(historial, activos) {
  const activosById = new Map(
    activos.map((activo) => [Number(activo?.id_activo), activo])
  );

  return sortByDateDesc(historial, (item) => item?.fecha)
    .slice(0, 6)
    .map((item) => {
      const activo = activosById.get(Number(item?.activo?.id_activo)) ?? item?.activo ?? null;
      return {
        id: item?.id_historial ?? `${item?.tipo_evento}-${item?.fecha ?? Math.random()}`,
        tipo: item?.tipo_evento ?? "evento",
        fecha: item?.fecha ?? null,
        titulo: item?.tipo_evento === "mantenimiento"
          ? "Mantenimiento"
          : item?.tipo_evento === "reporte"
            ? "Reporte"
            : item?.tipo_evento === "asignacion"
              ? "Asignacion"
              : "Cambio de estatus",
        detalle:
          item?.motivo ||
          item?.estatus_nuevo ||
          item?.estatus_anterior ||
          normalizeText(activo?.etiqueta_bien || activo?.numero_serie || "Sin detalle"),
        tecnico:
          item?.usuario?.nombre_completo ||
          item?.usuario?.nombre ||
          item?.usuario?.correo ||
          "Sistema",
        codigo: normalizeText(activo?.etiqueta_bien || activo?.numero_serie || "Sin codigo"),
      };
    });
}

function buildSummary(summaryRoot, datasets) {
  const activos = datasets.activos;
  const reportes = datasets.reportes;
  const usuarios = datasets.usuarios;
  const mantenimientos = datasets.mantenimientos;

  const summarySources = [summaryRoot?.metrics, summaryRoot?.metricas, summaryRoot?.summary, summaryRoot?.resumen, summaryRoot?.estadisticas, summaryRoot];

  const totalActivos = readNumber(summarySources, ["totalActivos", "total_activos", "activosTotales", "activos_total"], activos.length);
  const activosDisponibles = readNumber(summarySources, ["activosDisponibles", "activos_disponibles", "disponibles"], activos.filter(isAssetAvailable).length);
  const activosAsignados = readNumber(summarySources, ["activosAsignados", "activos_asignados", "asignados", "resguardados"], activos.filter(isAssetAssigned).length);
  const usuariosRegistrados = readNumber(summarySources, ["usuariosRegistrados", "usuarios_registrados", "totalUsuarios", "usuarios"], usuarios.length);
  const reportesAbiertos = readNumber(summarySources, ["reportesAbiertos", "reportes_abiertos", "reportesPendientes", "reportes_pendientes"], reportes.filter(isReporteOpen).length);
  const mantenimientosPendientes = readNumber(summarySources, ["mantenimientosPendientes", "mantenimientos_pendientes", "pendientesMantenimiento", "mantenimientoPendiente"], mantenimientos.filter(isMaintenanceOpen).length || reportes.filter(isReporteOpen).length);

  return {
    totalActivos,
    activosDisponibles,
    activosAsignados,
    usuariosRegistrados,
    reportesAbiertos,
    mantenimientosPendientes,
  };
}

function friendlyWarning(label, error) {
  const status = error?.status ?? error?.response?.status ?? 0;

  if (status === 404) {
    return `${label} no esta disponible en el backend`;
  }

  if (status === 403) {
    return `${label} no pudo cargarse por permisos insuficientes`;
  }

  if (status === 401) {
    return `${label} no pudo cargarse porque la sesion expiro`;
  }

  return `No fue posible cargar ${label.toLowerCase()}`;
}

export async function loadDashboardOverview({ signal } = {}) {
  const requests = {
    dashboard: api.get("/dashboard", { signal }),
    activos: api.get("/activo", { signal }),
    reportes: api.get("/reporte", { signal, skipAuthRedirect: true }),
    usuarios: api.get("/usuario", { signal, skipAuthRedirect: true }),
    historial: api.get("/historial", { signal, skipAuthRedirect: true }),
    mantenimientos: api.get("/mantenimiento", { signal, skipAuthRedirect: true }),
  };

  const entries = Object.entries(requests);
  const settled = await Promise.allSettled(entries.map(([, promise]) => promise));
  const results = Object.fromEntries(
    entries.map(([key], index) => [key, settled[index]])
  );

  const warnings = [];

  const readResponse = (key, normalizer, candidates = []) => {
    const settledResult = results[key];
    if (!settledResult) return [];

    if (settledResult.status === "fulfilled") {
      const payload = settledResult.value?.data ?? settledResult.value ?? null;
      return extractCollection(payload, candidates).map(normalizer);
    }

    warnings.push(friendlyWarning(key, settledResult.reason));
    return [];
  };

  const dashboardPayload =
    results.dashboard?.status === "fulfilled"
      ? results.dashboard.value?.data ?? results.dashboard.value ?? null
      : null;

  if (results.dashboard?.status === "rejected") {
    warnings.push(friendlyWarning("Dashboard", results.dashboard.reason));
  }

  const activosFromModule = readResponse("activos", normalizeActivo, [
    "data",
    "content",
    "items",
    "activos",
    "results",
  ]);
  const reportesFromModule = readResponse("reportes", normalizeReporte, [
    "data",
    "content",
    "items",
    "reportes",
    "results",
  ]);
  const usuariosFromModule = readResponse("usuarios", normalizeEntityUsuario, [
    "data",
    "content",
    "items",
    "usuarios",
    "results",
  ]);
  const historialFromModule = readResponse("historial", normalizeHistorial, [
    "data",
    "content",
    "items",
    "historial",
    "results",
  ]);
  const mantenimientosFromModule = readResponse("mantenimientos", normalizeMantenimiento, [
    "data",
    "content",
    "items",
    "mantenimientos",
    "results",
  ]);

  const dashboardLists = {
    activos: normalizeActivosList(extractCollection(dashboardPayload, ["activosRecientes", "ultimosActivos", "recentActivos", "activos"])),
    reportes: extractCollection(dashboardPayload, ["reportesRecientes", "ultimosReportes", "recentReportes", "reportes"]).map(normalizeReporte),
    usuarios: extractCollection(dashboardPayload, ["usuariosRecientes", "recentUsers", "usuarios"]).map(normalizeEntityUsuario),
    historial: extractCollection(dashboardPayload, ["historialReciente", "recentActivity", "historial"]).map(normalizeHistorial),
    mantenimientos: extractCollection(dashboardPayload, ["mantenimientosRecientes", "recentMaintenance", "mantenimientos"]).map(normalizeMantenimiento),
  };

  const activos = activosFromModule.length > 0 ? activosFromModule : dashboardLists.activos;
  const reportes = reportesFromModule.length > 0 ? reportesFromModule : dashboardLists.reportes;
  const usuarios = usuariosFromModule.length > 0 ? usuariosFromModule : dashboardLists.usuarios;
  const historial = historialFromModule.length > 0 ? historialFromModule : dashboardLists.historial;
  const mantenimientos = mantenimientosFromModule.length > 0 ? mantenimientosFromModule : dashboardLists.mantenimientos;

  const hasAnyData =
    Boolean(dashboardPayload) ||
    activos.length > 0 ||
    reportes.length > 0 ||
    usuarios.length > 0 ||
    historial.length > 0 ||
    mantenimientos.length > 0;

  if (!hasAnyData) {
    const lastError =
      results.dashboard?.reason ||
      results.activos?.reason ||
      results.reportes?.reason ||
      results.usuarios?.reason ||
      results.historial?.reason ||
      results.mantenimientos?.reason ||
      null;

    throw new ApiError(
      "No fue posible cargar el dashboard con datos reales",
      lastError?.status ?? 500,
      lastError?.data ?? null,
      lastError ?? null
    );
  }

  const dashboardRoot = firstObject(
    dashboardPayload?.metrics,
    dashboardPayload?.metricas,
    dashboardPayload?.summary,
    dashboardPayload?.resumen,
    dashboardPayload?.estadisticas,
    dashboardPayload
  );

  const summary = buildSummary(dashboardRoot, {
    activos,
    reportes,
    usuarios,
    mantenimientos,
  });

  const recentActivos = sortByDateDesc(
    activos,
    (item) => item?.fecha_alta ?? item?.fechaAlta ?? item?.createdAt ?? null
  ).slice(0, 8);

  const recentReportes = sortByDateDesc(
    reportes,
    (item) => item?.fecha_reporte ?? item?.fechaReporte ?? item?.fecha ?? item?.createdAt ?? null
  ).slice(0, 8);

  const chartActivosPorEstado = buildStatusSeries(activos);
  const chartTopProductos = buildTopProductsSeries(activos);
  const chartReportesPorMes = buildMonthlySeries(
    reportes,
    (item) => item?.fecha_reporte ?? item?.fechaReporte ?? item?.fecha ?? item?.createdAt ?? null
  );
  const recentActivity = buildRecentActivity(historial, activos);

  const updatedAt =
    dashboardPayload?.updatedAt ??
    dashboardPayload?.fechaActualizacion ??
    dashboardPayload?.generatedAt ??
    dashboardPayload?.timestamp ??
    new Date().toISOString();

  return {
    summary,
    activos,
    reportes,
    usuarios,
    historial,
    mantenimientos,
    recentActivos,
    recentReportes,
    recentActivity,
    charts: {
      activosPorEstado: chartActivosPorEstado,
      topProductos: chartTopProductos,
      reportesPorMes: chartReportesPorMes,
    },
    warnings,
    lastUpdated: updatedAt,
    source: dashboardPayload,
  };
}
