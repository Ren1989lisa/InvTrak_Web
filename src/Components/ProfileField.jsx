import { formatDate } from "../utils/format";

export default function ProfileField({ label, value }) {
  return (
    <div className="inv-profile-field">
      <span className="inv-field__label">{label}</span>
      <span className="inv-field__value">{formatDate(value)}</span>
    </div>
  );
}

