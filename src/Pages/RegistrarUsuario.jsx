import { useEffect, useMemo, useState } from "react";
import { Alert, Container, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import FormContainer from "../Components/FormContainer";
import FormInput from "../Components/FormInput";
import FormSelect from "../Components/FormSelect";
import PrimaryButton from "../Components/PrimaryButton";
import { usuarioSchema } from "../utils/schemas";
import { createUsuario, getUsuarios } from "../services/userService";
import "../Style/registrar-usuario.css";

const INITIAL_VALUES = {
  nombre: "",
  correo: "",
  fecha_nacimiento: "",
  curp: "",
  rol: "",
  numero_empleado: "",
  area: "",
};

const ROL_OPTIONS = [
  { value: "tecnico", label: "tecnico" },
  { value: "usuario", label: "usuario" },
];

export default function RegistrarUsuario() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usersList = useMemo(() => (Array.isArray(users) ? users : []), [users]);

  useEffect(() => {
    let active = true;
    async function loadUsers() {
      try {
        const list = await getUsuarios();
        if (!active) return;
        setUsers(Array.isArray(list) ? list : []);
      } catch {
        if (!active) return;
        setUsers([]);
      }
    }
    loadUsers();
    return () => {
      active = false;
    };
  }, []);

  const {
    control,
    handleSubmit,
    reset,
  } = useForm({
    resolver: zodResolver(usuarioSchema),
    defaultValues: INITIAL_VALUES,
  });

  const onSubmit = handleSubmit(async (data) => {
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const empleadoDuplicado = usersList.some(
      (u) => (u?.numero_empleado ?? "").toString() === data.numero_empleado
    );
    if (empleadoDuplicado) {
      setError("El número de empleado ya existe.");
      return;
    }

    const correoDuplicado = usersList.some(
      (u) => (u?.correo ?? "").toString().toLowerCase() === data.correo.toLowerCase()
    );
    if (correoDuplicado) {
      setError("El correo ya está registrado.");
      return;
    }

    try {
      await createUsuario({
        ...data,
        password: data.numero_empleado,
      });
      setSuccess("Usuario registrado correctamente.");
      reset(INITIAL_VALUES);
      const refreshed = await getUsuarios();
      setUsers(Array.isArray(refreshed) ? refreshed : []);
      window.setTimeout(() => {
        navigate("/usuarios");
      }, 800);
    } catch (err) {
      if (err?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(err?.message || "No fue posible registrar el usuario.");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="inv-register-page">
      <Container className="inv-register-container py-4">
        <FormContainer title="Registro de Usuarios">
          {error ? <Alert variant="danger">{error}</Alert> : null}
          {success ? <Alert variant="success">{success}</Alert> : null}

          <Form onSubmit={onSubmit} className="inv-register__form">
            <Controller
              name="nombre"
              control={control}
              render={({ field, fieldState }) => (
                <FormInput
                  label="Nombre completo"
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Ingresa el nombre completo"
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="correo"
              control={control}
              render={({ field, fieldState }) => (
                <FormInput
                  label="Correo electrónico"
                  name={field.name}
                  type="email"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="ejemplo@correo.com"
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="fecha_nacimiento"
              control={control}
              render={({ field, fieldState }) => (
                <FormInput
                  label="Fecha de nacimiento"
                  name={field.name}
                  type="date"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="curp"
              control={control}
              render={({ field, fieldState }) => (
                <FormInput
                  label="CURP"
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="18 caracteres"
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="rol"
              control={control}
              render={({ field, fieldState }) => (
                <FormSelect
                  label="Rol"
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={ROL_OPTIONS}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="numero_empleado"
              control={control}
              render={({ field, fieldState }) => (
                <FormInput
                  label="Número de empleado"
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Ej. 0810"
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="area"
              control={control}
              render={({ field, fieldState }) => (
                <FormInput
                  label="Área o departamento"
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Ej. Soporte Técnico"
                  error={fieldState.error?.message}
                />
              )}
            />

            <div className="inv-register__actions">
              <PrimaryButton
                type="button"
                variant="light"
                label="Cancelar"
                className="inv-register__cancel"
                onClick={() => navigate("/usuarios")}
              />
              <PrimaryButton
                type="submit"
                variant="primary"
                label={isSubmitting ? "Registrando..." : "Registrar"}
                className="inv-register__submit"
                disabled={isSubmitting}
              />
            </div>
          </Form>
        </FormContainer>
      </Container>
    </div>
  );
}

