import { useEffect, useState } from "react";
import { getProductos } from "../services/catalogoService";

export function useProductosCatalogo() {
  const [productos, setProductos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getProductos()
      .then((list) => {
        if (!active) return;
        setProductos(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!active) return;
        setProductos([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const tipoOptions = productos
    .map((p) => (p?.nombre ?? "").toString().trim())
    .filter(Boolean)
    .reduce((acc, nombre) => {
      if (!acc.find((o) => o.value.toLowerCase() === nombre.toLowerCase())) {
        acc.push({ value: nombre, label: nombre });
      }
      return acc;
    }, []);

  return { productos, tipoOptions, isLoading };
}
