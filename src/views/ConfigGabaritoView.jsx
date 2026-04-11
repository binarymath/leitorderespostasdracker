import React, { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";

const OPTIONS = ["A", "B", "C", "D", "E"];

export default function ConfigGabaritoView({ examConfig, onSave }) {
  const [questionCount, setQuestionCount] = useState(examConfig.questionCount || 20);
  const [answers, setAnswers] = useState(
    examConfig.answers || Array.from({ length: 20 }, () => "A"),
  );
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
    onSave({ questionCount, answers: answers.slice(0, questionCount) });
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
              <div key={qNumber} className="rounded-xl border border-slate-200 bg-white p-3">
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
