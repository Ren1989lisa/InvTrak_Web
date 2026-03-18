import { useMemo, useState } from "react";
import { Alert, Card, Container, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import PrimaryButton from "../Components/PrimaryButton";
import FormInput from "../Components/FormInput";
import FormSelect from "../Components/FormSelect";
import SelectProductModal from "../Components/SelectProductModal";
import SelectLocationModal from "../Components/SelectLocationModal";
import { useUsers } from "../context/UsersContext";
import { addActivo, getStoredActivos } from "../activosStorage";

import productosData from "../Data/productos.json";
import marcasData from "../Data/marcas.json";
import modelosData from "../Data/modelos.json";
import campusData from "../Data/campus.json";
import edificiosData from "../Data/edificios.json";
import aulasData from "../Data/aulas.json";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/registro-bien.css";

function todayDateString() {
  const d = new Date();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export default function RegistroBien() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUserId, menuItems } = useUsers();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [registeredCount, setRegisteredCount] = useState(0);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [form, setForm] = useState({
    numero_serie: "",
    fecha_alta: todayDateString(),
    descripcion: "",
    estatus: "Disponible",
    costo: "",
  });

  const estatusOptions = useMemo(
    () => [
      { value: "Disponible", label: "Disponible" },
      { value: "Resguardado", label: "Resguardado" },
      { value: "Mantenimiento", label: "Mantenimiento" },
    ],
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      numero_serie: "",
      fecha_alta: todayDateString(),
      descripcion: "",
      estatus: "Disponible",
      costo: "",
    });
    setSelectedProduct(null);
    setSelectedLocation(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!form.numero_serie.trim()) {
      setErrorMessage("El número de serie es obligatorio.");
      return;
    }
    if (!selectedProduct?.displayText) {
      setErrorMessage("Debes seleccionar un producto.");
      return;
    }
    if (!form.fecha_alta) {
      setErrorMessage("La fecha de alta es obligatoria.");
      return;
    }
    if (!selectedLocation?.displayText) {
      setErrorMessage("Debes seleccionar una ubicación.");
      return;
    }
    if (!form.descripcion.trim()) {
      setErrorMessage("La descripción es obligatoria.");
      return;
    }
    const costNumber = Number(form.costo);
    if (!form.costo || Number.isNaN(costNumber) || costNumber < 0) {
      setErrorMessage("El costo debe ser un número válido.");
      return;
    }

    const activosActuales = getStoredActivos();
    const serieNormalizada = form.numero_serie.trim().toLowerCase();
    const serieDuplicada = activosActuales.some(
      (item) => (item?.numero_serie ?? "").toString().trim().toLowerCase() === serieNormalizada
    );
    if (serieDuplicada) {
      setErrorMessage("Ya existe un activo con ese número de serie.");
      return;
    }

    const nextId =
      Math.max(...activosActuales.map((item) => Number(item?.id_activo) || 0), 0) + 1;
    const campus = selectedLocation.campus.toUpperCase().replace(/\s+/g, "");
    const edificio = selectedLocation.edificio.toUpperCase().replace(/\s+/g, "");
    const aula = selectedLocation.aula.toUpperCase().replace(/\s+/g, "");
    const tipo = selectedProduct.nombre.toUpperCase().slice(0, 2);
    const codigoInterno = `${tipo}${campus}${edificio}${aula}${nextId}`;

    const newAsset = {
      id_activo: nextId,
      codigo_interno: codigoInterno,
      numero_serie: form.numero_serie.trim(),
      producto: {
        tipo_activo: selectedProduct.nombre,
        marca: selectedProduct.marca,
        modelo: selectedProduct.modelo,
      },
      descripcion: form.descripcion.trim(),
      propietario: "",
      estado_asignacion: "pendiente de asignacion",
      estatus: form.estatus,
      costo: Number(costNumber.toFixed(2)),
      fecha_alta: form.fecha_alta,
      ubicacion: {
        campus: selectedLocation.campus,
        edificio: selectedLocation.edificio,
        aula: selectedLocation.aula,
      },
    };

    addActivo(newAsset);
    setRegisteredCount((prev) => prev + 1);
    setSuccessMessage("Bien registrado correctamente");
    resetForm();
  };

  return (
    <div className="inv-page inv-register-asset-page">
      <NavbarMenu title="Registro de Bienes" onMenuClick={() => setOpenSidebar((v) => !v)} />

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

      <Container fluid className="inv-content px-3 px-md-4 py-4">
        <Card className="inv-register-asset__card shadow-sm border-0">
          <Card.Body className="inv-register-asset__cardBody">
            <h2 className="inv-register-asset__title">Registro de Bien</h2>

            {successMessage ? (
              <Alert variant="success" className="mb-3">
                {successMessage}
              </Alert>
            ) : null}
            {errorMessage ? (
              <Alert variant="danger" className="mb-3">
                {errorMessage}
              </Alert>
            ) : null}

            <Form onSubmit={handleSubmit} className="inv-register-asset__form">
              <FormInput
                label="Número de serie"
                name="numero_serie"
                value={form.numero_serie}
                onChange={handleChange}
                placeholder="Ingrese el número de serie"
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

              <FormInput
                label="Fecha de alta"
                name="fecha_alta"
                type="date"
                value={form.fecha_alta}
                onChange={handleChange}
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

              <Form.Group className="mb-3">
                <Form.Label className="inv-register__label">Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  className="inv-register__input inv-register-asset__textarea"
                  placeholder="Ingrese la descripción del activo"
                />
              </Form.Group>

              <FormSelect
                label="Estatus"
                name="estatus"
                value={form.estatus}
                onChange={handleChange}
                options={estatusOptions}
              />

              <FormInput
                label="Costo"
                name="costo"
                type="number"
                value={form.costo}
                onChange={handleChange}
                placeholder="Ingrese el costo"
              />

              <div className="inv-register-asset__actions">
                <PrimaryButton
                  type="submit"
                  variant="primary"
                  label="Registrar"
                  className="inv-register-asset__submit"
                />
                <PrimaryButton
                  type="button"
                  variant="light"
                  label="Cancelar"
                  className="inv-register-asset__cancel"
                  onClick={resetForm}
                />
              </div>
            </Form>

            <p className="inv-register-asset__counter mb-0">
              Registros en esta sesión: {registeredCount}
            </p>
          </Card.Body>
        </Card>
      </Container>

      <SelectProductModal
        show={showProductModal}
        onClose={() => setShowProductModal(false)}
        onSave={(selection) => {
          setSelectedProduct(selection);
          setShowProductModal(false);
        }}
        productos={productosData}
        marcas={marcasData}
        modelos={modelosData}
      />

      <SelectLocationModal
        show={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onSave={(selection) => {
          setSelectedLocation(selection);
          setShowLocationModal(false);
        }}
        campus={campusData}
        edificios={edificiosData}
        aulas={aulasData}
      />
    </div>
  );
}
