import { useMemo, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import SearchBar from "../Components/SearchBar";
import PrimaryButton from "../Components/PrimaryButton";
import FilterDropdown from "../Components/FilterDropdown";
import UsersTable from "../Components/UsersTable";
import PaginationComponent from "../Components/PaginationComponent";
import { useUsers } from "../context/UsersContext";

import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/usuarios.css";

export default function Usuarios() {
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRol, setFilterRol] = useState("todos");
  const { users, currentUser, setCurrentUserId } = useUsers();

  const usuarios = Array.isArray(users) ? users : [];
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

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const nombre = (u?.nombre_completo ?? "").toString().toLowerCase();
      const rol = (u?.rol ?? "").toString().toLowerCase();

      const matchesSearch = !query || nombre.includes(query) || rol.includes(query);
      const matchesFilter = filterRol === "todos" || rol === filterRol;

      return matchesSearch && matchesFilter;
    });
  }, [usuarios, query, filterRol]);

  return (
    <div className="inv-page">
      <NavbarMenu title="Usuarios" onMenuClick={() => setOpenSidebar((v) => !v)} />

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
        <Row className="align-items-center g-2 inv-users-actions">
          <Col xs="auto">
            <PrimaryButton
              variant="light"
              label="←"
              className="inv-btn inv-btn--secondary inv-users-backBtn"
              onClick={() => navigate("/bienes-registrados")}
            />
          </Col>

          <Col>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Buscar usuarios..."
              showActions={false}
            />
          </Col>

          <Col xs="auto">
            <FilterDropdown value={filterRol} onSelect={setFilterRol} />
          </Col>

          <Col xs="auto">
            <PrimaryButton
              variant="primary"
              label="Agregar usuarios"
              className="inv-users-addBtn"
              onClick={() => navigate("/usuarios/registrar")}
            />
          </Col>
        </Row>

        <div className="mt-3">
          <UsersTable
            usuarios={usuariosFiltrados}
            onUserSelect={(usuario) => navigate(`/perfil/${usuario.id_usuario}`)}
            onUserEdit={(usuario) => navigate(`/perfil/${usuario.id_usuario}/editar`)}
          />
          <PaginationComponent />
        </div>
      </Container>
    </div>
  );
}

