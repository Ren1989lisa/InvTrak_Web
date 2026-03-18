import { useMemo, useState } from "react";
import { Alert, Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SearchBar from "../Components/SearchBar";
import AssetCard from "../Components/AssetCard";
import SidebarMenu from "../Components/SidebarMenu";
import { useUsers } from "../context/UsersContext";
import { getStoredActivos } from "../activosStorage";
import { getStoredResguardos } from "../resguardosStorage";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";

export default function MisBienes() {
  const [search, setSearch] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);
  const navigate = useNavigate();
  const { currentUser, setCurrentUserId, menuItems } = useUsers();

  const activos = useMemo(() => getStoredActivos(), []);
  const resguardos = useMemo(() => getStoredResguardos(), []);
  const query = search.trim().toLowerCase();

  const misBienes = useMemo(() => {
    const idUsuario = Number(currentUser?.id_usuario);
    const idsDesdeResguardos = new Set(
      resguardos
        .filter((r) => Number(r?.id_usuario) === idUsuario)
        .map((r) => Number(r?.id_activo))
    );
    return activos.filter(
      (a) =>
        Number(a?.id_usuario_asignado) === idUsuario ||
        idsDesdeResguardos.has(Number(a?.id_activo))
    );
  }, [activos, resguardos, currentUser?.id_usuario]);

  const activosFiltrados = useMemo(() => {
    return misBienes.filter((a) => {
      const codigo = (a?.codigo_interno ?? "").toString().toLowerCase();
      const tipo = (a?.producto?.tipo_activo ?? a?.tipo_activo ?? "").toString().toLowerCase();
      if (!query) return true;
      return codigo.includes(query) || tipo.includes(query);
    });
  }, [misBienes, query]);

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Mis bienes"
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
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código o tipo de activo"
        />

        {misBienes.length === 0 ? (
          <Alert variant="info" className="mt-3">
            No tienes bienes asignados. Contacta al administrador para que te asigne activos.
          </Alert>
        ) : (
          <Row className="g-4 mt-2">
            {activosFiltrados.map((activo) => (
              <Col md={4} key={activo.id_activo}>
                <AssetCard activo={activo} />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
}
