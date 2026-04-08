import { useEffect, useMemo, useState } from "react";
import { Col, Container, Row, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import SearchBar from "../Components/SearchBar";
import PrimaryButton from "../Components/PrimaryButton";
import FilterDropdown from "../Components/FilterDropdown";
import UsersTable from "../Components/UsersTable";
import PaginationComponent from "../Components/PaginationComponent";
import { useUsers } from "../context/UsersContext";
import { getUsuarios } from "../services/userService";

import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/usuarios.css";

export default function Usuarios() {
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRol, setFilterRol] = useState("todos");
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { currentUser, logout, menuItems } = useUsers();

  const query = search.trim().toLowerCase();

  useEffect(() => {
    let active = true;

    async function loadUsuarios() {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const list = await getUsuarios();
        if (!active) return;
        setUsuarios(Array.isArray(list) ? list : []);
      } catch (error) {
        if (!active) return;
        if (error?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setErrorMsg("No se pudo cargar la lista de usuarios.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadUsuarios();
    return () => {
      active = false;
    };
  }, [navigate]);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const nombre = (u?.nombre ?? u?.nombre_completo ?? "").toString().toLowerCase();
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
        <Row className="align-items-center g-2 inv-users-actions">
          <Col xs="auto">
          <Button
          type="button"
          variant="link"
          className="inv-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Regresar
        </Button>
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

        {errorMsg ? (
          <Alert variant="danger" className="mt-3 mb-0">
            {errorMsg}
          </Alert>
        ) : null}
        {isLoading ? (
          <Alert variant="info" className="mt-3 mb-0">
            Cargando usuarios...
          </Alert>
        ) : null}

        <div className="mt-3">
          <UsersTable
            usuarios={usuariosFiltrados}
            onUserSelect={(usuario) => navigate(`/perfil/${usuario.id_usuario}`)}
            onUserEdit={(usuario) => navigate(`/perfil/${usuario.id_usuario}/editar`)}
          />
          {!isLoading && usuariosFiltrados.length === 0 ? (
            <Alert variant="secondary" className="mt-3 mb-0">
              No hay usuarios para mostrar.
            </Alert>
          ) : null}
          <PaginationComponent />
        </div>
      </Container>
    </div>
  );
}

