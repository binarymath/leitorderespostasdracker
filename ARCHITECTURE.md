# 🏗️ Arquitetura da Aplicação

## Visão Geral

O **Leitor Dracker** é uma SPA (Single Page Application) construída com React e otimizada para ser executada 100% offline. A arquitetura segue padrões modernos de React com Hooks e gerenciamento de estado local.

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                      APP Principal                          │
│  - Gerencia state global (activeView, examConfig, results)  │
│  - Coordena todas as views                                  │
│  - Persiste dados no localStorage                           │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    LOCAL STORAGE      RENDER LOGIC      HOOKS
    ├─ Official Key   │                ├─ useState
    └─ Results        │                ├─ useLocalStorage
                      │                ├─ useEffect
              ┌───────┴────────┐       ├─ useMemo
              │                │       └─ useRef
         ┌────▼─────┐      ┌──▼──────┐
         │ Views    │      │Componentes
         │ (5 total)│      │(Header)
         └──────────┘      └──────────┘
```

## Estados (Views) da Aplicação

```javascript
activeView ∈ {
  "scanner"   → ScannerView (captura simulada)
  "config"    → ConfigView (configurar gabarito)
  "result"    → ResultView (resultado de uma prova)
  "dashboard" → DashboardView (analytics da turma)
  "template"  → TemplateView (impressão A4)
}
```

## Fluxo de Estados da Prova

```
┌──────────────────┐
│  ConfigView      │  Professor configura
│  (Setup)         │  gabarito oficial
└────────┬─────────┘
         │ onSave → setExamConfig
         │ localStorage[dracker_official_key]
         ▼
┌──────────────────────┐
│  ScannerView         │  Simulação de captura
│  (Captura)           │  de gabarito
└────────┬─────────────┘
         │ onCapture
         │
         ├─ Gera respostas aleatórias do aluno
         ├─ Compara com gabarito oficial
         ├─ Calcula nota (acertos/total × 10)
         │ createElement(newResult)
         │
         ▼
┌──────────────────────┐
│  ResultView          │  Exibe resultado
│  (Resultado)         │  individual
└────────┬─────────────┘
         │ setResults(prev => [newResult, ...prev])
         │ localStorage[dracker_students_results]
         │
         ├─ onBackScanner → ScannerView
         │ ou
         └─ onOpenDashboard → DashboardView
```

## Estrutura de Componentes

### 1. **Header** (Navegação Fixa)
```jsx
<header className="fixed inset-x-0 top-0 z-40">
  ├─ Logo + Título
  └─ Botões de Navegação
      ├─ Câmera (activeView === 'scanner')
      ├─ Gabarito (activeView === 'config')
      ├─ Dashboard (activeView === 'dashboard')
      └─ Imprimir (→ template + print())
```

**Props:**
- `activeView`: string (view atual)
- Callbacks para navegação

### 2. **ScannerView** (Câmera)
```jsx
<section className="h-[calc(100vh-3.5rem)]">
  ├─ <video> (ou fallback CSS)
  ├─ <div overlay> (marcadores de scanner)
  └─ <button capture> (botão circular)
```

**State:**
- `videoRef`: referência ao elemento video
- `streamRef`: referência ao stream de mídia
- `cameraReady`: boolean (stream pronto)
- `cameraBlocked`: boolean (permissão negada)

**Lógica:**
```javascript
handleCapture() {
  const totalQuestions = examConfig.questionCount
  const studentAnswers = randomAnswers(totalQuestions)
  const correctCount = studentAnswers.filter(
    (ans, i) => ans === examConfig.answers[i]
  ).length
  const score = (correctCount / totalQuestions) * 10
  
  newResult = { id, studentName, studentAnswers, ... }
  setResults(prev => [newResult, ...prev])
  setLastResult(newResult)
  setActiveView("result")
}
```

### 3. **ConfigView** (Setup Gabarito)
```jsx
<section className="mx-auto max-w-5xl">
  ├─ Input: Quantidade de questões (1-50)
  ├─ Grid: 5 botões para cada questão
  │  └─ Botões A, B, C, D, E (toggle)
  └─ Button: Salvar Gabarito
```

**State Management:**
```javascript
const [questionCount, setQuestionCount] = useState(...)
const [answers, setAnswers] = useState(...)

// Validação e sincronização automática
if (answers.length !== questionCount) {
  // Ajusta array de respostas
}
```

### 4. **ResultView** (Resultado)
```jsx
<section className="mx-auto max-w-4xl">
  ├─ Icon: CheckCircle2 (sucesso)
  ├─ Card: Resultado do aluno
  │  ├─ Nome
  │  ├─ Acertos/Total
  │  └─ Nota (3xl, blue-600)
  ├─ Button: Gerar Feedback IA
  └─ Actions:
     ├─ Nova Leitura
     └─ Ver Dashboard
```

### 5. **DashboardView** (Analytics)
```jsx
<section className="mx-auto max-w-5xl">
  ├─ Grid: Métricas
  │  ├─ Média da Turma
  │  └─ Total Corrigido
  ├─ Actions:
  │  ├─ Baixar Backup (.json)
  │  └─ Limpar Dados
  ├─ Chart: Taxa de Acerto por Questão
  └─ Card: Insights Pedagógicos (Sparkles)
