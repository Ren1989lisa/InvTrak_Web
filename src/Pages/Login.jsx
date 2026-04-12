import { useState } from "react";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import "./../Style/login.css";
import Logo from "../Components/Logo";
import FormInput from "../Components/FormInput";
import { useUsers } from "../context/UsersContext";
import { loginSchema } from "../utils/schemas";
import { ApiError } from "../api/apiClient";
import { getDefaultRouteByRole } from "../config/routes";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUsers();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit: submitForm,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { correo: "", password: "" },
  });

  const handleSubmit = submitForm(async (data) => {
    setError("");
    setSubmitting(true);
    try {
      const loggedIn = await login(data.correo.trim(), data.password);
      const fromRoute = location.state?.from?.pathname;
      const fallback = getDefaultRouteByRole(loggedIn?.rol);
      navigate(fromRoute || fallback, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Credenciales incorrectas");
      } else {
        setError("Error de conexión");
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Container fluid className="login-container">
        <Row className= "vh-100 align-items-center">
            <Col md={6} className="text-center text-light">
            <div className='logo-box'>
                <Logo></Logo>
                <h1 className='fw-bold'>InvTrack</h1>
                <p>
                 Sistema de Inventario,<br/>
                 Resguardos y <br/>
                 Mantenimiento de Activos con QR   
                </p>
            </div>
            </Col>
            <Col md={6} className="d-flex justify-content-center">
            <Card className="login-card p-4">

            <h3 className="mb-4 text-center">Bienvenido</h3>
            {error ? (
              <Alert variant="danger" className="py-2">
                {error}
              </Alert>
            ) : null}
            <Form onSubmit={handleSubmit}>
              <Controller
                name="correo"
                control={control}
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Correo Electrónico"
                    name={field.name}
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="password"
                control={control}
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Contraseña"
                    name={field.name}
                    type="password"
                    placeholder="********"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <div className="text-end mb-3 small">
                <Link to="/forgot-password" style={{ textDecoration: "none", color: "inherit" }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button
                variant="primary"
                className="login-btn w-100"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Ingresando..." : "Login"}
              </Button>
            </Form>

            </Card>
            </Col>
        </Row>

    </Container>
  )
}

export default Login
