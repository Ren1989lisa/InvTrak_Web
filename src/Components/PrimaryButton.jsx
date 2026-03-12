import { Button } from "react-bootstrap";

export default function PrimaryButton({
  variant = "primary",
  label,
  onClick,
  className = "",
  ...props
}) {
  return (
    <Button
      type="button"
      variant={variant}
      onClick={onClick}
      className={className}
      {...props}
    >
      {label}
    </Button>
  );
}
