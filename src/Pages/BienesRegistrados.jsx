import { useMemo, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";

import NavbarMenu from "../Components/NavbarMenu";
import SearchBar from "../Components/SearchBar";
import AssetCard from "../Components/AssetCard";
import PaginationComponent from "../Components/PaginationComponent";

import activosData from "../data/activosDetalle.json";
import "../Style/bienes-registrados.css";

export default function BienesRegistrados() {
  const [search, setSearch] = useState("");

  const activos = Array.isArray(activosData) ? activosData : [];
  const query = search.trim().toLowerCase();

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
      <NavbarMenu title="Bienes registrados" />

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
