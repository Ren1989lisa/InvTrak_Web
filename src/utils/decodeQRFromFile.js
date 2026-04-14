import jsQR from "jsqr";

function extractActivoIdFromText(text) {
  const rawText = (text ?? "").toString().trim();
  if (!rawText) return null;

  if (/^\d+$/.test(rawText)) {
    return Number(rawText);
  }

  try {
    const parsed = JSON.parse(rawText);
    const candidate =
      parsed?.activoId ??
      parsed?.id_activo ??
      parsed?.idActivo ??
      parsed?.id ??
      parsed?.codigo ??
      parsed?.valor;

    if (candidate == null) {
      return null;
    }

    const normalized = String(candidate).trim();
    if (!normalized) return null;
    if (/^\d+$/.test(normalized)) return Number(normalized);
    return normalized;
  } catch {
    return null;
  }
}

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

      if (!code?.data) {
        resolve(null);
        return;
      }

      const activoId = extractActivoIdFromText(code.data);
      if (activoId == null) {
        resolve(null);
        return;
      }

      resolve({
        activoId,
        rawText: code.data,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

export function openQRFilePicker({
  activoIdEsperado,
  codigoEsperado,
  onSuccess,
  onError,
}) {
  const expectedValue = activoIdEsperado ?? codigoEsperado ?? null;
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

    const actualValue = result.activoId;
    if (expectedValue != null && String(actualValue) !== String(expectedValue)) {
      onError?.(
        `El QR no corresponde al activo esperado. Código leído: ${actualValue}. Se esperaba: ${expectedValue}`
      );
      return;
    }

    onSuccess?.(result.activoId, result);
  };

  input.addEventListener("change", handleChange);
  document.body.appendChild(input);
  input.click();
}
