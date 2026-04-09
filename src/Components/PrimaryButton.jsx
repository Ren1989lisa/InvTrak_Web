import { Button } from "react-bootstrap";

export default function PrimaryButton({
  variant = "primary",
  label,
  onClick,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <Button
      type={type}
      variant={variant}
      onClick={onClick}
      className={className}
      {...props}
    >
      {label}
    </Button>
  );
}
