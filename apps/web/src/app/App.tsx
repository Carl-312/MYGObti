import type { CSSProperties } from "react";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { BandStoryPage } from "../features/band-story";
import { getQuizApiBaseUrl } from "../entities/quiz/api/quizContent";
import { useRuntimeQuizContent } from "../entities/quiz/model/useRuntimeQuizContent";
import { PageShell } from "./shell";
import { HomePage } from "../pages/home/HomePage";
import { TestPage } from "../pages/test/TestPage";

const DevChatAtomsPreviewPage = import.meta.env.DEV
  ? lazy(() =>
      import("../pages/preview/ChatAtomsPreviewPage").then((module) => ({
        default: module.ChatAtomsPreviewPage,
      })),
    )
  : null;
const DevResultPreviewPage = import.meta.env.DEV
  ? lazy(() =>
      import("../pages/preview/ResultPreviewPage").then((module) => ({
        default: module.ResultPreviewPage,
      })),
    )
  : null;

// 开发态视觉夹具样式：仅在 dev 构建中按需加载，生产环境不会进入 bundle。
if (import.meta.env.DEV) {
  void import("./dev-mobile-frame.css");
}

export function App() {
  return (
    <>
      <Routes>
        <Route element={<TemplateRuntimeLayout />}>
          <Route element={<QuizHomeRoute />} path="/" />
          <Route element={<QuizTestRoute />} path="/test" />
          <Route element={<BandStoryPage />} path="/band-story/*" />
          {DevChatAtomsPreviewPage && DevResultPreviewPage ? (
            <>
              <Route
                element={
                  <Suspense fallback={null}>
                    <DevChatAtomsPreviewPage />
                  </Suspense>
                }
                path="/preview/chat-atoms"
              />
              <Route
                element={
                  <Suspense fallback={null}>
                    <DevResultPreviewPage />
                  </Suspense>
                }
                path="/preview/results"
              />
            </>
          ) : null}
        </Route>
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
      <DevShortcutDock />
    </>
  );
}

/* ---------- dev 移动端 iframe 预览夹具 ---------- */

type DevMobileWidth = 0 | 375 | 390;

