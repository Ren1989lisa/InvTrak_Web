import { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "../api/apiClient";
import "../Style/reset-password.css";

const resetSchema = z
  .object({
    newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

function PasswordInput({ label, placeholder, field, fieldState }) {
  const [show, setShow] = useState(false);
  return (
    <Form.Group className="mb-3">
      <Form.Label className="reset-label">{label}</Form.Label>
      <div className="reset-input-wrapper">
        <Form.Control
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          isInvalid={!!fieldState.error}
          className="reset-input"
        />
        <button
          type="button"
          className="reset-eye-btn"
          onClick={() => setShow((v) => !v)}
          tabIndex={-1}
        >
          {show ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4E8EA2" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4E8EA2" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
        {fieldState.error && (
          <Form.Control.Feedback type="invalid">
            {fieldState.error.message}
          </Form.Control.Feedback>
        )}
      </div>
    </Form.Group>
  );
}

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  if (!token) {
    return (
      <div className="reset-container">
        <Container fluid className="d-flex justify-content-center align-items-center min-vh-100">
          <Alert variant="danger" className="text-center">
            Token inválido o expirado.{" "}
            <Link to="/forgot-password">Solicitar nuevo enlace</Link>
          </Alert>
        </Container>
      </div>
    );
  }

  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true);
    setStatus(null);
    setErrorMsg("");
    try {
      await apiRequest(
        "/auth/reset-password",
        "POST",
        { token, newPassword: data.newPassword, confirmPassword: data.confirmPassword },
        {},
        { omitAuth: true }
      );
      setStatus("success");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err?.message?.includes("expirado")
          ? "El enlace ha expirado. Solicita uno nuevo."
          : err?.message || "Error al cambiar la contraseña"
      );
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="reset-container">
      <Container fluid className="d-flex justify-content-center align-items-center min-vh-100">
        <Row className="w-100 justify-content-center">
          <Col xs={11} sm={8} md={5} lg={4}>
            <Card className="reset-card">
              <h4 className="reset-title">Crear una nueva contraseña</h4>

              {status === "success" && (
                <Alert variant="success" className="mt-2">
                  ¡Contraseña actualizada! Redirigiendo al login...
                </Alert>
              )}
              {status === "error" && (
                <Alert variant="danger" className="mt-2">{errorMsg}</Alert>
              )}

              {status !== "success" && (
                <Form onSubmit={onSubmit} className="mt-3">
                  <Controller
                    name="newPassword"
                    control={control}
                    render={({ field, fieldState }) => (
                      <PasswordInput
                        label="Nueva contraseña"
                        placeholder="Ingresa tu nueva contraseña"
                        field={field}
                        fieldState={fieldState}
                      />
                    )}
                  />
                  <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field, fieldState }) => (
                      <PasswordInput
                        label="Confirma tu contraseña"
                        placeholder="Ingresa tu nueva contraseña"
                        field={field}
                        fieldState={fieldState}
                      />
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-100 reset-btn mt-2"
                    disabled={submitting}
                  >
                    {submitting ? "Guardando..." : "Reestablecer contraseña"}
                  </Button>
                </Form>
              )}

              <div className="text-center mt-3">
                <Link to="/login" className="reset-back-link">
                  ← Regresar al inicio
                </Link>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default ResetPassword;
