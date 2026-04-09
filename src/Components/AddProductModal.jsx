import { useMemo, useState, useEffect } from "react";
import { Alert, Form, Modal } from "react-bootstrap";
import PrimaryButton from "./PrimaryButton";

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

export default function AddProductModal({
  show,
  onClose,
  onSave,
  productos = [],
}) {
  const [nombre, setNombre] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show) return;
    setNombre("");
    setMarca("");
    setModelo("");
    setDescripcion("");
    setError("");
  }, [show]);

  const productNameOptions = useMemo(() => {
    return [...new Set(productos.map((p) => p.nombre).filter(Boolean))];
  }, [productos]);

  const brandOptions = useMemo(() => {
    const selectedName = normalize(nombre);
    if (!selectedName) {
      return [...new Set(productos.map((p) => p.marca).filter(Boolean))];
    }

    const linkedBrands = productos
      .filter((p) => normalize(p.nombre) === selectedName)
      .map((p) => p.marca)
      .filter(Boolean);

    if (linkedBrands.length) return [...new Set(linkedBrands)];
    return [...new Set(productos.map((p) => p.marca).filter(Boolean))];
  }, [nombre, productos]);

  const modelOptions = useMemo(() => {
    const selectedName = normalize(nombre);
    const selectedBrand = normalize(marca);

    if (selectedBrand) {
      return [...new Set(
        productos
          .filter((p) => normalize(p.marca) === selectedBrand)
          .map((p) => p.modelo)
          .filter(Boolean)
      )];
    }

    if (selectedName) {
      return [...new Set(
        productos
          .filter((p) => normalize(p.nombre) === selectedName)
          .map((p) => p.modelo)
          .filter(Boolean)
      )];
    }

    return [...new Set(productos.map((p) => p.modelo).filter(Boolean))];
  }, [nombre, marca, productos]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      nombre: nombre.trim(),
      marca: marca.trim(),
      modelo: modelo.trim(),
      descripcion: descripcion.trim(),
      estatus: "Activo",
    };

    if (!payload.nombre || !payload.marca || !payload.modelo || !payload.descripcion) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    onSave?.(payload);
  };

  return (
    <Modal centered show={show} onHide={onClose} dialogClassName="inv-add-product-modal">
      <Modal.Header closeButton className="inv-add-product-modal__header">
        <Modal.Title>Agregar producto</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="inv-add-product-modal__body">
          {error ? <Alert variant="danger">{error}</Alert> : null}

          <Form.Group className="mb-3">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              list="catalog-product-names"
              placeholder="Ingrese el nombre"
              className="inv-catalog-input"
            />
            <datalist id="catalog-product-names">
              {productNameOptions.map((option) => (
                <option value={option} key={option} />
              ))}
            </datalist>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Marca *</Form.Label>
            <Form.Control
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              list="catalog-brand-options"
              placeholder="Ingrese la marca"
              className="inv-catalog-input"
            />
            <datalist id="catalog-brand-options">
              {brandOptions.map((option) => (
                <option value={option} key={option} />
              ))}
            </datalist>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Modelo *</Form.Label>
            <Form.Control
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              list="catalog-model-options"
              placeholder="Ingrese el modelo"
              className="inv-catalog-input"
            />
            <datalist id="catalog-model-options">
              {[...new Set(modelOptions)].map((option) => (
                <option value={option} key={option} />
              ))}
            </datalist>
          </Form.Group>

          <Form.Group className="mb-1">
            <Form.Label>Descripción *</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ingrese la descripción del producto"
              className="inv-catalog-input inv-catalog-textarea"
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="inv-add-product-modal__footer">
          <PrimaryButton
            variant="light"
            label="Cancelar"
            className="inv-catalog-btn inv-catalog-btn--cancel"
            onClick={onClose}
          />
          <PrimaryButton
            type="submit"
            variant="primary"
            label="Guardar"
            className="inv-catalog-btn inv-catalog-btn--save"
          />
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
