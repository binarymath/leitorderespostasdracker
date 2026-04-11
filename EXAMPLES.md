# 📚 Exemplos de Uso - API localStorage

## Estrutura de Dados Completa

### Chave 1: `dracker_official_key`
Armazena a configuração do gabarito oficial.

```javascript
{
  questionCount: 20,
  answers: [
    "A", "B", "C", "D", "E",
    "A", "B", "C", "D", "E",
    "A", "B", "C", "D", "E",
    "A", "B", "C", "D", "E"
  ]
}
```

**Acessar:**
```javascript
const officialKey = JSON.parse(
  localStorage.getItem('dracker_official_key')
);
console.log(officialKey.answers[0]); // "A"
```

### Chave 2: `dracker_students_results`
Armazena array com todos os resultados de alunos.

```javascript
[
  {
    id: 1712908534000,
    studentName: "Marina Costa",
    studentAnswers: ["A", "A", "C", "D", "E", ...],
    correctCount: 18,
    totalQuestions: 20,
    score: 9.0,
    createdAt: "2026-04-11T13:08:54.000Z"
  },
  {
    id: 1712908510000,
    studentName: "Paulo Silva",
    studentAnswers: ["A", "B", "C", "D", "E", ...],
    correctCount: 16,
    totalQuestions: 20,
    score: 8.0,
    createdAt: "2026-04-11T13:08:30.000Z"
  },
  // ... mais alunos ...
]
```

**Acessar:**
```javascript
const results = JSON.parse(
  localStorage.getItem('dracker_students_results')
) || [];

// Último aluno adicionado
console.log(results[0].studentName);

// Média da turma
const average = results.reduce((sum, r) => sum + r.score, 0) / results.length;
console.log(`Média: ${average.toFixed(1)}`);

// Aluno com melhor nota
const best = results.reduce((best, r) => 
  r.score > best.score ? r : best
);
console.log(`Melhor aluno: ${best.studentName} (${best.score})`);
```

## 🔄 Ciclo de Vida dos Dados

### 1. Inicializar Gabarito

```javascript
// Professor configura o gabarito
const newGabarito = {
  questionCount: 10,
  answers: ["A", "B", "C", "D", "E", "A", "B", "C", "D", "E"]
};

localStorage.setItem(
  'dracker_official_key',
  JSON.stringify(newGabarito)
);
```

### 2. Capturar e Corrigir Prova

```javascript
// Simular captura de prova
const studentName = "João Silva";
const studentAnswers = ["A", "B", "C", "C", "E", "A", "B", "C", "D", "E"];
const officialAnswers = ["A", "B", "C", "D", "E", "A", "B", "C", "D", "E"];

// Contar acertos
const correctCount = studentAnswers.reduce((count, ans, i) => 
  ans === officialAnswers[i] ? count + 1 : count, 0
);

// Calcular nota
const totalQuestions = officialAnswers.length;
const score = (correctCount / totalQuestions) * 10;

// Criar resultado
const result = {
  id: Date.now(),
  studentName,
  studentAnswers,
  correctCount,
  totalQuestions,
  score,
  createdAt: new Date().toISOString()
};

// Adicionar ao array de resultados
const results = JSON.parse(
  localStorage.getItem('dracker_students_results')
) || [];

results.unshift(result); // Adiciona no início

localStorage.setItem(
  'dracker_students_results',
  JSON.stringify(results)
);

console.log(`Aluno ${studentName} teve nota ${score.toFixed(1)}`);
```

## 📊 Exemplos de Análise

### Análise 1: Questão com Menor Desempenho

