import { useNavigate } from "react-router-dom";
import "../Style/back-button.css";

export default function BackButton({ to, label = "Regresar", className = "" }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      className={`inv-back-button ${className}`.trim()}
      onClick={handleClick}
    >
      <span className="inv-back-button__arrow" aria-hidden="true">←</span>
      <span>{label}</span>
    </button>
  );
}
