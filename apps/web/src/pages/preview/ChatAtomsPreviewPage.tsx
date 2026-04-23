import { useEffect, useRef, useState, type MutableRefObject } from "react";
import {
  getAllCharacterAssetContracts,
  type CharacterAssetContract,
} from "../../entities/character/model/characterAssets";
import {
  CharacterLive2DSlot,
  CharacterRoundAvatar,
} from "../../entities/character/ui";
import {
  DialogueList,
  type DialogueMessage,
} from "../../shared/ui/dialogue";
import "./preview.css";

const INTRO_MESSAGES: DialogueMessage[] = [
  {
    id: "intro-1",
    side: "left",
    characterId: "anon",
    characterName: "千早爱音",
    text: "壳层已经挂好了，接下来别再回头改 `/api` 边界了，我们直接验证聊天原子。",
    timestamp: "23:17",
  },
  {
    id: "intro-2",
    side: "left",
    characterId: "sakiko",
    characterName: "丰川祥子",
    text: "优先看 **row entrance**、**choice fade** 和 **auto-scroll**，先把前端 contract 站稳。",
    timestamp: "23:18",
  },
  {
    id: "intro-3",
    side: "left",
    characterId: "tomori",
    characterName: "高松灯",
    text: "旧答题流先继续留着，这里只负责做能复用的对话基座。",
    timestamp: "23:18",
  },
];

const CHOICE_MESSAGES: DialogueMessage[] = [
  {
    id: "choice-1",
    side: "right",
    characterId: "anon",
    text: "先把角色资源 contract 接好，再迁答题 UI。",
    status: "pending",
  },
  {
    id: "choice-2",
    side: "right",
    characterId: "anon",
    text: "先做一条能在浏览器里反复验的消息动画链路。",
    status: "pending",
  },
  {
    id: "choice-3",
    side: "right",
    characterId: "anon",
    text: "两边一起收口，但保留 legacy flow 可回退。",
    status: "pending",
  },
];

const FOLLOW_UP_BY_CHOICE: Record<string, DialogueMessage[]> = {
  "choice-1": [
    {
      id: "follow-1-a",
      side: "left",
      characterId: "mutsumi",
      characterName: "若叶睦",
      text: "可以，后面的结果页和头像槽位都会直接吃同一个 resolver。",
      timestamp: "23:19",
    },
    {
      id: "follow-1-b",
      side: "left",
      characterId: "raana",
      characterName: "要乐奈",
      text: "manifest 统一之后，`round-icons` 和 `live2d` 就不会再在组件里到处拼路径。",
      timestamp: "23:19",
    },
  ],
  "choice-2": [
    {
      id: "follow-2-a",
      side: "left",
      characterId: "taki",
      characterName: "椎名立希",
      text: "浏览器验收面有了，后面迁答题时就不会边写边猜动画有没有坏。",
      timestamp: "23:19",
    },
    {
      id: "follow-2-b",
      side: "left",
      characterId: "soyo",
      characterName: "长崎爽世",
      text: "而且 auto-scroll 和选项发送态可以在真实环境里反复回放，不用等完整流程。",
      timestamp: "23:20",
    },
  ],
  "choice-3": [
    {
      id: "follow-3-a",
      side: "left",
      characterId: "uika",
      characterName: "三角初华",
      text: "这就是这次 phase 的主线：先做可复用底座，再保留老答题链路做回退。",
      timestamp: "23:19",
    },
    {
      id: "follow-3-b",
      side: "left",
      characterId: "sakiko",
      characterName: "丰川祥子",
      text: "等原子稳定，再让 `02.3-03` 和 `02.3-04` 直接复用，不再重复造轮子。",
      timestamp: "23:20",
    },
  ],
};

type PreviewStage = "booting" | "choosing" | "resolved";

function queueTimeout(
  timers: MutableRefObject<number[]>,
  callback: () => void,
  delay: number,
) {
  const handle = window.setTimeout(callback, delay);
  timers.current.push(handle);
}

function PreviewAssetCard({ contract }: { contract: CharacterAssetContract }) {
  return (
    <article className="phase-preview__asset-card">
      <div className="phase-preview__asset-head">
        <CharacterRoundAvatar characterId={contract.id} label={contract.name} size="lg" />
        <div>
          <strong>{contract.name}</strong>
          <span>{contract.alias ? `${contract.id} / ${contract.alias}` : contract.id}</span>
        </div>
      </div>
      <div className="phase-preview__asset-contract">
        <span>{`round-icons: ${contract.roundIcon.status}`}</span>
        <span>{`live2d: ${contract.live2d.status}`}</span>
        <span>{`fallback: ${contract.fallbackLabel}`}</span>
      </div>
      <div className="phase-preview__asset-body">
        <CharacterLive2DSlot characterId={contract.id} label={contract.name} />
      </div>
    </article>
  );
}

