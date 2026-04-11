import React, { useEffect, useMemo, useRef, useState } from "react";
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

const OPTIONS = ["A", "B", "C", "D", "E"];

const STORAGE_KEYS = {
  schoolInfo: "dracker_school_info",
  studentList: "dracker_student_list",
  officialKey: "dracker_official_key",
  studentsResults: "dracker_students_results",
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

  const setStoredValue = (nextValue) => {
    setValue((prev) => {
      const computed =
        typeof nextValue === "function" ? nextValue(prev) : nextValue;
      window.localStorage.setItem(key, JSON.stringify(computed));
      return computed;
    });
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

function randomAnswers(total) {
  return Array.from(
    { length: total },
    () => OPTIONS[Math.floor(Math.random() * OPTIONS.length)],
  );
}

const A4_WARP_WIDTH = 840;
const A4_WARP_HEIGHT = 1188;

function ensureOpenCvLoaded() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("window indisponível"));
  }

  if (window.cv && window.cv.Mat) {
    return Promise.resolve(window.cv);
  }

  if (window.__drackerOpenCvPromise) {
    return window.__drackerOpenCvPromise;
  }

  window.__drackerOpenCvPromise = new Promise((resolve, reject) => {
    let script = document.getElementById("opencv-js");

    const resolveWhenReady = () => {
      if (window.cv && window.cv.Mat) {
        resolve(window.cv);
        return;
      }

      if (!window.cv) {
        reject(new Error("OpenCV não inicializado"));
        return;
      }

      window.cv.onRuntimeInitialized = () => {
        resolve(window.cv);
      };
    };

    if (!script) {
      script = document.createElement("script");
      script.id = "opencv-js";
      script.src = "https://docs.opencv.org/4.x/opencv.js";
      script.async = true;
      script.onerror = () => reject(new Error("Falha ao carregar OpenCV.js"));
      script.onload = resolveWhenReady;
      document.body.appendChild(script);
      return;
    }

    resolveWhenReady();
  });

  return window.__drackerOpenCvPromise;
}

function orderAnchorPoints(points) {
  if (!Array.isArray(points) || points.length !== 4) return null;

  const bySum = [...points].sort((a, b) => a.x + a.y - (b.x + b.y));
  const byDiff = [...points].sort((a, b) => a.y - a.x - (b.y - b.x));

  const tl = bySum[0];
  const br = bySum[3];
  const tr = byDiff[0];
  const bl = byDiff[3];

  return [tl, tr, br, bl];
}

function pickCornerAnchors(candidates, width, height) {
  if (candidates.length < 4) return null;

  const corners = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height },
  ];

  const chosen = [];
  const used = new Set();

  corners.forEach((corner) => {
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    candidates.forEach((candidate, index) => {
      if (used.has(index)) return;
      const dx = candidate.x - corner.x;
      const dy = candidate.y - corner.y;
      const distance = Math.hypot(dx, dy);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    if (bestIndex >= 0) {
      used.add(bestIndex);
      chosen.push(candidates[bestIndex]);
    }
  });

  if (chosen.length !== 4) return null;
  return orderAnchorPoints(chosen);
}

function detectAnchors(cv, rgbaMat) {
  const gray = new cv.Mat();
  const blur = new cv.Mat();
  const thresholded = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    cv.cvtColor(rgbaMat, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    cv.threshold(
      blur,
      thresholded,
      0,
      255,
      cv.THRESH_BINARY_INV + cv.THRESH_OTSU,
    );

    cv.findContours(
      thresholded,
      contours,
      hierarchy,
      cv.RETR_LIST,
      cv.CHAIN_APPROX_SIMPLE,
    );

    const areaFrame = rgbaMat.cols * rgbaMat.rows;
    const minArea = areaFrame * 0.00008;
    const maxArea = areaFrame * 0.02;

    const candidates = [];
    for (let i = 0; i < contours.size(); i += 1) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      const perimeter = cv.arcLength(contour, true);

      if (perimeter <= 0 || area < minArea || area > maxArea) {
        contour.delete();
        continue;
      }

      const circularity = (4 * Math.PI * area) / (perimeter * perimeter);
      if (circularity < 0.68) {
        contour.delete();
        continue;
      }

      const moments = cv.moments(contour);
      if (moments.m00 !== 0) {
        candidates.push({
          x: moments.m10 / moments.m00,
          y: moments.m01 / moments.m00,
          area,
        });
      }

      contour.delete();
    }

    const anchors = pickCornerAnchors(candidates, rgbaMat.cols, rgbaMat.rows);
    return anchors;
  } finally {
    gray.delete();
    blur.delete();
    thresholded.delete();
    contours.delete();
    hierarchy.delete();
  }
}