```javascript
const results = JSON.parse(
  localStorage.getItem('dracker_students_results')
) || [];
const official = JSON.parse(
  localStorage.getItem('dracker_official_key')
);

// Para cada questão, calcular percentual de acerto
const accuracyByQuestion = Array.from(
  { length: official.questionCount },
  (_, index) => {
    const correct = results.filter(
      r => r.studentAnswers[index] === official.answers[index]
    ).length;
    
    const accuracy = results.length > 0 
      ? (correct / results.length) * 100 
      : 0;
    
    return {
      question: `Q${index + 1}`,
      accuracy: accuracy.toFixed(1),
      correctCount: correct,
      totalAttempts: results.length
    };
  }
);

// Encontrar questão com menor desempenho
const worstQuestion = accuracyByQuestion.reduce((worst, current) =>
  parseFloat(current.accuracy) < parseFloat(worst.accuracy) ? current : worst
);

console.log(`Questão com menor desempenho: ${worstQuestion.question}`);
console.log(`Taxa de acerto: ${worstQuestion.accuracy}%`);
console.log(`${worstQuestion.correctCount}/${worstQuestion.totalAttempts} alunos acertaram`);
```

### Análise 2: Distribuição de Notas

```javascript
const results = JSON.parse(
  localStorage.getItem('dracker_students_results')
) || [];

// Agrupar por faixa de nota
const distribution = {
  'A (9.0-10.0)': results.filter(r => r.score >= 9.0).length,
  'B (8.0-8.9)': results.filter(r => r.score >= 8.0 && r.score < 9.0).length,
  'C (7.0-7.9)': results.filter(r => r.score >= 7.0 && r.score < 8.0).length,
  'D (6.0-6.9)': results.filter(r => r.score >= 6.0 && r.score < 7.0).length,
  'F (< 6.0)': results.filter(r => r.score < 6.0).length,
};

console.table(distribution);

// Porcentagem de aprovação (nota >= 6.0)
const approved = results.filter(r => r.score >= 6.0).length;
const approvalRate = (approved / results.length * 100).toFixed(1);
console.log(`Taxa de aprovação: ${approvalRate}%`);
```

### Análise 3: Alunos que Precisam de Feedback

```javascript
const results = JSON.parse(
  localStorage.getItem('dracker_students_results')
) || [];

// Alunos com desempenho abaixo da média
const average = results.reduce((sum, r) => sum + r.score, 0) / results.length;
const needsHelp = results.filter(r => r.score < average).sort((a, b) => a.score - b.score);

console.log(`Média da turma: ${average.toFixed(1)}`);
console.log(`Alunos abaixo da média (${needsHelp.length}):`);

needsHelp.forEach((student, index) => {
  const gap = (average - student.score).toFixed(1);
  console.log(`  ${index + 1}. ${student.studentName}: ${student.score.toFixed(1)} (-${gap})`);
});
```

### Análise 4: Mapeamento de Erros Comuns

```javascript
const results = JSON.parse(
  localStorage.getItem('dracker_students_results')
) || [];
const official = JSON.parse(
  localStorage.getItem('dracker_official_key')
);

// Para cada questão, encontrar respostas mais erradas
const commonWrongAnswers = Array.from(
  { length: official.questionCount },
  (_, qIndex) => {
    const wrongAnswers = results
      .filter(r => r.studentAnswers[qIndex] !== official.answers[qIndex])
      .map(r => r.studentAnswers[qIndex]);
    
    const frequency = {};
    wrongAnswers.forEach(ans => {
      frequency[ans] = (frequency[ans] || 0) + 1;
    });
    
    const mostCommonWrong = Object.entries(frequency).sort(
      (a, b) => b[1] - a[1]
    )[0];
    
    return {
      question: `Q${qIndex + 1}`,
      correct: official.answers[qIndex],
      mostCommonWrong: mostCommonWrong?.[0] || 'N/A',
      frequency: mostCommonWrong?.[1] || 0
    };
  }
);

console.log('Respostas erradas mais comuns:');
commonWrongAnswers.forEach(item => {
  if (item.frequency > 0) {
    console.log(`  ${item.question}: ${item.frequency} alunos responderam ${item.mostCommonWrong} (correta: ${item.correct})`);
  }
});
```

## 💾 Exportação e Backup

### Exportar Dados como JSON

```javascript
function exportDataAsJSON() {
  const payload = {
    exportedAt: new Date().toISOString(),
    dracker_official_key: JSON.parse(
      localStorage.getItem('dracker_official_key')
    ),
    dracker_students_results: JSON.parse(
      localStorage.getItem('dracker_students_results')
    ),
  };
  
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `dracker-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  URL.revokeObjectURL(url);
}

