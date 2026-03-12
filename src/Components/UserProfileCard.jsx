import { Button } from "react-bootstrap";

export default function UserProfileCard({
  name = "Administrador",
  onViewProfile,
}) {
  return (
    <div className="inv-user-card">
      <div className="inv-user-card__avatar" aria-hidden="true">
        <span className="inv-user-card__avatarText">A</span>
      </div>

      <div className="inv-user-card__meta">
        <div className="inv-user-card__name">{name}</div>
        <Button
          type="button"
          size="sm"
          variant="light"
          className="inv-user-card__profileBtn"
          onClick={onViewProfile}
        >
          Ver perfil
        </Button>
      </div>
    </div>
  );
}
