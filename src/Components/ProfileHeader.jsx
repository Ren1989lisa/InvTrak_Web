export default function ProfileHeader({ name = "Usuario" }) {
  const initial =
    typeof name === "string" && name.trim().length > 0
      ? name.trim().charAt(0).toUpperCase()
      : "U";

  return (
    <div className="inv-profile-header">
      <div className="inv-profile-header__avatar">
        <span className="inv-profile-header__avatarText">{initial}</span>
      </div>
      <div className="inv-profile-header__name">{name}</div>
    </div>
  );
}

