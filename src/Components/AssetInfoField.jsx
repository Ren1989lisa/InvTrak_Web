/**
 * Campo reutilizable para mostrar etiqueta + valor (detalle de activo).
 * Mantiene el mismo estilo que inv-field en bienes-registrados.
 */
export default function AssetInfoField({ label, value, stack = false }) {
  const className = stack
    ? "inv-field inv-field--stack"
    : "inv-field";

  return (
    <div className={className}>
      <span className="inv-field__label">{label}</span>
      <span className="inv-field__value">{value ?? "—"}</span>
    </div>
  );
}
