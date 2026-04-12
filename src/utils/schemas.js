import { z } from "zod";

export const loginSchema = z.object({
  correo: z.string().min(1, "El correo es obligatorio").email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "El correo es obligatorio").email("Correo inválido"),
});

export const usuarioSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  correo: z.string().min(1, "El correo es obligatorio").email("Correo inválido"),
  fecha_nacimiento: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  curp: z.string().length(18, "La CURP debe tener exactamente 18 caracteres"),
  rol: z.string().min(1, "El rol es obligatorio"),
  numero_empleado: z.string().min(1, "El número de empleado es obligatorio"),
  area: z.string().min(1, "El área es obligatorio"),
});

export const editarPerfilSchema = z.object({
  nombre: z.string().optional(),
  correo: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  curp: z.string().optional(),
  rol: z.string().optional(),
  numero_empleado: z.string().optional(),
  area: z.string().optional(),
  password: z.string().optional(),
});

export const reportarBienSchema = z.object({
  id_activo: z.string().min(1, "Selecciona el bien a reportar"),
  estatus: z.string().optional(),
  descripcion: z.string().optional(),
});

export const registroBienSchema = z.object({
  numero_serie: z.string().min(1, "El número de serie es obligatorio"),
  fecha_alta: z.string().min(1, "La fecha de alta es obligatoria"),
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  estatus: z.string().min(1, "El estatus es obligatorio"),
  costo: z.string().min(1, "El costo es obligatorio").refine(
    (val) => !Number.isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    "El costo debe ser un número válido mayor o igual a 0"
  ),
});