```

**Cálculos (useMemo):**
```javascript
dashboardMetrics = {
  totalCorrected: results.length,
  average: results.reduce(score) / length
}

issues = Array.from(questionCount) map((q, i) => {
  correctCount = results.filter(r => r.answers[i] === official[i]).length
  accuracy = (correctCount / results.length) * 100
  return { label: `Q${i+1}`, accuracy }
})
```

### 6. **TemplateView** (Impressão A4)
```jsx
<section className="mx-auto max-w-5xl">
  ├─ Actions (no-print):
  │  ├─ Voltar ao Scanner
  │  └─ Imprimir Agora
  └─ Print Area (A4):
     ├─ Header + Instruções
     ├─ Campos: Nome, Turma
     └─ Grid: Questões com bubbles
        └─ Bubbles preenchidos automaticamente
```

**CSS Print:**
```css
@media print {
  @page { size: A4 portrait; margin: 10mm; }
  .no-print { display: none !important; }
  .print-area { width: 100%; box-shadow: none; }
}
```

## Lógicas Principais

### 1. Hook Custom: `useLocalStorage`
```javascript
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : initialValue
  })
  
  const setStoredValue = (nextValue) => {
    setValue((prev) => {
      const computed = typeof nextValue === 'function' 
        ? nextValue(prev) 
        : nextValue
      window.localStorage.setItem(key, JSON.stringify(computed))
      return computed
    })
  }
  
  return [value, setStoredValue]
}
```

### 2. Geração de Dados Simulados
```javascript
randomStudentName() {
  // Banco de nomes realistas em PT-BR
  return `${firstName} ${lastName}`
}

randomAnswers(total) {
  // Gera array de A-E aleatórios
  return Array.from({ length: total }, () => 
    OPTIONS[Math.random() * 5]
  )
}
```

### 3. Cálculo de Nota
```javascript
score = (correctCount / totalQuestions) * 10

// Exemplo: 4 acertos em 5 = (4/5) * 10 = 8.0
```

### 4. Exportação JSON
```javascript
handleExportBackup() {
  const payload = {
    generatedAt: new Date().toISOString(),
    dracker_official_key: examConfig,
    dracker_students_results: results,
  }
  
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  // Trigger download automático
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `dracker-backup-${today}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
```

## Side Effects (useEffect)

### 1. Setup da Câmara (ScannerView)
```javascript
useEffect(() => {
  navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } },
    audio: false
  }).then(stream => {
    videoRef.current.srcObject = stream
    videoRef.current.play()
    setCameraReady(true)
  }).catch(() => {
    setCameraBlocked(true) // Fallback
  })
}, [])
```

### 2. Validação e Sync de Config (App)
```javascript
useEffect(() => {
  // Verifique se config mudou
  if (examConfig.answers.length !== examConfig.questionCount) {
    // Ajuste o array de respostas
    const fixed = Array.from(questionCount, (_, i) => 
      examConfig.answers[i] || 'A'
    )
    setExamConfig({ ...examConfig, answers: fixed })
  }
}, [examConfig, setExamConfig])
```

### 3. Print Automático (App)
```javascript
useEffect(() => {
  if (!printRequested || activeView !== 'template') return
  
  const timer = setTimeout(() => {
    window.print()
    setPrintRequested(false)
  }, 120) // delay para render
  
  return () => clearTimeout(timer)
}, [activeView, printRequested])
```

## Estilos (Tailwind CSS)

### Paleta de Cores
- **Fundos**: `slate-50` (app), `white` (cards)
- **Texto**: `slate-900` (principal), `slate-500` (secundário)
- **Destaques**: `blue-600` (primary), `emerald-600` (sucesso)
- **Borders**: `slate-200`
- **Hover**: `bg-slate-50` para cards

### Componentes Reutilizáveis
```javascript
// Button padrão
className="rounded-lg border border-slate-200 bg-white px-3 py-2 
           text-sm font-medium text-slate-700 hover:bg-slate-50 
           transition"

// Card padrão
className="rounded-2xl border border-slate-200 bg-white p-4 
           shadow-sm"

// Input padrão
className="rounded-lg border border-slate-300 bg-white px-3 py-2 
           text-sm text-slate-900 focus:ring focus:ring-blue-600"
```

## Performance Otimizações

1. **useMemo**: Para `dashboardMetrics` e `issues` (recalcula apenas se `results` ou `examConfig` mudam)
2. **useRef**: Para referências a DOM (`videoRef`, `streamRef`) que não causam re-renders
3. **lazy loading**: Câmara só é inicializada quando ScannerView está ativa
4. **Cleanup**: Streams de mídia são corretamente liberados no cleanup do `useEffect`

## Tratamento de Erros

- ✅ Câmara bloqueada → Fallback com padrão CSS
- ✅ localStorage indisponível → Função ainda funciona (estado em memória)
- ✅ Dados corrompidos → Reset para valores padrão
- ✅ Sem gabarito → Usa default de 5 questões

## Segurança & Privacidade

- ✅ XSS Prevention: React auto-escapa conteúdo por padrão
- ✅ localStorage: Dados nunca deixam o navegador
- ✅ CSRF: N/A (sem servidor)
- ✅ Sensitive Data: Nenhuma informação sensível armazenada

---

**Versão Arquitetural 1.0** | Documentação Técnica Completa
