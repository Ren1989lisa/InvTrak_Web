import jsQR from "jsqr";

/**
 * Decodifica un código QR desde un archivo de imagen.
 * El QR del sistema contiene JSON.stringify(activo) con codigo_interno.
 * @param {File} file - Archivo de imagen (PNG, JPG, etc.)
 * @returns {Promise<{ codigo_interno: string } | null>}
 */
export function decodeQRFromFile(file) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      resolve(null);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });
      if (!code || !code.data) {
        resolve(null);
        return;
      }
      try {
        const parsed = JSON.parse(code.data);
        const codigo = parsed?.codigo_interno ?? parsed?.codigo ?? null;
        resolve(codigo ? { codigo_interno: String(codigo), raw: parsed } : null);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Abre el explorador de archivos para seleccionar una imagen QR.
 * @param {Object} options
 * @param {string} options.codigoEsperado - codigo_interno que debe coincidir
 * @param {function(string)} options.onSuccess - llamado con id_activo para navegar
 * @param {function(string)} options.onError - llamado con mensaje de error
 */
export function openQRFilePicker({ codigoEsperado, onSuccess, onError }) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.display = "none";

  const handleChange = async (e) => {
    const file = e.target?.files?.[0];
    input.removeEventListener("change", handleChange);
    document.body.removeChild(input);

    if (!file) return;

    const result = await decodeQRFromFile(file);
    if (!result) {
      onError?.("No se pudo leer el código QR. Asegúrate de seleccionar una imagen válida.");
      return;
    }

    const codigoQR = (result.codigo_interno ?? "").toString().trim();
    const codigoEsperadoNorm = (codigoEsperado ?? "").toString().trim();

    if (codigoQR !== codigoEsperadoNorm) {
      onError?.(
        `El QR no corresponde a este bien. Código escaneado: ${codigoQR || "(vacío)"}. Se esperaba: ${codigoEsperadoNorm}`
      );
      return;
    }

    onSuccess?.(result.raw?.id_activo);
  };

  input.addEventListener("change", handleChange);
  document.body.appendChild(input);
  input.click();
}
