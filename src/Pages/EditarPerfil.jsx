import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import ProfileHeader from "../Components/ProfileHeader";
import FormInput from "../Components/FormInput";
import FormSelect from "../Components/FormSelect";
import PrimaryButton from "../Components/PrimaryButton";
import { useUsers } from "../context/UsersContext";
import { isValidEmail } from "../utils/validations";

import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/profile.css";
import "../Style/editar-perfil.css";

const ROL_OPTIONS = [
  { value: "usuario", label: "usuario" },
  { value: "tecnico", label: "tecnico" },
  { value: "admin", label: "admin" },
];

export default function EditarPerfil() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { users, setUsers, currentUser, setCurrentUserId, menuItems } = useUsers();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    nombre_completo: "",
    correo: "",
    fecha_nacimiento: "",
    curp: "",
    rol: "",
    numero_empleado: "",
    departamento: "",
    password: "",
  });

  const usuarios = useMemo(() => (Array.isArray(users) ? users : []), [users]);
  const idNum = Number(id);
  const usuarioSeleccionado = Number.isFinite(idNum)
    ? usuarios.find((u) => Number(u?.id_usuario) === idNum)
    : null;
  const usuario = usuarioSeleccionado ?? usuarios[0];
  const perfilRoute = usuario ? `/perfil/${usuario.id_usuario}` : "/perfil";

  useEffect(() => {
    if (!usuario) return;
    setForm({
      nombre_completo: usuario.nombre_completo ?? "",
      correo: usuario.correo ?? "",
      fecha_nacimiento: usuario.fecha_nacimiento ?? "",
      curp: usuario.curp ?? "",
      rol: usuario.rol ?? "",
      numero_empleado: usuario.numero_empleado ?? "",
      departamento: usuario.departamento ?? "",
      password: usuario.password ?? "",
    });
  }, [usuario]);

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

    if (Object.values(data).some((value) => !value)) {
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

    const empleadoDuplicado = usuarios.some(
      (u) =>
        Number(u?.id_usuario) !== Number(usuario?.id_usuario) &&
        (u?.numero_empleado ?? "").toString() === data.numero_empleado
    );
    if (empleadoDuplicado) {
      setError("El número de empleado ya existe.");
      return;
    }

    const correoDuplicado = usuarios.some(
      (u) =>
        Number(u?.id_usuario) !== Number(usuario?.id_usuario) &&
        (u?.correo ?? "").toString().toLowerCase() === data.correo.toLowerCase()
    );
    if (correoDuplicado) {
      setError("El correo ya está registrado.");
      return;
    }

    if (data.rol === "admin") {
      const otherAdmin = usuarios.some(
        (u) =>
          Number(u?.id_usuario) !== Number(usuario?.id_usuario) &&
          (u?.rol ?? "") === "admin"
      );
      if (otherAdmin) {
        setError("Solo puede existir un usuario con rol admin.");
        return;
      }
    }

    setUsers((prev) =>
      prev.map((u) =>
        Number(u?.id_usuario) === Number(usuario?.id_usuario)
          ? {
              ...u,
              ...data,
            }
          : u
      )
    );

    setSuccess("Perfil actualizado correctamente");
  };

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Editar Perfil"
        onMenuClick={() => setOpenSidebar((v) => !v)}
      />

      <SidebarMenu
        open={openSidebar}
        onClose={() => setOpenSidebar(false)}
        userName={currentUser?.nombre_completo}
        items={menuItems}
        onViewProfile={() => {
          setOpenSidebar(false);
          if (currentUser) {
            navigate(`/perfil/${currentUser.id_usuario}`);
          } else {
            navigate("/perfil");
          }
        }}
        onLogout={() => {
          setOpenSidebar(false);
          setCurrentUserId(null);
          navigate("/");
        }}
      />

      <Container fluid className="inv-content px-3 px-md-4 py-3 inv-profile-content">
        <Button
          type="button"
          variant="link"
          className="inv-back-btn"
          onClick={() => navigate(perfilRoute)}
        >
          ← Regresar
        </Button>

        {usuario ? (
          <>
            <ProfileHeader name={usuario.nombre_completo} />

            <Card className="inv-profile-card shadow-sm border-0 inv-edit-profile-card">
              <Card.Body className="inv-profile-card__body">
                {error ? <Alert variant="danger">{error}</Alert> : null}
                {success ? <Alert variant="success">{success}</Alert> : null}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col xs={12} md={6}>
                      <FormInput
                        label="Nombre completo"
                        name="nombre_completo"
                        value={form.nombre_completo}
                        onChange={handleChange}
                        disabled
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <FormInput
                        label="Correo electrónico"
                        name="correo"
                        type="email"
                        value={form.correo}
                        onChange={handleChange}
                        disabled
                      />
                    </Col>
                  </Row>

                  <Row>
                    <Col xs={12} md={6}>
                      <FormInput
                        label="Fecha de nacimiento"
                        name="fecha_nacimiento"
                        type="date"
                        value={form.fecha_nacimiento}
                        onChange={handleChange}
                        disabled
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <FormInput
                        label="CURP"
                        name="curp"
                        value={form.curp}
                        onChange={handleChange}
                        disabled
                      />
                    </Col>
                  </Row>

                  <Row>
                    <Col xs={12} md={6}>
                      <FormSelect
                        label="Rol"
                        name="rol"
                        value={form.rol}
                        onChange={handleChange}
                        options={ROL_OPTIONS}
                        disabled
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <FormInput
                        label="Número de empleado"
                        name="numero_empleado"
                        value={form.numero_empleado}
                        onChange={handleChange}
                        disabled
                      />
                    </Col>
                  </Row>

                  <Row>
                    <Col xs={12} md={6}>
                      <FormInput
                        label="Área / Departamento"
                        name="departamento"
                        value={form.departamento}
                        onChange={handleChange}
                        disabled
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <FormInput
                        label="Contraseña"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                      />
                    </Col>
                  </Row>

                  <div className="inv-edit-profile__actions">
                    <PrimaryButton
                      type="submit"
                      variant="primary"
                      label="Guardar"
                      className="inv-edit-profile__saveBtn"
                    />
                    <PrimaryButton
                      type="button"
                      variant="light"
                      label="Cancelar"
                      className="inv-edit-profile__cancelBtn"
                      onClick={() => navigate(perfilRoute)}
                    />
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </>
        ) : null}
      </Container>
    </div>
  );
}

