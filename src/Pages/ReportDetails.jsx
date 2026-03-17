import React, { useState } from 'react'
import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import { useNavigate } from 'react-router-dom';
import { useUsers } from "../context/UsersContext";


const ReportDetails = () => {
    const navigate = useNavigate();
    const [openSidebar, setOpenSidebar] = useState(false);
    const {users, currenUser, setCurrentUserId} = useUsers()

    const sidebarItems = [
    { icon: "grid", label: "Bienes", route: "/bienes-registrados" },
    { icon: "users", label: "Usuarios", route: "/usuarios" },
    { icon: "folder", label: "Catalogos", route: "/catalogos" },
    { icon: "report", label: "Reportes", route: "/reportes" },
    { icon: "clock", label: "Historial", route: "/historial" },
    { icon: "report", label: "Asignar Bien", route: "/asignar-bien" },
    { icon: "report", label: "Asignar Reporte", route: "/asignar-reporte" },
    { icon: "grid", label: "Dashboard", route: "/dashboard" },
    { icon: "box", label: "Registro de bienes", route: "/registro-bien" },
  ];

  return (
    <div>
      <NavbarMenu title='Datos del Reporte' onMenuClick={()=> setOpenSidebar((v) => !v)} />
      <SidebarMenu
              open={openSidebar}
              onClose={() => setOpenSidebar(false)}
              userName={currentUser?.nombre_completo}
              items={sidebarItems}
              onViewProfile={() => {
                setOpenSidebar(false);
                if (currentUser) {
                  navigate(`/perfil/${currentUser.id_usuario}`);
                } else {
                  navigate("/perfil");
                }
              }}
              onLogout={() => {
                setOpenSidebar(false);
                setCurrentUserId(null);
                navigate("/");
              }}
            />
            
    </div>
  )
}

export default ReportDetails
