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
      parsed?.valor ??
      null;

    if (candidate != null) {
      return extractActivoIdFromText(String(candidate));
    }
  } catch {
    // Continue with string strategies.
  }

  const queryLikeMatch = rawText.match(
    /(?:activoid|id_activo|idactivo|id|activo)[^0-9]{0,8}(\d{1,10})/i
  );
  if (queryLikeMatch?.[1]) {
    return Number(queryLikeMatch[1]);
  }

  const pathLikeMatch = rawText.match(/\/(\d{1,10})(?:\/)?$/);
  if (pathLikeMatch?.[1]) {
    return Number(pathLikeMatch[1]);
  }

  const numericGroups = rawText.match(/\d{1,10}/g);
  if (numericGroups && numericGroups.length > 0) {
    return Number(numericGroups[numericGroups.length - 1]);
  }

  return null;
}

async function decodeWithBarcodeDetector(file) {
  const BarcodeDetectorClass = window?.BarcodeDetector;
  if (!BarcodeDetectorClass) return null;

  try {
    const detector = new BarcodeDetectorClass({ formats: ["qr_code"] });
    const bitmap = await createImageBitmap(file);
    const barcodes = await detector.detect(bitmap);
    if (typeof bitmap.close === "function") {
      bitmap.close();
    }

    const rawText = barcodes?.[0]?.rawValue?.toString().trim();
    if (!rawText) return null;

    const activoId = extractActivoIdFromText(rawText);
    if (activoId == null) return null;

    return {
      activoId,
      rawText,
    };
  } catch {
    return null;
  }
}

function decodeWithJsQrFromImage(img) {
  const scales = [1, 2, 3];

  for (const scale of scales) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(img.width * scale));
    canvas.height = Math.max(1, Math.floor(img.height * scale));

    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (!code?.data) continue;

    const rawText = code.data.toString().trim();
    const activoId = extractActivoIdFromText(rawText);
    if (activoId == null) continue;

    return {
      activoId,
      rawText,
    };
  }

  return null;
}

export async function decodeQRFromFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    return null;
  }

  const detectorResult = await decodeWithBarcodeDetector(file);
  if (detectorResult) {
    return detectorResult;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(decodeWithJsQrFromImage(img));
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
