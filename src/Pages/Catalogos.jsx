import { useMemo, useState } from "react";
import { Alert, Container, Form, Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import PrimaryButton from "../Components/PrimaryButton";
import ProductTable from "../Components/ProductTable";
import PaginationComponent from "../Components/PaginationComponent";
import AddProductModal from "../Components/AddProductModal";
import EditProductModal from "../Components/EditProductModal";
import LocationTable from "../Components/LocationTable";
import AddLocationModal from "../Components/AddLocationModal";
import EditLocationModal from "../Components/EditLocationModal";
import { useUsers } from "../context/UsersContext";
import { getStoredActivos } from "../activosStorage";

import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";
import "../Style/catalogos.css";

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function getNextId(list, key) {
  if (!Array.isArray(list) || !list.length) return 1;
  return Math.max(...list.map((item) => Number(item?.[key]) || 0)) + 1;
}

function mapStatusToCatalogStatus(status) {
  return normalize(status) === "inactivo" ? "Inactivo" : "Activo";
}

function buildCatalogDataFromActivos(activos) {
  const marcas = [];
  const modelos = [];
  const productos = [];
  const marcaIndex = new Map();
  const modeloIndex = new Map();

  const list = Array.isArray(activos) ? activos : [];

  list.forEach((activo, i) => {
    const productoData = activo?.producto ?? {};
    const nombreProducto = (
      productoData?.tipo_activo ?? activo?.tipo_activo ?? ""
    ).toString().trim();
    const nombreMarca = (productoData?.marca ?? activo?.marca ?? "").toString().trim();
    const nombreModelo = (productoData?.modelo ?? activo?.modelo ?? "").toString().trim();

    if (!nombreProducto || !nombreMarca || !nombreModelo) return;

    const marcaKey = normalize(nombreMarca);
    let marcaId = marcaIndex.get(marcaKey);
    if (!marcaId) {
      marcaId = marcas.length + 1;
      marcaIndex.set(marcaKey, marcaId);
      marcas.push({
        id_marca: marcaId,
        nombre: nombreMarca,
      });
    }

    const modeloKey = `${normalize(nombreModelo)}::${marcaId}`;
    let modeloId = modeloIndex.get(modeloKey);
    if (!modeloId) {
      modeloId = modelos.length + 1;
      modeloIndex.set(modeloKey, modeloId);
      modelos.push({
        id_modelo: modeloId,
        nombre: nombreModelo,
        id_marca: marcaId,
      });
    }

    productos.push({
      id_producto: Number(activo?.id_activo) || i + 1,
      nombre: nombreProducto,
      id_modelo: modeloId,
      descripcion: (activo?.descripcion ?? "").toString().trim(),
      estatus: mapStatusToCatalogStatus(activo?.estatus),
    });
  });

  return { productos, modelos, marcas };
}

function buildLocationDataFromActivos(activos) {
  const locationMap = new Map();
  const list = Array.isArray(activos) ? activos : [];

  list.forEach((activo) => {
    const ubicacion = activo?.ubicacion ?? {};
    const campus = (ubicacion?.campus ?? "").toString().trim();
    const edificio = (ubicacion?.edificio ?? "").toString().trim();
    const aula = (ubicacion?.aula ?? "").toString().trim();
    const descripcion = (ubicacion?.descripcion ?? "").toString().trim();

    if (!campus || !edificio || !aula) return;

    const key = `${normalize(campus)}::${normalize(edificio)}::${normalize(aula)}`;
    if (locationMap.has(key)) return;

    locationMap.set(key, {
      id_ubicacion: locationMap.size + 1,
      campus,
      edificio,
      aula,
      descripcion,
    });
  });

  return Array.from(locationMap.values());
}

export default function Catalogos() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUserId, menuItems } = useUsers();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState("producto");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todo");
  const [locationSearch, setLocationSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState("todo");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [showEditLocationModal, setShowEditLocationModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [catalogData] = useState(() => buildCatalogDataFromActivos(getStoredActivos()));
  const [initialLocations] = useState(() => buildLocationDataFromActivos(getStoredActivos()));
  const [productos, setProductos] = useState(catalogData.productos);
  const [marcas, setMarcas] = useState(catalogData.marcas);
  const [modelos, setModelos] = useState(catalogData.modelos);
  const [locations, setLocations] = useState(initialLocations);

  const catalogRows = useMemo(() => {
    return productos
      .map((producto) => {
        const modelo = modelos.find(
          (m) => Number(m?.id_modelo) === Number(producto?.id_modelo)
        );
        const marca = marcas.find((b) => Number(b?.id_marca) === Number(modelo?.id_marca));

        return {
          id_producto: producto.id_producto,
          nombre: producto.nombre ?? "",
          marca: marca?.nombre ?? "",
          modelo: modelo?.nombre ?? "",
          descripcion: producto.descripcion ?? "",
          estatus: producto.estatus ?? "Activo",
        };
      })
      .sort((a, b) => Number(a.id_producto) - Number(b.id_producto));
  }, [productos, modelos, marcas]);

  const filteredRows = useMemo(() => {
    const query = normalize(search);

    return catalogRows.filter((row) => {
      const rowStatus = normalize(row.estatus);
      const matchesStatus = statusFilter === "todo" || rowStatus === normalize(statusFilter);
      const matchesSearch =
        !query ||
        normalize(row.nombre).includes(query) ||
        normalize(row.marca).includes(query) ||
        normalize(row.modelo).includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [catalogRows, search, statusFilter]);

  const campusOptions = useMemo(() => {
    return [...new Set(locations.map((item) => item.campus).filter(Boolean))].sort();
  }, [locations]);

  const filteredLocations = useMemo(() => {
    const query = normalize(locationSearch);

    return locations
      .filter((row) => {
        const matchesCampus =
          campusFilter === "todo" || normalize(row.campus) === normalize(campusFilter);
        const matchesSearch =
          !query ||
          normalize(row.campus).includes(query) ||
          normalize(row.edificio).includes(query) ||
          normalize(row.aula).includes(query) ||
          normalize(row.descripcion).includes(query);

        return matchesCampus && matchesSearch;
      })
      .sort((a, b) => Number(a.id_ubicacion) - Number(b.id_ubicacion));
  }, [locations, locationSearch, campusFilter]);

  const handleSaveProduct = ({ nombre, marca, modelo, descripcion, estatus }) => {
    setSuccessMessage("");
    setErrorMessage("");

    const normalizedBrand = normalize(marca);
    const normalizedModel = normalize(modelo);
    const normalizedName = normalize(nombre);

    let brandId;
    const existingBrand = marcas.find((item) => normalize(item?.nombre) === normalizedBrand);
    if (existingBrand) {
      brandId = Number(existingBrand.id_marca);
    } else {
      const newBrand = {
        id_marca: getNextId(marcas, "id_marca"),
        nombre: marca.trim(),
      };
      brandId = newBrand.id_marca;
      setMarcas((prev) => [...prev, newBrand]);
    }

    let modelId;
    const existingModel = modelos.find(
      (item) =>
        normalize(item?.nombre) === normalizedModel &&
        Number(item?.id_marca) === Number(brandId)
    );
    if (existingModel) {
      modelId = Number(existingModel.id_modelo);
    } else {
      const newModel = {
        id_modelo: getNextId(modelos, "id_modelo"),
        nombre: modelo.trim(),
        id_marca: Number(brandId),
      };
      modelId = newModel.id_modelo;
      setModelos((prev) => [...prev, newModel]);
    }

    const duplicatedProduct = productos.some(
      (item) =>
        normalize(item?.nombre) === normalizedName && Number(item?.id_modelo) === Number(modelId)
    );
    if (duplicatedProduct) {
      setErrorMessage("Ese producto ya existe para el modelo seleccionado.");
      return;
    }

    const newProduct = {
      id_producto: getNextId(productos, "id_producto"),
      nombre: nombre.trim(),
      id_modelo: Number(modelId),
      descripcion: descripcion.trim(),
      estatus: estatus || "Activo",
    };

    setProductos((prev) => [...prev, newProduct]);
    setShowAddModal(false);
    setSuccessMessage("Producto agregado correctamente");
  };

  const handleOpenEdit = (row) => {
    setSuccessMessage("");
    setErrorMessage("");
    setSelectedProduct(row);
    setShowEditModal(true);
  };

  const handleUpdateProduct = ({ id_producto, descripcion, estatus }) => {
    const nextDescription = (descripcion ?? "").trim();
    if (!nextDescription) {
      setErrorMessage("La descripción no puede estar vacía.");
      return;
    }

    setProductos((prev) =>
      prev.map((item) =>
        Number(item?.id_producto) === Number(id_producto)
          ? { ...item, descripcion: nextDescription, estatus: estatus || "Activo" }
          : item
      )
    );

    setShowEditModal(false);
    setSelectedProduct(null);
    setSuccessMessage("Producto actualizado correctamente");
    setErrorMessage("");
  };

  const handleDeleteProduct = (idProducto) => {
    setProductos((prev) =>
      prev.filter((item) => Number(item?.id_producto) !== Number(idProducto))
    );

    setShowEditModal(false);
    setSelectedProduct(null);
    setSuccessMessage("Producto eliminado correctamente");
    setErrorMessage("");
  };

  const handleDeleteProductFromTable = (row) => {
    const confirmed = window.confirm(`¿Eliminar el producto "${row?.nombre}"?`);
    if (!confirmed) return;
    handleDeleteProduct(row?.id_producto);
  };

  const handleSaveLocation = ({ campus, edificio, aula, descripcion }) => {
    setSuccessMessage("");
    setErrorMessage("");

    const duplicate = locations.some(
      (item) =>
        normalize(item?.campus) === normalize(campus) &&
        normalize(item?.edificio) === normalize(edificio) &&
        normalize(item?.aula) === normalize(aula)
    );

    if (duplicate) {
      setErrorMessage("Esa ubicación ya existe.");
      return;
    }

    const newLocation = {
      id_ubicacion: getNextId(locations, "id_ubicacion"),
      campus: campus.trim(),
      edificio: edificio.trim(),
      aula: aula.trim(),
      descripcion: (descripcion ?? "").trim(),
    };

    setLocations((prev) => [...prev, newLocation]);
    setShowAddLocationModal(false);
    setSuccessMessage("Ubicación agregada correctamente");
  };

  const handleOpenEditLocation = (row) => {
    setSuccessMessage("");
    setErrorMessage("");
    setSelectedLocation(row);
    setShowEditLocationModal(true);
  };

  const handleUpdateLocation = ({ id_ubicacion, descripcion }) => {
    setLocations((prev) =>
      prev.map((item) =>
        Number(item?.id_ubicacion) === Number(id_ubicacion)
          ? { ...item, descripcion: (descripcion ?? "").trim() }
          : item
      )
    );

    setShowEditLocationModal(false);
    setSelectedLocation(null);
    setSuccessMessage("Ubicación actualizada correctamente");
    setErrorMessage("");
  };

  const handleDeleteLocation = (idUbicacion) => {
    setLocations((prev) =>
      prev.filter((item) => Number(item?.id_ubicacion) !== Number(idUbicacion))
    );

    setShowEditLocationModal(false);
    setSelectedLocation(null);
    setSuccessMessage("Ubicación eliminada correctamente");
    setErrorMessage("");
  };

  const handleDeleteLocationFromTable = (row) => {
    const confirmed = window.confirm(
      `¿Eliminar la ubicación "${row?.campus} ${row?.edificio} ${row?.aula}"?`
    );
    if (!confirmed) return;
    handleDeleteLocation(row?.id_ubicacion);
  };

  return (
    <div className="inv-page">
      <NavbarMenu title="Catalogos" onMenuClick={() => setOpenSidebar((v) => !v)} />

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

      <Container fluid className="inv-content px-3 px-md-4 py-3">
        <div className="inv-catalog-tabs">
          <button
            type="button"
            className={`inv-catalog-tabs__btn${
              activeTab === "producto" ? " inv-catalog-tabs__btn--active" : ""
            }`}
            onClick={() => setActiveTab("producto")}
          >
            Producto
          </button>
          <button
            type="button"
            className={`inv-catalog-tabs__btn${
              activeTab === "ubicacion" ? " inv-catalog-tabs__btn--active" : ""
            }`}
            onClick={() => setActiveTab("ubicacion")}
          >
            Ubicación
          </button>
        </div>

        {activeTab === "ubicacion" ? (
          <>
            {successMessage ? (
              <Alert variant="success" className="mt-3 mb-2">
                {successMessage}
              </Alert>
            ) : null}

            {errorMessage ? (
              <Alert variant="danger" className="mt-3 mb-2">
                {errorMessage}
              </Alert>
            ) : null}

            <Row className="align-items-center g-2 mt-2 inv-catalog-actions">

              <Col xs={12} md="auto">
                <PrimaryButton
                  variant="primary"
                  label="+ Agregar ubicación"
                  className="inv-catalog-actions__addBtn"
                  onClick={() => setShowAddLocationModal(true)}
                />
              </Col>

              <Col>
                <Form.Control
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Ingrese nombre del edificio, aula o laboratorio..."
                  className="inv-search inv-catalog-input"
                />
              </Col>

              <Col xs={12} md="auto" className="d-flex align-items-center gap-2">
                <span className="inv-catalog-actions__statusLabel">Campus:</span>
                <Form.Select
                  value={campusFilter}
                  onChange={(e) => setCampusFilter(e.target.value)}
                  className="inv-catalog-select"
                >
                  <option value="todo">Todo</option>
                  {campusOptions.map((campus) => (
                    <option key={campus} value={campus.toLowerCase()}>
                      {campus}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            <div className="mt-3">
              <LocationTable
                rows={filteredLocations}
                onEdit={handleOpenEditLocation}
                onDelete={handleDeleteLocationFromTable}
              />
              <PaginationComponent />
            </div>
          </>
        ) : (
          <>
            {successMessage ? (
              <Alert variant="success" className="mt-3 mb-2">
                {successMessage}
              </Alert>
            ) : null}

            {errorMessage ? (
              <Alert variant="danger" className="mt-3 mb-2">
                {errorMessage}
              </Alert>
            ) : null}

            <Row className="align-items-center g-2 mt-2 inv-catalog-actions">
              <Col xs={12} md="auto">
                <PrimaryButton
                  variant="primary"
                  label="+ Agregar producto"
                  className="inv-catalog-actions__addBtn"
                  onClick={() => setShowAddModal(true)}
                />
              </Col>

              <Col>
                <Form.Control
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ingrese nombre del producto, marca o modelo"
                  className="inv-search inv-catalog-input"
                />
              </Col>

              <Col xs={12} md="auto" className="d-flex align-items-center gap-2">
                <span className="inv-catalog-actions__statusLabel">Estatus:</span>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="inv-catalog-select"
                >
                  <option value="todo">Todo</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </Form.Select>
              </Col>
            </Row>

            <div className="mt-3">
              <ProductTable
                rows={filteredRows}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteProductFromTable}
              />
              <PaginationComponent />
            </div>
          </>
        )}
      </Container>

      <AddProductModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveProduct}
        productos={productos}
        modelos={modelos}
        marcas={marcas}
      />

      <EditProductModal
        show={showEditModal}
        product={selectedProduct}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        onSave={handleUpdateProduct}
        onDelete={handleDeleteProduct}
      />

      <AddLocationModal
        show={showAddLocationModal}
        onClose={() => setShowAddLocationModal(false)}
        onSave={handleSaveLocation}
        locations={locations}
      />

      <EditLocationModal
        show={showEditLocationModal}
        location={selectedLocation}
        onClose={() => {
          setShowEditLocationModal(false);
          setSelectedLocation(null);
        }}
        onSave={handleUpdateLocation}
        onDelete={handleDeleteLocation}
      />
    </div>
  );
}
