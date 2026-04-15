import { useEffect, useState } from "react";
import { Alert, Form, Modal, Spinner } from "react-bootstrap";

import { getAulasByEdificio, getCampus, getEdificiosByCampus } from "../services/activoService";
import PrimaryButton from "./PrimaryButton";

function getLoadErrorMessage(error, entityLabel) {
  const status = Number(error?.status ?? 0);
  if (status === 401) return "Sesión expirada. Inicia sesión nuevamente.";
  if (status === 404) return `No se encontraron ${entityLabel}.`;
  if (status === 0) return "Error de red. Verifica tu conexión.";
  return error?.message || `No fue posible cargar ${entityLabel}.`;
}

export default function SelectLocationModal({ show, onClose, onSave, initialSelection = null }) {
  const [selectedCampusId, setSelectedCampusId] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");

  const [campusOptions, setCampusOptions] = useState([]);
  const [buildingOptions, setBuildingOptions] = useState([]);
  const [classroomOptions, setClassroomOptions] = useState([]);

  const [loadingCampus, setLoadingCampus] = useState(false);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [error, setError] = useState("");

  const isLoading = loadingCampus || loadingBuildings || loadingClassrooms;

  async function loadCampus() {
    setLoadingCampus(true);
    setError("");
    try {
      const list = await getCampus();
      setCampusOptions(list);
    } catch (loadError) {
      setError(getLoadErrorMessage(loadError, "los campus"));
    } finally {
      setLoadingCampus(false);
    }
  }

  async function loadBuildings(campusId) {
    if (!campusId) {
      setBuildingOptions([]);
      setClassroomOptions([]);
      return;
    }

    setLoadingBuildings(true);
    setError("");
    try {
      const list = await getEdificiosByCampus(campusId);
      setBuildingOptions(list);
    } catch (loadError) {
      setBuildingOptions([]);
      setError(getLoadErrorMessage(loadError, "los edificios"));
    } finally {
      setLoadingBuildings(false);
    }
  }

  async function loadClassrooms(buildingId) {
    if (!buildingId) {
      setClassroomOptions([]);
      return;
    }

    setLoadingClassrooms(true);
    setError("");
    try {
      const list = await getAulasByEdificio(buildingId);
      setClassroomOptions(list);
    } catch (loadError) {
      setClassroomOptions([]);
      setError(getLoadErrorMessage(loadError, "las aulas"));
    } finally {
      setLoadingClassrooms(false);
    }
  }

  async function retryCurrentStep() {
    if (!selectedCampusId) {
      await loadCampus();
      return;
    }

    if (!selectedBuildingId) {
      await loadBuildings(selectedCampusId);
      return;
    }

    await loadClassrooms(selectedBuildingId);
  }

  useEffect(() => {
    if (!show) return;

    setSelectedCampusId(String(initialSelection?.id_campus ?? ""));
    setSelectedBuildingId(String(initialSelection?.id_edificio ?? ""));
    setSelectedClassroomId(String(initialSelection?.id_aula ?? ""));
    setCampusOptions([]);
    setBuildingOptions([]);
    setClassroomOptions([]);
    setError("");

    let active = true;

    async function bootstrap() {
      setLoadingCampus(true);
      try {
        const list = await getCampus();
        if (!active) return;
        setCampusOptions(list);
      } catch (loadError) {
        if (!active) return;
        setError(getLoadErrorMessage(loadError, "los campus"));
      } finally {
        if (active) setLoadingCampus(false);
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [show, initialSelection?.id_aula, initialSelection?.id_campus, initialSelection?.id_edificio]);

  useEffect(() => {
    if (!show || !selectedCampusId) {
      setBuildingOptions([]);
      setSelectedBuildingId("");
      setClassroomOptions([]);
      setSelectedClassroomId("");
      return;
    }

    let active = true;

    async function bootstrap() {
      setLoadingBuildings(true);
      setError("");
      try {
        const list = await getEdificiosByCampus(selectedCampusId);
        if (!active) return;
        setBuildingOptions(list);
      } catch (loadError) {
        if (!active) return;
        setBuildingOptions([]);
        setError(getLoadErrorMessage(loadError, "los edificios"));
      } finally {
        if (active) setLoadingBuildings(false);
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [selectedCampusId, show]);

  useEffect(() => {
    if (!show || !selectedBuildingId) {
      setClassroomOptions([]);
      setSelectedClassroomId("");
      return;
    }

    let active = true;

    async function bootstrap() {
      setLoadingClassrooms(true);
      setError("");
      try {
        const list = await getAulasByEdificio(selectedBuildingId);
        if (!active) return;
        setClassroomOptions(list);
      } catch (loadError) {
        if (!active) return;
        setClassroomOptions([]);
        setError(getLoadErrorMessage(loadError, "las aulas"));
      } finally {
        if (active) setLoadingClassrooms(false);
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [selectedBuildingId, show]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const selectedCampus = campusOptions.find(
      (item) => Number(item?.id_campus) === Number(selectedCampusId)
    );
    const selectedBuilding = buildingOptions.find(
      (item) => Number(item?.id_edificio) === Number(selectedBuildingId)
    );
    const selectedClassroom = classroomOptions.find(
      (item) => Number(item?.id_aula) === Number(selectedClassroomId)
    );

    if (!selectedCampus || !selectedBuilding || !selectedClassroom) {
      setError("Debes seleccionar campus, edificio y aula.");
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
          {error ? (
            <Alert variant="danger" className="d-flex align-items-center justify-content-between gap-3">
              <span>{error}</span>
              <PrimaryButton
                variant="outline-danger"
                label="Reintentar"
                onClick={retryCurrentStep}
              />
            </Alert>
          ) : null}

          {isLoading ? (
            <Alert variant="info" className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              <span>Cargando catálogos...</span>
            </Alert>
          ) : null}

          <Form.Group className="mb-3">
            <Form.Label className="inv-select-modal__label">Campus</Form.Label>
            <Form.Select
              value={selectedCampusId}
              onChange={(event) => {
                setSelectedCampusId(event.target.value);
                setSelectedBuildingId("");
                setSelectedClassroomId("");
                setBuildingOptions([]);
                setClassroomOptions([]);
              }}
              className="inv-select-modal__control"
              disabled={loadingCampus}
            >
              <option value="">{loadingCampus ? "Cargando campus..." : "Seleccione el campus"}</option>
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
              onChange={(event) => {
                setSelectedBuildingId(event.target.value);
                setSelectedClassroomId("");
                setClassroomOptions([]);
              }}
              className="inv-select-modal__control"
              disabled={!selectedCampusId || loadingBuildings}
            >
              <option value="">
                {loadingBuildings ? "Cargando edificios..." : "Seleccione el edificio"}
              </option>
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
              onChange={(event) => setSelectedClassroomId(event.target.value)}
              className="inv-select-modal__control"
              disabled={!selectedBuildingId || loadingClassrooms}
            >
              <option value="">
                {loadingClassrooms ? "Cargando aulas..." : "Seleccione el aula o laboratorio"}
              </option>
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
            disabled={isLoading}
          />
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
