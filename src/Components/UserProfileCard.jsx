import { Button } from "react-bootstrap";

export default function UserProfileCard({
  name = "Administrador",
  onViewProfile,
}) {

  const initial =
    typeof name === "string" && name.length > 0
      ? name.charAt(0).toUpperCase()
      : "U";

  return (
    <div className="inv-user-card">

      <div className="inv-user-card__avatar" aria-hidden="true">
        <span className="inv-user-card__avatarText">
          {initial}
        </span>
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