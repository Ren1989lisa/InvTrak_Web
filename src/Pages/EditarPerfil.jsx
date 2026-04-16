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
import {
  getPerfilActual,
  getUsuarioById,
  updateUsuario,
  updateUsuarioPassword,
} from "../services/userService";

import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/profile.css";
import "../Style/editar-perfil.css";

const ROL_OPTIONS = [
  { value: "tecnico", label: "tecnico" },
  { value: "usuario", label: "usuario" },
];

function getPerfilRoute(usuario) {
  return usuario ? `/perfil/${usuario.id_usuario}` : "/perfil";
}

function getCorreoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((correo ?? "").toString().trim());
}

function validateAdminForm(data) {
  if (!(data?.nombre ?? "").toString().trim()) return "El nombre es obligatorio.";
  if (!(data?.correo ?? "").toString().trim()) return "El correo es obligatorio.";
  if (!getCorreoValido(data?.correo)) return "El formato del correo es invalido.";
  if (!(data?.fecha_nacimiento ?? "").toString().trim()) return "La fecha de nacimiento es obligatoria.";
  if (!(data?.curp ?? "").toString().trim()) return "La CURP es obligatoria.";
  if ((data?.curp ?? "").toString().trim().length !== 18) return "La CURP debe tener 18 caracteres.";
  if (!(data?.rol ?? "").toString().trim()) return "El rol es obligatorio.";
  if (!(data?.numero_empleado ?? "").toString().trim()) return "El numero de empleado es obligatorio.";
  if (!(data?.area ?? "").toString().trim()) return "El area es obligatoria.";
  return "";
}

function getAdminSaveErrorMessage(error) {
  const status = Number(error?.status ?? 0);
  if (status === 401) return "Sesion expirada. Inicia sesion nuevamente.";
  if (status === 403) return "No tienes permisos para editar usuarios.";
  if (status === 404) return "Usuario no encontrado.";
  if (status === 409) return error?.message || "El correo o numero de empleado ya esta registrado.";
  if (status === 400) return error?.message || "Datos invalidos. Revisa la informacion capturada.";
  if (status === 500) return "Error del servidor. Intentalo nuevamente.";
  if (status === 0) return "Error de red. Intenta nuevamente.";
  return error?.message || "No fue posible actualizar el usuario.";
}

