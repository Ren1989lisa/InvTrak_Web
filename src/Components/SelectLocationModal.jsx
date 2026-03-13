import { useMemo, useState, useEffect } from "react";
import { Alert, Form, Modal } from "react-bootstrap";
import PrimaryButton from "./PrimaryButton";

export default function SelectLocationModal({
  show,
  onClose,
  onSave,
  campus = [],
  edificios = [],
  aulas = [],
}) {
  const [selectedCampusId, setSelectedCampusId] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show) return;
    setSelectedCampusId("");
    setSelectedBuildingId("");
    setSelectedClassroomId("");
    setError("");
  }, [show]);

  const campusOptions = useMemo(() => (Array.isArray(campus) ? campus : []), [campus]);

  const buildingOptions = useMemo(() => {
    if (!selectedCampusId) return [];
    return edificios.filter((item) => Number(item?.id_campus) === Number(selectedCampusId));
  }, [edificios, selectedCampusId]);

  const classroomOptions = useMemo(() => {
    if (!selectedBuildingId) return [];
    return aulas.filter((item) => Number(item?.id_edificio) === Number(selectedBuildingId));
  }, [aulas, selectedBuildingId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const selectedCampus = campus.find(
      (item) => Number(item?.id_campus) === Number(selectedCampusId)
    );
    const selectedBuilding = edificios.find(
      (item) => Number(item?.id_edificio) === Number(selectedBuildingId)
    );
    const selectedClassroom = aulas.find(
      (item) => Number(item?.id_aula) === Number(selectedClassroomId)
    );

    if (!selectedCampus || !selectedBuilding || !selectedClassroom) {
      setError("Debes seleccionar campus, edificio y aula/laboratorio.");
      return;
    }

    onSave?.({
      id_campus: Number(selectedCampus.id_campus),
      id_edificio: Number(selectedBuilding.id_edificio),
      id_aula: Number(selectedClassroom.id_aula),
      campus: selectedCampus.nombre,
      edificio: selectedBuilding.nombre,
      aula: selectedClassroom.nombre,
      displayText: `${selectedCampus.nombre} ${selectedBuilding.nombre} ${selectedClassroom.nombre}`,
    });
  };

  return (
    <Modal centered show={show} onHide={onClose} dialogClassName="inv-select-modal">
      <Modal.Header closeButton className="inv-select-modal__header">
        <Modal.Title>Seleccione la ubicación</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="inv-select-modal__body">
          {error ? <Alert variant="danger">{error}</Alert> : null}

          <Form.Group className="mb-3">
            <Form.Label className="inv-select-modal__label">Campus</Form.Label>
            <Form.Select
              value={selectedCampusId}
              onChange={(e) => {
                setSelectedCampusId(e.target.value);
                setSelectedBuildingId("");
                setSelectedClassroomId("");
              }}
              className="inv-select-modal__control"
            >
              <option value="">Seleccione el campus</option>
              {campusOptions.map((item) => (
                <option key={item.id_campus} value={item.id_campus}>
                  {item.nombre}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="inv-select-modal__label">Edificio</Form.Label>
            <Form.Select
              value={selectedBuildingId}
              onChange={(e) => {
                setSelectedBuildingId(e.target.value);
                setSelectedClassroomId("");
              }}
              className="inv-select-modal__control"
              disabled={!selectedCampusId}
            >
              <option value="">Seleccione el edificio</option>
              {buildingOptions.map((item) => (
                <option key={item.id_edificio} value={item.id_edificio}>
                  {item.nombre}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group>
            <Form.Label className="inv-select-modal__label">Aula/Laboratorio</Form.Label>
            <Form.Select
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="inv-select-modal__control"
              disabled={!selectedBuildingId}
            >
              <option value="">Seleccione el aula o laboratorio</option>
              {classroomOptions.map((item) => (
                <option key={item.id_aula} value={item.id_aula}>
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
