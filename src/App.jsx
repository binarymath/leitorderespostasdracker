import React, { Suspense, lazy, memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  LayoutDashboard,
  Printer,
  School,
  Settings2,
  User,
  Users,
} from "lucide-react";
import QRCode from "qrcode";

const LazyConfigGabaritoView = lazy(() => import("./views/ConfigGabaritoView.jsx"));
const LazyDashboardView = lazy(() => import("./views/DashboardView.jsx"));

const OPTIONS = ["A", "B", "C", "D", "E"];

const STORAGE_KEYS = {
  v2Data: "dracker_v2_data",
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
  top: 0.31,
  bottom: 0.93,
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

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultActivity(name = "Atividade 1") {
  const questionCount = 20;
  return {
    id: createId("activity"),
    name,
    questionCount,
    weight: 1,
    officialKey: Array.from({ length: questionCount }, (_, idx) => OPTIONS[idx % OPTIONS.length]),
    results: [],
  };
}

function createDefaultClass(name = "Turma A") {
  const students = Array.from({ length: 6 }, (_, idx) => ({
    id: createId("student"),
    name: `${randomStudentName()} ${idx + 1}`,
  }));
  const activity = createDefaultActivity("Prova 1");
  return {
    id: createId("class"),
    name,
    students,
    activities: [activity],
  };
}

function ensureActivity(activity) {
  const count = Math.max(1, Number(activity?.questionCount) || 20);
  const key = Array.from({ length: count }, (_, idx) => activity?.officialKey?.[idx] || "A");
  return {
    id: activity?.id || createId("activity"),
    name: activity?.name || "Atividade",
    questionCount: count,
    weight: Number(activity?.weight || 1) > 0 ? Number(activity.weight) : 1,
    officialKey: key,
    results: Array.isArray(activity?.results) ? activity.results : [],
  };
}

function ensureClass(classroom) {
  const students = Array.isArray(classroom?.students)
    ? classroom.students.map((student) => ({
        id: student?.id || createId("student"),
        name: student?.name || "Aluno sem nome",
      }))
    : [];

  const activities = Array.isArray(classroom?.activities)
    ? classroom.activities.map(ensureActivity)
    : [createDefaultActivity()];

  return {
    id: classroom?.id || createId("class"),
    name: classroom?.name || "Turma",
    students,
    activities: activities.length ? activities : [createDefaultActivity()],
  };
}

function normalizeAppData(data) {
  const classes = Array.isArray(data?.classes) ? data.classes.map(ensureClass) : [createDefaultClass()];
  const firstClass = classes[0];
  const selectedClassId =
    classes.find((item) => item.id === data?.selectedClassId)?.id || firstClass.id;
  const selectedClass = classes.find((item) => item.id === selectedClassId) || firstClass;
  const selectedActivityId =
    selectedClass.activities.find((item) => item.id === data?.selectedActivityId)?.id ||
    selectedClass.activities[0].id;

  return {
    schoolInfo: { name: data?.schoolInfo?.name || "" },
    classes,
    selectedClassId,
    selectedActivityId,
  };
}

function migrateLegacyData() {
  const fallback = normalizeAppData({ classes: [createDefaultClass()] });

  if (typeof window === "undefined") return fallback;

  try {
    const v2Raw = window.localStorage.getItem(STORAGE_KEYS.v2Data);
    if (v2Raw) {
      return normalizeAppData(JSON.parse(v2Raw));
    }

    const schoolInfo = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.schoolInfo) || "null") || {
      name: "",
    };
    const studentList = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.studentList) || "[]");
    const examConfig = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.officialKey) || "null") || {
      questionCount: 20,
      answers: Array.from({ length: 20 }, () => "A"),
    };
    const legacyResults = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.studentsResults) || "[]");

    const students = (Array.isArray(studentList) ? studentList : [])
      .map((name) => String(name || "").trim())
      .filter(Boolean)
      .map((name) => ({ id: createId("student"), name }));

    const count = Math.max(1, Number(examConfig.questionCount) || 20);
    const activity = {
      id: createId("activity"),
      name: "Atividade Migrada",
      questionCount: count,
      weight: 1,
      officialKey: Array.from({ length: count }, (_, idx) => examConfig?.answers?.[idx] || "A"),
      results: Array.isArray(legacyResults)
        ? legacyResults.map((item) => ({
            ...item,
            id: item?.id || Date.now() + Math.random(),
            classId: null,
            activityId: null,
            studentId: null,
            weightedScore:
              typeof item?.weightedScore === "number"
                ? item.weightedScore
                : Number(item?.score || 0),
          }))
        : [],
    };

    const classroom = {
      id: createId("class"),
      name: "Turma Migrada",
      students,
      activities: [activity],
    };

    const migrated = normalizeAppData({
      schoolInfo,
      classes: [classroom],
      selectedClassId: classroom.id,
      selectedActivityId: activity.id,
    });

    return migrated;
  } catch {
    return fallback;
  }
}