function DevShortcutDock() {
  if (!import.meta.env.DEV) return null;

  // 当前激活的手机视口宽度档位（0 = 关闭预览）。
  const [mobileWidth, setMobileWidth] = useState<DevMobileWidth>(0);
  const location = useLocation();

  // Esc 键关闭遮罩。
  useEffect(() => {
    if (mobileWidth === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileWidth(0);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileWidth]);

  // 内层 iframe 里不渲染 dock，避免嵌套浮层。
  // （所有 hooks 必须在条件返回之前调用，确保调用顺序稳定。）
  if (typeof window !== "undefined" && window.self !== window.top) return null;

  // 切换档位：点同档位关闭，点另一档位直接切换。
  function toggle(w: 375 | 390) {
    setMobileWidth((prev) => (prev === w ? 0 : w));
  }

  // 拼接 iframe src：当前路径 + 已有 query + devFrame=1 标记。
  function buildIframeSrc(): string {
    const params = new URLSearchParams(location.search);
    params.set("devFrame", "1");
    return `${location.pathname}?${params.toString()}${location.hash}`;
  }

  /* ---- 通用内联样式 ---- */
  const dockStyle: CSSProperties = {
    position: "fixed",
    right: "0.9rem",
    bottom: "0.9rem",
    zIndex: 9999,
    display: "flex",
    gap: "0.4rem",
    padding: "0.45rem 0.7rem",
    borderRadius: "999px",
    border: "1px solid rgba(255, 255, 255, 0.18)",
    background: "rgba(17, 20, 29, 0.78)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.32)",
    color: "rgba(242, 244, 255, 0.92)",
    fontSize: "0.78rem",
    letterSpacing: "0.04em",
    pointerEvents: "auto",
  };
  const linkStyle: CSSProperties = {
    color: "inherit",
    textDecoration: "none",
    padding: "0.2rem 0.55rem",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.08)",
  };
  const buttonBase: CSSProperties = {
    ...linkStyle,
    border: "none",
    cursor: "pointer",
    font: "inherit",
  };
  const activeStyle: CSSProperties = {
    background: "rgba(126, 173, 255, 0.32)",
    boxShadow: "inset 0 0 0 1px rgba(126, 173, 255, 0.6)",
  };

  /* ---- 遮罩 + iframe 内联样式 ---- */
  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 9998,
    background: "rgba(11, 13, 18, 0.92)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };
  const toolbarStyle: CSSProperties = {
    height: 36,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.6rem",
    padding: "0 1rem",
    color: "rgba(242, 244, 255, 0.82)",
    fontSize: "0.75rem",
    fontFamily: "system-ui, sans-serif",
    background: "rgba(17, 20, 29, 0.95)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    flexShrink: 0,
  };
  const iframeStyle: CSSProperties = {
    width: mobileWidth || 375,
    height: "calc(100dvh - 36px)",
    border: "none",
    borderRadius: "0 0 12px 12px",
    background: "#fff",
    flexShrink: 0,
    boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 24px 64px rgba(0,0,0,0.55)",
  };
  const toolBtnStyle: CSSProperties = {
    ...buttonBase,
    fontSize: "0.72rem",
    padding: "0.15rem 0.5rem",
  };

  return (
    <>
      {/* ---- 全屏 iframe 遮罩（仅档位激活时渲染） ---- */}
      {mobileWidth !== 0 && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setMobileWidth(0); }}
          style={overlayStyle}
        >
          {/* 顶部工具条 */}
          <div style={toolbarStyle}>
            <span style={{ opacity: 0.5 }}>📱 {mobileWidth}px</span>
            <span style={{ opacity: 0.35 }}>|</span>
            <span style={{ opacity: 0.6, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {location.pathname}{location.search}
            </span>
            <span style={{ opacity: 0.35 }}>|</span>
            <button
              onClick={() => toggle(375)}
              style={mobileWidth === 375 ? { ...toolBtnStyle, ...activeStyle } : toolBtnStyle}
              type="button"
            >375</button>
            <button
              onClick={() => toggle(390)}
              style={mobileWidth === 390 ? { ...toolBtnStyle, ...activeStyle } : toolBtnStyle}
              type="button"
            >390</button>
            <button
              onClick={() => window.open(buildIframeSrc(), "_blank")}
              style={toolBtnStyle}
              title="在新标签页中打开当前 iframe URL"
              type="button"
            >↗ 新标签</button>
            <button
              onClick={() => setMobileWidth(0)}
              style={{ ...toolBtnStyle, color: "#f87171" }}
              title="关闭移动端预览"
              type="button"
            >✕ 关闭</button>
          </div>
          {/* iframe：key 跟随路由变化以触发重挂载 */}
          <iframe
            key={location.pathname + location.search}
            src={buildIframeSrc()}
            style={iframeStyle}
            title="移动端预览"
          />
        </div>
      )}

      {/* ---- 常驻 dock 浮层（遮罩打开时隐藏，toolbar 已含同样控件） ---- */}
      <div aria-label="dev shortcuts" style={{ ...dockStyle, ...(mobileWidth !== 0 && { display: "none" }) }}>
        <span style={{ opacity: 0.6 }}>DEV</span>
        <Link style={linkStyle} title="一键查看结果页 UI" to="/preview/results">
          结果页 →
        </Link>
        <span aria-hidden style={{ opacity: 0.4 }}>📱</span>
        <button
          onClick={() => toggle(375)}
          style={mobileWidth === 375 ? { ...buttonBase, ...activeStyle } : buttonBase}
          title="iframe 预览 375px（iPhone SE），@media 断点真实触发"
          type="button"
        >
          375
        </button>
        <button
          onClick={() => toggle(390)}
          style={mobileWidth === 390 ? { ...buttonBase, ...activeStyle } : buttonBase}
          title="iframe 预览 390px（iPhone 14），@media 断点真实触发"
          type="button"
        >
          390
        </button>
      </div>
    </>
  );
}

function TemplateRuntimeLayout() {
  // dev iframe 预览模式下隐藏顶部导航栏，避免 fixed 定位遮挡页面内容。
  const hideTopbar =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    window.self !== window.top;
  return <PageShell topbar={hideTopbar ? undefined : <ShellTopbar />} />;
}

