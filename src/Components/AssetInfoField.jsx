import { formatDate } from "../utils/format";

export default function AssetInfoField({ label, value, stack = false }) {
  const className = stack ? "inv-field inv-field--stack" : "inv-field";

  return (
    <div className={className}>
      <span className="inv-field__label">{label}</span>
      <span className="inv-field__value">{formatDate(value)}</span>
    </div>
  );
}
