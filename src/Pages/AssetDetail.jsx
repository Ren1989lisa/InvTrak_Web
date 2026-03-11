import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";
import NavbarMenu from "../Components/NavbarMenu";
import AssetDetailCard from "../Components/AssetDetailCard";
import activosData from "../data/activosDetalle.json";
import "../Style/bienes-registrados.css";
import "../Style/asset-detail.css";

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const activos = Array.isArray(activosData) ? activosData : [];
  const idNum = Number(id);

  const activo = useMemo(
    () => activos.find((a) => a.id_activo === idNum),
    [activos, idNum]
  );

  return (
    <div className="inv-page inv-page--detail">
      <NavbarMenu title="Detalle del activo" />

      <Container fluid className="inv-content inv-content--detail px-3 px-md-4 py-3">
        <Button
          type="button"
          variant="link"
          className="inv-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Regresar
        </Button>

        {activo ? (
          <Row className="justify-content-center mt-3">
            <Col xs={12} md={10} lg={8}>
              <AssetDetailCard activo={activo} />
            </Col>
          </Row>
        ) : (
          <div className="inv-detail-not-found">
            <p>Activo no encontrado.</p>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate("/bienes-registrados")}
            >
              Volver a bienes registrados
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}
