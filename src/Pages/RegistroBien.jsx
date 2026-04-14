import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Card, Container, Form, Modal, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import PrimaryButton from "../Components/PrimaryButton";
import FormInput from "../Components/FormInput";
import FormSelect from "../Components/FormSelect";
import SelectLocationModal from "../Components/SelectLocationModal";
import { useUsers } from "../context/UsersContext";
import { createActivo, getActivos } from "../services/activoService";
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

function getProductLoadErrorMessage(error) {
  const status = Number(error?.status ?? 0);
  if (status === 401) return "Sesión expirada. Inicia sesión nuevamente.";
  if (status === 404) return "No se encontraron productos.";
  if (status === 0) return "Error de red. Verifica tu conexión.";
  return error?.message || "No fue posible cargar los productos.";
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

function SelectProductModalInline({ show, onClose, onSave }) {
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

    setSelectedBrandId("");
    setSelectedModelId("");
    setSelectedProductId("");
    setCatalog([]);
    setError("");
    loadCatalog();
  }, [show, loadCatalog]);

  const brandOptions = useMemo(
    () => uniqueById(catalog, "id_marca", "marca"),
    [catalog]
  );

  const modelOptions = useMemo(() => {
    const brandId = Number(selectedBrandId);
    if (!brandId) return [];
    return uniqueById(
      catalog.filter((item) => Number(item?.id_marca) === brandId),
      "id_modelo",
      "modelo"
    );
  }, [catalog, selectedBrandId]);

  const productOptions = useMemo(() => {
    const brandId = Number(selectedBrandId);
    const modelId = Number(selectedModelId);
    if (!brandId || !modelId) return [];
    return uniqueById(
      catalog.filter(
        (item) =>
          Number(item?.id_marca) === brandId &&
          Number(item?.id_modelo) === modelId
      ),
      "id_producto",
      "nombre"
    );
  }, [catalog, selectedBrandId, selectedModelId]);

  const selectedBrand = brandOptions.find((item) => Number(item.value) === Number(selectedBrandId));
  const selectedModel = modelOptions.find((item) => Number(item.value) === Number(selectedModelId));
  const selectedProduct = productOptions.find(
    (item) => Number(item.value) === Number(selectedProductId)
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!selectedBrand || !selectedModel || !selectedProduct) {
      setError("Debes seleccionar marca, modelo y producto.");
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
      displayText: `${matchedItem.marca} > ${matchedItem.modelo} > ${matchedItem.nombre}`,
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
              <span>Cargando catálogos de producto...</span>
            </Alert>
          ) : null}

          <Form.Group className="mb-3">
            <Form.Label className="inv-select-modal__label">Marca</Form.Label>
            <Form.Select
              value={selectedBrandId}
              onChange={(event) => {
                setSelectedBrandId(event.target.value);
                setSelectedModelId("");
                setSelectedProductId("");
              }}
              className="inv-select-modal__control"
              disabled={isLoading}
            >
              <option value="">{isLoading ? "Cargando marcas..." : "Seleccione la marca"}</option>
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
              onChange={(event) => {
                setSelectedModelId(event.target.value);
                setSelectedProductId("");
              }}
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

          <Form.Group className="mb-3">
            <Form.Label className="inv-select-modal__label">Producto</Form.Label>
            <Form.Select
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              className="inv-select-modal__control"
              disabled={!selectedModelId || isLoading}
            >
              <option value="">
                {isLoading ? "Cargando productos..." : "Seleccione el producto"}
              </option>
              {productOptions.map((item) => (
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

  if (status === 401) return "Sesión expirada. Inicia sesión nuevamente.";
  if (status === 400) return backendMessage || "Datos inválidos. Revisa la información capturada.";
  if (status === 409) return backendMessage || "Ya existe un activo con ese número de serie.";
  if (status === 500) return backendMessage || "Error del servidor. Inténtalo nuevamente.";
  if (status === 0) return "No fue posible conectar con el servidor.";
  if (/número de serie ya está registrado/i.test(backendMessage)) {
    return "Ya existe un activo con ese número de serie.";
  }
  return backendMessage || "No fue posible crear el bien.";
}

function parseCosto(value) {
  const normalized = String(value).replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export default function RegistroBien() {
  const navigate = useNavigate();
  const { currentUser, logout, menuItems } = useUsers();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [registeredCount, setRegisteredCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [existingActivos, setExistingActivos] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const defaultValues = {
    numero_serie: "",
    fecha_alta: todayDateString(),
    descripcion: "",
    estatus: ESTATUS_ACTIVO.DISPONIBLE,
    costo: "",
  };

  const { control, handleSubmit, reset } = useForm({
    resolver: zodResolver(registroBienSchema),
    defaultValues,
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

  const clearForm = () => {
    reset({
      ...defaultValues,
      fecha_alta: todayDateString(),
      estatus: ESTATUS_ACTIVO.DISPONIBLE,
    });
    setSelectedProduct(null);
    setSelectedLocation(null);
  };

  const resetForm = () => {
    clearForm();
    setErrorMessage("");
    setSuccessMessage("");
  };

  const onSubmit = handleSubmit(async (data) => {
    setErrorMessage("");
    setSuccessMessage("");
    const numeroSerie = data.numero_serie.trim();

    const productoId = Number(selectedProduct?.id_producto);
    const aulaId = Number(selectedLocation?.id_aula);

    if (!productoId) {
      setErrorMessage("Debes seleccionar un producto.");
      return;
    }

    if (!aulaId) {
      setErrorMessage("Debes seleccionar una ubicación.");
      return;
    }

    const serieNormalizada = numeroSerie.toLowerCase();
    const serieDuplicada = existingActivos.some((item) =>
      String(item?.numero_serie ?? "").trim().toLowerCase() === serieNormalizada
    );

    if (serieDuplicada) {
      setErrorMessage("Ya existe un activo con ese número de serie.");
      return;
    }

    const costo = parseCosto(data.costo);
    if (!Number.isFinite(costo) || costo <= 0) {
      setErrorMessage("El costo debe ser un número válido mayor a 0.");
      return;
    }

    setIsSaving(true);

    try {
      await createActivo({
        numeroSerie,
        productoId,
        fechaAlta: data.fecha_alta,
        aulaId,
        descripcion: data.descripcion.trim(),
        costo,
      });

      setRegisteredCount((prev) => prev + 1);
      setExistingActivos((prev) => [...prev, { numero_serie: numeroSerie }]);
      clearForm();
      setSuccessMessage("Bien creado correctamente");
    } catch (error) {
      setErrorMessage(getCreateErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <div className="inv-page inv-register-asset-page">
      <NavbarMenu title="Registro de Bienes" onMenuClick={() => setOpenSidebar((value) => !value)} />

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
            <h2 className="inv-register-asset__title">Registro de Bien</h2>

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

            <Form onSubmit={onSubmit} className="inv-register-asset__form">
              <Controller
                name="numero_serie"
                control={control}
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Número de serie"
                    name={field.name}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Ingrese el número de serie"
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Form.Group className="mb-3">
                <Form.Label className="inv-register__label">Producto</Form.Label>
                <button
                  type="button"
                  className="inv-register-asset__picker"
                  onClick={() => setShowProductModal(true)}
                >
                  <span>{selectedProduct?.displayText || "Seleccione producto"}</span>
                  <span className="inv-register-asset__pickerIcon" aria-hidden="true">
                    ▼
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
                  />
                )}
              />

              <Form.Group className="mb-3">
                <Form.Label className="inv-register__label">Ubicación</Form.Label>
                <button
                  type="button"
                  className="inv-register-asset__picker"
                  onClick={() => setShowLocationModal(true)}
                >
                  <span>{selectedLocation?.displayText || "Seleccione ubicación"}</span>
                  <span className="inv-register-asset__pickerIcon" aria-hidden="true">
                    ▼
                  </span>
                </button>
              </Form.Group>

              <Controller
                name="descripcion"
                control={control}
                render={({ field, fieldState }) => (
                  <FormInput
                    label="Descripción"
                    name={field.name}
                    as="textarea"
                    rows={3}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Ingrese la descripción del activo"
                    className="inv-register__input inv-register-asset__textarea"
                    error={fieldState.error?.message}
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
                    disabled
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
                  />
                )}
              />

              <div className="inv-register-asset__actions">
                <PrimaryButton
                  type="submit"
                  variant="primary"
                  label={isSaving ? "Guardando..." : "Registrar"}
                  className="inv-register-asset__submit"
                  disabled={isSaving}
                />
                <PrimaryButton
                  type="button"
                  variant="light"
                  label="Cancelar"
                  className="inv-register-asset__cancel"
                  onClick={resetForm}
                  disabled={isSaving}
                />
              </div>
            </Form>

            <p className="inv-register-asset__counter mb-0">
              Registros en esta sesión: {registeredCount}
            </p>
          </Card.Body>
        </Card>
      </Container>

      <SelectProductModalInline
        show={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSave={(selection) => {
          setSelectedProduct(selection);
          setShowProductModal(false);
        }}
      />

      <SelectLocationModal
        show={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSave={(selection) => {
          setSelectedLocation(selection);
          setShowLocationModal(false);
        }}
      />
    </div>
  );
}