function warpPaperToA4(cv, srcMat, anchors) {
  if (!anchors || anchors.length !== 4) return null;

  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    anchors[0].x,
    anchors[0].y,
    anchors[1].x,
    anchors[1].y,
    anchors[2].x,
    anchors[2].y,
    anchors[3].x,
    anchors[3].y,
  ]);

  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    A4_WARP_WIDTH - 1,
    0,
    A4_WARP_WIDTH - 1,
    A4_WARP_HEIGHT - 1,
    0,
    A4_WARP_HEIGHT - 1,
  ]);

  const matrix = cv.getPerspectiveTransform(srcTri, dstTri);
  const warped = new cv.Mat();

  cv.warpPerspective(
    srcMat,
    warped,
    matrix,
    new cv.Size(A4_WARP_WIDTH, A4_WARP_HEIGHT),
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    new cv.Scalar(),
  );

  srcTri.delete();
  dstTri.delete();
  matrix.delete();

  return warped;
}

function buildBubbleCoordinatesPercent(questionCount) {
  const top = 0.36;
  const bottom = 0.88;
  const leftColumnStart = 0.29;
  const rightColumnStart = 0.76;
  const optionSpacing = 0.032;
  const rows = Math.ceil(questionCount / 2);

  return Array.from({ length: questionCount }, (_, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const y = rows <= 1 ? top : top + (row * (bottom - top)) / (rows - 1);
    const xStart = col === 0 ? leftColumnStart : rightColumnStart;

    return OPTIONS.map((option, optIndex) => ({
      option,
      xPercent: xStart + optIndex * optionSpacing,
      yPercent: y,
    }));
  });
}

