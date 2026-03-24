import { useMemo, useState } from "react";
import { Alert, Container, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import FormContainer from "../Components/FormContainer";
import FormInput from "../Components/FormInput";
import FormSelect from "../Components/FormSelect";
import PrimaryButton from "../Components/PrimaryButton";
import { useUsers } from "../context/UsersContext";
import { usuarioSchema } from "../utils/schemas";
import "../Style/registrar-usuario.css";

const INITIAL_VALUES = {
  nombre_completo: "",
  correo: "",
  fecha_nacimiento: "",
  curp: "",
  rol: "",
  numero_empleado: "",
  departamento: "",
};

const ROL_OPTIONS = [
  { value: "usuario", label: "usuario" },
  { value: "tecnico", label: "tecnico" },
  { value: "admin", label: "admin" },
];

export default function RegistrarUsuario() {
  const navigate = useNavigate();
  const { users, addUser } = useUsers();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const usersList = useMemo(() => (Array.isArray(users) ? users : []), [users]);

  const {
    control,
    handleSubmit,
    reset,
  } = useForm({
    resolver: zodResolver(usuarioSchema),
    defaultValues: INITIAL_VALUES,
  });

  const onSubmit = handleSubmit((data) => {
    setError("");
    setSuccess("");

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

    if (data.rol === "admin") {
      const alreadyAdmin = usersList.some((u) => (u?.rol ?? "") === "admin");
      if (alreadyAdmin) {
        setError("Solo puede existir un usuario con rol admin.");
        return;
      }
    }

    const maxId = usersList.reduce((max, user) => {
      const id = Number(user?.id_usuario ?? 0);
      return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0);

    const nuevoUsuario = {
      id_usuario: maxId + 1,
      nombre_completo: data.nombre_completo,
      correo: data.correo,
      fecha_nacimiento: data.fecha_nacimiento,
      curp: data.curp,
      numero_empleado: data.numero_empleado,
      rol: data.rol,
      departamento: data.departamento,
      password: data.numero_empleado,
      activo: true,
      fecha_creacion: new Date().toISOString().slice(0, 10),
    };

    addUser(nuevoUsuario);
    setSuccess("Usuario registrado correctamente.");
    reset(INITIAL_VALUES);
    window.setTimeout(() => {
      navigate("/usuarios");
    }, 900);
  });

  return (
    <div className="inv-register-page">
      <Container className="inv-register-container py-4">
        <FormContainer title="Registro de Usuarios">
          {error ? <Alert variant="danger">{error}</Alert> : null}
          {success ? <Alert variant="success">{success}</Alert> : null}

          <Form onSubmit={onSubmit} className="inv-register__form">
            <Controller
              name="nombre_completo"
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
              name="departamento"
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
                label="Registrar"
                className="inv-register__submit"
              />
            </div>
          </Form>
        </FormContainer>
      </Container>
    </div>
  );
}

