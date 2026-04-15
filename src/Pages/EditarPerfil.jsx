import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import ProfileHeader from "../Components/ProfileHeader";
import FormInput from "../Components/FormInput";
import FormSelect from "../Components/FormSelect";
import PrimaryButton from "../Components/PrimaryButton";
import { useUsers } from "../context/UsersContext";
import { editarPerfilSchema } from "../utils/schemas";
import { normalizeUsuario } from "../utils/entityFields";
import { ROL_ID_BY_NOMBRE } from "../config/databaseEnums";

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

  const usuarios = useMemo(() => (Array.isArray(users) ? users : []), [users]);
  const idNum = Number(id);
  const usuarioSeleccionado = Number.isFinite(idNum)
    ? usuarios.find((u) => Number(u?.id_usuario) === idNum)
    : null;
  const usuario = usuarioSeleccionado ?? usuarios[0];
  const perfilRoute = usuario ? `/perfil/${usuario.id_usuario}` : "/perfil";

  const {
    control,
    handleSubmit,
    reset,
  } = useForm({
    resolver: zodResolver(editarPerfilSchema),
    defaultValues: {
      nombre: "",
      correo: "",
      fecha_nacimiento: "",
      curp: "",
      rol: "",
      numero_empleado: "",
      area: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!usuario) return;
    reset({
      nombre: usuario.nombre ?? usuario.nombre_completo ?? "",
      correo: usuario.correo ?? "",
      fecha_nacimiento: usuario.fecha_nacimiento ?? "",
      curp: usuario.curp ?? "",
      rol: usuario.rol ?? "",
      numero_empleado: usuario.numero_empleado ?? "",
      area: usuario.area ?? usuario.departamento ?? "",
      password: usuario.password ?? "",
    });
  }, [usuario, reset]);

  const onSubmit = handleSubmit((data) => {
    setError("");
    setSuccess("");

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
          ? normalizeUsuario({
              ...u,
              ...data,
              nombre: data.nombre,
              area: data.area,
              rol: data.rol,
              id_rol: ROL_ID_BY_NOMBRE[data.rol],
              password: data.password ?? u.password,
            })
          : u
      )
    );

    setSuccess("Perfil actualizado correctamente");
  });

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Editar Perfil"
        onMenuClick={() => setOpenSidebar((v) => !v)}
      />

      <SidebarMenu
        open={openSidebar}
        onClose={() => setOpenSidebar(false)}
        userName={currentUser?.nombre ?? currentUser?.nombre_completo}
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
            <ProfileHeader name={usuario.nombre ?? usuario.nombre_completo} />

            <Card className="inv-profile-card shadow-sm border-0 inv-edit-profile-card">
              <Card.Body className="inv-profile-card__body">
                {error ? <Alert variant="danger">{error}</Alert> : null}
                {success ? <Alert variant="success">{success}</Alert> : null}

                <Form onSubmit={onSubmit}>
                  <Row>
                    <Col xs={12} md={6}>
                      <Controller
                        name="nombre"
                        control={control}
                        render={({ field }) => (
                          <FormInput
                            label="Nombre completo"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            disabled
                          />
                        )}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Controller
                        name="correo"
                        control={control}
                        render={({ field }) => (
                          <FormInput
                            label="Correo electrónico"
                            name={field.name}
                            type="email"
                            value={field.value}
                            onChange={field.onChange}
                            disabled
                          />
                        )}
                      />
                    </Col>
                  </Row>

                  <Row>
                    <Col xs={12} md={6}>
                      <Controller
                        name="fecha_nacimiento"
                        control={control}
                        render={({ field }) => (
                          <FormInput
                            label="Fecha de nacimiento"
                            name={field.name}
                            type="date"
                            value={field.value}
                            onChange={field.onChange}
                            disabled
                          />
                        )}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Controller
                        name="curp"
                        control={control}
                        render={({ field }) => (
                          <FormInput
                            label="CURP"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            disabled
                          />
                        )}
                      />
                    </Col>
                  </Row>

                  <Row>
                    <Col xs={12} md={6}>
                      <Controller
                        name="rol"
                        control={control}
                        render={({ field }) => (
                          <FormSelect
                            label="Rol"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            options={ROL_OPTIONS}
                            disabled
                          />
                        )}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Controller
                        name="numero_empleado"
                        control={control}
                        render={({ field }) => (
                          <FormInput
                            label="Número de empleado"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            disabled
                          />
                        )}
                      />
                    </Col>
                  </Row>

                  <Row>
                    <Col xs={12} md={6}>
                      <Controller
                        name="area"
                        control={control}
                        render={({ field }) => (
                          <FormInput
                            label="Área / Departamento"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            disabled
                          />
                        )}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Controller
                        name="password"
                        control={control}
                        render={({ field, fieldState }) => (
                          <FormInput
                            label="Contraseña"
                            name={field.name}
                            type="password"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={fieldState.error?.message}
                          />
                        )}
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

