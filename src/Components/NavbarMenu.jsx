import { useEffect, useRef, useState } from "react";
import { Button, Container, Navbar } from "react-bootstrap";
import { FaBars, FaBell } from "react-icons/fa";

export default function NavbarMenu({
  title = "Bienes registrados",
  onMenuClick,
  notificationItems = null,
  onNotificationsOpen,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  const hasNotifications = Array.isArray(notificationItems) && notificationItems.length > 0;
  const notificationCount = hasNotifications ? notificationItems.length : 0;

  function formatDate(value) {
    if (!value) return "Fecha no disponible";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }

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
              onClick={() =>
                setShowDropdown((value) => {
                  const next = !value;
                  if (next) {
                    onNotificationsOpen?.();
                  }
                  return next;
                })
              }
            >
              <FaBell size={22} />
              {hasNotifications ? (
                <span className="inv-navbar__bell-badge" aria-hidden="true">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              ) : null}
            </Button>

            {showDropdown ? (
              <div className="inv-navbar__dropdown">
                <div className="inv-navbar__dropdown-title">Pendientes de resguardo</div>
                {hasNotifications ? (
                  <div className="inv-navbar__dropdown-list">
                    {notificationItems.map((item, index) => (
                      <div
                        key={`${item.resguardoId ?? "res"}-${item.id_activo ?? item.activoId ?? "act"}-${index}`}
                        className="inv-navbar__dropdown-item"
                      >
                        <div className="inv-navbar__dropdown-item-info">
                          <div>Etq. bien: {item.etiqueta_bien}</div>
                          <div>Producto: {item.productoNombre}</div>
                          <div className="inv-navbar__dropdown-item-date">
                            Asignado: {formatDate(item.fechaAsignacion)}
                          </div>
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
                          Confirmar / Escanear QR
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="inv-navbar__dropdown-empty">No tienes bienes pendientes por confirmar</div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </Container>
    </Navbar>
  );
}
