import { useMemo, useState } from "react";
import { Alert, Container, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import FormContainer from "../Components/FormContainer";
import FormInput from "../Components/FormInput";
import FormSelect from "../Components/FormSelect";
import PrimaryButton from "../Components/PrimaryButton";
import { useUsers } from "../context/UsersContext";
import "../Style/registrar-usuario.css";

const INITIAL_FORM = {
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegistrarUsuario() {
  const navigate = useNavigate();
  const { users, addUser } = useUsers();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const usersList = useMemo(() => (Array.isArray(users) ? users : []), [users]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const data = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
    );

    const hasEmpty = Object.values(data).some((value) => !value);
    if (hasEmpty) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (!isValidEmail(data.correo)) {
      setError("El correo electrónico no tiene un formato válido.");
      return;
    }

    if (data.curp.length !== 18) {
      setError("La CURP debe tener exactamente 18 caracteres.");
      return;
    }

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
    setForm(INITIAL_FORM);
    window.setTimeout(() => {
      navigate("/usuarios");
    }, 900);
  };

  return (
    <div className="inv-register-page">
      <Container className="inv-register-container py-4">
        <FormContainer title="Registro de Usuarios">
          {error ? <Alert variant="danger">{error}</Alert> : null}
          {success ? <Alert variant="success">{success}</Alert> : null}

          <Form onSubmit={handleSubmit}>
            <FormInput
              label="Nombre completo"
              name="nombre_completo"
              value={form.nombre_completo}
              onChange={handleChange}
              placeholder="Ingresa el nombre completo"
            />
            <FormInput
              label="Correo electrónico"
              name="correo"
              type="email"
              value={form.correo}
              onChange={handleChange}
              placeholder="ejemplo@correo.com"
            />
            <FormInput
              label="Fecha de nacimiento"
              name="fecha_nacimiento"
              type="date"
              value={form.fecha_nacimiento}
              onChange={handleChange}
            />
            <FormInput
              label="CURP"
              name="curp"
              value={form.curp}
              onChange={handleChange}
              placeholder="18 caracteres"
            />
            <FormSelect
              label="Rol"
              name="rol"
              value={form.rol}
              onChange={handleChange}
              options={ROL_OPTIONS}
            />
            <FormInput
              label="Número de empleado"
              name="numero_empleado"
              value={form.numero_empleado}
              onChange={handleChange}
              placeholder="Ej. 0810"
            />

            <FormInput
              label="Área o departamento"
              name="departamento"
              value={form.departamento}
              onChange={handleChange}
              placeholder="Ej. Soporte Técnico"
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

