import { useEffect, useMemo, useState } from "react";
import { normalize } from "../utils/catalogUtils";
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  getUbicaciones,
  createUbicacion,
  updateUbicacion,
  deleteUbicacion,
} from "../services/catalogoService";

export function useCatalogState() {
  const [productos, setProductos] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoadingProductos, setIsLoadingProductos] = useState(false);
  const [isLoadingUbicaciones, setIsLoadingUbicaciones] = useState(false);
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

  // Cargar productos del backend
  useEffect(() => {
    let active = true;
    async function loadProductos() {
      setIsLoadingProductos(true);
      try {
        const list = await getProductos();
        if (!active) return;
        setProductos(list);
      } catch (error) {
        if (!active) return;
        console.error("Error cargando productos:", error);
      } finally {
        if (active) setIsLoadingProductos(false);
      }
    }
    loadProductos();
    return () => {
      active = false;
    };
  }, []);

  // Cargar ubicaciones del backend
  useEffect(() => {
    let active = true;
    async function loadUbicaciones() {
      setIsLoadingUbicaciones(true);
      try {
        const list = await getUbicaciones();
        if (!active) return;
        setLocations(list);
      } catch (error) {
        if (!active) return;
        console.error("Error cargando ubicaciones:", error);
      } finally {
        if (active) setIsLoadingUbicaciones(false);
      }
    }
    loadUbicaciones();
    return () => {
      active = false;
    };
  }, []);

  // Construir filas de productos para la tabla
  const catalogRows = useMemo(() => {
    return productos.map((p) => ({
      id_producto: p.id_producto,
      nombre: p.nombre ?? "",
      marca: p.marca ?? "",
      modelo: p.modelo ?? "",
      descripcion: p.descripcion ?? "",
      estatus: p.estatus ?? "ACTIVO",
    }));
  }, [productos]);

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
          normalize(row.aula).includes(query);
        return matchesCampus && matchesSearch;
      })
      .sort((a, b) => Number(a.id_ubicacion) - Number(b.id_ubicacion));
  }, [locations, locationSearch, campusFilter]);

  const handleSaveProduct = async ({ nombre, marca, modelo, descripcion }) => {
    console.log("🔵 [PRODUCTO] Iniciando creación:", { nombre, marca, modelo, descripcion });
    clearMessages();
    try {
      console.log("🔵 [PRODUCTO] Llamando createProducto...");
      const resultado = await createProducto({ nombre, marca, modelo, descripcion });
      console.log("✅ [PRODUCTO] Creado exitosamente:", resultado);
      const refreshed = await getProductos();
      console.log("✅ [PRODUCTO] Lista actualizada, total:", refreshed.length);
      setProductos(refreshed);
      setShowAddModal(false);
      setSuccessMessage("Producto agregado correctamente");
    } catch (error) {
      console.error("❌ [PRODUCTO] Error:", error);
      setErrorMessage(error?.message || "No fue posible agregar el producto.");
    }
  };

  const handleOpenEdit = (row) => {
    clearMessages();
    setSelectedProduct(row);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async ({ id_producto, descripcion, estatus }) => {
    clearMessages();
    try {
      await updateProducto(id_producto, { descripcion, estatus });
      const refreshed = await getProductos();
      setProductos(refreshed);
      setShowEditModal(false);
      setSelectedProduct(null);
      setSuccessMessage("Producto actualizado correctamente");
    } catch (error) {
      setErrorMessage(error?.message || "No fue posible actualizar el producto.");
    }
  };

  const handleDeleteProduct = async (idProducto) => {
    clearMessages();
    try {
      await deleteProducto(idProducto);
      const refreshed = await getProductos();
      setProductos(refreshed);
      setShowEditModal(false);
      setSelectedProduct(null);
      setSuccessMessage("Producto eliminado correctamente");
    } catch (error) {
      setErrorMessage(error?.message || "No fue posible eliminar el producto.");
    }
  };

  const handleDeleteProductFromTable = (row) => {
    const confirmed = window.confirm(`¿Eliminar el producto "${row?.nombre}"?`);
    if (!confirmed) return;
    handleDeleteProduct(row?.id_producto);
  };

  const handleSaveLocation = async ({ campus, edificio, aula, descripcion }) => {
    clearMessages();
    try {
      await createUbicacion({ campus, edificio, aula, descripcion });
      const refreshed = await getUbicaciones();
      setLocations(refreshed);
      setShowAddLocationModal(false);
      setSuccessMessage("Ubicación agregada correctamente");
    } catch (error) {
      setErrorMessage(error?.message || "No fue posible agregar la ubicación.");
    }
  };

  const handleOpenEditLocation = (row) => {
    clearMessages();
    setSelectedLocation(row);
    setShowEditLocationModal(true);
  };

  const handleUpdateLocation = async ({ id_ubicacion, descripcion }) => {
    clearMessages();
    try {
      await updateUbicacion(id_ubicacion, { descripcion });
      const refreshed = await getUbicaciones();
      setLocations(refreshed);
      setShowEditLocationModal(false);
      setSelectedLocation(null);
      setSuccessMessage("Ubicación actualizada correctamente");
    } catch (error) {
      setErrorMessage(error?.message || "No fue posible actualizar la ubicación.");
    }
  };

  const handleDeleteLocation = async (idUbicacion) => {
    clearMessages();
    try {
      await deleteUbicacion(idUbicacion);
      const refreshed = await getUbicaciones();
      setLocations(refreshed);
      setShowEditLocationModal(false);
      setSelectedLocation(null);
      setSuccessMessage("Ubicación eliminada correctamente");
    } catch (error) {
      setErrorMessage(error?.message || "No fue posible eliminar la ubicación.");
    }
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
    marcas: [], // Ya no usamos marcas/modelos por separado
    modelos: [], // Ya no usamos marcas/modelos por separado
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
    isLoadingProductos,
    isLoadingUbicaciones,
  };
}
