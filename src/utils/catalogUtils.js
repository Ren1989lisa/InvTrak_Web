export function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

export function getNextId(list, key) {
  if (!Array.isArray(list) || !list.length) return 1;
  return Math.max(...list.map((item) => Number(item?.[key]) || 0)) + 1;
}

export function mapStatusToCatalogStatus(status) {
  const s = normalize(status);
  if (s === "baja" || s === "inactivo") return "Inactivo";
  return "Activo";
}

export function buildCatalogDataFromActivos(activos) {
  const marcas = [];
  const modelos = [];
  const productos = [];
  const marcaIndex = new Map();
  const modeloIndex = new Map();

  const list = Array.isArray(activos) ? activos : [];

  list.forEach((activo, i) => {
    const productoData = activo?.producto ?? {};
    const nombreProducto = (
      productoData?.tipo_activo ?? activo?.tipo_activo ?? ""
    ).toString().trim();
    const nombreMarca = (productoData?.marca ?? activo?.marca ?? "").toString().trim();
    const nombreModelo = (productoData?.modelo ?? activo?.modelo ?? "").toString().trim();

    if (!nombreProducto || !nombreMarca || !nombreModelo) return;

    const marcaKey = normalize(nombreMarca);
    let marcaId = marcaIndex.get(marcaKey);
    if (!marcaId) {
      marcaId = marcas.length + 1;
      marcaIndex.set(marcaKey, marcaId);
      marcas.push({
        id_marca: marcaId,
        nombre: nombreMarca,
      });
    }

    const modeloKey = `${normalize(nombreModelo)}::${marcaId}`;
    let modeloId = modeloIndex.get(modeloKey);
    if (!modeloId) {
      modeloId = modelos.length + 1;
      modeloIndex.set(modeloKey, modeloId);
      modelos.push({
        id_modelo: modeloId,
        nombre: nombreModelo,
        id_marca: marcaId,
      });
    }

    productos.push({
      id_producto: Number(activo?.id_activo) || i + 1,
      nombre: nombreProducto,
      id_modelo: modeloId,
      descripcion: (activo?.descripcion ?? "").toString().trim(),
      estatus: mapStatusToCatalogStatus(activo?.estatus),
    });
  });

  return { productos, modelos, marcas };
}

export function buildLocationDataFromActivos(activos) {
  const locationMap = new Map();
  const list = Array.isArray(activos) ? activos : [];

  list.forEach((activo) => {
    const ubicacion = activo?.ubicacion ?? {};
    const campus = (ubicacion?.campus ?? "").toString().trim();
    const edificio = (ubicacion?.edificio ?? "").toString().trim();
    const aula = (ubicacion?.aula ?? "").toString().trim();
    const descripcion = (ubicacion?.descripcion ?? "").toString().trim();

    if (!campus || !edificio || !aula) return;

    const key = `${normalize(campus)}::${normalize(edificio)}::${normalize(aula)}`;
    if (locationMap.has(key)) return;

    locationMap.set(key, {
      id_ubicacion: locationMap.size + 1,
      campus,
      edificio,
      aula,
      descripcion,
    });
  });

  return Array.from(locationMap.values());
}
