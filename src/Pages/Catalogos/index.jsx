import { useState } from "react";
import { Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import NavbarMenu from "../../Components/NavbarMenu";
import SidebarMenu from "../../Components/SidebarMenu";
import AddProductModal from "../../Components/AddProductModal";
import EditProductModal from "../../Components/EditProductModal";
import AddLocationModal from "../../Components/AddLocationModal";
import EditLocationModal from "../../Components/EditLocationModal";
import CatalogTabs from "./CatalogTabs";
import ProductTabContent from "./ProductTabContent";
import LocationTabContent from "./LocationTabContent";
import { useUsers } from "../../context/UsersContext";
import { useCatalogState } from "../../hooks/useCatalogState";

import "../../Style/bienes-registrados.css";
import "../../Style/sidebar.css";
import "../../Style/catalogos.css";

export default function Catalogos() {
  const navigate = useNavigate();
  const { currentUser, logout, menuItems } = useUsers();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState("producto");

  const catalogState = useCatalogState();

  const {
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
  } = catalogState;

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
          logout();
          navigate("/login");
        }}
      />

      <Container fluid className="inv-content px-3 px-md-4 py-3">
        <CatalogTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "ubicacion" ? (
          <LocationTabContent
            successMessage={successMessage}
            errorMessage={errorMessage}
            locationSearch={locationSearch}
            setLocationSearch={setLocationSearch}
            campusFilter={campusFilter}
            setCampusFilter={setCampusFilter}
            campusOptions={campusOptions}
            filteredLocations={filteredLocations}
            onAddClick={() => setShowAddLocationModal(true)}
            onDelete={handleDeleteLocationFromTable}
            isLoading={isLoadingUbicaciones}
          />
        ) : (
          <ProductTabContent
            successMessage={successMessage}
            errorMessage={errorMessage}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            filteredRows={filteredRows}
            onAddClick={() => setShowAddModal(true)}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteProductFromTable}
            isLoading={isLoadingProductos}
          />
        )}
      </Container>

      <AddProductModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveProduct}
        productos={productos}
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
