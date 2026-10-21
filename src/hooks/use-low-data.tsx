import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * Adaptive low-data mode.
 *
 * Detects slow / constrained connections via the Network Information API
 * (`navigator.connection`) and Data Saver, auto-enabling a lighter experience.
 * The user can manually override; their preference is persisted in
 * localStorage and always wins over auto-detection.
 */

type LowDataState = {
  /** Whether low-data mode is currently active. */
  lowData: boolean;
  /** True when the value was auto-detected (not manually set). */
  auto: boolean;
  /** Manually set low-data mode. Persists across sessions. */
  setLowData: (value: boolean) => void;
};

const LowDataContext = createContext<LowDataState>({
  lowData: false,
  auto: true,
  setLowData: () => {},
});

const STORAGE_KEY = "fff:low-data";

type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

/** Returns true when the current connection looks slow or constrained. */
function isSlowConnection(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as unknown as { connection?: NetworkInformation })
    .connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  const et = conn.effectiveType;
  if (et === "slow-2g" || et === "2g" || et === "3g") return true;
  if (typeof conn.downlink === "number" && conn.downlink < 1.5) return true;
  if (typeof conn.rtt === "number" && conn.rtt > 500) return true;
  return false;
}

export function LowDataProvider({ children }: { children: ReactNode }) {
  const [lowData, setLowDataState] = useState(false);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    // A stored preference always wins over auto-detection.
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setLowDataState(stored === "1");
      setAuto(false);
      return;
    }

    // No manual preference — auto-detect from the network.
    const check = () => {
      setLowDataState(isSlowConnection());
    };
    check();

    const conn = (
      navigator as unknown as { connection?: NetworkInformation }
    ).connection;
    if (conn?.addEventListener) {
      const handler = () => {
        if (auto) check();
      };
      conn.addEventListener("change", handler);
      return () => conn.removeEventListener?.("change", handler);
    }
  }, [auto]);

  const setLowData = (value: boolean) => {
    setLowDataState(value);
    setAuto(false);
    try {
      localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* storage unavailable — fine */
    }
  };

  return (
    <LowDataContext.Provider value={{ lowData, auto, setLowData }}>
      {children}
    </LowDataContext.Provider>
  );
}

export function useLowData() {
  return useContext(LowDataContext);
}
