import { useMemo, useState, useEffect } from "react";
import { Alert, Form, Modal } from "react-bootstrap";
import PrimaryButton from "./PrimaryButton";

export default function SelectProductModal({
  show,
  onClose,
  onSave,
  productos = [],
  marcas = [],
  modelos = [],
}) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show) return;
    setSelectedProductId("");
    setSelectedBrandId("");
    setSelectedModelId("");
    setError("");
  }, [show]);

  const productOptions = useMemo(
    () => (Array.isArray(productos) ? productos : []),
    [productos]
  );

  const brandOptions = useMemo(() => {
    if (!selectedProductId) return [];
    return marcas.filter((item) => Number(item?.id_producto) === Number(selectedProductId));
  }, [marcas, selectedProductId]);

  const modelOptions = useMemo(() => {
    if (!selectedBrandId) return [];
    return modelos.filter((item) => Number(item?.id_marca) === Number(selectedBrandId));
  }, [modelos, selectedBrandId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const product = productos.find((item) => Number(item?.id_producto) === Number(selectedProductId));
    const brand = marcas.find((item) => Number(item?.id_marca) === Number(selectedBrandId));
    const model = modelos.find((item) => Number(item?.id_modelo) === Number(selectedModelId));

    if (!product || !brand || !model) {
      setError("Debes seleccionar nombre, marca y modelo.");
      return;
    }

    onSave?.({
      id_producto: Number(product.id_producto),
      id_marca: Number(brand.id_marca),
      id_modelo: Number(model.id_modelo),
      nombre: product.nombre,
      marca: brand.nombre,
      modelo: model.nombre,
      displayText: `${product.nombre} ${brand.nombre} ${model.nombre}`,
    });
  };

  return (
    <Modal centered show={show} onHide={onClose} dialogClassName="inv-select-modal">
      <Modal.Header closeButton className="inv-select-modal__header">
        <Modal.Title>Seleccione producto</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="inv-select-modal__body">
          {error ? <Alert variant="danger">{error}</Alert> : null}

          <Form.Group className="mb-3">
            <Form.Label className="inv-select-modal__label">Nombre del producto</Form.Label>
            <Form.Select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setSelectedBrandId("");
                setSelectedModelId("");
              }}
              className="inv-select-modal__control"
            >
              <option value="">Seleccione el nombre del producto</option>
              {productOptions.map((item) => (
                <option key={item.id_producto} value={item.id_producto}>
                  {item.nombre}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="inv-select-modal__label">Marca</Form.Label>
            <Form.Select
              value={selectedBrandId}
              onChange={(e) => {
                setSelectedBrandId(e.target.value);
                setSelectedModelId("");
              }}
              className="inv-select-modal__control"
              disabled={!selectedProductId}
            >
              <option value="">Seleccione la marca</option>
              {brandOptions.map((item) => (
                <option key={item.id_marca} value={item.id_marca}>
                  {item.nombre}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label className="inv-select-modal__label">Modelo</Form.Label>
            <Form.Select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="inv-select-modal__control"
              disabled={!selectedBrandId}
            >
              <option value="">Seleccione el modelo</option>
              {modelOptions.map((item) => (
                <option key={item.id_modelo} value={item.id_modelo}>
                  {item.nombre}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="inv-select-modal__footer">
          <PrimaryButton
            variant="light"
            label="Cancelar"
            className="inv-select-modal__btn inv-select-modal__btn--cancel"
            onClick={onClose}
          />
          <PrimaryButton
            type="submit"
            variant="primary"
            label="Guardar"
            className="inv-select-modal__btn inv-select-modal__btn--save"
          />
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
