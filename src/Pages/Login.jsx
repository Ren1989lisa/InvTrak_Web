import React from 'react'
import {Container, Row, Col, Form, Button, Card} from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import "./../Style/login.css"
import Logo from '../Components/Logo';  

function Login  ()  {

    const navigate = useNavigate();
    const handleSubmit =(e)=>{
        e.preventDefault();
        navigate("/DashBoard");
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
            <Form onSubmit={handleSubmit}>
             <Form.Group className="mb-3">
                <Form.Label>Correo Electrónico</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="your.email@example.com"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="********"
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