function readAnswersFromWarped(cv, warpedMat, questionCount) {
  const gray = new cv.Mat();
  const binary = new cv.Mat();

  try {
    cv.cvtColor(warpedMat, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);

    const layout = buildBubbleCoordinatesPercent(questionCount);
    const radius = Math.max(6, Math.round(warpedMat.cols * 0.009));

    const answers = layout.map((questionBubbles) => {
      let best = { option: "A", density: -1 };

      questionBubbles.forEach((bubble) => {
        const cx = Math.round(bubble.xPercent * warpedMat.cols);
        const cy = Math.round(bubble.yPercent * warpedMat.rows);

        let dark = 0;
        let total = 0;

        const yStart = Math.max(0, cy - radius);
        const yEnd = Math.min(binary.rows - 1, cy + radius);
        const xStart = Math.max(0, cx - radius);
        const xEnd = Math.min(binary.cols - 1, cx + radius);

        for (let y = yStart; y <= yEnd; y += 1) {
          for (let x = xStart; x <= xEnd; x += 1) {
            const dx = x - cx;
            const dy = y - cy;
            if (dx * dx + dy * dy > radius * radius) continue;
            total += 1;
            const pixel = binary.ucharPtr(y, x)[0];
            if (pixel > 0) dark += 1;
          }
        }

        const density = total > 0 ? dark / total : 0;
        if (density > best.density) {
          best = { option: bubble.option, density };
        }
      });

      return best.density >= 0.12 ? best.option : "A";
    });

    return answers;
  } finally {
    gray.delete();
    binary.delete();
  }
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

function ConfigGabaritoView({ examConfig, onSave }) {
  const [questionCount, setQuestionCount] = useState(examConfig.questionCount || 20);
  const [answers, setAnswers] = useState(examConfig.answers || Array.from({ length: 20 }, () => "A"));
  const [status, setStatus] = useState("");

  useEffect(() => {
    setQuestionCount(examConfig.questionCount || 20);
    setAnswers(examConfig.answers || Array.from({ length: 20 }, () => "A"));
  }, [examConfig]);

  const updateCount = (nextValue) => {
    const nextCount = Math.max(1, Math.min(60, Number(nextValue) || 1));
    setQuestionCount(nextCount);
    setAnswers((prev) => {
      if (prev.length === nextCount) return prev;
      if (prev.length > nextCount) return prev.slice(0, nextCount);
      return [...prev, ...Array.from({ length: nextCount - prev.length }, () => "A")];
    });
  };

  const saveOfficial = () => {
    const payload = {
      questionCount,
      answers: answers.slice(0, questionCount),
    };
    onSave(payload);
    setStatus("Gabarito oficial salvo com sucesso.");
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">
            Configuração do Gabarito Oficial
          </h2>
        </div>

        <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Número de questões
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={questionCount}
              onChange={(event) => updateCount(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-600 transition focus:ring"
            />
          </div>

          <div className="flex gap-2">
            {[5, 10, 20].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => updateCount(preset)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: questionCount }, (_, index) => index + 1).map(
            (qNumber, index) => (
              <div
                key={qNumber}
                className="rounded-xl border border-slate-200 bg-white p-3"
              >
                <p className="mb-2 text-sm font-medium text-slate-700">Q{qNumber}</p>
                <div className="grid grid-cols-5 gap-2">
                  {OPTIONS.map((option) => {
                    const active = answers[index] === option;
                    return (
                      <button
                        key={`${qNumber}-${option}`}
                        type="button"
                        onClick={() => {
                          setAnswers((prev) => {
                            const next = [...prev];
                            next[index] = option;
                            return next;
                          });
                        }}
                        className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                          active
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ),
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">{status}</p>
          <button
            type="button"
            onClick={saveOfficial}
            className="no-print rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Salvar Gabarito Oficial
          </button>
        </div>
      </div>
    </section>
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

function ScannerView({ questionCount, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const processingCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [cvReady, setCvReady] = useState(false);
  const [cvLoadError, setCvLoadError] = useState("");
  const [anchorFeedback, setAnchorFeedback] = useState({
    ready: false,
    message: "Aguardando câmera...",
    points: [],
  });

  const latestAnchorPointsRef = useRef(null);

  const drawOverlayFeedback = (points) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const guideX = width * 0.11;
    const guideY = height * 0.08;
    const guideW = width * 0.78;
    const guideH = height * 0.82;

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.strokeRect(guideX, guideY, guideW, guideH);

    const rows = Math.ceil(questionCount / 2);
    const top = guideY + guideH * 0.31;
    const bottom = guideY + guideH * 0.93;
    const leftBase = guideX + guideW * 0.22;
    const rightBase = guideX + guideW * 0.72;

    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    for (let q = 0; q < questionCount; q += 1) {
      const col = q % 2;
      const row = Math.floor(q / 2);
      const y = rows <= 1 ? top : top + (row * (bottom - top)) / (rows - 1);
      const xBase = col === 0 ? leftBase : rightBase;

      for (let o = 0; o < OPTIONS.length; o += 1) {
        const x = xBase + o * (guideW * 0.031);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (Array.isArray(points) && points.length === 4) {
      const sx = width / Math.max(1, video.videoWidth || width);
      const sy = height / Math.max(1, video.videoHeight || height);

      ctx.strokeStyle = "rgba(34,197,94,0.95)";
      ctx.fillStyle = "rgba(34,197,94,0.95)";
      ctx.lineWidth = 2;

      points.forEach((point, idx) => {
        const px = point.x * sx;
        const py = point.y * sy;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "12px sans-serif";
        ctx.fillText(String(idx + 1), px + 8, py - 8);
      });

      ctx.beginPath();
      ctx.moveTo(points[0].x * sx, points[0].y * sy);
      ctx.lineTo(points[1].x * sx, points[1].y * sy);
      ctx.lineTo(points[2].x * sx, points[2].y * sy);
      ctx.lineTo(points[3].x * sx, points[3].y * sy);
      ctx.closePath();
      ctx.stroke();
    }
  };

  const analyzeCurrentFrame = () => {
    const cv = window.cv;
    const video = videoRef.current;
    const canvas = processingCanvasRef.current;
    if (!cv || !video || !canvas || !video.videoWidth || !video.videoHeight) {
      return { ready: false, message: "Vídeo ainda não pronto", points: null };
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { ready: false, message: "Falha no contexto do canvas", points: null };
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const src = cv.imread(canvas);

    try {
      const anchors = detectAnchors(cv, src);
      if (!anchors) {
        drawOverlayFeedback(null);
        latestAnchorPointsRef.current = null;
        return {
          ready: false,
          message: "Aponte para o gabarito com 4 âncoras visíveis",
          points: null,
        };
      }

      latestAnchorPointsRef.current = anchors;
      drawOverlayFeedback(anchors);

      return {
        ready: true,
        message: "Âncoras detectadas. Pode capturar.",
        points: anchors,
      };
    } finally {
      src.delete();
    }
  };

  const handleCaptureWithCv = () => {
    const cv = window.cv;
    const video = videoRef.current;
    const canvas = processingCanvasRef.current;
    if (!cv || !video || !canvas) {
      onCapture(null);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onCapture(null);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const src = cv.imread(canvas);

    try {
      const anchors = latestAnchorPointsRef.current || detectAnchors(cv, src);
      if (!anchors) {
        setAnchorFeedback({
          ready: false,
          message: "Sem âncoras válidas. Ajuste enquadramento.",
          points: [],
        });
        return;
      }

      const warped = warpPaperToA4(cv, src, anchors);
      if (!warped) {
        onCapture(null);
        return;
      }

      try {
        const answers = readAnswersFromWarped(cv, warped, questionCount);
        onCapture(answers);
      } finally {
        warped.delete();
      }
    } finally {
      src.delete();
    }
  };

  useEffect(() => {
    let active = true;
    ensureOpenCvLoaded()
      .then(() => {
        if (!active) return;
        setCvReady(true);
        setCvLoadError("");
      })
      .catch(() => {
        if (!active) return;
        setCvReady(false);
        setCvLoadError("OpenCV.js ainda está a carregar ou indisponível.");
      });

    return () => {
      active = false;
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
    if (!isCameraActive || !cameraReady || !cvReady || cameraBlocked) return undefined;

    const timer = window.setInterval(() => {
      const result = analyzeCurrentFrame();
      setAnchorFeedback({
        ready: result.ready,
        message: result.message,
        points: result.points || [],
      });
    }, 220);

    return () => window.clearInterval(timer);
  }, [isCameraActive, cameraReady, cvReady, cameraBlocked]);

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
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            playsInline
            muted
          />
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
              O navegador bloqueou a câmera traseira. A simulação continua com
              o overlay de detecção ativo.
            </p>
          </div>
        </div>
      )}

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

      {cvLoadError && (
        <div className="absolute left-1/2 top-12 z-20 -translate-x-1/2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 shadow-sm">
          {cvLoadError} Use modo fallback para continuar.
        </div>
      )}

      <div className="no-print absolute inset-x-0 bottom-0 flex justify-center pb-7 pt-6">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleCaptureWithCv}
            disabled={!cvReady || !anchorFeedback.ready}
            className="group relative inline-flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-xl ring-8 ring-white/20 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Capturar gabarito"
          >
            <span className="absolute h-20 w-20 rounded-full border-4 border-blue-600" />
            <span className="h-5 w-5 rounded-full bg-blue-600 transition group-active:scale-125" />
          </button>

          {!cvReady && (
            <button
              type="button"
              onClick={() => onCapture(null)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              Continuar sem OpenCV (fallback)
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function DashboardView({ examConfig, results, onExport, onClear }) {
  const metrics = useMemo(() => {
    const totalRead = results.length;
    const average =
      totalRead > 0
        ? results.reduce((sum, item) => sum + Number(item.score || 0), 0) / totalRead
        : 0;
    return { totalRead, average };
  }, [results]);

  const questionBars = useMemo(() => {
    const totalQuestions = examConfig.questionCount;
    return Array.from({ length: totalQuestions }, (_, idx) => {
      const hits = results.filter(
        (item) => item.studentAnswers?.[idx] === examConfig.answers?.[idx],
      ).length;
      const accuracy =
        results.length > 0 ? Math.round((hits / results.length) * 100) : 0;
      return { label: `Q${idx + 1}`, accuracy };
    });
  }, [examConfig, results]);

  const worstQuestion = useMemo(() => {
    if (!questionBars.length) return null;
    return questionBars.reduce((lowest, current) =>
      current.accuracy < lowest.accuracy ? current : lowest,
    );
  }, [questionBars]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Média da Turma
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {metrics.average.toFixed(1)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total de Provas Lidas
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.totalRead}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onExport}
          className="no-print inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Baixar Backup (.json)
        </button>
        <button
          type="button"
          onClick={onClear}
          className="no-print inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-rose-700"
        >
          <Trash2 className="h-4 w-4" />
          Limpar Turma
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Taxa de acerto por questão
        </h3>

        <div className="space-y-2">
          {questionBars.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-[44px_1fr_44px] items-center gap-3"
            >
              <span className="text-xs font-medium text-slate-500">{item.label}</span>
              <div className="h-3 rounded-full bg-slate-100">
                <div
                  className="h-3 rounded-full bg-blue-600"
                  style={{ width: `${item.accuracy}%` }}
                />
              </div>
              <span className="text-right text-xs font-semibold text-slate-700">
                {item.accuracy}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {worstQuestion && (
        <div className="mt-4 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Insight Pedagógico (IA)
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            A {worstQuestion.label} apresentou o pior desempenho da turma (
            {worstQuestion.accuracy}% de acerto). Sugestão: revisar o conteúdo
            com exemplos guiados e prática direcionada.
          </p>
        </div>
      )}
    </section>
  );
}

function TemplateView({ examConfig, schoolName, studentName, onBack }) {
  const questions = Array.from({ length: examConfig.questionCount }, (_, i) => i + 1);

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
        <div className="print-area mx-auto min-h-[297mm] w-[210mm] bg-white p-6 text-slate-900 shadow-md">
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

          <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-xs">
            {questions.map((q) => (
              <div key={q} className="flex items-center gap-2">
                <span className="w-8 font-semibold text-slate-600">Q{q}</span>
                <div className="flex gap-2">
                  {OPTIONS.map((op) => (
                    <div key={`${q}-${op}`} className="grid place-items-center gap-1">
                      <div className="h-4 w-4 rounded-full border border-slate-400 bg-white" />
                      <span className="text-[10px] text-slate-500">{op}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

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
    const studentAnswers =
      Array.isArray(capturedAnswers) && capturedAnswers.length === totalQuestions
        ? capturedAnswers
        : randomAnswers(totalQuestions);
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
      return <ConfigGabaritoView examConfig={examConfig} onSave={setExamConfig} />;
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
        <DashboardView
          examConfig={examConfig}
          results={studentsResults}
          onExport={handleExportBackup}
          onClear={handleClearClass}
        />
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