function ShellTopbar() {
  const location = useLocation();
  const isBandStory = location.pathname.startsWith("/band-story");
  const isPreview = location.pathname.startsWith("/preview");
  const isHome = location.pathname === "/";
  const currentSurface = isBandStory
    ? "附加阅读"
    : isPreview
      ? "开发预览"
      : "人格测试";
  const homeEntryLabel = isHome ? "测试首页" : "返回测试首页";
  const homeEntryTarget = isHome ? "/" : "/";

  return (
    <header className="page-topbar">
      <div className="page-topbar__brand">
        <span className="page-topbar__eyebrow">MyGO 恶搞人格测试</span>
        <strong>MyGObti</strong>
      </div>
      <div className="page-topbar__meta">
        <span className="page-topbar__chip">{currentSurface}</span>
        <nav className="page-topbar__nav" aria-label="primary">
          <Link to={homeEntryTarget}>{homeEntryLabel}</Link>
        </nav>
      </div>
    </header>
  );
}


function QuizHomeRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const { runtimeContent, meta, loadState, loadMessage, loadError, reload } =
    useRuntimeQuizContent();

  const searchParams = new URLSearchParams(location.search);
  if (searchParams.get("start") === "1") {
    return <Navigate replace to="/test" />;
  }

  if (loadState !== "ready" || !runtimeContent) {
    return (
      <QuizRuntimeBootScreen
        loadError={loadError}
        loadMessage={loadMessage}
        loadState={loadState}
        meta={meta}
        onReload={reload}
      />
    );
  }

  function handleStart() {
    navigate("/test");
  }

  return (
    <HomePage
      questions={runtimeContent.questions}
      onStart={handleStart}
    />
  );
}

function QuizTestRoute() {
  const { runtimeContent, meta, loadState, loadMessage, loadError, reload } =
    useRuntimeQuizContent();

  if (loadState !== "ready" || !runtimeContent) {
    return (
      <QuizRuntimeBootScreen
        loadError={loadError}
        loadMessage={loadMessage}
        loadState={loadState}
        meta={meta}
        onReload={reload}
      />
    );
  }

  return <TestPage runtimeContent={runtimeContent} />;
}

interface QuizRuntimeBootScreenProps {
  loadError: string | null;
  loadMessage: string;
  loadState: "loading" | "ready" | "error";
  meta: { version: string; sourcePath: string } | null;
  onReload: () => void;
}

function QuizRuntimeBootScreen({
  loadError,
  loadMessage,
  loadState,
  meta,
  onReload,
}: QuizRuntimeBootScreenProps) {
  return (
    <main className="experience-shell">
      <section className="hero-stage hero-stage--boot">
        <div className="hero-stage__glow hero-stage__glow--left" />
        <div className="hero-stage__glow hero-stage__glow--right" />
        <div className="hero-stage__inner">
          <div className="boot-shell">
            <div className="boot-card">
              <p className="boot-card__eyebrow">Runtime Content Bootstrap</p>
              <h1>先把题库接上，再开始今晚这场角色测试。</h1>
              <p className="boot-card__lede">
                Web 端现在会先通过 `{getQuizApiBaseUrl()}` 读取只读内容服务，再保留原有
                V2.1D 的答题、结果计算和分享体验。
              </p>
              <div className="boot-card__status-list">
                <div className="boot-card__status-item">
                  <span>当前状态</span>
                  <strong>
                    {loadState === "loading" ? "正在载入内容" : "内容读取失败"}
                  </strong>
                </div>
                <div className="boot-card__status-item">
                  <span>版本探测</span>
                  <strong>{meta?.version ?? "等待 `/api/quiz/meta`"}</strong>
                </div>
                <div className="boot-card__status-item">
                  <span>读取路径</span>
                  <strong>{meta?.sourcePath ?? "等待内容服务响应"}</strong>
                </div>
              </div>
              <div
                className={`boot-card__message ${
                  loadState === "error"
                    ? "boot-card__message--error"
                    : "boot-card__message--info"
                }`}
                role={loadState === "error" ? "alert" : "status"}
              >
                {loadState === "error" ? loadError : loadMessage}
              </div>
              {loadState === "error" ? (
                <div className="hero-copy__actions">
                  <button
                    className="primary-button"
                    onClick={onReload}
                    type="button"
                  >
                    重试读取内容
                  </button>
                  <button
                    className="ghost-button"
                    onClick={() => window.location.reload()}
                    type="button"
                  >
                    整页刷新
                  </button>
                </div>
              ) : null}
              <p className="boot-card__hint">
                如果这里一直失败，先确认 `apps/api` 是否已启动，或者
                `VITE_API_BASE_URL` / `VITE_API_PROXY_TARGET` 是否指向正确地址。
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
