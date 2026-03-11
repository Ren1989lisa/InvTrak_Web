import React from 'react'
import "./../Style/login.css"

const BotonPrincipal = (props) => {
  return (
    <button className='login-btn'>
        {props.text}
    </button>
  )
}

export default BotonPrincipal
