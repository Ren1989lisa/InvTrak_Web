import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../services/api";
import { loadDashboardOverview } from "../services/dashboardService";

const INITIAL_STATE = {
  data: null,
  isLoading: true,
  error: "",
  warnings: [],
  lastUpdated: null,
};

export function useDashboardData() {
  const [state, setState] = useState(INITIAL_STATE);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function load() {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: "",
      }));

      try {
        const data = await loadDashboardOverview({
          signal: controller.signal,
        });

        if (!active) return;

        setState({
          data,
          isLoading: false,
          error: "",
          warnings: Array.isArray(data.warnings) ? data.warnings : [],
          lastUpdated: data.lastUpdated ?? new Date().toISOString(),
        });
      } catch (error) {
        if (!active || controller.signal.aborted) return;

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          return;
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error?.message || "No fue posible cargar el dashboard.",
          warnings: [],
        }));
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [refreshToken]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    warnings: state.warnings,
    lastUpdated: state.lastUpdated,
    refresh,
  };
}
