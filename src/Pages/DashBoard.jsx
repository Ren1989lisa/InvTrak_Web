import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Container, Spinner } from "react-bootstrap";
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
import { getDashboardSnapshot } from "../services/dashboardService";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/dashboard.css";

const COLORS = ["#2c5e91", "#6ea3d8", "#94c4e8", "#5a9bd4", "#3d7bb5"];

const DEFAULT_DASHBOARD = {
  totalActivos: 0,
  activosPorEstatus: {},
  activosMasReportados: [],
  mantenimientosPorTecnico: [],
  tiempoPromedioAtencion: 0,
  updatedAt: null,
};

function normalizeText(value) {
  return (value ?? "").toString().trim();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStatusTitle(value) {
  const normalized = normalizeText(value).replace(/_/g, " ").toLowerCase();
  if (!normalized) return "Sin estatus";
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const { currentUser, logout, menuItems } = useUsers();

  const [dashboard, setDashboard] = useState(DEFAULT_DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadDashboard() {
      setIsLoading(true);
      setError("");

      try {
        const data = await getDashboardSnapshot({ signal: controller.signal });
        if (!active) return;
        setDashboard({
          ...DEFAULT_DASHBOARD,
          ...data,
        });
      } catch (err) {
        if (!active || controller.signal.aborted) return;
        if (err?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        if (err?.status === 403) {
          setError("No tienes permisos para ver el dashboard.");
          return;
        }
        setError(err?.message || "No fue posible cargar los datos del dashboard.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
      controller.abort();
    };
  }, [navigate, refreshToken]);

  const metrics = useMemo(() => {
    const byStatus = dashboard?.activosPorEstatus ?? {};

    const totalByStatus = Object.values(byStatus).reduce(
      (acc, value) => acc + toNumber(value, 0),
      0
    );
    const total = toNumber(dashboard?.totalActivos, totalByStatus);
    const disponibles = toNumber(byStatus?.DISPONIBLE, 0);
    const resguardados = toNumber(byStatus?.RESGUARDADO, 0);
    const enMantenimiento = toNumber(byStatus?.MANTENIMIENTO, 0);
    const deBaja = toNumber(byStatus?.BAJA, 0);

    return {
      total,
      enMantenimiento,
      activos: disponibles + resguardados,
      deBaja,
    };
  }, [dashboard]);

  const chartTiempoData = useMemo(() => {
    const promedio = Number(toNumber(dashboard?.tiempoPromedioAtencion, 0).toFixed(1));
    return [{ mes: "Promedio", horas: promedio }];
  }, [dashboard?.tiempoPromedioAtencion]);

  const pieData = useMemo(() => {
    const byStatus = dashboard?.activosPorEstatus ?? {};
    const rows = Object.entries(byStatus)
      .map(([key, value]) => ({
        name: toStatusTitle(key),
        value: toNumber(value, 0),
      }))
      .filter((item) => item.value > 0);

    if (rows.length > 0) return rows;
    return [{ name: "Sin datos", value: 1 }];
  }, [dashboard?.activosPorEstatus]);

  const reportedDisplay = useMemo(() => {
    const list = Array.isArray(dashboard?.activosMasReportados)
      ? dashboard.activosMasReportados
      : [];
    if (list.length === 0) return [];

    const max = Math.max(
      1,
      ...list.map((item) => toNumber(item?.totalReportes, 0))
    );

    return list.map((item) => {
      const totalReportes = toNumber(item?.totalReportes, 0);
      const label =
        normalizeText(item?.etiquetaBien) || `Activo #${toNumber(item?.activoId, 0)}`;

      return {
        label,
        cantidad: totalReportes,
        porcentaje: (totalReportes / max) * 100,
      };
    });
  }, [dashboard?.activosMasReportados]);

  const feedEvents = useMemo(() => {
    const list = Array.isArray(dashboard?.mantenimientosPorTecnico)
      ? [...dashboard.mantenimientosPorTecnico]
      : [];

    return list
      .sort(
        (a, b) =>
          toNumber(b?.totalMantenimientos, 0) - toNumber(a?.totalMantenimientos, 0)
      )
      .map((item, index) => {
        const nombreTecnico = normalizeText(item?.nombreTecnico) || "Tecnico sin nombre";
        const totalMantenimientos = toNumber(item?.totalMantenimientos, 0);

        return {
          id: `${nombreTecnico}-${index}`,
          tecnico: nombreTecnico,
          reparo: `${totalMantenimientos} mantenimientos`,
          labelReparo: "Atendio",
          tiempo: "Total acumulado",
        };
      });
  }, [dashboard?.mantenimientosPorTecnico]);

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
          logout();
          navigate("/login");
        }}
      />

      <Container fluid className="inv-content px-3 px-md-4 py-3">
        {isLoading ? (
          <Alert variant="info" className="mb-3 d-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" />
            <span>Cargando datos del dashboard...</span>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="danger" className="mb-3 d-flex justify-content-between align-items-center">
            <span>{error}</span>
            <Button
              type="button"
              variant="outline-danger"
              size="sm"
              onClick={() => setRefreshToken((value) => value + 1)}
            >
              Reintentar
            </Button>
          </Alert>
        ) : null}

        <div className="inv-dashboard__metrics">
          <div className="inv-metric-card">
            <div className="inv-metric-card__icon">
              <AiOutlineBoxPlot />
            </div>
            <div>
              <div className="inv-metric-card__value">{metrics.total}</div>
              <div className="inv-metric-card__label">Total de activos</div>
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

        <div className="inv-dashboard__charts">
          <div className="inv-chart-card">
            <h3 className="inv-chart-card__title">Tiempo promedio de atencion</h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartTiempoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} unit=" d" />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`${value} dias`, "Promedio"]}
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

        <div className="inv-dashboard__reported">
          <h3 className="inv-reported__title">Activos mas reportados</h3>
          <div className="inv-reported__header">
            <span className="inv-reported__headerLabel">Etiqueta de bien</span>
            <span className="inv-reported__headerLabel">Cantidad</span>
          </div>
          {reportedDisplay.length === 0 ? (
            <p className="text-muted mb-0">No hay datos de reportes</p>
          ) : (
            reportedDisplay.map((item, index) => (
              <div key={`${item.label}-${index}`} className="inv-reported__row">
                <span className="inv-reported__tipo">{item.label}</span>
                <div className="inv-reported__bar-wrapper">
                  <div className="inv-reported__bar">
                    <div
                      className="inv-reported__bar-fill"
                      style={{ width: `${item.porcentaje}%` }}
                    />
                  </div>
                  <span className="inv-reported__cantidad">
                    {item.cantidad} reportes
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="inv-dashboard__feed">
          <h3 className="inv-feed__title">Mantenimientos por tecnico</h3>
          <div className="inv-feed__grid">
            {feedEvents.length === 0 ? (
              <p className="text-muted mb-0">No hay datos de mantenimientos</p>
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
