import React, { useState } from 'react'
import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import { useNavigate } from 'react-router-dom';
import { useUsers } from "../context/UsersContext";


const ReportDetails = () => {
    const navigate = useNavigate();
    const [openSidebar, setOpenSidebar] = useState(false);
    const { currentUser, setCurrentUserId, menuItems } = useUsers();

  return (
    <div>
      <NavbarMenu title='Datos del Reporte' onMenuClick={()=> setOpenSidebar((v) => !v)} />
      <SidebarMenu
              open={openSidebar}
              onClose={() => setOpenSidebar(false)}
              userName={currentUser?.nombre_completo}
              items={menuItems}
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