export function ChatAtomsPreviewPage() {
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [stage, setStage] = useState<PreviewStage>("booting");
  const timersRef = useRef<number[]>([]);
  const selectionLockRef = useRef(false);
  const assetContracts = getAllCharacterAssetContracts();
  const autoChoiceIdRef = useRef<string | null>(
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("choice"),
  );

  function clearTimers() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }

  function startPreview() {
    clearTimers();
    setMessages([]);
    setSelectedId(undefined);
    setStage("booting");
    selectionLockRef.current = false;

    INTRO_MESSAGES.forEach((message, index) => {
      queueTimeout(timersRef, () => {
        setMessages((current) => [...current, message]);
      }, 220 + index * 420);
    });

    queueTimeout(timersRef, () => {
      setMessages((current) => [...current, ...CHOICE_MESSAGES]);
      setStage("choosing");
    }, 220 + INTRO_MESSAGES.length * 420);

    if (autoChoiceIdRef.current && CHOICE_MESSAGES.some((message) => message.id === autoChoiceIdRef.current)) {
      queueTimeout(timersRef, () => {
        triggerChoice(autoChoiceIdRef.current!);
      }, 760 + INTRO_MESSAGES.length * 420);
    }
  }

  function triggerChoice(id: string) {
    if (selectionLockRef.current) {
      return;
    }

    selectionLockRef.current = true;
    setSelectedId(id);
    setStage("resolved");

    queueTimeout(timersRef, () => {
      setMessages((current) =>
        current
          .filter((message) => message.side !== "right" || message.id === id)
          .map((message) =>
            message.id === id
              ? {
                  ...message,
                  status: "sent",
                  timestamp: "23:18",
                }
              : message,
          ),
      );
    }, 240);

    const followUps = FOLLOW_UP_BY_CHOICE[id] ?? [];
    followUps.forEach((message, index) => {
      queueTimeout(timersRef, () => {
        setMessages((current) => [...current, message]);
      }, 760 + index * 380);
    });
  }

  function handleSelect(id: string) {
    if (stage !== "choosing") {
      return;
    }

    triggerChoice(id);
  }

  useEffect(() => {
    startPreview();

    return () => {
      clearTimers();
    };
  }, []);

  return (
    <main className="phase-preview">
      <section className="phase-preview__hero">
        <div className="phase-preview__hero-copy">
          <p className="phase-preview__eyebrow">Phase 02.3-02 Preview Surface</p>
          <h1>聊天消息原子和角色素材 contract 已经独立成可验底座。</h1>
          <p>
            这个页面只负责验三个东西：`DialogueRow / DialogueList` 的进场与发送语义，
            manifest 驱动的圆形头像 / Live2D resolver，以及它们在当前 template shell
            下是否能稳定工作，而不打断 legacy quiz flow。
          </p>
        </div>
        <div className="phase-preview__meta">
          <span>Legacy quiz route 保留</span>
          <span>Manifest-driven assets</span>
          <span>Browser QA ready</span>
        </div>
      </section>

      <div className="phase-preview__grid">
        <section className="phase-preview__panel">
          <header className="phase-preview__panel-header">
            <div className="phase-preview__panel-copy">
              <p className="phase-preview__eyebrow">Chat Atoms</p>
              <h2>消息进场、选择发送和自动滚动</h2>
              <p>
                点击右侧选项会触发发送动画，未选中的 choice 会淡出，随后自动补入左侧回复并滚动到最新消息。
              </p>
            </div>
            <button className="phase-preview__button" onClick={startPreview} type="button">
              重播消息动画
            </button>
          </header>
          <div className="phase-preview__status">
            <span>{`消息数: ${messages.length}`}</span>
            <span>{`当前阶段: ${stage}`}</span>
            <span>{`已选 option: ${selectedId ?? "未选择"}`}</span>
          </div>
          <DialogueList
            className="phase-preview__chat-log"
            messages={messages}
            onSelect={handleSelect}
            selectedId={selectedId}
          />
        </section>

        <section className="phase-preview__panel">
          <header className="phase-preview__panel-copy">
            <p className="phase-preview__eyebrow">Asset Contract</p>
            <h2>8 角色头像与 Live2D 资源统一走 resolver</h2>
            <p>
              所有角色都直接从 manifest 解析资源；即使调用方还传旧 id，也会先标准化到统一 contract。
            </p>
          </header>
          <div className="phase-preview__asset-grid">
            {assetContracts.map((contract) => (
              <PreviewAssetCard contract={contract} key={contract.id} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
