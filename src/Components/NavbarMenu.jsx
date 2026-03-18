import { useState, useRef, useEffect } from "react";
import { Container, Navbar, Button } from "react-bootstrap";
import { FaBell } from "react-icons/fa";

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
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
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
          aria-label="Abrir menú"
          onClick={onMenuClick}
        >
          <span className="inv-navbar__hamburger" aria-hidden="true">
            ☰
          </span>
        </Button>

        <Navbar.Brand className="inv-navbar__title ms-3 mb-0 flex-grow-1">
          {title}
        </Navbar.Brand>

        {notificationItems !== null && (
          <div ref={containerRef} className="inv-navbar__notifications position-relative">
            <Button
              type="button"
              variant="link"
              className="inv-navbar__bell p-0"
              aria-label="Notificaciones"
              onClick={() => setShowDropdown((v) => !v)}
            >
              <FaBell size={22} />
              {hasNotifications && (
                <span className="inv-navbar__bell-badge" aria-hidden="true" />
              )}
            </Button>

            {showDropdown && (
              <div className="inv-navbar__dropdown">
                <div className="inv-navbar__dropdown-title">Pendientes de resguardo</div>
                {hasNotifications ? (
                  <div className="inv-navbar__dropdown-list">
                    {notificationItems.map((item) => (
                      <div key={item.id_activo} className="inv-navbar__dropdown-item">
                        <div className="inv-navbar__dropdown-item-info">
                          <div>Etq. bien: {item.codigo_interno}</div>
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
                          ↑ Subir QR
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="inv-navbar__dropdown-empty">
                    No hay pendientes
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Container>
    </Navbar>
  );
}
