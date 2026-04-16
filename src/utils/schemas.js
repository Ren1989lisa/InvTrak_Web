import { z } from "zod";

export const loginSchema = z.object({
  correo: z.string().min(1, "El correo es obligatorio").email("Correo invalido"),
  password: z.string().min(1, "La contrasena es obligatoria"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "El correo es obligatorio").email("Correo invalido"),
});

export const usuarioSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  correo: z.string().min(1, "El correo es obligatorio").email("Correo invalido"),
  fecha_nacimiento: z.string().min(1, "La fecha de nacimiento es obligatoria"),
  curp: z.string().length(18, "La CURP debe tener exactamente 18 caracteres"),
  rol: z.string().min(1, "El rol es obligatorio"),
  area: z.string().min(1, "El area es obligatoria"),
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
  etiqueta: z.string().min(1, "La etiqueta del bien es obligatoria"),
  tipoFalla: z.string().min(1, "El tipo de falla es obligatorio"),
  prioridad: z.string().min(1, "La prioridad es obligatoria"),
  descripcion: z.string().trim().min(1, "La descripcion es obligatoria"),
});

export const registroBienSchema = z.object({
  numero_serie: z
    .string()
    .trim()
    .min(1, "El numero de serie es obligatorio")
    .regex(/^\d{6}$/, "El numero de serie debe tener 6 digitos exactos."),
  fecha_alta: z
    .string()
    .trim()
    .min(1, "La fecha de alta es obligatoria")
    .refine((value) => {
      const selectedDate = new Date(`${value}T00:00:00`);
      if (Number.isNaN(selectedDate.getTime())) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate <= today;
    }, "La fecha no puede ser futura"),
  descripcion: z.string().trim().min(1, "La descripcion es obligatoria"),
  estatus: z.string().optional(),
  costo: z.string().trim().min(1, "El costo es obligatorio").refine(
    (value) => {
      const normalized = String(value).replace(",", ".").trim();
      const parsed = Number(normalized);
      return Number.isFinite(parsed) && parsed > 0;
    },
    "El costo debe ser un numero valido mayor a 0"
  ),
});
