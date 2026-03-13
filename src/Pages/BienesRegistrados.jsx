import { useMemo, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

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

export default function BienesRegistrados() {
  const [search, setSearch] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null);
  const navigate = useNavigate();
  const { currentUser, setCurrentUserId } = useUsers();

  const activos = useMemo(() => getStoredActivos(), []);
  const query = search.trim().toLowerCase();

  const sidebarItems = [
    { icon: "grid", label: "Bienes", route: "/bienes-registrados" },
    { icon: "users", label: "Usuarios", route: "/usuarios" },
    { icon: "folder", label: "Catalogos", route: "/catalogos" },
    { icon: "report", label: "Reportes", route: "/reportes" },
    { icon: "clock", label: "Historial", route: "/historial" },
    { icon: "report", label: "Asignar Bien", route: "/asignar-bien" },
    { icon: "grid", label: "Dashboard", route: "/dashboard" },
    { icon: "box", label: "Registro de bienes", route: "/registro-bien" },
  ];

  const tipos = useMemo(() => {
    const values = new Set();
    activos.forEach((a) => {
      const tipo = (a?.producto?.tipo_activo ?? a?.tipo_activo ?? "").toString().trim();
      if (tipo) values.add(tipo);
    });
    return Array.from(values);
  }, [activos]);

  const estados = useMemo(() => {
    const values = new Set();
    activos.forEach((a) => {
      const estado = (a?.estatus ?? "").toString().trim();
      if (estado) values.add(estado);
    });
    return Array.from(values);
  }, [activos]);

  const ubicaciones = useMemo(() => {
    const values = new Set();
    activos.forEach((a) => {
      const u = a?.ubicacion;
      if (!u) return;
      const combined = [u.campus, u.edificio, u.aula].filter(Boolean).join(" ");
      if (combined) values.add(combined);
    });
    return Array.from(values);
  }, [activos]);

  const activosFiltrados = useMemo(() => {
    return activos.filter((a) => {
      const codigo = (a?.codigo_interno ?? "").toString().toLowerCase();
      const tipo = (a?.producto?.tipo_activo ?? a?.tipo_activo ?? "")
        .toString()
        .toLowerCase();

      if (query && !codigo.includes(query) && !tipo.includes(query)) return false;

      if (appliedFilters) {
        const {
          etiqueta,
          tipo: fTipo,
          estado: fEstado,
          ubicacion: fUbicacion,
          fechaDesde,
          fechaHasta,
          precioMin,
          precioMax,
        } = appliedFilters;

        if (etiqueta && !codigo.includes(etiqueta.toLowerCase())) return false;
        if (fTipo && (a?.producto?.tipo_activo ?? a?.tipo_activo ?? "") !== fTipo) return false;
        if (fEstado && (a?.estatus ?? "") !== fEstado) return false;

        if (fUbicacion) {
          const u = a?.ubicacion;
          const combined = u ? [u.campus, u.edificio, u.aula].filter(Boolean).join(" ") : "";
          if (combined !== fUbicacion) return false;
        }

        if (fechaDesde || fechaHasta) {
          const fecha = a?.fecha_alta ? new Date(a.fecha_alta) : null;
          if (fecha) {
            if (fechaDesde && fecha < new Date(fechaDesde)) return false;
            if (fechaHasta && fecha > new Date(fechaHasta)) return false;
          }
        }

        if (precioMin != null && Number.isFinite(precioMin) && (a?.costo ?? 0) < precioMin) {
          return false;
        }
        if (precioMax != null && Number.isFinite(precioMax) && (a?.costo ?? 0) > precioMax) {
          return false;
        }
      }

      return true;
    });
  }, [activos, query, appliedFilters]);

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
          onFilters={() => setShowFilters(true)}
          placeholder="Buscar por código o tipo de activo"
        />

        <FiltersModal
          show={showFilters}
          onHide={() => setShowFilters(false)}
          onApply={setAppliedFilters}
          onClear={() => setAppliedFilters(null)}
          ubicaciones={ubicaciones}
          tipos={tipos}
          estados={estados}
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
