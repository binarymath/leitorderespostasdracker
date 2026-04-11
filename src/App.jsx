import React, {
  Suspense,
  lazy,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Download,
  LayoutDashboard,
  Printer,
  School,
  Settings2,
  Trash2,
  User,
  Users,
} from "lucide-react";

const LazyConfigGabaritoView = lazy(() => import("./views/ConfigGabaritoView.jsx"));
const LazyDashboardView = lazy(() => import("./views/DashboardView.jsx"));

const OPTIONS = ["A", "B", "C", "D", "E"];

const STORAGE_KEYS = {
  schoolInfo: "dracker_school_info",
  studentList: "dracker_student_list",
  officialKey: "dracker_official_key",
  studentsResults: "dracker_students_results",
};

const BUBBLE_GEOMETRY = {
  infoX: 0.18,
  infoY: 0.28,
  infoW: 0.64,
  infoH: 0.6,
  top: 0.1,
  bottom: 0.95,
  leftStart: 0.16,
  rightStart: 0.77,
  optionSpacing: 0.046,
  overlayRadius: 6,
};

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const writeTimerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (writeTimerRef.current) {
      window.clearTimeout(writeTimerRef.current);
      writeTimerRef.current = null;
    }

    writeTimerRef.current = window.setTimeout(() => {
      try {
        const write = () => {
          window.localStorage.setItem(key, JSON.stringify(value));
        };

        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(write, { timeout: 300 });
          return;
        }

        write();
      } catch {
        // noop
      }
    }, 80);

    return () => {
      if (writeTimerRef.current) {
        window.clearTimeout(writeTimerRef.current);
        writeTimerRef.current = null;
      }
    };
  }, [key, value]);

  const setStoredValue = (nextValue) => {
    setValue((prev) =>
      typeof nextValue === "function" ? nextValue(prev) : nextValue,
    );
  };

  return [value, setStoredValue];
}

function randomStudentName() {
  const first = [
    "Ana",
    "Lucas",
    "Marina",
    "Rafael",
    "Bianca",
    "Paulo",
    "Sofia",
    "Diego",
    "Joana",
    "Bruno",
  ];
  const last = [
    "Silva",
    "Santos",
    "Costa",
    "Almeida",
    "Souza",
    "Oliveira",
    "Nunes",
    "Pereira",
  ];
  return `${first[Math.floor(Math.random() * first.length)]} ${
    last[Math.floor(Math.random() * last.length)]
  }`;
}

