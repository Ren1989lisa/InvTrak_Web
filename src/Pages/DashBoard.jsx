import { createElement, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Container,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FaBoxes,
  FaCheckCircle,
  FaChartLine,
  FaChartPie,
  FaClipboardList,
  FaExclamationTriangle,
  FaHistory,
  FaPlus,
  FaSyncAlt,
  FaTools,
  FaUserCheck,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import { useUsers } from "../context/UsersContext";
import { useDashboardData } from "../hooks/useDashboardData";
import "../Style/dashboard.css";

const PIE_COLORS = ["#2c5e91", "#6ea3d8", "#94c4e8", "#5a9bd4", "#3d7bb5", "#8fb8e0"];

const numberFormatter = new Intl.NumberFormat("es-MX");
const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
});
const dateTimeFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

function normalizeText(value) {
  return (value ?? "").toString().trim();
}

function normalizeStatus(value) {
  return normalizeText(value).toLowerCase().replace(/\s+/g, " ");
}

function humanizeStatus(value) {
  const normalized = normalizeText(value).replace(/_/g, " ").trim();
  if (!normalized) return "Sin estado";

  return normalized
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function isValidDate(value) {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (!isValidDate(parsed)) return normalizeText(value) || "Sin fecha";
  return dateFormatter.format(parsed);
}

function formatDateTime(value) {
  if (!value) return "Sin actualizacion";
  const parsed = new Date(value);
  if (!isValidDate(parsed)) return normalizeText(value) || "Sin actualizacion";
  return dateTimeFormatter.format(parsed);
}

function formatRelativeTime(value) {
  if (!value) return "Sin fecha";

  const parsed = new Date(value);
  if (!isValidDate(parsed)) return formatDateTime(value);

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMinutes < 1) return "Ahora";
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} d`;
  return formatDateTime(parsed);
}

function getMetricValue(value) {
  return numberFormatter.format(Number(value) || 0);
}

function getBadgeVariant(status) {
  const value = normalizeStatus(status);

  if (["disponible", "resuelto", "confirmado", "activo"].includes(value)) return "success";
  if (["resguardado", "asignado", "en_proceso"].includes(value)) return "primary";
  if (["mantenimiento", "en_mantenimiento", "pendiente"].includes(value)) return "warning";
  if (["baja", "inactivo", "cerrado"].includes(value)) return "danger";
  return "secondary";
}

function getPriorityBadgeVariant(priority) {
  const value = normalizeStatus(priority);

  if (value === "alta") return "danger";
  if (value === "media") return "warning";
  if (value === "baja") return "info";
  return "secondary";
}

function getAssetLabel(asset) {
  return normalizeText(
    asset?.etiqueta_bien ||
      asset?.etiquetaBien ||
      asset?.numero_serie ||
      asset?.numeroSerie ||
      "Sin etiqueta"
  );
}

function getProductLabel(asset) {
  return normalizeText(
    asset?.producto?.completo ||
      asset?.producto?.nombre ||
      asset?.producto?.modelo ||
      asset?.producto?.marca ||
      asset?.tipo_activo ||
      "Sin producto"
  );
}

function getLocationLabel(asset) {
  return normalizeText(
    asset?.ubicacion?.completa ||
      asset?.ubicacion?.aula ||
      asset?.ubicacion?.edificio ||
      asset?.ubicacion?.campus ||
      [asset?.aula?.nombre, asset?.aula?.edificio?.nombre, asset?.aula?.edificio?.campus?.nombre]
        .filter(Boolean)
        .join(" ") ||
      "Sin ubicacion"
  );
}

function getReporteActivoLabel(reporte) {
  return normalizeText(
    reporte?.activo?.etiqueta_bien ||
      reporte?.activo?.etiquetaBien ||
      reporte?.activo?.numero_serie ||
      reporte?.activo?.numeroSerie ||
      "Sin activo"
  );
}

function getReporteDescripcion(reporte) {
  return normalizeText(
    reporte?.descripcion ||
      reporte?.tipo_falla ||
      reporte?.tipoFalla ||
      "Sin descripcion"
  );
}

function MetricCard({ icon, label, helper, value, tone = "blue" }) {
  return (
    <div className={`inv-dashboard__metric inv-dashboard__metric--${tone}`}>
      <div className="inv-dashboard__metric-icon" aria-hidden="true">
        {icon ? createElement(icon) : null}
      </div>
      <div className="inv-dashboard__metric-copy">
        <div className="inv-dashboard__metric-value">{value}</div>
        <div className="inv-dashboard__metric-label">{label}</div>
        <div className="inv-dashboard__metric-helper">{helper}</div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, action }) {
  return (
    <div className="inv-dashboard__sectionHeader">
      <div className="inv-dashboard__sectionHeading">
        <div className="inv-dashboard__sectionIcon" aria-hidden="true">
          {icon ? createElement(icon) : null}
        </div>
        <div>
          <h2 className="inv-dashboard__sectionTitle">{title}</h2>
          {subtitle ? <p className="inv-dashboard__sectionSubtitle">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="inv-dashboard__sectionAction">{action}</div> : null}
    </div>
  );
}

function ChartShell({ title, subtitle, icon: Icon, action, children, emptyMessage }) {
  return (
    <section className="inv-dashboard__panel inv-dashboard__panel--chart">
      <SectionHeader icon={Icon} title={title} subtitle={subtitle} action={action} />
      <div className="inv-dashboard__chartBox">
        {children ? (
          children
        ) : (
          <div className="inv-dashboard__emptyState">
            <p className="mb-1">{emptyMessage || "No hay datos disponibles"}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyTableState({ message }) {
  return (
    <div className="inv-dashboard__emptyState">
      <p className="mb-0">{message}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const { currentUser, logout, menuItems } = useUsers();
  const { data, isLoading, error, warnings, lastUpdated, refresh } = useDashboardData();

  const summary = data?.summary ?? {
    totalActivos: 0,
    activosDisponibles: 0,
    activosAsignados: 0,
    usuariosRegistrados: 0,
    reportesAbiertos: 0,
    mantenimientosPendientes: 0,
  };

  const activosPorEstado = data?.charts?.activosPorEstado ?? [];
  const topProductos = data?.charts?.topProductos ?? [];
  const reportesPorMes = data?.charts?.reportesPorMes ?? [];
  const recentActivos = data?.recentActivos ?? [];
  const recentReportes = data?.recentReportes ?? [];
  const recentActivity = data?.recentActivity ?? [];

  const metricCards = useMemo(
    () => [
      {
        key: "totalActivos",
        label: "Total activos",
        helper: "Activos registrados en el sistema",
        icon: FaBoxes,
        tone: "blue",
      },
      {
        key: "activosDisponibles",
        label: "Activos disponibles",
        helper: "Listos para asignacion",
        icon: FaCheckCircle,
        tone: "green",
      },
      {
        key: "activosAsignados",
        label: "Activos asignados",
        helper: "Con resguardo activo",
        icon: FaUserCheck,
        tone: "indigo",
      },
      {
        key: "usuariosRegistrados",
        label: "Usuarios registrados",
        helper: "Cuentas activas en la plataforma",
        icon: FaUsers,
        tone: "purple",
      },
      {
        key: "reportesAbiertos",
        label: "Reportes abiertos",
        helper: "Incidencias por atender",
        icon: FaExclamationTriangle,
        tone: "amber",
      },
      {
        key: "mantenimientosPendientes",
        label: "Mantenimientos pendientes",
        helper: "Casos en espera de resolucion",
        icon: FaTools,
        tone: "rose",
      },
    ],
    []
  );

  const hasActivity = recentActivity.length > 0;
  const hasWarnings = Array.isArray(warnings) && warnings.length > 0;

  return (
    <div className="inv-page inv-dashboard">
      <NavbarMenu title="Dashboard" onMenuClick={() => setOpenSidebar((value) => !value)} />

      <SidebarMenu
        open={openSidebar}
        onClose={() => setOpenSidebar(false)}
        userName={currentUser?.nombre_completo}
        items={menuItems}
        onViewProfile={() => {
          setOpenSidebar(false);
          if (currentUser?.id_usuario) {
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
        <div className="inv-dashboard__hero">
          <div className="inv-dashboard__heroCopy">
            <span className="inv-dashboard__eyebrow">Panel administrativo</span>
            <h1 className="inv-dashboard__title">Dashboard operativo</h1>
            <p className="inv-dashboard__subtitle">
              Datos reales de Spring Boot + MySQL conectados a <code>/api/dashboard</code> y a los modulos del sistema.
            </p>
            <div className="inv-dashboard__meta">
              <span>
                <FaHistory className="me-1" />
                Ultima actualizacion: {formatDateTime(lastUpdated)}
              </span>
            </div>
          </div>

          <div className="inv-dashboard__heroActions">
            <Button
              type="button"
              variant="outline-primary"
              className="inv-dashboard__actionBtn"
              onClick={refresh}
              disabled={isLoading}
            >
              <FaSyncAlt className={isLoading ? "inv-spin me-2" : "me-2"} />
              Actualizar
            </Button>
            <Button
              type="button"
              variant="primary"
              className="inv-dashboard__actionBtn"
              onClick={() => navigate("/registro-bien")}
            >
              <FaPlus className="me-2" />
              Registrar bien
            </Button>
            <Button
              type="button"
              variant="outline-secondary"
              className="inv-dashboard__actionBtn"
              onClick={() => navigate("/bienes-registrados")}
            >
              <FaClipboardList className="me-2" />
              Ver activos
            </Button>
          </div>
        </div>

        {error ? (
          <Alert variant="danger" className="inv-dashboard__alert">
            <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between">
              <div>
                <strong>No fue posible cargar el dashboard.</strong>
                <div>{error}</div>
              </div>
              <Button type="button" variant="light" onClick={refresh}>
                Reintentar
              </Button>
            </div>
          </Alert>
        ) : null}

        {hasWarnings ? (
          <Alert variant="warning" className="inv-dashboard__alert">
            <strong>Algunas secciones no respondieron.</strong>
            <ul className="mb-0 mt-2 ps-3">
              {warnings.map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        {isLoading && !data ? (
          <div className="inv-dashboard__loading">
            <Spinner animation="border" role="status" variant="primary" />
            <span>Cargando dashboard real...</span>
          </div>
        ) : null}

        {!isLoading || data ? (
          <>
            <section className="inv-dashboard__metrics">
              {metricCards.map((card) => (
                <MetricCard
                  key={card.key}
                  icon={card.icon}
                  label={card.label}
                  helper={card.helper}
                  tone={card.tone}
                  value={getMetricValue(summary?.[card.key])}
                />
              ))}
            </section>

            <section className="inv-dashboard__charts">
              <ChartShell
                icon={FaChartPie}
                title="Estado de activos"
                subtitle="Distribucion real de activos por estatus"
                emptyMessage="Aun no hay activos para graficar"
              >
                {activosPorEstado.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activosPorEstado}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={84}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {activosPorEstado.map((_, index) => (
                          <Cell key={`asset-status-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
              </ChartShell>

              <ChartShell
                icon={FaChartLine}
                title="Reportes por mes"
                subtitle="Tendencia de incidencias registradas"
                emptyMessage="Aun no hay reportes para mostrar"
              >
                {reportesPorMes.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportesPorMes} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2c5e91"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#6ea3d8", strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : null}
              </ChartShell>

              <ChartShell
                icon={FaChartLine}
                title="Top productos"
                subtitle="Productos con mas activos registrados"
                emptyMessage="Aun no hay productos para graficar"
              >
                {topProductos.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topProductos}
                      layout="vertical"
                      margin={{ top: 4, right: 20, left: 12, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" allowDecimals={false} stroke="#64748b" fontSize={12} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#64748b"
                        fontSize={12}
                        width={130}
                      />
                      <Tooltip />
                      <Bar dataKey="value" fill="#2c5e91" radius={[0, 10, 10, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </ChartShell>
            </section>

            <section className="inv-dashboard__tables">
              <article className="inv-dashboard__panel">
                <SectionHeader
                  icon={FaBoxes}
                  title="Ultimos activos"
                  subtitle="Registro reciente desde /api/activo"
                />

                {recentActivos.length > 0 ? (
                  <div className="table-responsive inv-dashboard__tableWrap">
                    <Table hover className="inv-dashboard__table mb-0 align-middle">
                      <thead>
                        <tr>
                          <th>Etiqueta</th>
                          <th>Numero serie</th>
                          <th>Producto</th>
                          <th>Ubicacion</th>
                          <th>Estatus</th>
                          <th>Fecha alta</th>
                          <th className="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentActivos.map((asset) => {
                          const assetId = asset?.id_activo ?? asset?.idActivo ?? asset?.id ?? null;

                          return (
                            <tr key={assetId ?? `${getAssetLabel(asset)}-${asset?.numero_serie ?? ""}`}>
                              <td className="fw-semibold">{getAssetLabel(asset)}</td>
                              <td>{normalizeText(asset?.numero_serie ?? asset?.numeroSerie ?? "Sin serie")}</td>
                              <td>{getProductLabel(asset)}</td>
                              <td>{getLocationLabel(asset)}</td>
                              <td>
                                <Badge bg={getBadgeVariant(asset?.estatus)}>
                                  {humanizeStatus(asset?.estatus)}
                                </Badge>
                              </td>
                              <td>{formatDate(asset?.fecha_alta ?? asset?.fechaAlta ?? asset?.fecha)}</td>
                              <td className="text-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => assetId && navigate(`/activo/${assetId}`)}
                                  disabled={!assetId}
                                >
                                  Ver
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <EmptyTableState message="No se encontraron activos recientes" />
                )}
              </article>

              <article className="inv-dashboard__panel">
                <SectionHeader
                  icon={FaClipboardList}
                  title="Reportes recientes"
                  subtitle="Ultimos movimientos desde /api/reporte"
                />

                {recentReportes.length > 0 ? (
                  <div className="table-responsive inv-dashboard__tableWrap">
                    <Table hover className="inv-dashboard__table mb-0 align-middle">
                      <thead>
                        <tr>
                          <th>Folio</th>
                          <th>Activo</th>
                          <th>Descripcion</th>
                          <th>Prioridad</th>
                          <th>Estatus</th>
                          <th>Fecha</th>
                          <th className="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentReportes.map((report) => {
                          const reportId = report?.id_reporte ?? report?.idReporte ?? report?.id ?? null;

                          return (
                            <tr key={reportId ?? `${report?.folio ?? ""}-${report?.fecha_reporte ?? ""}`}>
                              <td className="fw-semibold">{normalizeText(report?.folio ?? "Sin folio")}</td>
                              <td>{getReporteActivoLabel(report)}</td>
                              <td>{getReporteDescripcion(report)}</td>
                              <td>
                                <Badge bg={getPriorityBadgeVariant(report?.prioridad)}>
                                  {humanizeStatus(report?.prioridad)}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg={getBadgeVariant(report?.estatus)}>
                                  {humanizeStatus(report?.estatus)}
                                </Badge>
                              </td>
                              <td>{formatDate(report?.fecha_reporte ?? report?.fechaReporte ?? report?.fecha)}</td>
                              <td className="text-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline-primary"
                                  onClick={() => reportId && navigate(`/reporte/${reportId}`)}
                                  disabled={!reportId}
                                >
                                  Ver
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <EmptyTableState message="No se encontraron reportes recientes" />
                )}
              </article>
            </section>

            <section className="inv-dashboard__panel inv-dashboard__activityPanel">
              <SectionHeader
                icon={FaHistory}
                title="Actividad reciente"
                subtitle="Eventos recientes desde /api/historial"
              />

              {hasActivity ? (
                <div className="inv-dashboard__activityList">
                  {recentActivity.map((entry) => (
                    <div key={entry.id} className="inv-dashboard__activityItem">
                      <div className="inv-dashboard__activityDot" />
                      <div className="inv-dashboard__activityContent">
                        <div className="inv-dashboard__activityTitle">
                          {entry.titulo} <span className="text-muted">- {entry.tecnico}</span>
                        </div>
                        <div className="inv-dashboard__activityDetail">
                          {entry.detalle}
                        </div>
                        <div className="inv-dashboard__activityMeta">
                          {entry.codigo} | {formatRelativeTime(entry.fecha)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyTableState message="No hay actividad reciente disponible" />
              )}
            </section>
          </>
        ) : null}
      </Container>
    </div>
  );
}
