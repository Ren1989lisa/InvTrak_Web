import { useMemo, useState } from "react";
import { getStoredActivos } from "../activosStorage";
import {
  normalize,
  getNextId,
  buildCatalogDataFromActivos,
  buildLocationDataFromActivos,
} from "../utils/catalogUtils";

export function useCatalogState() {
  const [catalogData] = useState(() => buildCatalogDataFromActivos(getStoredActivos()));
  const [initialLocations] = useState(() => buildLocationDataFromActivos(getStoredActivos()));
  const [productos, setProductos] = useState(catalogData.productos);
  const [marcas, setMarcas] = useState(catalogData.marcas);
  const [modelos, setModelos] = useState(catalogData.modelos);
  const [locations, setLocations] = useState(initialLocations);
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

  const clearMessages = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

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
    clearMessages();

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
    clearMessages();
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
    clearMessages();
  };

  const handleDeleteProduct = (idProducto) => {
    setProductos((prev) =>
      prev.filter((item) => Number(item?.id_producto) !== Number(idProducto))
    );
    setShowEditModal(false);
    setSelectedProduct(null);
    setSuccessMessage("Producto eliminado correctamente");
    clearMessages();
  };

  const handleDeleteProductFromTable = (row) => {
    const confirmed = window.confirm(`¿Eliminar el producto "${row?.nombre}"?`);
    if (!confirmed) return;
    handleDeleteProduct(row?.id_producto);
  };

  const handleSaveLocation = ({ campus, edificio, aula, descripcion }) => {
    clearMessages();

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
    clearMessages();
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
    clearMessages();
  };

  const handleDeleteLocation = (idUbicacion) => {
    setLocations((prev) =>
      prev.filter((item) => Number(item?.id_ubicacion) !== Number(idUbicacion))
    );
    setShowEditLocationModal(false);
    setSelectedLocation(null);
    setSuccessMessage("Ubicación eliminada correctamente");
    clearMessages();
  };

  const handleDeleteLocationFromTable = (row) => {
    const confirmed = window.confirm(
      `¿Eliminar la ubicación "${row?.campus} ${row?.edificio} ${row?.aula}"?`
    );
    if (!confirmed) return;
    handleDeleteLocation(row?.id_ubicacion);
  };

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filteredRows,
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    selectedProduct,
    setSelectedProduct,
    productos,
    marcas,
    modelos,
    handleSaveProduct,
    handleOpenEdit,
    handleUpdateProduct,
    handleDeleteProduct,
    handleDeleteProductFromTable,
    locationSearch,
    setLocationSearch,
    campusFilter,
    setCampusFilter,
    campusOptions,
    filteredLocations,
    showAddLocationModal,
    setShowAddLocationModal,
    showEditLocationModal,
    setShowEditLocationModal,
    selectedLocation,
    setSelectedLocation,
    locations,
    handleSaveLocation,
    handleOpenEditLocation,
    handleUpdateLocation,
    handleDeleteLocation,
    handleDeleteLocationFromTable,
    successMessage,
    errorMessage,
  };
}
