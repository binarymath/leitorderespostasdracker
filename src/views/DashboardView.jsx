import React, { useMemo } from "react";
import { Download, Trash2, TrendingUp } from "lucide-react";

export default function DashboardView({
  classes,
  selectedClassId,
  selectedActivityId,
  onSelectClass,
  onSelectActivity,
  onExport,
  onClearActivity,
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

  const scopedResults = selectedActivity?.results || [];

  const metrics = useMemo(() => {
    const totalRead = scopedResults.length;
    const average =
      totalRead > 0
        ? scopedResults.reduce((sum, item) => sum + Number(item.score || 0), 0) / totalRead
        : 0;
    return { totalRead, average };
  }, [scopedResults]);

  const questionBars = useMemo(() => {
    if (!selectedActivity) return [];

    const totalQuestions = selectedActivity.questionCount;
    return Array.from({ length: totalQuestions }, (_, idx) => {
      const hits = scopedResults.filter(
        (item) => item.studentAnswers?.[idx] === selectedActivity.officialKey?.[idx],
      ).length;
      const accuracy =
        scopedResults.length > 0 ? Math.round((hits / scopedResults.length) * 100) : 0;
      return { label: `Q${idx + 1}`, accuracy };
    });
  }, [selectedActivity, scopedResults]);

  const worstQuestion = useMemo(() => {
    if (!questionBars.length) return null;
    return questionBars.reduce((lowest, current) =>
      current.accuracy < lowest.accuracy ? current : lowest,
    );
  }, [questionBars]);

  const activityComparison = useMemo(() => {
    if (!selectedClass) return [];

    return selectedClass.activities.map((activity) => {
      const total = activity.results.length;
      const avg =
        total > 0
          ? activity.results.reduce((sum, item) => sum + Number(item.score || 0), 0) / total
          : 0;

      return {
        id: activity.id,
        name: activity.name,
        average: Number(avg.toFixed(2)),
        total,
      };
    });
  }, [selectedClass]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6">
      <div className="mb-3 grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2">
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

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Media da atividade
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.average.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total de leituras
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
          onClick={onClearActivity}
          className="no-print inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-rose-700"
        >
          <Trash2 className="h-4 w-4" />
          Limpar Resultados da Atividade
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Taxa de acerto por questao</h3>

        <div className="space-y-2">
          {questionBars.map((item) => (
            <div key={item.label} className="grid grid-cols-[44px_1fr_44px] items-center gap-3">
              <span className="text-xs font-medium text-slate-500">{item.label}</span>
              <div className="h-3 rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-blue-600" style={{ width: `${item.accuracy}%` }} />
              </div>
              <span className="text-right text-xs font-semibold text-slate-700">{item.accuracy}%</span>
            </div>
          ))}
          {questionBars.length === 0 && (
            <p className="text-sm text-slate-500">Sem dados para a atividade selecionada.</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="mb-2 inline-flex items-center gap-2 text-emerald-700">
          <TrendingUp className="h-4 w-4" />
          <h3 className="text-sm font-semibold">Evolucao entre atividades da turma</h3>
        </div>
        <div className="space-y-2">
          {activityComparison.map((activity) => (
            <div key={activity.id} className="rounded-lg border border-emerald-200 bg-white px-3 py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-800">{activity.name}</p>
                <p className="text-sm font-semibold text-emerald-700">Media {activity.average.toFixed(1)}</p>
              </div>
              <p className="text-xs text-slate-500">Leituras: {activity.total}</p>
            </div>
          ))}
          {activityComparison.length === 0 && (
            <p className="text-sm text-slate-500">Selecione uma turma para comparar atividades.</p>
          )}
        </div>
      </div>

      {worstQuestion && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Insight Evolutivo</h3>
          <p className="mt-1 text-sm text-slate-600">
            A {worstQuestion.label} teve o menor desempenho ({worstQuestion.accuracy}% de acerto)
            nesta atividade. Reforce esse conteudo antes da proxima avaliacao.
          </p>
        </div>
      )}
    </section>
  );
}
