import { useState } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import FormInput from "../Components/FormInput";
import "../Style/forgot-password.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Enviar link de recuperación a:", email);
  };

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center forgot-password-container"
    >
      <Row className="w-100 justify-content-center">
        <Col xs={11} sm={8} md={6} lg={4}>
          <Card className="p-4 forgot-password-card">
            <div className="forgot-password-icon-wrapper">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 11H6C4.9 11 4 11.9 4 13V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V13C20 11.9 19.1 11 18 11ZM18 19H6V13H18V19ZM12 16C13.1 16 14 15.1 14 14C14 12.9 13.1 12 12 12C10.9 12 10 12.9 10 14C10 15.1 10.9 16 12 16ZM9 11V7C9 4.24 11.24 2 14 2C16.76 2 19 4.24 19 7V11H17V7C17 5.35 15.65 4 14 4C12.35 4 11 5.35 11 7V11H9Z"
                  fill="#194567"
                />
              </svg>
            </div>

            <h3 className="text-center mb-2 fw-bold forgot-password-title">
              ¿Olvidaste tu contraseña?
            </h3>

            <p className="text-center mb-4 forgot-password-description">
              Ingresa tu correo, te enviaremos un link para restablecer la
              contraseña
            </p>

            <Form onSubmit={handleSubmit}>
              <FormInput
                label="Correo electrónico"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="forgot-password-input"
                required
              />

              <p className="mb-3 forgot-password-help-text">
                Te enviaremos instrucciones a este correo para cambiar tu
                contraseña.
              </p>

              <Button
                type="submit"
                className="w-100 forgot-password-submit-btn"
              >
                Enviar
              </Button>
            </Form>

            <div className="text-center mt-3">
              <Link to="/" className="forgot-password-link">
                <span>←</span> Login
              </Link>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ForgotPassword;

