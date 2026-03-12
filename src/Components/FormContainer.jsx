import { Card } from "react-bootstrap";

export default function FormContainer({ title, children }) {
  return (
    <Card className="inv-register-card shadow border-0">
      <Card.Body className="inv-register-card__body">
        <h2 className="inv-register-card__title">{title}</h2>
        {children}
      </Card.Body>
    </Card>
  );
}

