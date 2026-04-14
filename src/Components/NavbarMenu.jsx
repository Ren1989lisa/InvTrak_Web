import { useEffect, useRef, useState } from "react";
import { Button, Container, Navbar } from "react-bootstrap";
import { FaBars, FaBell } from "react-icons/fa";

export default function NavbarMenu({
  title = "Bienes registrados",
  onMenuClick,
  notificationItems = null,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  const hasNotifications = Array.isArray(notificationItems) && notificationItems.length > 0;

  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  return (
    <Navbar className="inv-navbar" expand={false}>
      <Container fluid className="px-3 d-flex align-items-center">
        <Button
          type="button"
          variant="link"
          className="inv-navbar__menu p-0"
          aria-label="Abrir menu"
          onClick={onMenuClick}
        >
          <FaBars className="inv-navbar__menuIcon" aria-hidden="true" />
        </Button>

        <Navbar.Brand className="inv-navbar__title ms-3 mb-0 flex-grow-1">
          {title}
        </Navbar.Brand>

        {notificationItems !== null ? (
          <div ref={containerRef} className="inv-navbar__notifications position-relative">
            <Button
              type="button"
              variant="link"
              className="inv-navbar__bell p-0"
              aria-label="Notificaciones"
              onClick={() => setShowDropdown((value) => !value)}
            >
              <FaBell size={22} />
              {hasNotifications ? <span className="inv-navbar__bell-badge" aria-hidden="true" /> : null}
            </Button>

            {showDropdown ? (
              <div className="inv-navbar__dropdown">
                <div className="inv-navbar__dropdown-title">Pendientes de resguardo</div>
                {hasNotifications ? (
                  <div className="inv-navbar__dropdown-list">
                    {notificationItems.map((item) => (
                      <div
                        key={item.id_activo ?? item.activoId ?? item.resguardoId}
                        className="inv-navbar__dropdown-item"
                      >
                        <div className="inv-navbar__dropdown-item-info">
                          <div>Etq. bien: {item.etiqueta_bien}</div>
                          <div>Producto: {item.productoNombre}</div>
                        </div>
                        <Button
                          type="button"
                          variant="light"
                          size="sm"
                          className="inv-navbar__dropdown-btn"
                          onClick={() => {
                            item.onSubirQR?.(item);
                            setShowDropdown(false);
                          }}
                        >
                          Subir QR
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="inv-navbar__dropdown-empty">No hay pendientes</div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </Container>
    </Navbar>
  );
}
