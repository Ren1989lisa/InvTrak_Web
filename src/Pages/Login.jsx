import { useState } from "react";
import { Alert, Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import "./../Style/login.css"
import Logo from '../Components/Logo';  
import { useUsers } from "../context/UsersContext";

function Login  ()  {

    const navigate = useNavigate();
    const { users, setCurrentUserId } = useUsers();
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const usuarios = Array.isArray(users) ? users : [];

    const handleSubmit =(e)=>{
        e.preventDefault();
        setError("");

        const correoNorm = correo.trim().toLowerCase();
        const passNorm = password.trim();

        const user = usuarios.find(
          (u) => (u?.correo ?? "").toString().toLowerCase() === correoNorm
        );

        if (!user) {
          setError("Correo o contraseña incorrectos.");
          return;
        }

        if (user.activo !== true) {
          setError("Tu usuario está inactivo. Contacta al administrador.");
          return;
        }

        if ((user?.password ?? "").toString() !== passNorm) {
          setError("Correo o contraseña incorrectos.");
          return;
        }

        setCurrentUserId(Number(user.id_usuario));
        navigate("/bienes-registrados");
    };
    return (
    <Container fluid className="login-container">
        <Row className= "vh-100 align-items-center">
            <Col md={6} className="text-center text-light">
            <div className='logo-box'>
                <Logo></Logo>
                <h1 className='fw-bold'>InvTrack</h1>
                <p>
                 Sistema de Inventario,<br/>
                 Resguardos y <br/>
                 Mantenimiento de Activos con QR   
                </p>
            </div>
            </Col>
            <Col md={6} className="d-flex justify-content-center">
            <Card className="login-card p-4">

            <h3 className="mb-4 text-center">Bienvenido</h3>
            {error ? (
              <Alert variant="danger" className="py-2">
                {error}
              </Alert>
            ) : null}
            <Form onSubmit={handleSubmit}>
             <Form.Group className="mb-3">
                <Form.Label>Correo Electrónico</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="your.email@example.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <div className="text-end mb-3 small">
                <Link to="/forgot-password" style={{ textDecoration: "none", color: "inherit" }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button
                variant="primary"
                className="login-btn w-100"
                type="submit"
                
              >
                Login
              </Button>
            </Form>

            </Card>
            </Col>
        </Row>

    </Container>
  )
}

export default Login
