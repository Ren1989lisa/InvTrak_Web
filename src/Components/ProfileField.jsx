export default function ProfileField({ label, value }) {
  const displayValue = value === null || value === undefined ? "—" : String(value);

  return (
    <div className="inv-profile-field">
      <span className="inv-field__label">{label}</span>
      <span className="inv-field__value">{displayValue}</span>
    </div>
  );
}

