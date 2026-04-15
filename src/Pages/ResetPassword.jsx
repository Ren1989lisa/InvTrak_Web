import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Form, Button, Alert, Card, Container } from "react-bootstrap";

function ResetPassword() {
  const navigate = useNavigate(); 
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); 
  
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      await axios.post("http://localhost:8085/api/auth/reset-password", {
        token: token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });
      
      setMensaje("¡Contraseña actualizada con éxito! Redirigiendo al login...");
      
      setTimeout(() => {
        navigate("/login"); 
      }, 2500); // Espera 2.5 segundos para que el usuario vea el mensaje

    } catch (err) {
      if (err.response?.data) {
        if (typeof err.response.data === 'object') {
             const errorMessage = Object.values(err.response.data).join(" | ");
             setError(errorMessage);
        } else {
             setError(err.response.data);
        }
      } else {
        setError("Error al procesar la solicitud.");
      }
    }
  };
  

  return (
    <div className="container mt-5">
      <Card className="p-4">
        <h3>Restablecer Contraseña</h3>
        {error && <Alert variant="danger">{error}</Alert>}
        {mensaje && <Alert variant="success">{mensaje}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nueva Contraseña</Form.Label>
            <Form.Control 
              type="password" 
              onChange={(e) => setFormData({...formData, newPassword: e.target.value})} 
              required 
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Confirmar Contraseña</Form.Label>
            <Form.Control 
              type="password" 
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
              required 
            />
          </Form.Group>
          <Button type="submit">Actualizar Contraseña</Button>
        </Form>
      </Card>
    </div>
  );
}
export default ResetPassword;