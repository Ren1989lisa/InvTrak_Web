import { useEffect, useMemo, useState } from "react";
import { Col, Container, Row, Button, Alert } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import SearchBar from "../Components/SearchBar";
import PrimaryButton from "../Components/PrimaryButton";
import FilterDropdown from "../Components/FilterDropdown";
import UsersTable from "../Components/UsersTable";
import PaginationComponent from "../Components/PaginationComponent";
import DeleteConfirmModal from "../Components/DeleteConfirmModal";
import { useUsers } from "../context/UsersContext";
import { getUsuarios, deleteUsuario } from "../services/userService";

import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/usuarios.css";

export default function Usuarios() {
  const ITEMS_PER_PAGE = 12;
  const navigate = useNavigate();
  const location = useLocation();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRol, setFilterRol] = useState("todos");
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { currentUser, logout, menuItems } = useUsers();
  const isAdmin = (currentUser?.rol ?? "").toString().toLowerCase() === "admin";

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

  useEffect(() => {
    const toastMessage = location.state?.toastMessage;
    if (!toastMessage) return;

    setSuccessMsg(toastMessage);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const nombre = (u?.nombre ?? u?.nombre_completo ?? "").toString().toLowerCase();
      const rol = (u?.rol ?? "").toString().toLowerCase();

      const matchesSearch = !query || nombre.includes(query) || rol.includes(query);
      const matchesFilter = filterRol === "todos" || rol === filterRol;

      return matchesSearch && matchesFilter;
    });
  }, [usuarios, query, filterRol]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, filterRol]);

  const totalPages = Math.max(1, Math.ceil(usuariosFiltrados.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const usuariosPaginados = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return usuariosFiltrados.slice(start, start + ITEMS_PER_PAGE);
  }, [usuariosFiltrados, currentPage]);

  const handleDeleteClick = (usuario) => {
    if (Number(usuario?.id_usuario) === Number(currentUser?.id_usuario)) {
      setErrorMsg("No puedes eliminarte a ti mismo.");
      setSuccessMsg("");
      return;
    }
    setUserToDelete(usuario);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await deleteUsuario(userToDelete.id_usuario);
      setSuccessMsg(`Usuario ${userToDelete.nombre ?? userToDelete.nombre_completo} eliminado correctamente.`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      
      const list = await getUsuarios();
      setUsuarios(Array.isArray(list) ? list : []);
    } catch (error) {
      if (error?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setErrorMsg(error?.message || "No fue posible eliminar el usuario.");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

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
          <Alert variant="danger" className="mt-3 mb-0" dismissible onClose={() => setErrorMsg("")}>
            {errorMsg}
          </Alert>
        ) : null}
        {successMsg ? (
          <Alert variant="success" className="mt-3 mb-0" dismissible onClose={() => setSuccessMsg("")}>
            {successMsg}
          </Alert>
        ) : null}
        {isLoading ? (
          <Alert variant="info" className="mt-3 mb-0">
            Cargando usuarios...
          </Alert>
        ) : null}

        <div className="mt-3">
          <UsersTable
            usuarios={usuariosPaginados}
            onUserSelect={(usuario) => navigate(`/perfil/${usuario.id_usuario}`)}
            onUserEdit={(usuario) => navigate(`/perfil/${usuario.id_usuario}/editar`)}
            onUserDelete={handleDeleteClick}
            canEdit={isAdmin}
          />
          {!isLoading && usuariosFiltrados.length === 0 ? (
            <Alert variant="secondary" className="mt-3 mb-0">
              No hay usuarios para mostrar.
            </Alert>
          ) : null}
          <PaginationComponent
            currentPage={currentPage}
            totalItems={usuariosFiltrados.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>

        <DeleteConfirmModal
          show={showDeleteModal}
          onHide={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          userName={userToDelete?.nombre ?? userToDelete?.nombre_completo ?? ""}
          isDeleting={isDeleting}
        />
      </Container>
    </div>
  );
}

