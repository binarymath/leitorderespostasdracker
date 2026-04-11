/* eslint-disable no-restricted-globals */

const OPTIONS = ["A", "B", "C", "D", "E"];
const A4_WARP_WIDTH = 840;
const A4_WARP_HEIGHT = 1188;
const BUBBLE_GEOMETRY = {
  guideX: 0.11,
  guideY: 0.08,
  guideW: 0.78,
  guideH: 0.82,
  top: 0.31,
  bottom: 0.93,
  leftStart: 0.22,
  rightStart: 0.72,
  optionSpacing: 0.038,
  samplingRadiusScale: 0.012,
};

let cvReady = false;
let cv = null;

function loadOpenCvInWorker() {
  return new Promise((resolve, reject) => {
    if (cvReady && self.cv && self.cv.Mat) {
      cv = self.cv;
      resolve();
      return;
    }

    const done = () => {
      if (self.cv && self.cv.Mat) {
        cv = self.cv;
        cvReady = true;
        resolve();
        return;
      }
      reject(new Error("OpenCV não iniciou no worker"));
    };

    try {
      if (self.cv) {
        if (self.cv.Mat) {
          done();
          return;
        }
        self.cv.onRuntimeInitialized = done;
        return;
      }

      self.importScripts("https://docs.opencv.org/4.x/opencv.js");
      if (self.cv && self.cv.Mat) {
        done();
        return;
      }
      self.cv.onRuntimeInitialized = done;
    } catch (error) {
      reject(error);
    }
  });
}

function orderAnchorPoints(points) {
  const bySum = [...points].sort((a, b) => a.x + a.y - (b.x + b.y));
  const byDiff = [...points].sort((a, b) => a.y - a.x - (b.y - b.x));
  return [bySum[0], byDiff[0], bySum[3], byDiff[3]];
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

    candidates.forEach((candidate, idx) => {
      if (used.has(idx)) return;
      const distance = Math.hypot(candidate.x - corner.x, candidate.y - corner.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = idx;
      }
    });

    if (bestIndex >= 0) {
      used.add(bestIndex);
      chosen.push(candidates[bestIndex]);
    }
  });

  return chosen.length === 4 ? orderAnchorPoints(chosen) : null;
}

function detectAnchors(rgbaMat) {
  const gray = new cv.Mat();
  const blur = new cv.Mat();
  const thresholded = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    cv.cvtColor(rgbaMat, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    cv.threshold(blur, thresholded, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);

    cv.findContours(
      thresholded,
      contours,
      hierarchy,
      cv.RETR_LIST,
      cv.CHAIN_APPROX_SIMPLE,
    );

    const frameArea = rgbaMat.cols * rgbaMat.rows;
    const minArea = frameArea * 0.00008;
    const maxArea = frameArea * 0.02;
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

      const m = cv.moments(contour);
      if (m.m00 !== 0) {
        candidates.push({ x: m.m10 / m.m00, y: m.m01 / m.m00, area });
      }

      contour.delete();
    }

    return pickCornerAnchors(candidates, rgbaMat.cols, rgbaMat.rows);
  } finally {
    gray.delete();
    blur.delete();
    thresholded.delete();
    contours.delete();
    hierarchy.delete();
  }
}

function warpPaperToA4(srcMat, anchors) {
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
  const top = BUBBLE_GEOMETRY.guideY + BUBBLE_GEOMETRY.guideH * BUBBLE_GEOMETRY.top;
  const bottom =
    BUBBLE_GEOMETRY.guideY + BUBBLE_GEOMETRY.guideH * BUBBLE_GEOMETRY.bottom;
  const leftColumnStart =
    BUBBLE_GEOMETRY.guideX + BUBBLE_GEOMETRY.guideW * BUBBLE_GEOMETRY.leftStart;
  const rightColumnStart =
    BUBBLE_GEOMETRY.guideX + BUBBLE_GEOMETRY.guideW * BUBBLE_GEOMETRY.rightStart;
  const optionSpacing = BUBBLE_GEOMETRY.guideW * BUBBLE_GEOMETRY.optionSpacing;
  const rows = Math.ceil(questionCount / 2);

  return Array.from({ length: questionCount }, (_, index) => {
    const col = index < rows ? 0 : 1;
    const row = col === 0 ? index : index - rows;
    const y = rows <= 1 ? top : top + (row * (bottom - top)) / (rows - 1);
    const xStart = col === 0 ? leftColumnStart : rightColumnStart;

    return OPTIONS.map((option, optIndex) => ({
      option,
      xPercent: xStart + optIndex * optionSpacing,
      yPercent: y,
    }));
  });
}

function readAnswersFromWarped(warpedMat, questionCount) {
  const gray = new cv.Mat();
  const binary = new cv.Mat();

  try {
    cv.cvtColor(warpedMat, gray, cv.COLOR_RGBA2GRAY);
    cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);

    const layout = buildBubbleCoordinatesPercent(questionCount);
    const radius = Math.max(
      8,
      Math.round(warpedMat.cols * BUBBLE_GEOMETRY.samplingRadiusScale),
    );

    return layout.map((questionBubbles) => {
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
            if (binary.ucharPtr(y, x)[0] > 0) dark += 1;
          }
        }

        const density = total > 0 ? dark / total : 0;
        if (density > best.density) {
          best = { option: bubble.option, density };
        }
      });

      return best.density >= 0.12 ? best.option : "A";
    });
  } finally {
    gray.delete();
    binary.delete();
  }
}

function processFrame(imageData, questionCount) {
  const src = cv.matFromImageData(imageData);

  try {
    const anchors = detectAnchors(src);
    if (!anchors) {
      return {
        ready: false,
        message: "Aponte para o gabarito com 4 âncoras visíveis",
        anchors: [],
        answers: null,
      };
    }

    const warped = warpPaperToA4(src, anchors);
    try {
      const answers = readAnswersFromWarped(warped, questionCount);
      return {
        ready: true,
        message: "Âncoras detectadas. Pode capturar.",
        anchors,
        answers,
      };
    } finally {
      warped.delete();
    }
  } finally {
    src.delete();
  }
}

self.onmessage = async (event) => {
  const { type, payload } = event.data || {};

  if (type === "init-opencv") {
    try {
      await loadOpenCvInWorker();
      self.postMessage({ type: "opencv-ready" });
    } catch (error) {
      self.postMessage({
        type: "opencv-error",
        message: error?.message || "Falha ao carregar OpenCV no worker",
      });
    }
    return;
  }

  if (type === "process-frame") {
    if (!cvReady || !cv) {
      self.postMessage({
        type: "process-error",
        message: "OpenCV indisponível no worker",
      });
      return;
    }

    try {
      const result = processFrame(payload.imageData, payload.questionCount);
      self.postMessage({ type: "processed", payload: result });
    } catch (error) {
      self.postMessage({
        type: "process-error",
        message: error?.message || "Erro no processamento do frame",
      });
    }
  }
};
