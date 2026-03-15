function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 21v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function UserSelectableCard({ user, selected = false, onSelect }) {
  return (
    <button
      type="button"
      className={`inv-assign-user-card${selected ? " inv-assign-user-card--selected" : ""}`}
      onClick={() => onSelect?.(user)}
    >
      <span className="inv-assign-user-card__icon">
        <UserIcon />
      </span>
      <span className="inv-assign-user-card__name">{user?.nombre_completo}</span>
    </button>
  );
}
