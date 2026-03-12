import { useMemo, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import usuariosData from "../data/usuarios.json";

import NavbarMenu from "../Components/NavbarMenu";
import SearchBar from "../Components/SearchBar";
import AssetCard from "../Components/AssetCard";
import PaginationComponent from "../Components/PaginationComponent";
import SidebarMenu from "../Components/SidebarMenu";

import activosData from "../data/activosDetalle.json";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";

export default function BienesRegistrados() {
  const [search, setSearch] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);
  const navigate = useNavigate();
  const usuarioLogeado = usuariosData[0];

  const activos = Array.isArray(activosData) ? activosData : [];
  const query = search.trim().toLowerCase();

  const sidebarItems = [
    { icon: "grid", label: "Bienes", route: "/bienes-registrados" },
    { icon: "users", label: "Usuarios", route: "/usuarios" },
    { icon: "box", label: "Activos", route: "/activos" },
    { icon: "folder", label: "Catalogos", route: "/catalogos" },
    { icon: "report", label: "Reportes", route: "/reportes" },
    { icon: "clock", label: "Historial", route: "/historial" },
  ];

  const activosFiltrados = useMemo(() => {
    if (!query) return activos;

    return activos.filter((a) => {
      const codigo = (a?.codigo_interno ?? "").toString().toLowerCase();
      const tipo = (a?.tipo_activo ?? "").toString().toLowerCase();
      return codigo.includes(query) || tipo.includes(query);
    });
  }, [activos, query]);

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Bienes registrados"
        onMenuClick={() => setOpenSidebar((v) => !v)}
      />

      <SidebarMenu
       open={openSidebar}
       onClose={() => setOpenSidebar(false)}
       userName={usuarioLogeado.nombre_completo}
       items={sidebarItems}
       onViewProfile={() => {
       setOpenSidebar(false);
       navigate("/perfil");
         }}
       onLogout={() => {
       setOpenSidebar(false);
       navigate("/");
        }}
      />  

      <Container fluid className="inv-content px-3 px-md-4 py-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código o tipo de activo"
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
