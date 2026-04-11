import React, { useMemo } from "react";
import { Download, Trash2 } from "lucide-react";

export default function DashboardView({ examConfig, results, onExport, onClear }) {
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
      const accuracy = results.length > 0 ? Math.round((hits / results.length) * 100) : 0;
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
          <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.average.toFixed(1)}</p>
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
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Taxa de acerto por questão</h3>

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
        </div>
      </div>

      {worstQuestion && (
        <div className="mt-4 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Insight Pedagógico (IA)</h3>
          <p className="mt-1 text-sm text-slate-600">
            A {worstQuestion.label} apresentou o pior desempenho da turma ({worstQuestion.accuracy}%
            de acerto). Sugestão: revisar o conteúdo com exemplos guiados e prática direcionada.
          </p>
        </div>
      )}
    </section>
  );
}
