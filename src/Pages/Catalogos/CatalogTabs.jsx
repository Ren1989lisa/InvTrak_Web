export default function CatalogTabs({ activeTab, onTabChange }) {
  return (
    <div className="inv-catalog-tabs">
      <button
        type="button"
        className={`inv-catalog-tabs__btn${
          activeTab === "producto" ? " inv-catalog-tabs__btn--active" : ""
        }`}
        onClick={() => onTabChange("producto")}
      >
        Producto
      </button>
      <button
        type="button"
        className={`inv-catalog-tabs__btn${
          activeTab === "ubicacion" ? " inv-catalog-tabs__btn--active" : ""
        }`}
        onClick={() => onTabChange("ubicacion")}
      >
        Ubicación
      </button>
    </div>
  );
}
