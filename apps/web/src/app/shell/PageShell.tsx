import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { BackgroundLayer } from "./BackgroundLayer";
import { NoiseOverlay } from "./NoiseOverlay";
import { PageShellProvider } from "./PageShellContext";
import { PageTransition } from "./PageTransition";
import { ScanlineOverlay } from "./ScanlineOverlay";

interface PageShellProps {
  topbar?: ReactNode;
  footer?: ReactNode;
}

function PageShellContent({ topbar, footer }: PageShellProps) {
  return (
    <div className="page-shell">
      <BackgroundLayer />
      <NoiseOverlay />
      <ScanlineOverlay />

      {topbar ? <div className="page-shell__chrome">{topbar}</div> : null}

      <main className="page-shell__main" role="main">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      {footer ? <div className="page-shell__footer">{footer}</div> : null}
    </div>
  );
}

export function PageShell({ topbar, footer }: PageShellProps) {
  return (
    <PageShellProvider>
      <PageShellContent footer={footer} topbar={topbar} />
    </PageShellProvider>
  );
}