function Header({ activeView, onNavigate }) {
  const nav = [
    { id: "scanner", label: "Leitor Real", icon: Camera },
    { id: "config", label: "Turmas e Atividades", icon: Settings2 },
    { id: "template", label: "Templates A4", icon: Printer },
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
            <h1 className="text-sm font-semibold text-slate-900 sm:text-base">Leitor Dracker</h1>
            <p className="text-[11px] text-slate-500 sm:text-xs">Leitura real com QR e OpenCV</p>
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

function SelectionStrip({
  classes,
  selectedClassId,
  selectedActivityId,
  onSelectClass,
  onSelectActivity,
}) {
  const selectedClass = classes.find((item) => item.id === selectedClassId);

  return (
    <div className="w-full rounded-xl border border-white/20 bg-slate-900/78 p-3 backdrop-blur-sm">
      <p className="mb-2 text-[11px] font-semibold tracking-wide text-white/85">CONTEXTO DA LEITURA</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          value={selectedClassId || ""}
          onChange={(event) => onSelectClass(event.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-100"
        >
          <option value="">Turma</option>
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <select
          value={selectedActivityId || ""}
          onChange={(event) => onSelectActivity(event.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-100"
        >
          <option value="">Atividade</option>
          {(selectedClass?.activities || []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

const ScannerOverlay = memo(function ScannerOverlay({
  overlayCanvasRef,
  processingCanvasRef,
  workerLoadError,
  workerLoading,
  anchorReady,
  captureStatus,
  anchorMessage,
  selectedClass,
  selectedActivity,
}) {
  const indicators = [
    { label: "Circulos Detectados", active: Boolean(anchorReady) || Boolean(captureStatus?.circlesDetected) },
    { label: "QR Code Lido", active: Boolean(captureStatus?.qrRead) },
    { label: "Atividade Identificada", active: Boolean(captureStatus?.activityIdentified) },
  ];

  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-slate-950/45" />

      <canvas ref={overlayCanvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

      <canvas ref={processingCanvasRef} className="hidden" />

      <div className="absolute left-1/2 top-4 z-20 w-[min(94vw,950px)] -translate-x-1/2 rounded-xl border border-white/15 bg-slate-900/72 p-3 backdrop-blur-sm">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide text-white/90">LEITOR REAL AJUSTADO AO GABARITO</p>
          <p className="text-[11px] text-blue-100/90">{selectedClass?.name || "Sem turma"} • {selectedActivity?.name || "Sem atividade"}</p>
        </div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {indicators.map((item) => (
            <div
              key={item.label}
              className={`rounded-full px-3 py-1 text-[11px] font-medium shadow-sm ${
                item.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>
        <p className="text-xs text-white/85">{captureStatus?.message || anchorMessage || "Posicione a folha inteira dentro do quadro"}</p>
      </div>

      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-white/20 bg-slate-900/72 px-4 py-2 text-center backdrop-blur-sm">
        <p className="text-[11px] font-semibold tracking-wide text-white/90">ALINHE OS 4 CIRCULOS DA FOLHA COM OS ALVOS DO QUADRO</p>
      </div>

      <div className="absolute bottom-6 left-1/2 z-20 w-[min(90vw,760px)] -translate-x-1/2 rounded-xl border border-white/15 bg-slate-900/70 p-3 backdrop-blur-sm">
        <div className="grid grid-cols-3 gap-2 text-[11px] text-white/85">
          <p className="rounded-lg bg-slate-800/70 px-2 py-1">1. Centralize os 4 cantos pretos</p>
          <p className="rounded-lg bg-slate-800/70 px-2 py-1">2. Evite sombras sobre bolhas</p>
          <p className="rounded-lg bg-slate-800/70 px-2 py-1">3. Capture com a folha estável</p>
        </div>
      </div>

      {workerLoading && (
        <div className="absolute left-1/2 top-12 z-20 -translate-x-1/2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
          Preparando motor de visao...
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

function ScannerView({
  classes,
  selectedClassId,
  selectedActivityId,
  onSelectClass,
  onSelectActivity,
  onCapture,
}) {
  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) || null,
    [classes, selectedClassId],
  );

  const selectedActivity = useMemo(
    () =>
      selectedClass?.activities?.find((item) => item.id === selectedActivityId) || null,
    [selectedClass, selectedActivityId],
  );

  const questionCount = selectedActivity?.questionCount || 20;

  const videoRef = useRef(null);
  const scanFrameRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);
  const processingCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const pendingFrameRef = useRef(false);
  const latestFrameSizeRef = useRef({ width: 1, height: 1 });
  const captureResolverRef = useRef(null);
  const autoCaptureTimerRef = useRef(null);
  const autoCaptureLockRef = useRef(false);
  const autoCaptureCooldownRef = useRef(0);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);
  const [workerLoading, setWorkerLoading] = useState(true);
  const [workerLoadError, setWorkerLoadError] = useState("");
  const [anchorFeedback, setAnchorFeedback] = useState({
    ready: false,
    message: "Aguardando camera...",
    points: [],
  });
  const [captureStatus, setCaptureStatus] = useState({
    circlesDetected: false,
    qrRead: false,
    activityIdentified: false,
    message: "",
  });
  const [isCapturing, setIsCapturing] = useState(false);
  const [autoCaptureMessage, setAutoCaptureMessage] = useState(
    "Captura automatica aguardando alinhamento...",
  );

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

    const cornerRadius = Math.max(10, Math.round(Math.min(fw, fh) * 0.018));
    const targetCorners = [
      { x: fx + 16, y: fy + 16 },
      { x: fx + fw - 16, y: fy + 16 },
      { x: fx + fw - 16, y: fy + fh - 16 },
      { x: fx + 16, y: fy + fh - 16 },
    ];

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.strokeRect(fx, fy, fw, fh);

    targetCorners.forEach((point, idx) => {
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, cornerRadius + 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.arc(point.x, point.y, cornerRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.beginPath();
      ctx.moveTo(point.x - cornerRadius - 7, point.y);
      ctx.lineTo(point.x + cornerRadius + 7, point.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(point.x, point.y - cornerRadius - 7);
      ctx.lineTo(point.x, point.y + cornerRadius + 7);
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "11px sans-serif";
      ctx.fillText(`A${idx + 1}`, point.x + cornerRadius + 8, point.y - cornerRadius - 6);
    });

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
      ctx.lineWidth = 2;

      points.forEach((point, idx) => {
        const px = fx + point.x * sx;
        const py = fy + point.y * sy;

        const target = targetCorners[idx];
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.95)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, 11, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "rgba(34,197,94,0.95)";
        ctx.lineWidth = 2;
        ctx.font = "12px sans-serif";
        ctx.fillText(`D${idx + 1}`, px + 10, py - 9);
      });
    }
  };

  useEffect(() => {
    const worker = new Worker(new URL("./workers/imageProcessor.worker.js", import.meta.url), {
      type: "classic",
    });

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
        return;
      }

      if (type === "capture-result") {
        if (captureResolverRef.current) {
          captureResolverRef.current(payload);
          captureResolverRef.current = null;
        }
        return;
      }

      if (type === "capture-error") {
        if (captureResolverRef.current) {
          captureResolverRef.current({
            success: false,
            message: message || "Erro ao processar captura",
            circlesDetected: false,
            qrRead: false,
            activityIdentified: false,
          });
          captureResolverRef.current = null;
        }
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
  }, [isCameraActive]);

  useEffect(() => {
    if (!isCameraActive || !cameraReady || !workerReady || cameraBlocked) return undefined;

    const maxProcessWidth = 960;
    const tickMs = anchorFeedback.ready ? 900 : 360;

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

  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = processingCanvasRef.current;
    const worker = workerRef.current;
    if (!video || !canvas || !worker || !workerReady || !selectedActivity || isCapturing) {
      return;
    }

    if (!video.videoWidth || !video.videoHeight) return;

    setIsCapturing(true);
    setAutoCaptureMessage("Captura automatica em andamento...");

    const maxProcessWidth = 1280;
    const scale = Math.min(1, maxProcessWidth / video.videoWidth);
    const frameWidth = Math.max(1, Math.floor(video.videoWidth * scale));
    const frameHeight = Math.max(1, Math.floor(video.videoHeight * scale));

    if (canvas.width !== frameWidth || canvas.height !== frameHeight) {
      canvas.width = frameWidth;
      canvas.height = frameHeight;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    ctx.drawImage(video, 0, 0, frameWidth, frameHeight);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const payload = await new Promise((resolve) => {
      captureResolverRef.current = resolve;
      worker.postMessage({
        type: "capture-frame",
        payload: { imageData, questionCount: selectedActivity.questionCount },
      });
    });

    setIsCapturing(false);

    setCaptureStatus({
      circlesDetected: Boolean(payload?.circlesDetected),
      qrRead: Boolean(payload?.qrRead),
      activityIdentified: Boolean(payload?.activityIdentified),
      message: payload?.message || "",
    });

    if (!payload?.success || !Array.isArray(payload?.answers)) {
      autoCaptureLockRef.current = false;
      autoCaptureCooldownRef.current = Date.now() + 1200;
      setAutoCaptureMessage("Falha na captura automatica. Reposicione a folha.");
      setAnchorFeedback((prev) => ({
        ...prev,
        ready: false,
        message: payload?.message || "Falha na captura",
      }));
      return;
    }

    setAutoCaptureMessage("Leitura concluida automaticamente.");

    onCapture(payload);
  };

  useEffect(() => {
    if (
      !isCameraActive ||
      !cameraReady ||
      !workerReady ||
      cameraBlocked ||
      !selectedClass ||
      !selectedActivity
    ) {
      if (autoCaptureTimerRef.current) {
        window.clearTimeout(autoCaptureTimerRef.current);
        autoCaptureTimerRef.current = null;
      }
      return;
    }

    if (isCapturing || autoCaptureLockRef.current) return;

    if (!anchorFeedback.ready) {
      setAutoCaptureMessage("Captura automatica aguardando alinhamento...");
      if (autoCaptureTimerRef.current) {
        window.clearTimeout(autoCaptureTimerRef.current);
        autoCaptureTimerRef.current = null;
      }
      return;
    }

    if (Date.now() < autoCaptureCooldownRef.current) return;

    setAutoCaptureMessage("Alinhamento detectado. Capturando automaticamente...");

    if (autoCaptureTimerRef.current) {
      window.clearTimeout(autoCaptureTimerRef.current);
      autoCaptureTimerRef.current = null;
    }

    autoCaptureTimerRef.current = window.setTimeout(() => {
      autoCaptureLockRef.current = true;
      handleCapture();
      autoCaptureTimerRef.current = null;
    }, 700);

    return () => {
      if (autoCaptureTimerRef.current) {
        window.clearTimeout(autoCaptureTimerRef.current);
        autoCaptureTimerRef.current = null;
      }
    };
  }, [
    isCameraActive,
    cameraReady,
    workerReady,
    cameraBlocked,
    selectedClass,
    selectedActivity,
    anchorFeedback.ready,
    isCapturing,
  ]);

  if (!isCameraActive) {
    return (
      <section className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-7xl items-center px-4 sm:px-6">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mx-auto mb-4 inline-flex rounded-full bg-blue-50 p-3 text-blue-600">
                <Camera className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Scanner real de gabaritos</h2>
              <p className="mt-2 max-w-lg text-sm text-slate-500">
                Tela reconstruida para guiar o enquadramento da folha A4 e alinhar melhor
                com o gabarito impresso. Selecione turma e atividade e inicie a leitura.
              </p>
            </div>

            <button
              type="button"
              disabled={!selectedClass || !selectedActivity}
              onClick={() => {
                setCameraBlocked(false);
                setCameraReady(false);
                setAnchorFeedback({
                  ready: false,
                  message: "Iniciando leitura...",
                  points: [],
                });
                setCaptureStatus({
                  circlesDetected: false,
                  qrRead: false,
                  activityIdentified: false,
                  message: "",
                });
                setAutoCaptureMessage("Captura automatica aguardando alinhamento...");
                autoCaptureLockRef.current = false;
                autoCaptureCooldownRef.current = 0;
                if (autoCaptureTimerRef.current) {
                  window.clearTimeout(autoCaptureTimerRef.current);
                  autoCaptureTimerRef.current = null;
                }
                setIsCameraActive(true);
              }}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Iniciar Scanner
            </button>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <select
              value={selectedClassId || ""}
              onChange={(event) => onSelectClass(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Selecione a turma</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              value={selectedActivityId || ""}
              onChange={(event) => onSelectActivity(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Selecione a atividade</option>
              {(selectedClass?.activities || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-3">
            <p>Use boa iluminacao e mantenha a camera paralela.</p>
            <p>Posicione os 4 circulos pretos dentro do quadro.</p>
            <p>A leitura de QR identifica aluno e atividade automaticamente.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-900">
      <div className="absolute left-1/2 top-24 z-30 w-[min(94vw,950px)] -translate-x-1/2">
        <SelectionStrip
          classes={classes}
          selectedClassId={selectedClassId}
          selectedActivityId={selectedActivityId}
          onSelectClass={onSelectClass}
          onSelectActivity={onSelectActivity}
        />
      </div>

      {!cameraBlocked ? (
        <>
          <div className="absolute inset-0 bg-slate-950/80" />
          <div className="absolute inset-0 flex items-center justify-center px-2 py-3 sm:px-4 sm:py-4">
            <div
              ref={scanFrameRef}
              className="relative aspect-[210/297] w-[min(94vw,720px)] max-h-[82vh] overflow-hidden rounded-2xl border border-white/25 bg-slate-900 shadow-2xl sm:w-[min(90vw,680px)]"
            >
              <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />

              <div className="pointer-events-none absolute left-4 top-4 h-6 w-6 rounded-full border-2 border-white/85 bg-white/20" />
              <div className="pointer-events-none absolute right-4 top-4 h-6 w-6 rounded-full border-2 border-white/85 bg-white/20" />
              <div className="pointer-events-none absolute bottom-4 left-4 h-6 w-6 rounded-full border-2 border-white/85 bg-white/20" />
              <div className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 rounded-full border-2 border-white/85 bg-white/20" />
            </div>
          </div>

          {!cameraReady && (
            <div className="absolute inset-0 grid place-items-center bg-slate-900/60">
              <p className="text-sm font-medium text-white">Iniciando camera...</p>
            </div>
          )}
        </>
      ) : (
        <div className="relative h-full w-full overflow-hidden bg-slate-200">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.78),transparent_38%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.42),transparent_34%),radial-gradient(circle_at_60%_80%,rgba(148,163,184,0.35),transparent_44%)]" />
          <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
            <div className="rounded-full bg-white p-4 shadow-md">
              <Camera className="h-7 w-7 text-slate-500" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Camera bloqueada</h2>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              O navegador bloqueou a camera traseira. Libere a permissao e tente novamente.
            </p>
          </div>
        </div>
      )}

      <ScannerOverlay
        overlayCanvasRef={overlayCanvasRef}
        processingCanvasRef={processingCanvasRef}
        anchorReady={anchorFeedback.ready}
        captureStatus={captureStatus}
        anchorMessage={anchorFeedback.message}
        selectedClass={selectedClass}
        selectedActivity={selectedActivity}
        workerLoadError={workerLoadError}
        workerLoading={workerLoading}
      />

      <div className="no-print absolute inset-x-0 bottom-0 z-30 flex justify-center pb-7 pt-6">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-xl border border-white/15 bg-slate-900/80 px-4 py-2 text-center backdrop-blur-sm">
            <p className="text-xs font-semibold text-white/90">CAPTURA AUTOMATICA ATIVA</p>
            <p className="mt-1 text-xs text-white/75">{autoCaptureMessage}</p>
          </div>

          <button
            type="button"
            onClick={handleCapture}
            disabled={!selectedClass || !selectedActivity || !workerReady || isCapturing}
            className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Capturar agora (manual)
          </button>

          {!workerReady && (
            <p className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
              OpenCV em carregamento. Aguarde para capturar.
            </p>
          )}

          {workerReady && (
            <p className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700">
              O leitor captura sozinho quando os 4 alvos estiverem alinhados.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function TemplatesHubView({
  schoolInfo,
  classes,
  selectedClassId,
  selectedActivityId,
  onSchoolNameChange,
  onSelectClass,
  onSelectActivity,
  onOpenTemplate,
}) {
  const selectedClass = classes.find((item) => item.id === selectedClassId) || null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <School className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">Template A4 com QR e Ancoras</h2>
          </div>

          <label className="mb-2 block text-sm font-medium text-slate-700">Nome da Escola</label>
          <input
            type="text"
            value={schoolInfo?.name || ""}
            onChange={(event) => onSchoolNameChange(event.target.value)}
            className="mb-4 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            placeholder="Ex: Escola Municipal Aurora"
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={selectedClassId || ""}
              onChange={(event) => onSelectClass(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Selecione a turma</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              value={selectedActivityId || ""}
              onChange={(event) => onSelectActivity(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Selecione a atividade</option>
              {(selectedClass?.activities || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            Cada folha gera QR unico contendo turma, atividade e aluno.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-semibold text-slate-900">Alunos da Turma</h3>
          </div>

          <div className="max-h-[460px] space-y-2 overflow-auto pr-1">
            {(selectedClass?.students || []).length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                Nenhum aluno cadastrado nesta turma.
              </p>
            ) : (
              selectedClass.students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                    <User className="h-4 w-4 text-slate-500" />
                    {student.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenTemplate(student.id)}
                    disabled={!selectedActivityId}
                    className="no-print rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Gerar Folha
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

const TemplateView = memo(function TemplateView({ schoolName, classroom, activity, student, onBack }) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  const questions = Array.from({ length: activity.questionCount }, (_, i) => i + 1);
  const questionsPerColumn = Math.ceil(questions.length / 2);
  const leftColumnQuestions = questions.slice(0, questionsPerColumn);
  const rightColumnQuestions = questions.slice(questionsPerColumn);

  useEffect(() => {
    const payload = JSON.stringify({
      v: 1,
      classId: classroom.id,
      activityId: activity.id,
      studentId: student.id,
    });

    QRCode.toDataURL(payload, {
      margin: 0,
      width: 160,
      errorCorrectionLevel: "M",
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(""));
  }, [classroom.id, activity.id, student.id]);

  return (
    <section className="mx-auto w-full max-w-7xl px-3 pb-12 pt-4 sm:px-6">
      <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          QR integrado para identificacao automatica de turma/atividade/aluno.
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
          <div className="pointer-events-none absolute inset-3 rounded-xl border border-slate-300" />

          <div className="absolute left-3 top-3 h-5 w-5 rounded-full bg-black" />
          <div className="absolute right-3 top-3 h-5 w-5 rounded-full bg-black" />
          <div className="absolute bottom-3 left-3 h-5 w-5 rounded-full bg-black" />
          <div className="absolute bottom-3 right-3 h-5 w-5 rounded-full bg-black" />

          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {schoolName || "Escola nao informada"}
              </p>
              <h2 className="mt-1 text-lg font-bold">Gabarito de Respostas</h2>
              <p className="mt-1 text-sm text-slate-500">{classroom.name} • {activity.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                Marque apenas uma alternativa por questao usando caneta escura.
              </p>
            </div>
            <div className="rounded-lg border border-slate-300 bg-white p-2">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR de identificacao" className="h-20 w-20" />
              ) : (
                <div className="grid h-20 w-20 place-items-center text-[10px] text-slate-400">
                  Gerando QR...
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-slate-500">Aluno</p>
              <div className="rounded border border-slate-300 px-3 py-2 font-medium text-slate-900">
                {student.name}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500">Data</p>
              <div className="rounded border border-slate-300 px-3 py-2 font-medium text-slate-900">
                ____ / ____ / ______
              </div>
            </div>
          </div>

          <div className="relative mx-auto mt-6 w-[86%] rounded-xl border border-slate-300 p-3">
            <div className="grid grid-cols-2 gap-x-8 text-xs">
              <div className="space-y-3">
                {leftColumnQuestions.map((q) => (
                  <div key={q} className="flex items-center justify-center gap-2">
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
                  <div key={q} className="flex items-center justify-center gap-2">
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

        <h2 className="text-center text-xl font-semibold text-slate-900">Correcao concluida</h2>
        <p className="mt-1 text-center text-sm text-slate-500">
          Aluno e atividade identificados pelo QR (ou selecao manual de fallback).
        </p>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Aluno</span>
            <span className="text-sm font-medium text-slate-900">{result.studentName}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Turma / Atividade</span>
            <span className="text-sm font-medium text-slate-900">
              {result.className} • {result.activityName}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Acertos</span>
            <span className="text-sm font-medium text-slate-900">
              {result.correctCount}/{result.totalQuestions}
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-sm text-slate-500">Nota</span>
            <span className="text-3xl font-bold text-blue-600">{Number(result.score).toFixed(1)}</span>
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
  const [selectedTemplateStudentId, setSelectedTemplateStudentId] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const [appData, setAppData] = useLocalStorage(STORAGE_KEYS.v2Data, null);

  useEffect(() => {
    if (appData !== null) return;
    setAppData(migrateLegacyData());
  }, [appData, setAppData]);

  const normalizedData = useMemo(
    () => normalizeAppData(appData || migrateLegacyData()),
    [appData],
  );

  const classes = normalizedData.classes;
  const selectedClass = classes.find((item) => item.id === normalizedData.selectedClassId) || classes[0];
  const selectedActivity =
    selectedClass?.activities?.find((item) => item.id === normalizedData.selectedActivityId) ||
    selectedClass?.activities?.[0] ||
    null;
  const selectedTemplateStudent =
    selectedClass?.students?.find((item) => item.id === selectedTemplateStudentId) || null;

  const setSelection = (nextClassId, nextActivityId = null) => {
    setAppData((prev) => {
      const current = normalizeAppData(prev || normalizedData);
      const nextClass = current.classes.find((item) => item.id === nextClassId) || current.classes[0];
      const candidateActivity =
        nextClass.activities.find((item) => item.id === nextActivityId) || nextClass.activities[0];

      return {
        ...current,
        selectedClassId: nextClass.id,
        selectedActivityId: candidateActivity.id,
      };
    });
  };

  const updateSchoolName = (name) => {
    setAppData((prev) => {
      const current = normalizeAppData(prev || normalizedData);
      return {
        ...current,
        schoolInfo: { name },
      };
    });
  };

  const createClass = (name) => {
    const created = {
      id: createId("class"),
      name,
      students: [],
      activities: [createDefaultActivity("Atividade 1")],
    };

    setAppData((prev) => {
      const current = normalizeAppData(prev || normalizedData);
      return {
        ...current,
        classes: [...current.classes, created],
        selectedClassId: created.id,
        selectedActivityId: created.activities[0].id,
      };
    });

    return created;
  };

  const createActivity = (classId, name) => {
    const created = {
      id: createId("activity"),
      name,
      questionCount: 20,
      weight: 1,
      officialKey: Array.from({ length: 20 }, () => "A"),
      results: [],
    };

    setAppData((prev) => {
      const current = normalizeAppData(prev || normalizedData);
      return {
        ...current,
        classes: current.classes.map((classroom) => {
          if (classroom.id !== classId) return classroom;
          return {
            ...classroom,
            activities: [...classroom.activities, created],
          };
        }),
        selectedClassId: classId,
        selectedActivityId: created.id,
      };
    });

    return created;
  };

  const renameClass = (classId, nextName) => {
    const trimmed = String(nextName || "").trim();
    if (!trimmed) return false;

    setAppData((prev) => {
      const current = normalizeAppData(prev || normalizedData);
      return {
        ...current,
        classes: current.classes.map((classroom) =>
          classroom.id === classId ? { ...classroom, name: trimmed } : classroom,
        ),
      };
    });

    return true;
  };

  const deleteClass = (classId) => {
    const current = normalizeAppData(appData || normalizedData);
    if (current.classes.length <= 1) return false;

    const remaining = current.classes.filter((item) => item.id !== classId);
    const nextClass = remaining[0];
    const nextActivity = nextClass.activities[0];

    setAppData({
      ...current,
      classes: remaining,
      selectedClassId: nextClass.id,
      selectedActivityId: nextActivity.id,
    });

    return true;
  };

  const renameActivity = (classId, activityId, nextName) => {
    const trimmed = String(nextName || "").trim();
    if (!trimmed) return false;

    setAppData((prev) => {
      const current = normalizeAppData(prev || normalizedData);
      return {
        ...current,
        classes: current.classes.map((classroom) => {
          if (classroom.id !== classId) return classroom;
          return {
            ...classroom,
            activities: classroom.activities.map((activity) =>
              activity.id === activityId ? { ...activity, name: trimmed } : activity,
            ),
          };
        }),
      };
    });

    return true;
  };

  const deleteActivity = (classId, activityId) => {
    const current = normalizeAppData(appData || normalizedData);
    const classroom = current.classes.find((item) => item.id === classId);
    if (!classroom || classroom.activities.length <= 1) return false;

    const nextClasses = current.classes.map((item) => {
      if (item.id !== classId) return item;
      return {
        ...item,
        activities: item.activities.filter((activity) => activity.id !== activityId),
      };
    });

    const nextClassroom = nextClasses.find((item) => item.id === classId) || nextClasses[0];
    const nextActivity = nextClassroom.activities[0];

    setAppData({
      ...current,
      classes: nextClasses,
      selectedClassId: nextClassroom.id,
      selectedActivityId: nextActivity.id,
    });

    return true;
  };

  const saveClassStudents = (classId, studentNames) => {
    const students = studentNames.map((name) => ({ id: createId("student"), name }));

    setAppData((prev) => {
      const current = normalizeAppData(prev || normalizedData);
      return {
        ...current,
        classes: current.classes.map((classroom) =>
          classroom.id === classId ? { ...classroom, students } : classroom,
        ),
      };
    });
  };

  const saveActivityConfig = (classId, activityId, config) => {
    setAppData((prev) => {
      const current = normalizeAppData(prev || normalizedData);
      return {
        ...current,
        classes: current.classes.map((classroom) => {
          if (classroom.id !== classId) return classroom;
          return {
            ...classroom,
            activities: classroom.activities.map((activity) => {
              if (activity.id !== activityId) return activity;
              const count = Math.max(1, Number(config.questionCount) || 1);
              const key = Array.from(
                { length: count },
                (_, idx) => config?.officialKey?.[idx] || "A",
              );
              return {
                ...activity,
                questionCount: count,
                weight: Number(config.weight || 1) > 0 ? Number(config.weight) : 1,
                officialKey: key,
              };
            }),
          };
        }),
      };
    });
  };

  const handleScannerCapture = (capturePayload) => {
    const idsFromQr = capturePayload?.qrPayload || {};

    let classForResult = selectedClass;
    if (idsFromQr.classId) {
      const byQrClass = classes.find((item) => item.id === idsFromQr.classId);
      if (byQrClass) classForResult = byQrClass;
    }

    let activityForResult = selectedActivity;
    if (classForResult && idsFromQr.activityId) {
      const byQrActivity = classForResult.activities.find(
        (item) => item.id === idsFromQr.activityId,
      );
      if (byQrActivity) activityForResult = byQrActivity;
    }

    if (!classForResult || !activityForResult) {
      return;
    }

    let student = classForResult.students[0] || null;
    if (idsFromQr.studentId) {
      const byQrStudent = classForResult.students.find((item) => item.id === idsFromQr.studentId);
      if (byQrStudent) student = byQrStudent;
    }

    const official = activityForResult.officialKey.slice(0, activityForResult.questionCount);
    const studentAnswers = capturePayload.answers.slice(0, activityForResult.questionCount);

    const correctCount = studentAnswers.reduce(
      (acc, answer, idx) => (answer === official[idx] ? acc + 1 : acc),
      0,
    );

    const rawScore =
      activityForResult.questionCount > 0
        ? (correctCount / activityForResult.questionCount) * 10
        : 0;

    const weightedScore = rawScore * Number(activityForResult.weight || 1);

    const result = {
      id: Date.now(),
      classId: classForResult.id,
      className: classForResult.name,
      activityId: activityForResult.id,
      activityName: activityForResult.name,
      studentId: student?.id || null,
      studentName: student?.name || "Aluno nao identificado",
      studentAnswers,
      correctCount,
      totalQuestions: activityForResult.questionCount,
      score: Number(rawScore.toFixed(1)),
      weightedScore: Number(weightedScore.toFixed(2)),
      createdAt: new Date().toISOString(),
      qrData: capturePayload?.qrData || null,
    };

    setAppData((prev) => {
      const current = normalizeAppData(prev || normalizedData);
      return {
        ...current,
        selectedClassId: classForResult.id,
        selectedActivityId: activityForResult.id,
        classes: current.classes.map((classroom) => {
          if (classroom.id !== classForResult.id) return classroom;
          return {
            ...classroom,
            activities: classroom.activities.map((activity) => {
              if (activity.id !== activityForResult.id) return activity;
              return {
                ...activity,
                results: [result, ...(activity.results || [])],
              };
            }),
          };
        }),
      };
    });

    setLastResult(result);
    setActiveView("result");
  };

  const handleExportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      [STORAGE_KEYS.v2Data]: normalizedData,
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

  const handleClearActivityResults = () => {
    if (!selectedClass || !selectedActivity) return;
    setAppData((prev) => {
      const current = normalizeAppData(prev || normalizedData);
      return {
        ...current,
        classes: current.classes.map((classroom) => {
          if (classroom.id !== selectedClass.id) return classroom;
          return {
            ...classroom,
            activities: classroom.activities.map((activity) =>
              activity.id === selectedActivity.id ? { ...activity, results: [] } : activity,
            ),
          };
        }),
      };
    });
  };

  const openTemplateForStudent = (studentId) => {
    setSelectedTemplateStudentId(studentId);
    setActiveView("template-print");
  };

  const renderView = () => {
    if (activeView === "config") {
      return (
        <Suspense
          fallback={
            <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Carregando configuracao...</p>
              </div>
            </section>
          }
        >
          <LazyConfigGabaritoView
            classes={classes}
            selectedClassId={normalizedData.selectedClassId}
            selectedActivityId={normalizedData.selectedActivityId}
            onSelectClass={(classId) => setSelection(classId)}
            onSelectActivity={(activityId) =>
              setSelection(normalizedData.selectedClassId, activityId)
            }
            onCreateClass={createClass}
            onCreateActivity={createActivity}
            onRenameClass={renameClass}
            onDeleteClass={deleteClass}
            onRenameActivity={renameActivity}
            onDeleteActivity={deleteActivity}
            onSaveClassStudents={saveClassStudents}
            onSaveActivityConfig={saveActivityConfig}
          />
        </Suspense>
      );
    }

    if (activeView === "template") {
      return (
        <TemplatesHubView
          schoolInfo={normalizedData.schoolInfo}
          classes={classes}
          selectedClassId={normalizedData.selectedClassId}
          selectedActivityId={normalizedData.selectedActivityId}
          onSchoolNameChange={updateSchoolName}
          onSelectClass={(classId) => setSelection(classId)}
          onSelectActivity={(activityId) =>
            setSelection(normalizedData.selectedClassId, activityId)
          }
          onOpenTemplate={openTemplateForStudent}
        />
      );
    }

    if (activeView === "template-print") {
      if (!selectedClass || !selectedActivity || !selectedTemplateStudent) {
        return (
          <TemplatesHubView
            schoolInfo={normalizedData.schoolInfo}
            classes={classes}
            selectedClassId={normalizedData.selectedClassId}
            selectedActivityId={normalizedData.selectedActivityId}
            onSchoolNameChange={updateSchoolName}
            onSelectClass={(classId) => setSelection(classId)}
            onSelectActivity={(activityId) =>
              setSelection(normalizedData.selectedClassId, activityId)
            }
            onOpenTemplate={openTemplateForStudent}
          />
        );
      }

      return (
        <TemplateView
          schoolName={normalizedData.schoolInfo?.name || ""}
          classroom={selectedClass}
          activity={selectedActivity}
          student={selectedTemplateStudent}
          onBack={() => setActiveView("template")}
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
            classes={classes}
            selectedClassId={normalizedData.selectedClassId}
            selectedActivityId={normalizedData.selectedActivityId}
            onSelectClass={(classId) => setSelection(classId)}
            onSelectActivity={(activityId) =>
              setSelection(normalizedData.selectedClassId, activityId)
            }
            onExport={handleExportBackup}
            onClearActivity={handleClearActivityResults}
          />
        </Suspense>
      );
    }

    if (activeView === "result") {
      const result = lastResult;
      if (!result) {
        return (
          <ScannerView
            classes={classes}
            selectedClassId={normalizedData.selectedClassId}
            selectedActivityId={normalizedData.selectedActivityId}
            onSelectClass={(classId) => setSelection(classId)}
            onSelectActivity={(activityId) =>
              setSelection(normalizedData.selectedClassId, activityId)
            }
            onCapture={handleScannerCapture}
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
      <ScannerView
        classes={classes}
        selectedClassId={normalizedData.selectedClassId}
        selectedActivityId={normalizedData.selectedActivityId}
        onSelectClass={(classId) => setSelection(classId)}
        onSelectActivity={(activityId) => setSelection(normalizedData.selectedClassId, activityId)}
        onCapture={handleScannerCapture}
      />
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