// Uso:
exportDataAsJSON();
```

### Importar Dados de JSON

```javascript
function importDataFromJSON(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      localStorage.setItem(
        'dracker_official_key',
        JSON.stringify(data.dracker_official_key)
      );
      localStorage.setItem(
        'dracker_students_results',
        JSON.stringify(data.dracker_students_results)
      );
      
      console.log('Dados importados com sucesso!');
      window.location.reload(); // Refresh para carregar novos dados
    } catch (error) {
      console.error('Erro ao importar:', error);
      alert('Arquivo JSON inválido');
    }
  };
  reader.readAsText(file);
}

// Uso:
// <input type="file" accept=".json" onChange={e => importDataFromJSON(e.target.files[0])} />
```

## 🗑️ Limpeza de Dados

### Limpar Tudo

```javascript
function clearAllData() {
  if (confirm('Tem certeza? Isso deletará todos os dados permanentemente.')) {
    localStorage.removeItem('dracker_official_key');
    localStorage.removeItem('dracker_students_results');
    console.log('Todos os dados foram deletados');
  }
}
```

### Limpar Resultados (Manter Gabarito)

```javascript
function clearStudentResults() {
  localStorage.removeItem('dracker_students_results');
  console.log('Resultados dos alunos deletados');
}
```

### Remover Um Aluno Específico

```javascript
function removeStudent(studentId) {
  const results = JSON.parse(
    localStorage.getItem('dracker_students_results')
  ) || [];
  
  const filtered = results.filter(r => r.id !== studentId);
  
  localStorage.setItem(
    'dracker_students_results',
    JSON.stringify(filtered)
  );
  
  console.log(`Aluno ${studentId} removido`);
}

// Uso:
// removeStudent(1712908534000);
```

## 🎓 Scripts Úteis para Professores

### Criar Turma de Teste (30 alunos simulados)

```javascript
function generateTestClass() {
  const names = [
    "Ana Silva", "Bruno Costa", "Carla Mendes", "Daniel Oliveira",
    "Eduarda Sousa", "Felipe Alves", "Gabriela Santos", "Hugo Ferreira",
    "Iris Ribeiro", "João Pereira", "Karina Dias", "Leonardo Rocha",
    "Mariana Gomes", "Nicolas Duarte", "Olivia Castro", "Paulo Martins",
    "Quintino Neves", "Rafaela Lima", "Samuel Barbosa", "Tatiana Correia",
    "Ulisses Teixeira", "Vanessa Reis", "Wagner Campos", "Xena Moura",
    "Yasmin Braga", "Zaia Leite", "Ágata Bento", "Brás Siqueira",
    "Cecília Nunes", "Dalton Pires"
  ];
  
  const official = JSON.parse(
    localStorage.getItem('dracker_official_key')
  );
  
  const results = names.map((name, index) => ({
    id: Date.now() + index,
    studentName: name,
    studentAnswers: Array.from(
      { length: official.questionCount },
      () => ["A", "B", "C", "D", "E"][Math.floor(Math.random() * 5)]
    ),
    correctCount: Math.floor(Math.random() * (official.questionCount + 1)),
    totalQuestions: official.questionCount,
    score: (Math.random() * 10).toFixed(1),
    createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString()
  }));
  
  localStorage.setItem(
    'dracker_students_results',
    JSON.stringify(results)
  );
  
  console.log(`${results.length} alunos de teste adicionados`);
}

// Uso:
// generateTestClass();
```

## 📱 Sincronização Entre Abas

localStorage é automaticamente sincronizado entre abas. Teste:

```javascript
// Aba 1: Adicionar dados
localStorage.setItem('dracker_official_key', JSON.stringify({
  questionCount: 5,
  answers: ["A", "B", "C", "D", "E"]
}));

// Aba 2: Isso dispara evento 'storage'
window.addEventListener('storage', (event) => {
  if (event.key === 'dracker_official_key') {
    console.log('Gabarito foi atualizado em outra aba!');
    console.log(JSON.parse(event.newValue));
  }
});
```

---

**Exemplos Práticos de API** | Versão 1.0.0
