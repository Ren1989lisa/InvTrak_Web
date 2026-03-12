import { Card, Col, Row } from "react-bootstrap";
import ProfileField from "./ProfileField";

export default function ProfileInfoCard({ usuario }) {
  if (!usuario) return null;

  return (
    <Card className="inv-profile-card shadow-sm border-0">
      <Card.Body className="inv-profile-card__body">
        <Row>
          <Col xs={12} md={6} className="inv-profile-card__col">
            <ProfileField label="Nombre completo" value={usuario.nombre_completo} />
            <ProfileField label="Correo electrónico" value={usuario.correo} />
            <ProfileField
              label="Fecha de nacimiento"
              value={usuario.fecha_nacimiento}
            />
            <ProfileField label="CURP" value={usuario.curp} />
          </Col>
          <Col xs={12} md={6} className="inv-profile-card__col">
            <ProfileField label="Rol" value={usuario.rol} />
            <ProfileField
              label="Número de empleado"
              value={usuario.numero_empleado}
            />
            <ProfileField
              label="Área / Departamento"
              value={usuario.departamento}
            />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

