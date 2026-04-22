import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

interface PageShellContextValue {
  animationsEnabled: boolean;
  currentRoute: string;
}

const PageShellContext = createContext<PageShellContextValue | null>(null);

export function PageShellProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAnimationsEnabled(!mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);

    return () => {
      mediaQuery.removeEventListener("change", sync);
    };
  }, []);

  return (
    <PageShellContext.Provider
      value={{
        animationsEnabled,
        currentRoute: location.pathname,
      }}
    >
      {children}
    </PageShellContext.Provider>
  );
}

export function usePageShell() {
  const context = useContext(PageShellContext);

  if (!context) {
    throw new Error("usePageShell must be used within a PageShellProvider.");
  }

  return context;
}
