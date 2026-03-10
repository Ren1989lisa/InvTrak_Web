import React from 'react'
import logo from "../assets/logo.png";

const Logo = () => {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center"
    }}>
      <img src={logo} alt="logo" style={{ width: "150px" }} />
    </div>
  )
}

export default Logo
