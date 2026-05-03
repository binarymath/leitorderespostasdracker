import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  PieChart,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";

const OPTIONS = ["A", "B", "C", "D", "E"];

function columnOrderIndices(total) {
  const half = Math.ceil(total / 2);
  const left = [];
  const right = [];
  for (let i = 0; i < half; i++) left.push(i);
  for (let i = half; i < total; i++) right.push(i);
  return { left, right };
}

// ─── Score Distribution Histogram ───
function ScoreDistribution({ results }) {
  const buckets = useMemo(() => {
    const b = Array.from({ length: 11 }, (_, i) => ({ label: `${i}`, count: 0 }));
    results.forEach((r) => {
      const idx = Math.min(10, Math.max(0, Math.floor(Number(r.score || 0))));
      b[idx].count += 1;
    });
    return b;
  }, [results]);

  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <PieChart className="h-4 w-4 text-violet-600" />
        <h3 className="text-sm font-semibold text-slate-900">Distribuicao de Notas</h3>
      </div>
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {buckets.map((b) => {
          const pct = maxCount > 0 ? (b.count / maxCount) * 100 : 0;
          const isZero = b.count === 0;
          return (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-slate-500">
                {isZero ? "" : b.count}
              </span>
              <div
                className={`w-full rounded-t-md transition-all ${
                  isZero ? "bg-slate-100" : "bg-violet-500"
                }`}
                style={{ height: `${Math.max(isZero ? 4 : 8, pct)}%` }}
              />
              <span className="text-[10px] text-slate-400">{b.label}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[10px] text-slate-400">Nota (0-10)</p>
    </div>
  );
}

// ─── Per-Question Accuracy Chart ───
function QuestionAccuracyChart({ questionBars, chartMode }) {
  if (questionBars.length === 0) {
    return <p className="text-sm text-slate-500">Sem dados para a atividade selecionada.</p>;
  }

  if (chartMode === "table") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Questao</th>
              <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Gabarito</th>
              <th className="px-2 py-1.5 text-right font-semibold text-slate-600">Acerto</th>
              <th className="px-2 py-1.5 text-left font-semibold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {questionBars.map((item) => (
              <tr key={item.label} className="border-b border-slate-100">
                <td className="px-2 py-1.5 font-medium text-slate-700">{item.label}</td>
                <td className="px-2 py-1.5">
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 font-medium">
                    {item.officialAnswer}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-right font-semibold text-slate-700">
                  {item.accuracy}%
                </td>
                <td className="px-2 py-1.5">
                  {item.accuracy >= 70 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Bom
                    </span>
                  ) : item.accuracy >= 40 ? (
                    <span className="text-amber-600">Regular</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <XCircle className="h-3 w-3" /> Critico
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {questionBars.map((item) => (
        <div key={item.label} className="grid grid-cols-[50px_1fr_44px] items-center gap-2">
          <span className="text-xs font-medium text-slate-500">
            {item.label} ({item.officialAnswer})
          </span>
          <div className="h-4 rounded-full bg-slate-100">
            <div
              className={`h-4 rounded-full transition-all ${
                item.accuracy >= 70
                  ? "bg-emerald-500"
                  : item.accuracy >= 40
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${item.accuracy}%` }}
            />
          </div>
          <span className="text-right text-xs font-semibold text-slate-700">
            {item.accuracy}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Individual Student Answer Review Modal ───
function StudentAnswerModal({ result, officialKey, onClose, onSaveEdited }) {
  const total = result.totalQuestions;
  const [editedAnswers, setEditedAnswers] = useState(() => [...(result.studentAnswers || [])]);

  const correctCount = editedAnswers.reduce(
    (acc, ans, idx) => (ans === officialKey[idx] ? acc + 1 : acc),
    0,
  );
  const score = total > 0 ? (correctCount / total) * 10 : 0;
  const hasChanges = editedAnswers.some((a, i) => a !== result.studentAnswers?.[i]);

  const handleOptionClick = (qIdx, option) => {
    setEditedAnswers((prev) => {
      const copy = [...prev];
      copy[qIdx] = option;
      return copy;
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Gabarito de {result.studentName}
            </h3>
            <p className="text-xs text-slate-500">
              {result.activityName} • {new Date(result.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-800">{result.studentName}</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">
              {hasChanges ? "Nota atualizada" : "Nota original"}
            </p>
            <p className="text-xl font-bold text-blue-600">{score.toFixed(1)}</p>
            <p className="text-xs text-slate-500">
              {correctCount}/{total} acertos
            </p>
          </div>
        </div>

        <p className="mb-3 text-xs text-slate-500">
          Clique nas alternativas para corrigir. A nota recalcula em tempo real.
        </p>

        <div className="grid gap-x-4 sm:grid-cols-2">
          {(() => {
            const { left, right } = columnOrderIndices(total);
            const renderQ = (qIdx) => {
              const isCorrect = editedAnswers[qIdx] === officialKey[qIdx];
              return (
                <div
                  key={qIdx}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 mb-1.5 ${
                    isCorrect ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <span className="w-8 shrink-0 text-xs font-semibold text-slate-600">Q{qIdx + 1}</span>
                  <div className="flex gap-1">
                    {OPTIONS.map((op) => {
                      const isSelected = editedAnswers[qIdx] === op;
                      const isOfficial = officialKey[qIdx] === op;
                      let cls = "h-7 w-7 rounded-full border-2 text-[10px] font-semibold flex items-center justify-center cursor-pointer transition ";
                      if (isSelected && isCorrect) cls += "border-emerald-500 bg-emerald-500 text-white";
                      else if (isSelected && !isCorrect) cls += "border-red-500 bg-red-500 text-white";
                      else if (isOfficial) cls += "border-emerald-400 bg-emerald-100 text-emerald-700";
                      else cls += "border-slate-300 bg-white text-slate-500 hover:border-blue-400 hover:bg-blue-50";
                      return (
                        <button key={op} type="button" onClick={() => handleOptionClick(qIdx, op)} className={cls}>{op}</button>
                      );
                    })}
                  </div>
                  {isCorrect ? (
                    <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="ml-auto h-4 w-4 shrink-0 text-red-500" />
                  )}
                </div>
              );
            };
            return (
              <>
                <div>{left.map(renderQ)}</div>
                <div>{right.map(renderQ)}</div>
              </>
            );
          })()}
        </div>

        {hasChanges && (
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditedAnswers([...(result.studentAnswers || [])])}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Repor Original
            </button>
            <button
              type="button"
              onClick={() => onSaveEdited(result.id, editedAnswers, correctCount, score)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
            >
              Gravar Alteracoes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Student Results Table ───
function StudentResultsTable({ results, officialKey, onOpenStudent, onDeleteResult, searchQuery }) {
  const [sortField, setSortField] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);

  const filteredAndSorted = useMemo(() => {
    let list = [...results];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => r.studentName?.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      let va, vb;
      if (sortField === "name") {
        va = a.studentName || "";
        vb = b.studentName || "";
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      if (sortField === "score") {
        va = Number(a.score || 0);
        vb = Number(b.score || 0);
      } else if (sortField === "correct") {
        va = Number(a.correctCount || 0);
        vb = Number(b.correctCount || 0);
      } else if (sortField === "date") {
        va = a.createdAt || "";
        vb = b.createdAt || "";
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortAsc ? va - vb : vb - va;
    });

    return list;
  }, [results, searchQuery, sortField, sortAsc]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortAsc ? (
      <ChevronUp className="ml-0.5 inline h-3 w-3" />
    ) : (
      <ChevronDown className="ml-0.5 inline h-3 w-3" />
    );
  };

  if (results.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">Nenhum resultado registado.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th
              className="cursor-pointer px-3 py-2 text-left font-semibold text-slate-600 hover:text-slate-900"
              onClick={() => toggleSort("name")}
            >
              Aluno <SortIcon field="name" />
            </th>
            <th
              className="cursor-pointer px-3 py-2 text-center font-semibold text-slate-600 hover:text-slate-900"
              onClick={() => toggleSort("correct")}
            >
              Acertos <SortIcon field="correct" />
            </th>
            <th
              className="cursor-pointer px-3 py-2 text-center font-semibold text-slate-600 hover:text-slate-900"
              onClick={() => toggleSort("score")}
            >
              Nota <SortIcon field="score" />
            </th>
            <th
              className="cursor-pointer px-3 py-2 text-center font-semibold text-slate-600 hover:text-slate-900"
              onClick={() => toggleSort("date")}
            >
              Data <SortIcon field="date" />
            </th>
            <th className="px-3 py-2 text-center font-semibold text-slate-600">Acoes</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSorted.map((r) => {
            const pct =
              r.totalQuestions > 0
                ? Math.round((r.correctCount / r.totalQuestions) * 100)
                : 0;
            const hasScoreChanged = r.scoreChanged === true;
            return (
              <tr
                key={r.id}
                className={`border-b border-slate-100 transition ${
                  hasScoreChanged ? "bg-blue-50/50" : "hover:bg-slate-50"
                }`}
              >
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="font-medium text-slate-800">{r.studentName}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 font-semibold ${
                      pct >= 70
                        ? "bg-emerald-100 text-emerald-700"
                        : pct >= 40
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {r.correctCount}/{r.totalQuestions}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {Number(r.score).toFixed(1)}
                    </span>
                    {hasScoreChanged && (
                      <div
                        className="flex items-center gap-0.5 rounded px-1.5 py-0.5 bg-blue-100"
                        title={`Nota atualizada de ${r.previousScore} para ${Number(r.score).toFixed(1)}`}
                      >
                        <RefreshCw className="h-2.5 w-2.5 text-blue-600" />
                        <span className="text-[10px] font-medium text-blue-600">atualizado</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center text-slate-500">
                  {r.createdAt
                    ? new Date(r.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    : "-"}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenStudent(r)}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-blue-700 transition hover:bg-blue-100"
                    >
                      <Eye className="h-3 w-3" /> Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Excluir o resultado de ${r.studentName}?`)) {
                          onDeleteResult(r.id);
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-rose-700 transition hover:bg-rose-100 hover:text-rose-800"
                    >
                      <Trash2 className="h-3 w-3" /> Excluir
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Activity Comparison Mini Chart ───
function ActivityComparisonChart({ activities }) {
  if (activities.length === 0) {
    return <p className="text-sm text-slate-500">Selecione uma turma para comparar atividades.</p>;
  }

  const maxAvg = Math.max(10, ...activities.map((a) => a.average));

  return (
    <div className="space-y-2">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="rounded-lg border border-emerald-200 bg-white p-3"
        >
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-800">{activity.name}</p>
            <p className="text-sm font-semibold text-emerald-700">
              {activity.average.toFixed(1)}
            </p>
          </div>
          <div className="h-2.5 rounded-full bg-emerald-100">
            <div
              className="h-2.5 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(activity.average / maxAvg) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            {activity.total} leitura{activity.total !== 1 ? "s" : ""}
            {activity.highest != null && ` • Maior: ${activity.highest.toFixed(1)}`}
            {activity.lowest != null && ` • Menor: ${activity.lowest.toFixed(1)}`}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───
export default function DashboardView({
  classes,
  selectedClassId,
  selectedActivityId,
  onSelectClass,
  onSelectActivity,
  onExport,
  onRestore,
  onClearActivity,
  onUpdateStudentResult,
  onDeleteStudentResult,
  onRecalculateScores,
}) {
  const [chartMode, setChartMode] = useState("bars");
  const [studentSearch, setStudentSearch] = useState("");
  const [openResult, setOpenResult] = useState(null);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [recalculating, setRecalculating] = useState(false);

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) || null,
    [classes, selectedClassId],
  );

  const selectedActivity = useMemo(
    () =>
      selectedClass?.activities?.find((item) => item.id === selectedActivityId) || null,
    [selectedClass, selectedActivityId],
  );

  useEffect(() => {
    if (selectedActivity) {
      setRangeStart(1);
      setRangeEnd(selectedActivity.questionCount);
    }
  }, [selectedActivity]);

  const scopedResults = useMemo(() => {
    if (!selectedActivity) return [];
    const baseResults = selectedActivity.results || [];
    const key = selectedActivity.officialKey || [];
    
    const s = Math.max(1, parseInt(rangeStart) || 1);
    const e = Math.min(selectedActivity.questionCount, Math.max(s, parseInt(rangeEnd) || selectedActivity.questionCount));
    
    const startIdx = s - 1;
    const endIdx = e;
    const rangeTotal = endIdx - startIdx;

    if (rangeTotal === selectedActivity.questionCount) {
      return baseResults; // use original if full range
    }

    return baseResults.map((r) => {
      let correct = 0;
      const studentAnswers = r.studentAnswers || [];
      if (rangeTotal > 0) {
        for (let i = startIdx; i < endIdx; i++) {
          if (studentAnswers[i] === key[i]) correct++;
        }
      }
      const score = rangeTotal > 0 ? (correct / rangeTotal) * 10 : 0;
      return {
        ...r,
        correctCount: correct,
        score: score,
        totalQuestions: rangeTotal,
      };
    });
  }, [selectedActivity, rangeStart, rangeEnd]);

  const officialKey = useMemo(
    () =>
      selectedActivity
        ? selectedActivity.officialKey.slice(0, selectedActivity.questionCount)
        : [],
    [selectedActivity],
  );

  const metrics = useMemo(() => {
    const totalRead = scopedResults.length;
    const scores = scopedResults.map((r) => Number(r.score || 0));
    const sum = scores.reduce((a, b) => a + b, 0);
    const average = totalRead > 0 ? sum / totalRead : 0;
    const highest = totalRead > 0 ? Math.max(...scores) : 0;
    const lowest = totalRead > 0 ? Math.min(...scores) : 0;
    const passed = scores.filter((s) => s >= 6).length;
    const passRate = totalRead > 0 ? Math.round((passed / totalRead) * 100) : 0;
    return { totalRead, average, highest, lowest, passRate };
  }, [scopedResults]);

  const questionBars = useMemo(() => {
    if (!selectedActivity) return [];
    
    const s = Math.max(1, parseInt(rangeStart) || 1);
    const e = Math.min(selectedActivity.questionCount, Math.max(s, parseInt(rangeEnd) || selectedActivity.questionCount));
    
    const bars = [];
    const baseResults = selectedActivity.results || [];
    
    for (let idx = s - 1; idx < e; idx++) {
      const hits = baseResults.filter(
        (item) => item.studentAnswers?.[idx] === selectedActivity.officialKey?.[idx],
      ).length;
      const accuracy =
        baseResults.length > 0 ? Math.round((hits / baseResults.length) * 100) : 0;
      bars.push({
        label: `Q${idx + 1}`,
        accuracy,
        officialAnswer: selectedActivity.officialKey?.[idx] || "-",
      });
    }
    return bars;
  }, [selectedActivity, rangeStart, rangeEnd]);

  const worstQuestions = useMemo(() => {
    if (!questionBars.length) return [];
    return [...questionBars].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
  }, [questionBars]);

  const activityComparison = useMemo(() => {
    if (!selectedClass) return [];
    return selectedClass.activities.map((activity) => {
      const results = activity.results || [];
      const total = results.length;
      const scores = results.map((r) => Number(r.score || 0));
      const avg = total > 0 ? scores.reduce((a, b) => a + b, 0) / total : 0;
      return {
        id: activity.id,
        name: activity.name,
        average: Number(avg.toFixed(2)),
        total,
        highest: total > 0 ? Math.max(...scores) : null,
        lowest: total > 0 ? Math.min(...scores) : null,
      };
    });
  }, [selectedClass]);

  const handleSaveEdited = useCallback(
    (resultId, editedAnswers, newCorrectCount, newScore) => {
      if (onUpdateStudentResult) {
        onUpdateStudentResult(
          selectedClassId,
          selectedActivityId,
          resultId,
          editedAnswers,
          newCorrectCount,
          newScore,
        );
      }
      setOpenResult(null);
    },
    [onUpdateStudentResult, selectedClassId, selectedActivityId],
  );

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6">
      {/* Selectors */}
      <div className="mb-4 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-4">
        <select
          value={selectedClassId || ""}
          onChange={(e) => onSelectClass(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:col-span-1"
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
          onChange={(e) => onSelectActivity(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm sm:col-span-1"
        >
          <option value="">Selecione a atividade</option>
          {(selectedClass?.activities || []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 sm:col-span-2">
          <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Filtrar Questoes:</span>
          <input
            type="number"
            min={1}
            max={selectedActivity?.questionCount || 1}
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
            className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
          />
          <span className="text-xs text-slate-500">ate</span>
          <input
            type="number"
            min={1}
            max={selectedActivity?.questionCount || 1}
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value)}
            className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-4 grid gap-3 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Media</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {metrics.average.toFixed(1)}
          </p>
          <p className="text-[10px] text-slate-400">de 10.0</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Leituras
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{metrics.totalRead}</p>
          <p className="text-[10px] text-slate-400">
            {metrics.passRate}% aprovados (≥6)
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-500">
            Maior Nota
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {metrics.highest.toFixed(1)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-medium uppercase tracking-wide text-red-400">
            Menor Nota
          </p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            {metrics.lowest.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            if (onRecalculateScores && selectedClassId && selectedActivityId) {
              setRecalculating(true);
              onRecalculateScores(selectedClassId, selectedActivityId);
              setTimeout(() => setRecalculating(false), 500);
            }
          }}
          disabled={!selectedClassId || !selectedActivityId || recalculating}
          className="no-print inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${recalculating ? "animate-spin" : ""}`} />
          {recalculating ? "Recalculando..." : "Recalcular Notas"}
        </button>
        <button
          type="button"
          onClick={onExport}
          className="no-print inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Baixar Backup
        </button>
        <label className="no-print inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-100">
          <Upload className="h-4 w-4" />
          Restaurar Backup
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !onRestore) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const data = JSON.parse(ev.target.result);
                  onRestore(data);
                } catch {
                  alert("Arquivo de backup invalido.");
                }
              };
              reader.readAsText(file);
              e.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          onClick={onClearActivity}
          className="no-print inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-rose-700"
        >
          <Trash2 className="h-4 w-4" />
          Limpar Resultados
        </button>
      </div>

      {/* Charts Grid */}
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        {/* Question Accuracy */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-slate-900">Acerto por Questao</h3>
            </div>
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setChartMode("bars")}
                className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition ${
                  chartMode === "bars"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Barras
              </button>
              <button
                type="button"
                onClick={() => setChartMode("table")}
                className={`rounded-md px-2.5 py-1 text-[10px] font-medium transition ${
                  chartMode === "table"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Tabela
              </button>
            </div>
          </div>
          <QuestionAccuracyChart questionBars={questionBars} chartMode={chartMode} />
        </div>

        {/* Score Distribution */}
        <ScoreDistribution results={scopedResults} />
      </div>

      {/* Activity Comparison */}
      <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="mb-3 inline-flex items-center gap-2 text-emerald-700">
          <TrendingUp className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Evolucao entre Atividades</h3>
        </div>
        <ActivityComparisonChart activities={activityComparison} />
      </div>

      {/* Insights */}
      {worstQuestions.length > 0 && worstQuestions[0].accuracy < 100 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-900">Insights</h3>
          </div>
          <div className="space-y-1">
            {worstQuestions
              .filter((q) => q.accuracy < 70)
              .map((q) => (
                <p key={q.label} className="text-xs text-slate-600">
                  <span className="font-semibold text-amber-700">{q.label}</span> (Resp:{" "}
                  {q.officialAnswer}) — apenas{" "}
                  <span className="font-semibold">{q.accuracy}%</span> de acerto. Reforce
                  este conteudo.
                </p>
              ))}
            {worstQuestions.filter((q) => q.accuracy < 70).length === 0 && (
              <p className="text-xs text-slate-600">
                Todas as questoes tem taxa de acerto acima de 70%. Excelente desempenho!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Individual Student Results */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Resultados Individuais
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              {scopedResults.length}
            </span>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Pesquisar aluno..."
              className="w-48 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <StudentResultsTable
          results={scopedResults}
          officialKey={officialKey}
          onOpenStudent={setOpenResult}
          onDeleteResult={(resultId) => onDeleteStudentResult(selectedClassId, selectedActivityId, resultId)}
          searchQuery={studentSearch}
        />
      </div>

      {/* Student Answer Modal */}
      {openResult && (
        <StudentAnswerModal
          result={openResult}
          officialKey={officialKey}
          onClose={() => setOpenResult(null)}
          onSaveEdited={handleSaveEdited}
        />
      )}
    </section>
  );
}
