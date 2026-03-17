import { useMemo, useState } from "react";
import { Alert, Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

import NavbarMenu from "../Components/NavbarMenu";
import SearchBar from "../Components/SearchBar";
import AssetCard from "../Components/AssetCard";
import PaginationComponent from "../Components/PaginationComponent";
import FiltersModal from "../Components/FiltersModal";
import SidebarMenu from "../Components/SidebarMenu";
import { useUsers } from "../context/UsersContext";
import { getStoredActivos } from "../activosStorage";

import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/asignacion-bien.css";

function buildExportRows(activos) {
  return (Array.isArray(activos) ? activos : []).map((activo) => {
    const producto = activo?.producto ?? {};
    const ubicacion = activo?.ubicacion ?? {};
    return {
      id_activo: activo?.id_activo ?? "",
      codigo_interno: activo?.codigo_interno ?? "",
      numero_serie: activo?.numero_serie ?? "",
      tipo_activo: producto?.tipo_activo ?? activo?.tipo_activo ?? "",
      marca: producto?.marca ?? activo?.marca ?? "",
      modelo: producto?.modelo ?? activo?.modelo ?? "",
      descripcion: activo?.descripcion ?? "",
      propietario: activo?.propietario ?? "",
      estatus: activo?.estatus ?? "",
      costo: activo?.costo ?? "",
      fecha_alta: activo?.fecha_alta ?? "",
      campus: ubicacion?.campus ?? "",
      edificio: ubicacion?.edificio ?? "",
      aula: ubicacion?.aula ?? "",
    };
  });
}

export default function BienesRegistrados() {
  const [search, setSearch] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [activos] = useState(() => getStoredActivos());
  const [exportFeedback, setExportFeedback] = useState(null);
  const navigate = useNavigate();
  const { currentUser, setCurrentUserId } = useUsers();
  const query = search.trim().toLowerCase();

  const sidebarItems = [
    { icon: "grid", label: "Bienes", route: "/bienes-registrados" },
    { icon: "users", label: "Usuarios", route: "/usuarios" },
    { icon: "folder", label: "Catalogos", route: "/catalogos" },
    { icon: "report", label: "Reportes", route: "/reportes" },
    { icon: "clock", label: "Historial", route: "/historial" },
    { icon: "report", label: "Asignar Bien", route: "/asignar-bien" },
    { icon: "report", label: "Asignar Reporte", route: "/asignar-reporte" },
    { icon: "grid", label: "Dashboard", route: "/dashboard" },
    { icon: "box", label: "Registro de bienes", route: "/registro-bien" },
  ];

  const ubicaciones = useMemo(() => {
    const values = new Set();
    activos.forEach((a) => {
      const u = a?.ubicacion;
      const text = [u?.campus, u?.edificio, u?.aula].filter(Boolean).join(" ");
      if (text) values.add(text);
    });
    return Array.from(values);
  }, [activos]);

  const activosFiltrados = useMemo(() => {
    return activos.filter((a) => {
      const codigo = (a?.codigo_interno ?? "").toString().toLowerCase();
      const tipo = (a?.producto?.tipo_activo ?? a?.tipo_activo ?? "")
        .toString()
        .toLowerCase();
      const ubicacion = a?.ubicacion ?? {};
      const ubicacionTexto = [ubicacion?.campus, ubicacion?.edificio, ubicacion?.aula]
        .filter(Boolean)
        .join(" ");
      const fechaAlta = a?.fecha_alta ? new Date(a.fecha_alta) : null;
      const costo = Number(a?.costo ?? 0);

      if (query && !codigo.includes(query) && !tipo.includes(query)) return false;

      if (appliedFilters) {
        const { ubicacion: fUbicacion, fechaDesde, fechaHasta, precioMin, precioMax } =
          appliedFilters;

        if (fUbicacion && ubicacionTexto !== fUbicacion) return false;
        if (fechaDesde && fechaAlta && fechaAlta < new Date(fechaDesde)) return false;
        if (fechaHasta && fechaAlta && fechaAlta > new Date(fechaHasta)) return false;
        if (precioMin != null && Number.isFinite(precioMin) && costo < precioMin) return false;
        if (precioMax != null && Number.isFinite(precioMax) && costo > precioMax) return false;
      }

      return true;
    });
  }, [activos, query, appliedFilters]);

  const handleExportExcel = () => {
    setExportFeedback(null);
    try {
      const actuales = getStoredActivos();
      if (!actuales.length) {
        setExportFeedback({
          variant: "warning",
          message: "No hay bienes registrados para exportar.",
        });
        return;
      }

      const rows = buildExportRows(actuales);
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Bienes");

      const now = new Date();
      const datePart = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, "0")}-${`${now.getDate()}`.padStart(2, "0")}`;
      const fileName = `bienes_registrados_${datePart}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setExportFeedback({
        variant: "success",
        message: `Archivo exportado correctamente: ${fileName}`,
      });
    } catch {
      setExportFeedback({
        variant: "danger",
        message: "No fue posible generar el archivo Excel.",
      });
    }
  };

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Bienes registrados"
        onMenuClick={() => setOpenSidebar((v) => !v)}
      />

      <SidebarMenu
       open={openSidebar}
       onClose={() => setOpenSidebar(false)}
       userName={currentUser?.nombre_completo}
       items={sidebarItems}
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
        <SearchBar
          value={search}
          onChange={setSearch}
          onImport={handleExportExcel}
          onFilters={() => setShowFilters(true)}
          placeholder="Buscar por código o tipo de activo"
          firstActionLabel="Exportar a Excel"
        />

        {exportFeedback ? (
          <Alert variant={exportFeedback.variant} className="mt-3 mb-0">
            {exportFeedback.message}
          </Alert>
        ) : null}

        <FiltersModal
          show={showFilters}
          onHide={() => setShowFilters(false)}
          onApply={setAppliedFilters}
          onClear={() => setAppliedFilters(null)}
          ubicaciones={ubicaciones}
        />

        <Row className="g-4 mt-2">
          {activosFiltrados.map((activo) => (
            <Col md={4} key={activo.id_activo}>
              <AssetCard activo={activo} />
            </Col>
          ))}
        </Row>

        <PaginationComponent />
      </Container>
    </div>
  );
}
