import { Container, Navbar, Button } from "react-bootstrap";

export default function NavbarMenu({ title = "Bienes registrados", onMenuClick }) {
  return (
    <Navbar className="inv-navbar" expand={false}>
      <Container fluid className="px-3">
        <Button
          type="button"
          variant="link"
          className="inv-navbar__menu p-0"
          aria-label="Abrir menú"
          onClick={onMenuClick}
        >
          <span className="inv-navbar__hamburger" aria-hidden="true">
            ☰
          </span>
        </Button>

        <Navbar.Brand className="inv-navbar__title ms-3 mb-0">
          {title}
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
}