function Header({ activeView, onNavigate }) {
  const nav = [
    { id: "scanner", label: "Ler Respostas", icon: Camera },
    { id: "config", label: "Configurar Gabarito", icon: Settings2 },
    { id: "customize", label: "Customizar & Imprimir", icon: Printer },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2 text-white shadow-sm">
            <ClipboardCheck className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 sm:text-base">
              Leitor Drácker
            </h1>
            <p className="text-[11px] text-slate-500 sm:text-xs">
              Leitor de Gabaritos Web
            </p>
          </div>
        </div>

        <nav className="no-print flex items-center gap-1 overflow-x-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function CustomizePrintView({
  schoolInfo,
  studentList,
  onSaveSchool,
  onSaveStudents,
  onOpenTemplate,
}) {
  const [schoolNameInput, setSchoolNameInput] = useState(schoolInfo?.name || "");
  const [studentsText, setStudentsText] = useState(studentList.join("\n"));
  const [status, setStatus] = useState("");

  useEffect(() => {
    setSchoolNameInput(schoolInfo?.name || "");
  }, [schoolInfo]);

  useEffect(() => {
    setStudentsText(studentList.join("\n"));
  }, [studentList]);

  const normalizedStudents = useMemo(() => {
    return studentsText
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean);
  }, [studentsText]);

  const handleSave = () => {
    onSaveSchool({ name: schoolNameInput.trim() || "Escola não informada" });
    onSaveStudents(normalizedStudents);
    setStatus("Informações salvas com sucesso.");
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <School className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">
              Customizar & Imprimir
            </h2>
          </div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Nome da Escola
          </label>
          <input
            type="text"
            value={schoolNameInput}
            onChange={(event) => setSchoolNameInput(event.target.value)}
            className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600 transition focus:ring"
            placeholder="Ex: Escola Municipal Aurora"
          />

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Lista de Alunos (um nome por linha)
          </label>
          <textarea
            rows={10}
            value={studentsText}
            onChange={(event) => setStudentsText(event.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600 transition focus:ring"
            placeholder={`Ana Souza\nBruno Lima\nCarla Mendes`}
          />

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">{status}</p>
            <button
              type="button"
              onClick={handleSave}
              className="no-print rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Salvar Info
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-semibold text-slate-900">Alunos</h3>
          </div>

          <div className="max-h-[460px] space-y-2 overflow-auto pr-1">
            {normalizedStudents.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                Nenhum aluno listado. Adicione nomes na caixa ao lado.
              </p>
            ) : (
              normalizedStudents.map((student) => (
                <div
                  key={student}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                    <User className="h-4 w-4 text-slate-500" />
                    {student}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenTemplate(student)}
                    className="no-print rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Ver Gabarito Personalizado
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

const ScannerOverlay = memo(function ScannerOverlay({
  overlayCanvasRef,
  processingCanvasRef,
  anchorFeedback,
  workerLoadError,
  workerLoading,
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-slate-950/35" />

      <div className="absolute inset-0 flex items-center justify-center px-2 py-3 sm:px-4 sm:py-4">
        <div className="relative aspect-[210/297] w-[min(94vw,680px)] max-h-[84vh] overflow-hidden rounded-2xl border border-white/35 bg-slate-900/15 shadow-2xl backdrop-blur-[2px] sm:w-[min(90vw,620px)]">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-blue-500/10" />

          <div className="absolute left-[18%] top-[28%] h-[60%] w-[64%] rounded-xl border border-white/45 bg-blue-500/5">
            <div className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-blue-400/60 animate-pulse" />

            <div className="absolute left-0 top-0 h-8 w-8">
              <div className="absolute left-0 top-0 h-5 w-[2px] rounded bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
              <div className="absolute left-0 top-0 h-[2px] w-5 rounded bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
              <div className="absolute left-1.5 top-1.5 h-4 w-4 rounded-full border border-dashed border-white/70" />
            </div>

            <div className="absolute right-0 top-0 h-8 w-8">
              <div className="absolute right-0 top-0 h-5 w-[2px] rounded bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
              <div className="absolute right-0 top-0 h-[2px] w-5 rounded bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
              <div className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full border border-dashed border-white/70" />
            </div>

            <div className="absolute bottom-0 left-0 h-8 w-8">
              <div className="absolute bottom-0 left-0 h-5 w-[2px] rounded bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
              <div className="absolute bottom-0 left-0 h-[2px] w-5 rounded bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
              <div className="absolute bottom-1.5 left-1.5 h-4 w-4 rounded-full border border-dashed border-white/70" />
            </div>

            <div className="absolute bottom-0 right-0 h-8 w-8">
              <div className="absolute bottom-0 right-0 h-5 w-[2px] rounded bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
              <div className="absolute bottom-0 right-0 h-[2px] w-5 rounded bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
              <div className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full border border-dashed border-white/70" />
            </div>

            <div className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-white/70" />
            <div className="absolute bottom-0 left-1/2 h-3 w-px -translate-x-1/2 bg-white/70" />
            <div className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-white/70" />
            <div className="absolute right-0 top-1/2 h-px w-3 -translate-y-1/2 bg-white/70" />
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-slate-950/70 px-3 py-2 text-center text-[11px] font-semibold tracking-wide text-white/90">
            ALINHE OS CÍRCULOS COM OS CANTOS DO PAPEL
          </div>
        </div>
      </div>

      <canvas
        ref={overlayCanvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      <canvas ref={processingCanvasRef} className="hidden" />

      <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2">
        <div
          className={`rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
            anchorFeedback.ready
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {anchorFeedback.message}
        </div>
      </div>

      {workerLoading && (
        <div className="absolute left-1/2 top-12 z-20 -translate-x-1/2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
          Carregamento otimizado: preparando motor de visão...
        </div>
      )}

      {workerLoadError && (
        <div className="absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 shadow-sm">
          {workerLoadError}
        </div>
      )}
    </div>
  );
});

function ScannerView({ questionCount, onCapture }) {
  const videoRef = useRef(null);
  const scanFrameRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);
  const processingCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const pendingFrameRef = useRef(false);
  const latestAnswersRef = useRef(null);
  const latestFrameSizeRef = useRef({ width: 1, height: 1 });

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);
  const [workerLoading, setWorkerLoading] = useState(true);
  const [workerLoadError, setWorkerLoadError] = useState("");
  const [anchorFeedback, setAnchorFeedback] = useState({
    ready: false,
    message: "Aguardando câmera...",
    points: [],
  });

  const drawOverlayFeedback = (points, frameSize) => {
    const canvas = overlayCanvasRef.current;
    const frame = scanFrameRef.current;
    if (!canvas || !frame) return;

    const rect = canvas.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const fx = frameRect.left - rect.left;
    const fy = frameRect.top - rect.top;
    const fw = frameRect.width;
    const fh = frameRect.height;

    const guideX = fx + fw * BUBBLE_GEOMETRY.infoX;
    const guideY = fy + fh * BUBBLE_GEOMETRY.infoY;
    const guideW = fw * BUBBLE_GEOMETRY.infoW;
    const guideH = fh * BUBBLE_GEOMETRY.infoH;

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.strokeRect(guideX, guideY, guideW, guideH);

    const rows = Math.ceil(questionCount / 2);
    const top = guideY + guideH * BUBBLE_GEOMETRY.top;
    const bottom = guideY + guideH * BUBBLE_GEOMETRY.bottom;
    const leftBase = guideX + guideW * BUBBLE_GEOMETRY.leftStart;
    const rightBase = guideX + guideW * BUBBLE_GEOMETRY.rightStart;

    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    for (let q = 0; q < questionCount; q += 1) {
      const col = q < rows ? 0 : 1;
      const row = col === 0 ? q : q - rows;
      const y = rows <= 1 ? top : top + (row * (bottom - top)) / (rows - 1);
      const xBase = col === 0 ? leftBase : rightBase;

      for (let o = 0; o < OPTIONS.length; o += 1) {
        const x = xBase + o * (guideW * BUBBLE_GEOMETRY.optionSpacing);
        ctx.beginPath();
        ctx.arc(x, y, BUBBLE_GEOMETRY.overlayRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (Array.isArray(points) && points.length === 4) {
      const baseWidth = frameSize?.width || fw;
      const baseHeight = frameSize?.height || fh;
      const sx = fw / Math.max(1, baseWidth);
      const sy = fh / Math.max(1, baseHeight);

      ctx.strokeStyle = "rgba(34,197,94,0.95)";
      ctx.fillStyle = "rgba(34,197,94,0.95)";

      points.forEach((point, idx) => {
        const px = fx + point.x * sx;
        const py = fy + point.y * sy;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "12px sans-serif";
        ctx.fillText(String(idx + 1), px + 8, py - 8);
      });
    }
  };

  useEffect(() => {
    const worker = new Worker(
      new URL("./workers/imageProcessor.worker.js", import.meta.url),
      { type: "classic" },
    );

    workerRef.current = worker;
    setWorkerLoading(true);

    worker.onmessage = (event) => {
      const { type, payload, message } = event.data || {};

      if (type === "opencv-ready") {
        setWorkerReady(true);
        setWorkerLoading(false);
        setWorkerLoadError("");
        return;
      }

      if (type === "opencv-error") {
        setWorkerReady(false);
        setWorkerLoading(false);
        setWorkerLoadError(message || "Falha ao carregar OpenCV no worker");
        return;
      }

      if (type === "processed") {
        pendingFrameRef.current = false;
        latestFrameSizeRef.current = {
          width: payload.sourceWidth || 1,
          height: payload.sourceHeight || 1,
        };
        drawOverlayFeedback(payload.anchors, latestFrameSizeRef.current);
        latestAnswersRef.current = payload.answers;
        setAnchorFeedback({
          ready: payload.ready,
          message: payload.message,
          points: payload.anchors || [],
        });
        return;
      }

      if (type === "process-error") {
        pendingFrameRef.current = false;
        setAnchorFeedback({
          ready: false,
          message: message || "Erro de processamento",
          points: [],
        });
      }
    };

    worker.postMessage({ type: "init-opencv" });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isCameraActive) return undefined;
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraBlocked(true);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
          drawOverlayFeedback(null);
        }
      } catch {
        setCameraBlocked(true);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraActive, questionCount]);

  useEffect(() => {
    if (!isCameraActive || !cameraReady || !workerReady || cameraBlocked) return undefined;

    const maxProcessWidth = 960;
    const tickMs = anchorFeedback.ready ? 900 : 380;

    const tick = window.setInterval(() => {
      if (document.hidden) return;
      if (pendingFrameRef.current || !workerRef.current) return;
      const video = videoRef.current;
      const canvas = processingCanvasRef.current;
      if (!video || !canvas || !video.videoWidth || !video.videoHeight) return;

      const scale = Math.min(1, maxProcessWidth / video.videoWidth);
      const frameWidth = Math.max(1, Math.floor(video.videoWidth * scale));
      const frameHeight = Math.max(1, Math.floor(video.videoHeight * scale));

      if (canvas.width !== frameWidth || canvas.height !== frameHeight) {
        canvas.width = frameWidth;
        canvas.height = frameHeight;
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, frameWidth, frameHeight);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      pendingFrameRef.current = true;
      workerRef.current.postMessage({
        type: "process-frame",
        payload: { imageData, questionCount },
      });
    }, tickMs);

    return () => window.clearInterval(tick);
  }, [
    isCameraActive,
    cameraReady,
    workerReady,
    cameraBlocked,
    questionCount,
    anchorFeedback.ready,
  ]);

  const handleCapture = () => {
    if (workerReady && anchorFeedback.ready && Array.isArray(latestAnswersRef.current)) {
      onCapture(latestAnswersRef.current);
      return;
    }

    setAnchorFeedback({
      ready: false,
      message: "Alinhar as âncoras para capturar.",
      points: [],
    });
  };

  if (!isCameraActive) {
    return (
      <section className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-7xl items-center px-4 sm:px-6">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 inline-flex rounded-full bg-blue-50 p-3 text-blue-600">
            <Camera className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Leitor de Respostas</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
            Para iniciar a leitura, toque no botão abaixo e abra a câmera quando
            quiser começar.
          </p>
          <button
            type="button"
            onClick={() => {
              setCameraBlocked(false);
              setCameraReady(false);
              setAnchorFeedback({
                ready: false,
                message: "Iniciando leitura...",
                points: [],
              });
              setIsCameraActive(true);
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Camera className="h-4 w-4" />
            Ler Respostas
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-900">
      {!cameraBlocked ? (
        <>
          <div className="absolute inset-0 bg-slate-950/80" />
          <div className="absolute inset-0 flex items-center justify-center px-2 py-3 sm:px-4 sm:py-4">
            <div
              ref={scanFrameRef}
              className="relative aspect-[210/297] w-[min(94vw,680px)] max-h-[84vh] overflow-hidden rounded-2xl border border-white/20 bg-slate-900 shadow-2xl sm:w-[min(90vw,620px)]"
            >
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                autoPlay
                playsInline
                muted
              />
            </div>
          </div>

          {!cameraReady && (
            <div className="absolute inset-0 grid place-items-center bg-slate-900/60">
              <p className="text-sm font-medium text-white">Iniciando câmera...</p>
            </div>
          )}
        </>
      ) : (
        <div className="relative h-full w-full overflow-hidden bg-slate-200">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.78),transparent_38%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.42),transparent_34%),radial-gradient(circle_at_60%_80%,rgba(148,163,184,0.35),transparent_44%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.13)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.13)_50%,rgba(255,255,255,0.13)_75%,transparent_75%,transparent)] bg-[length:24px_24px] opacity-40" />
          <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
            <div className="rounded-full bg-white p-4 shadow-md">
              <Camera className="h-7 w-7 text-slate-500" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Câmera Simulada
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              O navegador bloqueou a câmera traseira. A leitura continua com
              fallback.
            </p>
          </div>
        </div>
      )}

      <ScannerOverlay
        overlayCanvasRef={overlayCanvasRef}
        processingCanvasRef={processingCanvasRef}
        anchorFeedback={anchorFeedback}
        workerLoadError={workerLoadError}
        workerLoading={workerLoading}
      />

      <div className="no-print absolute inset-x-0 bottom-0 flex justify-center pb-7 pt-6">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleCapture}
            disabled={!anchorFeedback.ready && workerReady}
            className="group relative inline-flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl ring-8 ring-white/20 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Capturar gabarito"
          >
            <span className="absolute h-20 w-20 rounded-full border-4 border-blue-600" />
            <span className="h-5 w-5 rounded-full bg-blue-600 transition group-active:scale-125" />
          </button>

          {!workerReady && (
            <p className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
              OpenCV em carregamento. Aguarde para capturar.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

const TemplateView = memo(function TemplateView({
  examConfig,
  schoolName,
  studentName,
  onBack,
}) {
  const questions = Array.from({ length: examConfig.questionCount }, (_, i) => i + 1);
  const questionsPerColumn = Math.ceil(questions.length / 2);
  const leftColumnQuestions = questions.slice(0, questionsPerColumn);
  const rightColumnQuestions = questions.slice(questionsPerColumn);

  return (
    <section className="mx-auto w-full max-w-7xl px-3 pb-12 pt-4 sm:px-6">
      <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Dica: se a impressão automática estiver bloqueada, use Ctrl+P.
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Imprimir
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-3 sm:p-6">
        <div className="print-area relative mx-auto min-h-[297mm] w-[210mm] bg-white p-6 text-slate-900 shadow-md">
          <div className="pointer-events-none absolute inset-3 rounded-xl border border-slate-300">
            <div className="absolute left-2 top-2 h-8 w-8">
              <div className="absolute left-0 top-0 h-5 w-[2px] bg-blue-600" />
              <div className="absolute left-0 top-0 h-[2px] w-5 bg-blue-600" />
              <div className="absolute left-1.5 top-1.5 h-4 w-4 rounded-full border border-dashed border-slate-500" />
            </div>

            <div className="absolute right-2 top-2 h-8 w-8">
              <div className="absolute right-0 top-0 h-5 w-[2px] bg-blue-600" />
              <div className="absolute right-0 top-0 h-[2px] w-5 bg-blue-600" />
              <div className="absolute right-1.5 top-1.5 h-4 w-4 rounded-full border border-dashed border-slate-500" />
            </div>

            <div className="absolute bottom-2 left-2 h-8 w-8">
              <div className="absolute bottom-0 left-0 h-5 w-[2px] bg-blue-600" />
              <div className="absolute bottom-0 left-0 h-[2px] w-5 bg-blue-600" />
              <div className="absolute bottom-1.5 left-1.5 h-4 w-4 rounded-full border border-dashed border-slate-500" />
            </div>

            <div className="absolute bottom-2 right-2 h-8 w-8">
              <div className="absolute bottom-0 right-0 h-5 w-[2px] bg-blue-600" />
              <div className="absolute bottom-0 right-0 h-[2px] w-5 bg-blue-600" />
              <div className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full border border-dashed border-slate-500" />
            </div>

            <div className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-slate-400" />
            <div className="absolute bottom-0 left-1/2 h-3 w-px -translate-x-1/2 bg-slate-400" />
            <div className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-slate-400" />
            <div className="absolute right-0 top-1/2 h-px w-3 -translate-y-1/2 bg-slate-400" />
          </div>

          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {schoolName || "Escola não informada"}
            </p>
            <h2 className="mt-1 text-lg font-bold">Gabarito de Respostas</h2>
            <p className="mt-1 text-sm text-slate-500">
              Preencha as bolhas com caneta escura. Marque apenas uma
              alternativa por questão.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-slate-500">Aluno</p>
              <div className="rounded border border-slate-300 px-3 py-2 font-medium text-slate-900">
                {studentName || "Aluno não selecionado"}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500">Data</p>
              <div className="rounded border border-slate-300 px-3 py-2 font-medium text-slate-900">
                ____ / ____ / ______
              </div>
            </div>
          </div>

          <div className="relative mt-6 rounded-xl border border-slate-300 p-3">
            <div className="pointer-events-none absolute left-2 top-2 h-6 w-6 border-l-2 border-t-2 border-blue-600" />
            <div className="pointer-events-none absolute right-2 top-2 h-6 w-6 border-r-2 border-t-2 border-blue-600" />
            <div className="pointer-events-none absolute bottom-2 left-2 h-6 w-6 border-b-2 border-l-2 border-blue-600" />
            <div className="pointer-events-none absolute bottom-2 right-2 h-6 w-6 border-b-2 border-r-2 border-blue-600" />

            <div className="grid grid-cols-2 gap-x-8 text-xs">
              <div className="space-y-3">
                {leftColumnQuestions.map((q) => (
                  <div key={q} className="flex items-center gap-2">
                    <span className="w-8 font-semibold text-slate-600">Q{q}</span>
                    <div className="flex gap-2">
                      {OPTIONS.map((op) => (
                        <div key={`${q}-${op}`} className="grid place-items-center gap-1">
                          <div className="h-5 w-5 rounded-full border-2 border-slate-400 bg-white" />
                          <span className="text-[10px] text-slate-500">{op}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {rightColumnQuestions.map((q) => (
                  <div key={q} className="flex items-center gap-2">
                    <span className="w-8 font-semibold text-slate-600">Q{q}</span>
                    <div className="flex gap-2">
                      {OPTIONS.map((op) => (
                        <div key={`${q}-${op}`} className="grid place-items-center gap-1">
                          <div className="h-5 w-5 rounded-full border-2 border-slate-400 bg-white" />
                          <span className="text-[10px] text-slate-500">{op}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

function ResultView({ result, onBackScanner, onOpenDashboard }) {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 pb-10 pt-6 sm:px-6">
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>

        <h2 className="text-center text-xl font-semibold text-slate-900">
          Correção concluída
        </h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Prova simulada corrigida com base no gabarito oficial.
        </p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Aluno</span>
            <span className="text-sm font-medium text-slate-900">
              {result.studentName}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Acertos</span>
            <span className="text-sm font-medium text-slate-900">
              {result.correctCount}/{result.totalQuestions}
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-sm text-slate-500">Nota final</span>
            <span className="text-3xl font-bold text-blue-600">
              {Number(result.score).toFixed(1)}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onBackScanner}
            className="no-print rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Nova Leitura
          </button>
          <button
            type="button"
            onClick={onOpenDashboard}
            className="no-print rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Ver Dashboard
          </button>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState("scanner");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const [schoolInfo, setSchoolInfo] = useLocalStorage(STORAGE_KEYS.schoolInfo, {
    name: "",
  });
  const [studentList, setStudentList] = useLocalStorage(
    STORAGE_KEYS.studentList,
    [],
  );
  const [examConfig, setExamConfig] = useLocalStorage(STORAGE_KEYS.officialKey, {
    questionCount: 20,
    answers: Array.from({ length: 20 }, (_, idx) => OPTIONS[idx % OPTIONS.length]),
  });
  const [studentsResults, setStudentsResults] = useLocalStorage(
    STORAGE_KEYS.studentsResults,
    [],
  );

  useEffect(() => {
    const count = Math.max(1, Number(examConfig.questionCount) || 1);
    if (!Array.isArray(examConfig.answers) || examConfig.answers.length !== count) {
      const fixedAnswers = Array.from(
        { length: count },
        (_, i) => examConfig.answers?.[i] || "A",
      );
      setExamConfig({ questionCount: count, answers: fixedAnswers });
    }
  }, [examConfig, setExamConfig]);

  const handleCapture = (capturedAnswers) => {
    const totalQuestions = examConfig.questionCount;
    const official = examConfig.answers.slice(0, totalQuestions);
    if (!Array.isArray(capturedAnswers) || capturedAnswers.length !== totalQuestions) {
      return;
    }

    const studentAnswers = capturedAnswers;
    const correctCount = studentAnswers.reduce(
      (acc, answer, idx) => (answer === official[idx] ? acc + 1 : acc),
      0,
    );
    const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 10 : 0;

    const result = {
      id: Date.now(),
      studentName: randomStudentName(),
      studentAnswers,
      correctCount,
      totalQuestions,
      score: Number(score.toFixed(1)),
      createdAt: new Date().toISOString(),
    };

    setStudentsResults((prev) => [result, ...prev]);
    setLastResult(result);
    setActiveView("result");
  };

  const handleExportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      [STORAGE_KEYS.schoolInfo]: schoolInfo,
      [STORAGE_KEYS.studentList]: studentList,
      [STORAGE_KEYS.officialKey]: examConfig,
      [STORAGE_KEYS.studentsResults]: studentsResults,
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleClearClass = () => {
    window.localStorage.removeItem(STORAGE_KEYS.studentsResults);
    setStudentsResults([]);
  };

  const openTemplateForStudent = (studentName) => {
    setSelectedStudent(studentName);
    setActiveView("template");
  };

  const renderView = () => {
    if (activeView === "config") {
      return (
        <Suspense
          fallback={
            <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Carregando configuração...</p>
              </div>
            </section>
          }
        >
          <LazyConfigGabaritoView examConfig={examConfig} onSave={setExamConfig} />
        </Suspense>
      );
    }

    if (activeView === "customize") {
      return (
        <CustomizePrintView
          schoolInfo={schoolInfo}
          studentList={studentList}
          onSaveSchool={setSchoolInfo}
          onSaveStudents={setStudentList}
          onOpenTemplate={openTemplateForStudent}
        />
      );
    }

    if (activeView === "template") {
      return (
        <TemplateView
          examConfig={examConfig}
          schoolName={schoolInfo?.name || ""}
          studentName={selectedStudent}
          onBack={() => setActiveView("customize")}
        />
      );
    }

    if (activeView === "dashboard") {
      return (
        <Suspense
          fallback={
            <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Carregando dashboard...</p>
              </div>
            </section>
          }
        >
          <LazyDashboardView
            examConfig={examConfig}
            results={studentsResults}
            onExport={handleExportBackup}
            onClear={handleClearClass}
          />
        </Suspense>
      );
    }

    if (activeView === "result") {
      const result = lastResult || studentsResults[0];
      if (!result) {
        return (
          <ScannerView
            questionCount={examConfig.questionCount}
            onCapture={handleCapture}
          />
        );
      }
      return (
        <ResultView
          result={result}
          onBackScanner={() => setActiveView("scanner")}
          onOpenDashboard={() => setActiveView("dashboard")}
        />
      );
    }

    return (
      <ScannerView questionCount={examConfig.questionCount} onCapture={handleCapture} />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          body {
            background: #fff !important;
          }

          .no-print {
            display: none !important;
          }

          .print-area {
            width: 100% !important;
            min-height: auto !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
        }
      `}</style>

      <Header activeView={activeView} onNavigate={setActiveView} />

      <main className="pt-16">{renderView()}</main>
    </div>
  );
}
