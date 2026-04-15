import React, { useEffect, useMemo, useState } from "react";
import { Plus, Settings2 } from "lucide-react";

const OPTIONS = ["A", "B", "C", "D", "E"];

export default function ConfigGabaritoView({
  classes,
  selectedClassId,
  selectedActivityId,
  onSelectClass,
  onSelectActivity,
  onCreateClass,
  onCreateActivity,
  onRenameClass,
  onDeleteClass,
  onRenameActivity,
  onDeleteActivity,
  onSaveClassStudents,
  onSaveActivityConfig,
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

  const [newClassName, setNewClassName] = useState("");
  const [newActivityName, setNewActivityName] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editActivityName, setEditActivityName] = useState("");
  const [studentsText, setStudentsText] = useState("");
  const [questionCount, setQuestionCount] = useState(20);
  const [weight, setWeight] = useState(1);
  const [answers, setAnswers] = useState(Array.from({ length: 20 }, () => "A"));
  const [status, setStatus] = useState("");

  useEffect(() => {
    const asText = (selectedClass?.students || []).map((item) => item.name).join("\n");
    setStudentsText(asText);
    setEditClassName(selectedClass?.name || "");
  }, [selectedClass]);

  useEffect(() => {
    const count = selectedActivity?.questionCount || 20;
    setQuestionCount(count);
    setWeight(Number(selectedActivity?.weight || 1));
    setEditActivityName(selectedActivity?.name || "");
    setAnswers(
      selectedActivity?.officialKey || Array.from({ length: count }, () => "A"),
    );
  }, [selectedActivity]);

  const updateCount = (nextValue) => {
    const nextCount = Math.max(1, Math.min(80, Number(nextValue) || 1));
    setQuestionCount(nextCount);
    setAnswers((prev) => {
      if (prev.length === nextCount) return prev;
      if (prev.length > nextCount) return prev.slice(0, nextCount);
      return [...prev, ...Array.from({ length: nextCount - prev.length }, () => "A")];
    });
  };

  const handleCreateClass = () => {
    if (!newClassName.trim()) return;
    const created = onCreateClass(newClassName.trim());
    setNewClassName("");
    setStatus(`Turma criada: ${created.name}`);
  };

  const handleCreateActivity = () => {
    if (!selectedClass) {
      setStatus("Selecione uma turma antes de criar atividade.");
      return;
    }
    if (!newActivityName.trim()) return;
    const created = onCreateActivity(selectedClass.id, newActivityName.trim());
    setNewActivityName("");
    setStatus(`Atividade criada: ${created.name}`);
  };

  const handleSaveStudents = () => {
    if (!selectedClass) return;
    const students = studentsText
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean);
    onSaveClassStudents(selectedClass.id, students);
    setStatus("Lista de alunos salva.");
  };

  const handleSaveActivity = () => {
    if (!selectedClass || !selectedActivity) {
      setStatus("Selecione uma atividade para salvar o gabarito.");
      return;
    }

    onSaveActivityConfig(selectedClass.id, selectedActivity.id, {
      questionCount,
      weight: Number(weight) > 0 ? Number(weight) : 1,
      officialKey: answers.slice(0, questionCount),
    });

    setStatus("Configuração da atividade salva.");
  };

  const handleRenameClass = () => {
    if (!selectedClass) {
      setStatus("Selecione uma turma para renomear.");
      return;
    }

    const ok = onRenameClass(selectedClass.id, editClassName);
    setStatus(ok ? "Turma renomeada com sucesso." : "Nome de turma inválido.");
  };

  const handleDeleteClass = () => {
    if (!selectedClass) {
      setStatus("Selecione uma turma para excluir.");
      return;
    }

    const confirmDelete = window.confirm(
      `Excluir a turma "${selectedClass.name}" e todas as atividades/resultados?`,
    );

    if (!confirmDelete) return;

    const ok = onDeleteClass(selectedClass.id);
    setStatus(
      ok
        ? "Turma excluída com sucesso."
        : "Não é possível excluir a última turma do sistema.",
    );
  };

  const handleRenameActivity = () => {
    if (!selectedClass || !selectedActivity) {
      setStatus("Selecione uma atividade para renomear.");
      return;
    }

    const ok = onRenameActivity(selectedClass.id, selectedActivity.id, editActivityName);
    setStatus(ok ? "Atividade renomeada com sucesso." : "Nome de atividade inválido.");
  };

  const handleDeleteActivity = () => {
    if (!selectedClass || !selectedActivity) {
      setStatus("Selecione uma atividade para excluir.");
      return;
    }

    const confirmDelete = window.confirm(
      `Excluir a atividade "${selectedActivity.name}" e todos os resultados dela?`,
    );

    if (!confirmDelete) return;

    const ok = onDeleteActivity(selectedClass.id, selectedActivity.id);
    setStatus(
      ok
        ? "Atividade excluída com sucesso."
        : "Não é possível excluir a última atividade da turma.",
    );
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">
            Gestao de Turmas e Atividades
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">Turma</label>
            <div className="flex gap-2">
              <select
                value={selectedClassId || ""}
                onChange={(event) => onSelectClass(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Selecione uma turma</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Nova turma (ex: 2A Manha)"
              />
              <button
                type="button"
                onClick={handleCreateClass}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Criar
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={editClassName}
                onChange={(event) => setEditClassName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Renomear turma selecionada"
              />
              <button
                type="button"
                onClick={handleRenameClass}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={handleDeleteClass}
                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white"
              >
                Excluir
              </button>
            </div>

            <label className="mb-2 mt-4 block text-sm font-medium text-slate-700">
              Alunos da turma (um por linha)
            </label>
            <textarea
              rows={8}
              value={studentsText}
              onChange={(event) => setStudentsText(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              placeholder="Ana Souza\nBruno Lima"
            />
            <button
              type="button"
              onClick={handleSaveStudents}
              className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
            >
              Salvar Alunos
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">Atividade</label>
            <select
              value={selectedActivityId || ""}
              onChange={(event) => onSelectActivity(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Selecione uma atividade</option>
              {(selectedClass?.activities || []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newActivityName}
                onChange={(event) => setNewActivityName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Nova atividade (ex: Prova 1)"
              />
              <button
                type="button"
                onClick={handleCreateActivity}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Criar
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={editActivityName}
                onChange={(event) => setEditActivityName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Renomear atividade selecionada"
              />
              <button
                type="button"
                onClick={handleRenameActivity}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={handleDeleteActivity}
                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-medium text-white"
              >
                Excluir
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Numero de questoes
                </label>
                <input
                  type="number"
                  min={1}
                  max={80}
                  value={questionCount}
                  onChange={(event) => updateCount(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Peso</label>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={weight}
                  onChange={(event) => setWeight(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 grid max-h-[320px] gap-2 overflow-auto rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-2">
              {Array.from({ length: questionCount }, (_, index) => index + 1).map(
                (qNumber, index) => (
                  <div key={qNumber} className="rounded border border-slate-200 p-2">
                    <p className="mb-1 text-xs font-medium text-slate-600">Q{qNumber}</p>
                    <div className="grid grid-cols-5 gap-1">
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
                            className={`rounded border px-1 py-1 text-xs font-semibold ${
                              active
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 bg-white text-slate-700"
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

            <button
              type="button"
              onClick={handleSaveActivity}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              Salvar Gabarito da Atividade
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">{status}</p>
      </div>
    </section>
  );
}
