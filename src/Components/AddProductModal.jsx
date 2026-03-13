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
  modelos = [],
  marcas = [],
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

  const mergedRows = useMemo(() => {
    return productos
      .map((p) => {
        const model = modelos.find((m) => Number(m?.id_modelo) === Number(p?.id_modelo));
        const brand = marcas.find((b) => Number(b?.id_marca) === Number(model?.id_marca));
        return {
          nombre: p?.nombre ?? "",
          marca: brand?.nombre ?? "",
          modelo: model?.nombre ?? "",
        };
      })
      .filter((row) => row.nombre);
  }, [productos, modelos, marcas]);

  const productNameOptions = useMemo(() => {
    return [...new Set(mergedRows.map((row) => row.nombre).filter(Boolean))];
  }, [mergedRows]);

  const brandOptions = useMemo(() => {
    const selectedName = normalize(nombre);
    if (!selectedName) {
      return marcas.map((b) => b.nombre).filter(Boolean);
    }

    const linkedBrands = mergedRows
      .filter((row) => normalize(row.nombre) === selectedName)
      .map((row) => row.marca)
      .filter(Boolean);

    if (linkedBrands.length) return [...new Set(linkedBrands)];
    return marcas.map((b) => b.nombre).filter(Boolean);
  }, [nombre, marcas, mergedRows]);

  const selectedBrand = useMemo(
    () => marcas.find((b) => normalize(b?.nombre) === normalize(marca)),
    [marcas, marca]
  );

  const modelOptions = useMemo(() => {
    if (selectedBrand) {
      return modelos
        .filter((m) => Number(m?.id_marca) === Number(selectedBrand.id_marca))
        .map((m) => m.nombre)
        .filter(Boolean);
    }

    const selectedName = normalize(nombre);
    if (!selectedName) return modelos.map((m) => m.nombre).filter(Boolean);

    return mergedRows
      .filter((row) => normalize(row.nombre) === selectedName)
      .map((row) => row.modelo)
      .filter(Boolean);
  }, [selectedBrand, modelos, nombre, mergedRows]);

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
            <Form.Label>Descripción del producto</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ingrese los detalles y características del producto"
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
