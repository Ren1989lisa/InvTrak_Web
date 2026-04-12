import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import { getUsuarios, updateUsuarioPassword } from "../services/userService";

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
  const location = useLocation();
  const { id } = useParams();
  const { updateCurrentUser, currentUser, logout, menuItems } = useUsers();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const perfilRoute = usuario ? `/perfil/${usuario.id_usuario}` : "/perfil";

  const returnAfterEdit = () => {
    const from = location.state?.from;
    if (from === "/usuarios") {
      navigate("/usuarios", { replace: true });
      return;
    }
    navigate(perfilRoute, { replace: true });
  };

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
    shouldUnregister: false,
  });

  useEffect(() => {
    let active = true;
    async function loadUsuario() {
      setIsLoading(true);
      setError("");
      try {
        const idNum = Number(id);
        const list = await getUsuarios();
        if (!active) return;

        const selected = Number.isFinite(idNum)
          ? (Array.isArray(list) ? list : []).find(
              (u) => Number(u?.id_usuario ?? u?.idUsuario ?? u?.id) === idNum
            ) ?? null
          : null;

        const baseUser = selected ?? currentUser ?? null;
        setUsuario(baseUser);

        if (baseUser) {
          reset({
            nombre: baseUser.nombre ?? baseUser.nombre_completo ?? "",
            correo: baseUser.correo ?? "",
            fecha_nacimiento: baseUser.fecha_nacimiento ?? "",
            curp: baseUser.curp ?? "",
            rol: baseUser.rol ?? "",
            numero_empleado: baseUser.numero_empleado ?? "",
            area: baseUser.area ?? baseUser.departamento ?? "",
            password: "",
          });
        }
      } catch (err) {
        if (!active) return;
        if (err?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setError("No se pudo cargar el usuario a editar.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadUsuario();
    return () => {
      active = false;
    };
  }, [id, currentUser, navigate, reset]);

  const onSubmit = handleSubmit(async (data) => {
    setError("");
    setSuccess("");
    const nextPassword = (data?.password ?? "").toString().trim();

    if (!nextPassword) {
      setError("La contraseña es obligatoria.");
      return;
    }

    const targetId = usuario?.id_usuario ?? usuario?.idUsuario ?? usuario?.id;
    if (targetId == null) {
      setError("No se encontró el usuario a actualizar.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateUsuarioPassword(targetId, nextPassword);
      if (Number(currentUser?.id_usuario) === Number(targetId)) {
        updateCurrentUser(updated);
      }
      setSuccess("Contraseña actualizada correctamente.");
      reset(
        (prev) => ({
          ...prev,
          password: "",
        }),
        { keepValues: true }
      );
    } catch (err) {
      if (err?.status === 401) {
        navigate("/login", { replace: true });
        return;
      }
      setError(err?.message || "No fue posible actualizar el usuario.");
    } finally {
      setIsSaving(false);
    }
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
          logout();
          navigate("/login");
        }}
      />

      <Container fluid className="inv-content px-3 px-md-4 py-3 inv-profile-content">
        <Button
          type="button"
          variant="link"
          className="inv-back-btn"
          onClick={returnAfterEdit}
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
                {isLoading ? <Alert variant="info">Cargando usuario...</Alert> : null}

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
                      label={isSaving ? "Guardando..." : "Guardar"}
                      className="inv-edit-profile__saveBtn"
                      disabled={isSaving || isLoading}
                    />
                    <PrimaryButton
                      type="button"
                      variant="light"
                      label="Cancelar"
                      className="inv-edit-profile__cancelBtn"
                      onClick={returnAfterEdit}
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

