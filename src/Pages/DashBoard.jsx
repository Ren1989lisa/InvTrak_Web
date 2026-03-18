import { useMemo, useState } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  AiOutlineBoxPlot,
  AiOutlineTool,
  AiOutlineFileText,
  AiOutlineWarning,
} from "react-icons/ai";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import { useUsers } from "../context/UsersContext";
import { getStoredActivos } from "../activosStorage";
import { getStoredReportes } from "../reportesStorage";
import historialData from "../Data/historial_activo.json";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/dashboard.css";

const COLORS = ["#2c5e91", "#6ea3d8", "#94c4e8", "#5a9bd4", "#3d7bb5"];

function formatTimeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours} horas`;
  if (diffDays === 1) return "1 día";
  if (diffDays < 7) return `${diffDays} días`;
  return date.toLocaleDateString();
}

function eventTitle(tipo) {
  switch (tipo) {
    case "reporte":
      return "Reporte del bien";
    case "cambio_estatus":
      return "Cambio de estatus";
    case "mantenimiento":
      return "Mantenimiento realizado";
    case "asignacion":
      return "Asignación de técnico";
    case "alta":
      return "Nuevo bien agregado";
    default:
      return "Evento";
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const { currentUser, setCurrentUserId, menuItems } = useUsers();

  const activos = useMemo(() => getStoredActivos(), []);
  const reportes = useMemo(() => getStoredReportes(), []);

  // Métricas de vista general
  const metrics = useMemo(() => {
    const total = activos.length;
    const enMantenimiento = activos.filter(
      (a) =>
        (a?.estatus ?? "").toLowerCase().includes("mantenimiento") ||
        reportes.some(
          (r) =>
            Number(r?.id_activo) === Number(a?.id_activo) &&
            (r?.estatus === "pendiente" || r?.estatus === "asignado")
        )
    ).length;
    const activosOk = activos.filter(
      (a) =>
        ["disponible", "resguardado"].includes(
          (a?.estatus ?? "").toLowerCase()
        )
    ).length;
    const deBaja = activos.filter((a) =>
      (a?.estatus ?? "").toLowerCase().includes("baja")
    ).length;

    return {
      total: total || 0,
      enMantenimiento: enMantenimiento || 0,
      activos: activosOk || 0,
      deBaja: deBaja || 0,
    };
  }, [activos, reportes]);

  // Gráfico: tiempo promedio de atención (simulado con reportes)
  const chartTiempoData = useMemo(() => {
    const reportesConFecha = reportes
      .filter((r) => r?.fecha_reporte)
      .sort((a, b) => new Date(a.fecha_reporte) - new Date(b.fecha_reporte));
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    if (reportesConFecha.length === 0) {
      return [
        { mes: "Ene", horas: 2.5 },
        { mes: "Feb", horas: 3.2 },
        { mes: "Mar", horas: 2.8 },
      ];
    }
    const byMonth = {};
    reportesConFecha.forEach((r) => {
      const d = new Date(r.fecha_reporte);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!byMonth[key]) byMonth[key] = { count: 0, total: 0 };
      byMonth[key].count++;
      byMonth[key].total += 2 + Math.random() * 2;
    });
    const result = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, v]) => {
        const [, m] = key.split("-").map(Number);
        return {
          mes: meses[m] ?? String(m + 1),
          horas: Number((v.total / v.count).toFixed(1)),
        };
      });
    return result.length > 0
      ? result
      : [
          { mes: "Ene", horas: 2.5 },
          { mes: "Feb", horas: 3.2 },
          { mes: "Mar", horas: 2.8 },
        ];
  }, [reportes]);

  // Gráfico: estado de bienes
  const estadoBienesData = useMemo(() => {
    const byStatus = {};
    activos.forEach((a) => {
      const s = (a?.estatus ?? "Sin estatus").toString();
      byStatus[s] = (byStatus[s] || 0) + 1;
    });
    return Object.entries(byStatus).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [activos]);

  const pieData = useMemo(() => {
    const d = estadoBienesData;
    if (Array.isArray(d) && d.length > 0) return d;
    return [
      { name: "Disponible", value: activos.length || 1 },
      { name: "Resguardado", value: Math.max(0, activos.length - 1) },
    ];
  }, [estadoBienesData, activos.length]);

  // Activos más reportados
  const activosReportados = useMemo(() => {
    const map = {};
    reportes.forEach((r) => {
      const activo = activos.find((a) => Number(a?.id_activo) === Number(r?.id_activo));
      const tipo = activo?.producto?.tipo_activo ?? activo?.tipo_activo ?? "Otro";
      map[tipo] = (map[tipo] || 0) + 1;
    });
    const arr = Object.entries(map).map(([tipo, cantidad]) => ({ tipo, cantidad }));
    arr.sort((a, b) => b.cantidad - a.cantidad);
    return arr.slice(0, 5);
  }, [activos, reportes]);

  const reportedWithMax = useMemo(() => {
    const max = Math.max(1, ...activosReportados.map((a) => a.cantidad));
    return activosReportados.map((a) => ({
      ...a,
      porcentaje: (a.cantidad / max) * 100,
    }));
  }, [activosReportados]);

  // Si no hay reportes, mostrar datos de ejemplo basados en tipo
  const reportedDisplay = useMemo(() => {
    if (reportedWithMax.length > 0) return reportedWithMax;
    const byTipo = {};
    activos.forEach((a) => {
      const t = a?.producto?.tipo_activo ?? a?.tipo_activo ?? "Otro";
      byTipo[t] = (byTipo[t] || 0) + 1;
    });
    const arr = Object.entries(byTipo)
      .map(([tipo, cantidad]) => ({ tipo, cantidad, porcentaje: (cantidad / activos.length) * 100 }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
    const max = Math.max(1, ...arr.map((a) => a.cantidad));
    return arr.map((a) => ({ ...a, porcentaje: (a.cantidad / max) * 100 }));
  }, [reportedWithMax, activos]);

  // Feed: Mantenimientos por técnico (nombre del técnico + qué reparó)
  const feedEvents = useMemo(() => {
    const events = [];
    const allHistorial = Array.isArray(historialData) ? historialData : [];
    const activosMap = new Map(activos.map((a) => [Number(a?.id_activo), a]));
    const reportesMap = new Map(reportes.map((r) => [r?.folio, r]));

    allHistorial.forEach((h) => {
      const activo = activosMap.get(Number(h?.id_activo));
      const codigo = activo?.codigo_interno ?? `#${h?.id_activo}`;
      const tipoActivo = activo?.producto?.tipo_activo ?? activo?.tipo_activo ?? "bien";
      const reporte = reportesMap.get(h?.folio_reporte ?? h?.reporte_relacionado);

      let tecnico = "";
      let reparo = "";

      if (h?.tipo_evento === "mantenimiento") {
        tecnico = h?.tecnico ?? "Técnico";
        reparo = h?.diagnostico ?? h?.observacion ?? `Mantenimiento en ${tipoActivo} ${codigo}`;
      } else if (h?.tipo_evento === "asignacion") {
        tecnico = h?.tecnico_asignado ?? "Técnico asignado";
        reparo = reporte?.descripcion ?? h?.observacion ?? `Reporte ${h?.reporte_relacionado ?? ""}`;
      } else if (h?.tipo_evento === "reporte") {
        tecnico = h?.usuario ?? "Usuario";
        reparo = h?.diagnostico ?? reporte?.descripcion ?? `Reporte del bien ${codigo}`;
      } else if (h?.tipo_evento === "cambio_estatus") {
        tecnico = h?.usuario ?? "Sistema";
        reparo = h?.observacion ?? `Cambio a ${h?.estatus_nuevo ?? ""}`;
      } else {
        tecnico = h?.usuario ?? h?.tecnico ?? "Sistema";
        reparo = codigo;
      }

      const labelReparo = ["mantenimiento", "asignacion"].includes(h?.tipo_evento)
        ? "Reparó"
        : h?.tipo_evento === "reporte"
          ? "Reportó"
          : "Detalle";

      events.push({
        id: h?.id_historial,
        tipo: h?.tipo_evento,
        title: eventTitle(h?.tipo_evento),
        tecnico,
        reparo,
        labelReparo,
        codigo,
        tiempo: formatTimeAgo(h?.fecha),
        fecha: h?.fecha,
      });
    });

    // Agregar altas recientes de activos (sin técnico de reparación)
    activos
      .filter((a) => a?.fecha_alta)
      .sort((a, b) => new Date(b.fecha_alta) - new Date(a.fecha_alta))
      .slice(0, 2)
      .forEach((a) => {
      events.push({
        id: `alta-${a?.id_activo}`,
        tipo: "alta",
        title: "Nuevo bien agregado",
        tecnico: "Administrador",
        reparo: `${a?.producto?.tipo_activo ?? "Bien"} ${a?.codigo_interno ?? ""}`,
        labelReparo: "Registró",
        codigo: a?.codigo_interno,
        tiempo: formatTimeAgo(a?.fecha_alta),
        fecha: a?.fecha_alta,
      });
      });

    events.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return events.slice(0, 9);
  }, [activos, historialData, reportes]);

  return (
    <div className="inv-page inv-dashboard">
      <NavbarMenu
        title="Dashboard"
        onMenuClick={() => setOpenSidebar((v) => !v)}
      />

      <SidebarMenu
        open={openSidebar}
        onClose={() => setOpenSidebar(false)}
        userName={currentUser?.nombre_completo}
        items={menuItems}
        onViewProfile={() => {
          setOpenSidebar(false);
          if (currentUser) {
            navigate(`/perfil/${currentUser.id_usuario}`);
          } else {
            navigate("/perfil");
          }
        }}
        onLogout={() => {
          setOpenSidebar(false);
          setCurrentUserId(null);
          navigate("/");
        }}
      />

      <Container fluid className="inv-content px-3 px-md-4 py-3">

        {/* Métricas */}
        <div className="inv-dashboard__metrics">
          <div className="inv-metric-card">
            <div className="inv-metric-card__icon">
              <AiOutlineBoxPlot />
            </div>
            <div>
              <div className="inv-metric-card__value">{metrics.total}</div>
              <div className="inv-metric-card__label">Total de Activos</div>
            </div>
          </div>
          <div className="inv-metric-card">
            <div className="inv-metric-card__icon">
              <AiOutlineTool />
            </div>
            <div>
              <div className="inv-metric-card__value">{metrics.enMantenimiento}</div>
              <div className="inv-metric-card__label">Bienes en mantenimiento</div>
            </div>
          </div>
          <div className="inv-metric-card">
            <div className="inv-metric-card__icon">
              <AiOutlineFileText />
            </div>
            <div>
              <div className="inv-metric-card__value">{metrics.activos}</div>
              <div className="inv-metric-card__label">Bienes activos</div>
            </div>
          </div>
          <div className="inv-metric-card">
            <div className="inv-metric-card__icon">
              <AiOutlineWarning />
            </div>
            <div>
              <div className="inv-metric-card__value">{metrics.deBaja}</div>
              <div className="inv-metric-card__label">Bienes de baja</div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="inv-dashboard__charts">
          <div className="inv-chart-card">
            <h3 className="inv-chart-card__title">Tiempo promedio de atención</h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartTiempoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} unit=" h" />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`${value} horas`, "Promedio"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="horas"
                    stroke="#2c5e91"
                    strokeWidth={2}
                    dot={{ fill: "#6ea3d8", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="inv-chart-card">
            <h3 className="inv-chart-card__title">Estado de bienes</h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [value, "Cantidad"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Activos más reportados */}
        <div className="inv-dashboard__reported">
          <h3 className="inv-reported__title">Activos más reportados</h3>
          <div className="inv-reported__header">
            <span className="inv-reported__headerLabel">Tipo de activo</span>
            <span className="inv-reported__headerLabel">Cantidad</span>
          </div>
          {reportedDisplay.length === 0 ? (
            <p className="text-muted mb-0">No hay datos de reportes</p>
          ) : (
            reportedDisplay.map((item) => (
              <div key={item.tipo} className="inv-reported__row">
                <span className="inv-reported__tipo">{item.tipo}</span>
                <div className="inv-reported__bar-wrapper">
                  <div className="inv-reported__bar">
                    <div
                      className="inv-reported__bar-fill"
                      style={{ width: `${item.porcentaje}%` }}
                    />
                  </div>
                  <span className="inv-reported__cantidad">
                    {item.cantidad} unidades
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mantenimientos por técnico */}
        <div className="inv-dashboard__feed">
          <h3 className="inv-feed__title">Mantenimientos por técnico</h3>
          <div className="inv-feed__grid">
            {feedEvents.length === 0 ? (
              <p className="text-muted mb-0">No hay eventos recientes</p>
            ) : (
              feedEvents.map((ev) => (
                <div key={ev.id} className="inv-feed__item">
                  <div className="inv-feed__bullet" />
                  <div className="inv-feed__content">
                    <div className="inv-feed__event-title">{ev.tecnico}</div>
                    <div className="inv-feed__event-desc">
                      <span className="inv-feed__reparo-label">{ev.labelReparo}:</span> {ev.reparo}
                    </div>
                    <div className="inv-feed__event-time">{ev.tiempo}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
