import { useState } from "react"; // 1. Agregado useState
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap"; // 2. Agregado Alert y Spinner
import { Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios"; // 3. Importar axios
import FormInput from "../Components/FormInput";
import { forgotPasswordSchema } from "../utils/schemas";
import "../Style/forgot-password.css";

function ForgotPassword() {
  // 4. Estados para manejar la UI
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  // 5. Unica función onSubmit corregida
  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    setError("");
    setMensaje("");

    try {
      // Petición al backend (asegúrate de que la ruta sea la correcta)
      await axios.post("http://localhost:8085/api/auth/forgot-password", {
        correo: data.email, // Aquí envías el campo que espera tu DTO
      });
      setMensaje("Se ha enviado un enlace de recuperación a tu correo.");
    } catch (err) {
      setError("No se pudo enviar el correo. Verifica que el email sea correcto.");
    } finally {
      setLoading(false);
    }
  });

  return (
    <Container fluid className="d-flex justify-content-center align-items-center forgot-password-container">
      <Row className="w-100 justify-content-center">
        <Col xs={11} sm={8} md={6} lg={4}>
          <Card className="p-4 forgot-password-card">
            <h3 className="text-center mb-2 fw-bold">¿Olvidaste tu contraseña?</h3>

            {/* 6. Renderizado condicional de alertas */}
            {mensaje && <Alert variant="success">{mensaje}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={onSubmit}>
              <Controller
                name="email"
                control={control}
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Correo electrónico"
                    name={field.name}
                    type="email"
                    placeholder="your.email@example.com"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Button type="submit" className="w-100 forgot-password-submit-btn" disabled={loading}>
                {loading ? <Spinner size="sm" /> : "Enviar"}
              </Button>
            </Form>

            <div className="text-center mt-3">
              <Link to="/" className="forgot-password-link"><span>←</span> Login</Link>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default ForgotPassword;