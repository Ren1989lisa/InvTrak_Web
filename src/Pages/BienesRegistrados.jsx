import { useMemo, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import SearchBar from "../Components/SearchBar";
import AssetCard from "../Components/AssetCard";
import PaginationComponent from "../Components/PaginationComponent";
import FiltersModal from "../Components/FiltersModal";

import activosData from "../Data/activosDetalle.json";
import "../Style/bienes-registrados.css";

export default function BienesRegistrados() {
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null);

  const activos = useMemo(() => (Array.isArray(activosData) ? activosData : []), []);
  const query = search.trim().toLowerCase();

  // derive options for selects
  const tipos = useMemo(() => {
    const s = new Set();
    activos.forEach((a) => a?.tipo_activo && s.add(a.tipo_activo));
    return Array.from(s);
  }, [activos]);

  const estados = useMemo(() => {
    const s = new Set();
    activos.forEach((a) => a?.estatus && s.add(a.estatus));
    return Array.from(s);
  }, [activos]);

  const ubicaciones = useMemo(() => {
    const s = new Set();
    activos.forEach((a) => {
      const u = a?.ubicacion;
      if (!u) return;
      const combined = [u.campus, u.edificio, u.aula].filter(Boolean).join(" ");
      s.add(combined);
    });
    return Array.from(s);
  }, [activos]);

  function handleApplyFilters(filters) {
    setAppliedFilters(filters);
  }

  function handleClearFilters() {
    setAppliedFilters(null);
  }

  const activosFiltrados = useMemo(() => {
    // start from all activos
    return activos.filter((a) => {
      // search query filter (codigo or tipo)
      if (query) {
        const codigo = (a?.codigo_interno ?? "").toString().toLowerCase();
        const tipo = (a?.tipo_activo ?? "").toString().toLowerCase();
        if (!codigo.includes(query) && !tipo.includes(query)) return false;
      }

      // applied filters
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

        if (etiqueta) {
          const codigo = (a?.codigo_interno ?? "").toString().toLowerCase();
          if (!codigo.includes(etiqueta.toLowerCase())) return false;
        }

        if (fTipo) {
          if ((a?.tipo_activo ?? "") !== fTipo) return false;
        }

        if (fEstado) {
          if ((a?.estatus ?? "") !== fEstado) return false;
        }

        if (fUbicacion) {
          const u = a?.ubicacion;
          const combined = u ? [u.campus, u.edificio, u.aula].filter(Boolean).join(" ") : "";
          if (combined !== fUbicacion) return false;
        }

        if (fechaDesde || fechaHasta) {
          const fecha = a?.fecha_alta ? new Date(a.fecha_alta) : null;
          if (fecha) {
            if (fechaDesde) {
              const desde = new Date(fechaDesde);
              if (fecha < desde) return false;
            }
            if (fechaHasta) {
              const hasta = new Date(fechaHasta);
              if (fecha > hasta) return false;
            }
          }
        }

        if (precioMin != null) {
          if (Number.isFinite(precioMin)) {
            if ((a?.costo ?? 0) < precioMin) return false;
          }
        }

        if (precioMax != null) {
          if (Number.isFinite(precioMax)) {
            if ((a?.costo ?? 0) > precioMax) return false;
          }
        }
      }

      return true;
    });
  }, [activos, query, appliedFilters]);

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Bienes registrados"
        onMenuClick={() => setSidebarOpen(true)}
      />

      <SidebarMenu
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName="Administrador"
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
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
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
