import axios from 'axios';

const API_URL = "http://localhost:8085/api/auth";

export const solicitarRecuperacion = async (email) => {
  // Al enviar un objeto, Axios lo serializa automáticamente como JSON
  return await axios.post(`${API_URL}/forgot-password`, {
    correo: email
  });
};