export default function EditarPerfil() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { updateCurrentUser, currentUser, logout, menuItems, isAdmin } = useUsers();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usuario, setUsuario] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const targetIdFromRoute = Number(id);
  const hasValidRouteId = Number.isFinite(targetIdFromRoute) && targetIdFromRoute > 0;
  const isAdminEditMode = Boolean(isAdmin && hasValidRouteId);
  const perfilRoute = getPerfilRoute(usuario);

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
      setSuccess("");
      try {
        let baseUser = null;

        if (isAdminEditMode) {
          baseUser = await getUsuarioById(targetIdFromRoute);
        } else {
          const perfil = await getPerfilActual();
          baseUser = {
            id_usuario: perfil?.id_usuario ?? perfil?.idUsuario ?? perfil?.id ?? currentUser?.id_usuario ?? null,
            nombre: perfil?.nombre ?? currentUser?.nombre ?? currentUser?.nombre_completo ?? "",
            nombre_completo: perfil?.nombre ?? currentUser?.nombre_completo ?? currentUser?.nombre ?? "",
            correo: perfil?.correo ?? currentUser?.correo ?? "",
            fecha_nacimiento: perfil?.fecha_nacimiento ?? perfil?.fechaNacimiento ?? "",
            curp: perfil?.curp ?? currentUser?.curp ?? "",
            rol: perfil?.rol ?? currentUser?.rol ?? "",
            numero_empleado: perfil?.numero_empleado ?? perfil?.numeroEmpleado ?? currentUser?.numero_empleado ?? "",
            area: perfil?.area ?? currentUser?.area ?? currentUser?.departamento ?? "",
          };
        }

        if (!active) return;
        setUsuario(baseUser);

        reset({
          nombre: baseUser?.nombre ?? baseUser?.nombre_completo ?? "",
          correo: baseUser?.correo ?? "",
          fecha_nacimiento: baseUser?.fecha_nacimiento ?? "",
          curp: baseUser?.curp ?? "",
          rol: baseUser?.rol ?? "",
          numero_empleado: baseUser?.numero_empleado ?? "",
          area: baseUser?.area ?? baseUser?.departamento ?? "",
          password: "",
        });
      } catch (err) {
        if (!active) return;
        if (err?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setError(
          isAdminEditMode
            ? (err?.status === 403 ? "No tienes permisos para editar usuarios." : "No se pudo cargar el usuario a editar.")
            : "No se pudo cargar el perfil."
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadUsuario();
    return () => {
      active = false;
    };
  }, [currentUser, isAdminEditMode, navigate, reset, targetIdFromRoute]);

  const onSubmit = handleSubmit(async (data) => {
    setError("");
    setSuccess("");

    const targetId = usuario?.id_usuario ?? usuario?.idUsuario ?? usuario?.id;
    if (targetId == null) {
      setError("No se encontro el usuario a actualizar.");
      return;
    }

    if (isAdminEditMode) {
      const validationMessage = validateAdminForm(data);
      if (validationMessage) {
        setError(validationMessage);
        return;
      }
    } else {
      const nextPassword = (data?.password ?? "").toString().trim();
      if (!nextPassword) {
        setError("La contrasena es obligatoria.");
        return;
      }
    }

    setIsSaving(true);
    try {
      if (isAdminEditMode) {
        const updated = await updateUsuario(targetId, data);

        if (Number(currentUser?.id_usuario) === Number(targetId)) {
          updateCurrentUser(updated);
        }

        navigate("/usuarios", {
          replace: true,
          state: { toastMessage: "Usuario actualizado correctamente" },
        });
        return;
      }

      const updated = await updateUsuarioPassword(targetId, data?.password ?? "");
      if (Number(currentUser?.id_usuario) === Number(targetId)) {
        updateCurrentUser(updated);
      }
      setSuccess("Contrasena actualizada correctamente.");
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
      setError(isAdminEditMode ? getAdminSaveErrorMessage(err) : (err?.message || "No fue posible actualizar el usuario."));
    } finally {
      setIsSaving(false);
    }
  });

  const pageTitle = isAdminEditMode ? "Editar Usuario" : "Editar Perfil";
  const canEditUserFields = isAdminEditMode;
  const showPasswordField = !isAdminEditMode;
  const backRoute = isAdminEditMode ? "/usuarios" : perfilRoute;

  return (
    <div className="inv-page">
      <NavbarMenu
        title={pageTitle}
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
          onClick={() => navigate(backRoute)}
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
                        render={({ field, fieldState }) => (
                          <FormInput
                            label="Nombre completo"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={fieldState.error?.message}
                            disabled={!canEditUserFields}
                          />
                        )}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Controller
                        name="correo"
                        control={control}
                        render={({ field, fieldState }) => (
                          <FormInput
                            label="Correo electronico"
                            name={field.name}
                            type="email"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={fieldState.error?.message}
                            disabled={!canEditUserFields}
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
                        render={({ field, fieldState }) => (
                          <FormInput
                            label="Fecha de nacimiento"
                            name={field.name}
                            type="date"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={fieldState.error?.message}
                            disabled={!canEditUserFields}
                          />
                        )}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Controller
                        name="curp"
                        control={control}
                        render={({ field, fieldState }) => (
                          <FormInput
                            label="CURP"
                            name={field.name}
                            value={field.value}
                            onChange={(event) => field.onChange((event?.target?.value ?? "").toUpperCase())}
                            onBlur={field.onBlur}
                            error={fieldState.error?.message}
                            disabled={!canEditUserFields}
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
                        render={({ field, fieldState }) => (
                          <FormSelect
                            label="Rol"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            options={ROL_OPTIONS}
                            disabled={!canEditUserFields}
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Controller
                        name="numero_empleado"
                        control={control}
                        render={({ field, fieldState }) => (
                          <FormInput
                            label="Numero de empleado"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={fieldState.error?.message}
                            disabled={!canEditUserFields}
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
                        render={({ field, fieldState }) => (
                          <FormInput
                            label="Area / Departamento"
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={fieldState.error?.message}
                            disabled={!canEditUserFields}
                          />
                        )}
                      />
                    </Col>

                    {showPasswordField ? (
                      <Col xs={12} md={6}>
                        <Controller
                          name="password"
                          control={control}
                          render={({ field, fieldState }) => (
                            <FormInput
                              label="Contrasena"
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
                    ) : null}
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
                      onClick={() => navigate(backRoute)}
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
