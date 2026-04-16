import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Card, Container, Form, Modal, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import PrimaryButton from "../Components/PrimaryButton";
import FormInput from "../Components/FormInput";
import FormSelect from "../Components/FormSelect";
import SelectLocationModal from "../Components/SelectLocationModal";
import { useUsers } from "../context/UsersContext";
import {
  createActivo,
  getActivoById,
  getActivos,
  updateActivo,
} from "../services/activoService";
import { getProductos } from "../services/catalogoService";
import { registroBienSchema } from "../utils/schemas";
import { ESTATUS_ACTIVO, ESTATUS_ACTIVO_OPTIONS } from "../config/estatusActivo";

import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/registro-bien.css";

function todayDateString() {
  const date = new Date();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function getDefaultValues() {
  return {
    numero_serie: "",
    fecha_alta: todayDateString(),
    descripcion: "",
    estatus: ESTATUS_ACTIVO.DISPONIBLE,
    costo: "",
  };
}

function getProductLoadErrorMessage(error) {
  const status = Number(error?.status ?? 0);
  if (status === 401) return "Sesion expirada. Inicia sesion nuevamente.";
  if (status === 404) return "No se encontraron productos.";
  if (status === 0) return "Error de red. Verifica tu conexion.";
  return error?.message || "No fue posible cargar los productos.";
}

function getEditLoadErrorMessage(error) {
  const status = Number(error?.status ?? 0);
  if (status === 401) return "Sesion expirada. Inicia sesion nuevamente.";
  if (status === 403) return "No tienes permisos para editar activos.";
  if (status === 404) return "Activo no encontrado.";
  if (status === 0) return "Error de red. Verifica tu conexion.";
  return error?.message || "No fue posible cargar los datos del activo.";
}

function uniqueById(items, idKey, labelKey) {
  const seen = new Map();
  (Array.isArray(items) ? items : []).forEach((item) => {
    const id = Number(item?.[idKey]);
    const label = String(item?.[labelKey] ?? "").trim();
    if (!Number.isFinite(id) || id <= 0 || !label) return;
    if (seen.has(id)) return;
    seen.set(id, { value: id, label });
  });
  return [...seen.values()];
}

function buildChainDisplay(values) {
  return values.map((value) => String(value ?? "").trim()).filter(Boolean).join(" > ");
}

function buildProductSelectionFromActivo(activo) {
  const producto = activo?.producto ?? {};
  const idProducto = Number(producto?.id_producto ?? producto?.idProducto ?? activo?.productoId);
  if (!Number.isFinite(idProducto) || idProducto <= 0) return null;

  const idMarca = Number(producto?.id_marca ?? producto?.marca?.id_marca ?? producto?.marca?.idMarca);
  const idModelo = Number(producto?.id_modelo ?? producto?.modelo?.id_modelo ?? producto?.modelo?.idModelo);
  const marca = String(producto?.marca ?? producto?.modelo?.marca?.nombre ?? "").trim();
  const modelo = String(producto?.modelo ?? producto?.modelo?.nombre ?? "").trim();
  const nombre =
    String(producto?.nombre ?? producto?.tipo_activo ?? producto?.tipoActivo ?? "").trim() || "Producto";

  return {
    id_marca: Number.isFinite(idMarca) ? idMarca : null,
    id_modelo: Number.isFinite(idModelo) ? idModelo : null,
    id_producto: idProducto,
    marca,
    modelo,
    nombre,
    displayText: buildChainDisplay([nombre, marca, modelo]) || nombre,
  };
}

function buildLocationSelectionFromActivo(activo) {
  const ubicacion = activo?.ubicacion ?? {};
  const idCampus = Number(ubicacion?.id_campus ?? activo?.campusId);
  const idEdificio = Number(ubicacion?.id_edificio ?? activo?.edificioId);
  const idAula = Number(ubicacion?.id_aula ?? activo?.aulaId);
  if (!Number.isFinite(idAula) || idAula <= 0) return null;

  const campus = String(ubicacion?.campus ?? "").trim();
  const edificio = String(ubicacion?.edificio ?? "").trim();
  const aula = String(ubicacion?.aula ?? "").trim();

  return {
    id_campus: Number.isFinite(idCampus) ? idCampus : null,
    id_edificio: Number.isFinite(idEdificio) ? idEdificio : null,
    id_aula: idAula,
    campus,
    edificio,
    aula,
    displayText: [campus, edificio, aula].filter(Boolean).join(" ").trim() || aula,
  };
}

function SelectProductModalInline({ show, onClose, onSave, initialSelection = null }) {
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const list = await getProductos();
      setCatalog(Array.isArray(list) ? list : []);
    } catch (loadError) {
      setCatalog([]);
      setError(getProductLoadErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!show) return;

    setSelectedProductId(String(initialSelection?.id_producto ?? ""));
    setSelectedBrandId(String(initialSelection?.id_marca ?? ""));
    setSelectedModelId(String(initialSelection?.id_modelo ?? ""));
    setCatalog([]);
    setError("");
    loadCatalog();
  }, [
    show,
    loadCatalog,
    initialSelection?.id_marca,
    initialSelection?.id_modelo,
    initialSelection?.id_producto,
  ]);

  const productOptions = useMemo(() => uniqueById(catalog, "id_producto", "nombre"), [catalog]);

  const brandOptions = useMemo(() => {
    const productId = Number(selectedProductId);
    if (!productId) return [];
    return uniqueById(
      catalog.filter((item) => Number(item?.id_producto) === productId),
      "id_marca",
      "marca"
    );
  }, [catalog, selectedProductId]);

  const modelOptions = useMemo(() => {
    const productId = Number(selectedProductId);
    const brandId = Number(selectedBrandId);
    if (!productId || !brandId) return [];
    return uniqueById(
      catalog.filter(
        (item) =>
          Number(item?.id_producto) === productId &&
          Number(item?.id_marca) === brandId
      ),
      "id_modelo",
      "modelo"
    );
  }, [catalog, selectedProductId, selectedBrandId]);

  const selectedBrand = brandOptions.find((item) => Number(item.value) === Number(selectedBrandId));
  const selectedModel = modelOptions.find((item) => Number(item.value) === Number(selectedModelId));
  const selectedProduct = productOptions.find(
    (item) => Number(item.value) === Number(selectedProductId)
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!selectedProduct || !selectedBrand || !selectedModel) {
      setError("Debes seleccionar producto, marca y modelo.");
      return;
    }

    const matchedItem = catalog.find(
      (item) =>
        Number(item?.id_marca) === Number(selectedBrand.value) &&
        Number(item?.id_modelo) === Number(selectedModel.value) &&
        Number(item?.id_producto) === Number(selectedProduct.value)
    );

    if (!matchedItem) {
      setError("No fue posible confirmar el producto seleccionado.");
      return;
    }

    onSave?.({
      id_marca: Number(selectedBrand.value),
      id_modelo: Number(selectedModel.value),
      id_producto: Number(selectedProduct.value),
      marca: matchedItem.marca,
      modelo: matchedItem.modelo,
      nombre: matchedItem.nombre,
      displayText: buildChainDisplay([matchedItem.nombre, matchedItem.marca, matchedItem.modelo]),
    });
  };

  return (
    <Modal centered show={show} onHide={onClose} dialogClassName="inv-select-modal">
      <Modal.Header closeButton className="inv-select-modal__header">
        <Modal.Title>Seleccione producto</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="inv-select-modal__body">
          {error ? (
            <Alert variant="danger" className="d-flex align-items-center justify-content-between gap-3">
              <span>{error}</span>
              <PrimaryButton variant="outline-danger" label="Reintentar" onClick={loadCatalog} />
            </Alert>
          ) : null}

          {isLoading ? (
            <Alert variant="info" className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              <span>Cargando catalogos de producto...</span>
            </Alert>
          ) : null}

          <Form.Group className="mb-3">
            <Form.Label className="inv-select-modal__label">Producto</Form.Label>
            <Form.Select
              value={selectedProductId}
              onChange={(event) => {
                setSelectedProductId(event.target.value);
                setSelectedBrandId("");
                setSelectedModelId("");
              }}
              className="inv-select-modal__control"
              disabled={isLoading}
            >
              <option value="">{isLoading ? "Cargando productos..." : "Seleccione el producto"}</option>
              {productOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="inv-select-modal__label">Marca</Form.Label>
            <Form.Select
              value={selectedBrandId}
              onChange={(event) => {
                setSelectedBrandId(event.target.value);
                setSelectedModelId("");
              }}
              className="inv-select-modal__control"
              disabled={!selectedProductId || isLoading}
            >
              <option value="">
                {isLoading ? "Cargando marcas..." : "Seleccione la marca"}
              </option>
              {brandOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="inv-select-modal__label">Modelo</Form.Label>
            <Form.Select
              value={selectedModelId}
              onChange={(event) => setSelectedModelId(event.target.value)}
              className="inv-select-modal__control"
              disabled={!selectedBrandId || isLoading}
            >
              <option value="">
                {isLoading ? "Cargando modelos..." : "Seleccione el modelo"}
              </option>
              {modelOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="inv-select-modal__footer">
          <PrimaryButton
            variant="light"
            label="Cancelar"
            className="inv-select-modal__btn inv-select-modal__btn--cancel"
            onClick={onClose}
          />
          <PrimaryButton
            type="submit"
            variant="primary"
            label="Guardar"
            className="inv-select-modal__btn inv-select-modal__btn--save"
            disabled={isLoading}
          />
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

function getCreateErrorMessage(error) {
  const status = Number(error?.status ?? 0);
  const backendMessage = error?.data?.message || error?.message || "";

  if (status === 401) return "Sesion expirada. Inicia sesion nuevamente.";
  if (status === 400) return backendMessage || "Datos invalidos. Revisa la informacion capturada.";
  if (status === 409) return backendMessage || "Ya existe un activo con ese numero de serie.";
  if (status === 500) return backendMessage || "Error del servidor. Intentalo nuevamente.";
  if (status === 0) return "No fue posible conectar con el servidor.";
  if (/numero de serie ya esta registrado/i.test(backendMessage)) {
    return "Ya existe un activo con ese numero de serie.";
  }
  return backendMessage || "No fue posible crear el bien.";
}

function getUpdateErrorMessage(error) {
  const status = Number(error?.status ?? 0);
  const backendMessage = error?.data?.message || error?.message || "";

  if (status === 401) return "Sesion expirada. Inicia sesion nuevamente.";
  if (status === 403) return "No tienes permisos para editar activos.";
  if (status === 404) return backendMessage || "Activo no encontrado.";
  if (status === 409) return backendMessage || "Ya existe un activo con ese numero de serie.";
  if (status === 400) return backendMessage || "Datos invalidos. Revisa la informacion capturada.";
  if (status === 500) return backendMessage || "Error del servidor. Intentalo nuevamente.";
  if (status === 0) return "No fue posible conectar con el servidor.";
  return backendMessage || "No fue posible actualizar el activo.";
}

function parseCosto(value) {
  const normalized = String(value).replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export default function RegistroBien() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const editActivoId = isEditMode ? Number(id) : null;

  const { currentUser, logout, menuItems } = useUsers();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [registeredCount, setRegisteredCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isHydratingEdit, setIsHydratingEdit] = useState(false);
  const [existingActivos, setExistingActivos] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(registroBienSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    let active = true;

    async function loadExistingActivos() {
      try {
        const activos = await getActivos();
        if (!active) return;
        setExistingActivos(Array.isArray(activos) ? activos : []);
      } catch {
        if (!active) return;
        setExistingActivos([]);
      }
    }

    loadExistingActivos();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    if (!Number.isFinite(editActivoId) || editActivoId <= 0) {
      setErrorMessage("El activo que intentas editar no es valido.");
      return;
    }

    let active = true;

    async function loadActivoForEdit() {
      setIsHydratingEdit(true);
      setErrorMessage("");
      setSuccessMessage("");
      try {
        const activo = await getActivoById(editActivoId);
        if (!active) return;

        const nextProduct = buildProductSelectionFromActivo(activo);
        const nextLocation = buildLocationSelectionFromActivo(activo);

        setSelectedProduct(nextProduct);
        setSelectedLocation(nextLocation);
        reset({
          numero_serie: String(activo?.numero_serie ?? "").trim(),
          fecha_alta: String(activo?.fecha_alta ?? "").trim() || todayDateString(),
          descripcion: String(activo?.descripcion ?? "").trim(),
          estatus: String(activo?.estatus ?? ESTATUS_ACTIVO.DISPONIBLE).trim() || ESTATUS_ACTIVO.DISPONIBLE,
          costo:
            activo?.costo != null && activo?.costo !== ""
              ? String(activo.costo)
              : "",
        });
      } catch (error) {
        if (!active) return;
        setErrorMessage(getEditLoadErrorMessage(error));
      } finally {
        if (active) setIsHydratingEdit(false);
      }
    }

    loadActivoForEdit();

    return () => {
      active = false;
    };
  }, [isEditMode, editActivoId, reset]);

  const clearForm = () => {
    reset({
      ...getDefaultValues(),
      fecha_alta: todayDateString(),
      estatus: ESTATUS_ACTIVO.DISPONIBLE,
    });
    setSelectedProduct(null);
    setSelectedLocation(null);
  };

  const resetForm = () => {
    if (isEditMode) {
      navigate("/bienes-registrados");
      return;
    }
    clearForm();
    setErrorMessage("");
    setSuccessMessage("");
  };

  const onSubmit = handleSubmit(async (data) => {
    setErrorMessage("");
    setSuccessMessage("");

    const numeroSerie = String(data.numero_serie ?? "").trim();
    const descripcion = String(data.descripcion ?? "").trim();
    const productoId = Number(selectedProduct?.id_producto);
    const aulaId = Number(selectedLocation?.id_aula);

    if (!productoId) {
      setErrorMessage("Debes seleccionar un producto.");
      return;
    }

    if (!aulaId) {
      setErrorMessage("Debes seleccionar una ubicacion.");
      return;
    }

    const serieNormalizada = numeroSerie.toLowerCase();
    const serieDuplicada = existingActivos.some((item) => {
      const sameSerie = String(item?.numero_serie ?? "").trim().toLowerCase() === serieNormalizada;
      if (!sameSerie) return false;
      if (!isEditMode) return true;
      return Number(item?.id_activo) !== Number(editActivoId);
    });

    if (serieDuplicada) {
      setErrorMessage("Ya existe un activo con ese numero de serie.");
      return;
    }

    const costo = parseCosto(data.costo);
    if (!Number.isFinite(costo) || costo <= 0) {
      setErrorMessage("El costo debe ser un numero valido mayor a 0.");
      return;
    }

    const payload = {
      numeroSerie,
      productoId,
      fechaAlta: data.fecha_alta,
      aulaId,
      descripcion,
      costo,
    };

    setIsSaving(true);

    try {
      if (isEditMode) {
        const estatus = String(data.estatus ?? "").trim() || ESTATUS_ACTIVO.DISPONIBLE;
        await updateActivo(editActivoId, {
          ...payload,
          estatus,
        });

        navigate("/bienes-registrados", {
          replace: true,
          state: { toastMessage: "Activo actualizado correctamente" },
        });
        return;
      }

      await createActivo(payload);

      setRegisteredCount((prev) => prev + 1);
      setExistingActivos((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        { id_activo: Date.now(), numero_serie: numeroSerie },
      ]);
      clearForm();
      setSuccessMessage("Bien creado correctamente");
    } catch (error) {
      setErrorMessage(isEditMode ? getUpdateErrorMessage(error) : getCreateErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  });

  const pageTitle = isEditMode ? "Editar activo" : "Registro de Bienes";
  const formTitle = isEditMode ? "Editar bien" : "Registro de Bien";
  const submitLabel = isSaving
    ? isEditMode
      ? "Guardando..."
      : "Guardando..."
    : isEditMode
      ? "Guardar cambios"
      : "Registrar";

  return (
    <div className="inv-page inv-register-asset-page">
      <NavbarMenu title={pageTitle} onMenuClick={() => setOpenSidebar((value) => !value)} />

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
          logout();
          navigate("/login");
        }}
      />

      <Container fluid className="inv-content px-3 px-md-4 py-4">
        <Card className="inv-register-asset__card shadow-sm border-0">
          <Card.Body className="inv-register-asset__cardBody">
            <h2 className="inv-register-asset__title">{formTitle}</h2>

            {successMessage ? (
              <Alert
                variant="success"
                className="mb-3"
                dismissible
                onClose={() => setSuccessMessage("")}
              >
                {successMessage}
              </Alert>
            ) : null}

            {errorMessage ? (
              <Alert variant="danger" className="mb-3" dismissible onClose={() => setErrorMessage("")}>
                {errorMessage}
              </Alert>
            ) : null}

            {isHydratingEdit ? (
              <Alert variant="info" className="d-flex align-items-center gap-2">
                <Spinner animation="border" size="sm" />
                <span>Cargando datos del activo...</span>
              </Alert>
            ) : null}

            <Form onSubmit={onSubmit} className="inv-register-asset__form">
              <Controller
                name="numero_serie"
                control={control}
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Numero de serie"
                    name={field.name}
                    value={field.value}
                    onChange={(event) => {
                      const onlyDigits = String(event?.target?.value ?? "")
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      field.onChange(onlyDigits);
                    }}
                    onBlur={field.onBlur}
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    onInvalid={(event) => {
                      event.target.setCustomValidity("El numero de serie debe tener 6 digitos exactos.");
                    }}
                    onInput={(event) => {
                      event.target.setCustomValidity("");
                    }}
                    placeholder="Ingrese el numero de serie"
                    error={fieldState.error?.message}
                    disabled={isSaving || isHydratingEdit}
                  />
                )}
              />

              <Form.Group className="mb-3">
                <Form.Label className="inv-register__label">Producto</Form.Label>
                <button
                  type="button"
                  className="inv-register-asset__picker"
                  onClick={() => setShowProductModal(true)}
                  disabled={isSaving || isHydratingEdit}
                >
                  <span>{selectedProduct?.displayText || "Seleccione producto"}</span>
                  <span className="inv-register-asset__pickerIcon" aria-hidden="true">
                    v
                  </span>
                </button>
              </Form.Group>

              <Controller
                name="fecha_alta"
                control={control}
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Fecha de alta"
                    name={field.name}
                    type="date"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    disabled={isSaving || isHydratingEdit}
                  />
                )}
              />

              <Form.Group className="mb-3">
                <Form.Label className="inv-register__label">Ubicacion</Form.Label>
                <button
                  type="button"
                  className="inv-register-asset__picker"
                  onClick={() => setShowLocationModal(true)}
                  disabled={isSaving || isHydratingEdit}
                >
                  <span>{selectedLocation?.displayText || "Seleccione ubicacion"}</span>
                  <span className="inv-register-asset__pickerIcon" aria-hidden="true">
                    v
                  </span>
                </button>
              </Form.Group>

              <Controller
                name="descripcion"
                control={control}
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Descripcion"
                    name={field.name}
                    as="textarea"
                    rows={3}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Ingrese la descripcion del activo"
                    className="inv-register__input inv-register-asset__textarea"
                    error={fieldState.error?.message}
                    disabled={isSaving || isHydratingEdit}
                  />
                )}
              />

              <Controller
                name="estatus"
                control={control}
                render={({ field, fieldState }) => (
                  <FormSelect
                    label="Estatus"
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    options={ESTATUS_ACTIVO_OPTIONS}
                    disabled={!isEditMode || isSaving || isHydratingEdit}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="costo"
                control={control}
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Costo"
                    name={field.name}
                    type="text"
                    inputMode="decimal"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Ingrese el costo"
                    error={fieldState.error?.message}
                    disabled={isSaving || isHydratingEdit}
                  />
                )}
              />

              <div className="inv-register-asset__actions">
                <PrimaryButton
                  type="submit"
                  variant="primary"
                  label={submitLabel}
                  className="inv-register-asset__submit"
                  disabled={isSaving || isHydratingEdit}
                />
                <PrimaryButton
                  type="button"
                  variant="light"
                  label={isEditMode ? "Volver" : "Cancelar"}
                  className="inv-register-asset__cancel"
                  onClick={resetForm}
                  disabled={isSaving}
                />
              </div>
            </Form>

            {!isEditMode ? (
              <p className="inv-register-asset__counter mb-0">
                Registros en esta sesion: {registeredCount}
              </p>
            ) : null}
          </Card.Body>
        </Card>
      </Container>

      <SelectProductModalInline
        show={showProductModal}
        initialSelection={selectedProduct}
        onClose={() => setShowProductModal(false)}
        onSave={(selection) => {
          setSelectedProduct(selection);
          setShowProductModal(false);
        }}
      />

      <SelectLocationModal
        show={showLocationModal}
        initialSelection={selectedLocation}
        onClose={() => setShowLocationModal(false)}
        onSave={(selection) => {
          setSelectedLocation(selection);
          setShowLocationModal(false);
        }}
      />
    </div>
  );
}
