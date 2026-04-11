# 📱 Leitor Dracker - Visão Visual da Aplicação

## Fluxo de Navegação

```
┌─────────────────────────────────────────────────────────────┐
│           HEADER (Navegação Fixa - Todas as páginas)        │
│  [Logo] Leitor Dracker  [Câmera] [Gabarito] [Dashboard] [Imprimir]
└─────────────────────────────────────────────────────────────┘
                             ▼
        
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  1️⃣  CONFIG VIEW              2️⃣  SCANNER VIEW             │
│  ┌──────────────────┐         ┌──────────────────────┐       │
│  │ Configurar       │         │ 📷 Câmera            │       │
│  │ Gabarito Oficial │         │  (ou padrão CSS)     │       │
│  │                  │         │                      │       │
│  │ Questões: [____] │────┐    │ ┌──────────────────┐ │       │
│  │                  │    │    │ │                  │ │       │
│  │ Q1: [A][B][C]... │    │    │ │  Marcadores de   │ │       │
│  │ Q2: [A][B][C]... │    │    │ │  Scanner         │ │       │
│  │ Q3: [A][B][C]... │    │    │ └──────────────────┘ │       │
│  │ ...              │    │    │                      │       │
│  │                  │    │    │      [O BOTÃO O]     │       │
│  │ [Salvar]         │    │    └──────────────────────┘       │
│  └──────────────────┘    │                                   │
│                          └──────────────────┬──────┐         │
│                                            ▼      │         │
│                      ┌──────────────────────────┐  │         │
│                   3️⃣ │  RESULT VIEW             │◄─┘         │
│                      │                          │             │
│                      │ ✅ Correção concluída   │             │
│                      │                          │             │
│                      │ Aluno: Marina Costa     │             │
│                      │ Acertos: 18/20          │             │
│                      │ Nota: 9.0               │             │
│                      │                          │             │
│                      │ [Gerar Feedback IA]    │             │
│                      │ [🔄 Nueva Leitura]     │             │
│                      │ [📊 Ver Dashboard]     │             │
│                      └──────────────────────────┘             │
│                                │                             │
│                                └──────────┬──────────┐       │
│                                          ▼          ▼       │
│  ┌────────────────────────────┐  ┌──────────────────────┐  │
│  │ 4️⃣  DASHBOARD (Analytics)  │  │ 5️⃣  TEMPLATE       │  │
│  │                            │  │ (Impressão A4)      │  │
│  │ ┌──────────────────┐      │  │                      │  │
│  │ │ Média: 8.5      │      │  │ ┌────────────────┐   │  │
│  │ │ Total: 15       │      │  │ │ GABARITO A4    │   │  │
│  │ └──────────────────┘      │  │ │                │   │  │
│  │                            │  │ │ Q1 [●] [ ] [ ]│   │  │
│  │ Taxa de Acerto por Q:    │  │ │    [A] [B] [C]│   │  │
│  │                            │  │ │                │   │  │
│  │ Q1 ████████████░░ 87%    │  │ │ Q2 [ ] [●] [ ]│   │  │
│  │ Q2 █████████████░░ 93%    │  │ │    [A] [B] [C]│   │  │
│  │ Q3 ███████░░░░░░░░ 42%    │  │ │ ...            │   │  │
│  │ Q4 ███████████████░ 87%    │  │ │                │   │  │
│  │ Q5 █████░░░░░░░░░░░ 32%    │  │ └────────────────┘   │  │
│  │ ...                        │  │                      │  │
│  │                            │  │ [Voltar] [🖨️ Print]│  │
│  │ 💡 Insight: Q3 teve a mei │  └──────────────────────┘  │
│  │ menor taxa. Revisar.       │                            │
│  │                            │                            │
│  │ [⬇️ Baixar Backup JSON]    │                            │
│  │ [🗑️ Limpar Dados da Turma] │                            │
│  └────────────────────────────┘                            │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Wireframe Detalhado - Config View

```
┌────────────────────────────────────────────────────────────────┐
│  📋 Configurar Gabarito Oficial                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Quantidade de Questões:                                      │
│  ┌─────────────────────┐                                      │
│  │        [  5  ]      │ (input type="number" min=1 max=50)   │
│  └─────────────────────┘                                      │
│                                                                │
│  Questão 1                                                     │
│  ┌─────────────────────────────────────────┐                 │
│  │ [A] [B] [C] [D] [E]  ← selecione uma   │                 │
│  └─────────────────────────────────────────┘                 │
│                                                                │
│  Questão 2                                                     │
│  ┌─────────────────────────────────────────┐                 │
│  │ [A] [B] [C] [D] [E]                    │                 │
│  └─────────────────────────────────────────┘                 │
│                                                                │
│  Questão 3                                                     │
│  ┌─────────────────────────────────────────┐                 │
│  │ [A] [B] [C] [D] [E]                    │                 │
│  └─────────────────────────────────────────┘                 │
│                                                                │
│  Questão 4                                                     │
│  ┌─────────────────────────────────────────┐                 │
│  │ [A] [B] [C] [D] [E]                    │                 │
│  └─────────────────────────────────────────┘                 │
│                                                                │
│  Questão 5                                                     │
│  ┌─────────────────────────────────────────┐                 │
│  │ [A] [B] [C] [D] [E]                    │                 │
│  └─────────────────────────────────────────┘                 │
│                                                                │
│                  ┌──────────────────────┐                     │
│                  │  📥 Salvar Gabarito  │                     │
│                  └──────────────────────┘                     │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Wireframe Detalhado - Scanner View

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│         ╔════════════════════════════════════════════╗        │
│         ║                                            ║        │
│         ║  📷 Video Stream / CSS Pattern Fallback    ║        │
│         ║                                            ║        │
│         ║         ◆─────────────────────◆           ║        │
│         ║         │   SCANNER OVERLAY   │           ║        │
│         ║         │                     │           ║        │
│         ║         │  (Marcadores azuis)│           ║        │
│         ║         │                     │           ║        │
│         ║         ◆─────────────────────◆           ║        │
│         ║                                            ║        │
│         ╚════════════════════════════════════════════╝        │
│                                                                │
│                                                                │
│                     ┌─────────────────┐                       │
│                     │                 │                       │
│                     │      O BOTÃO    │ ← Clique para        │
│                     │      CIRCULAR   │   capturar           │
│                     │      BRANCO     │                       │
│                     │                 │                       │
│                     └─────────────────┘                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Wireframe Detalhado - Result View

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                       ✅ Ícone Sucesso                         │
│                                                                │
│                   Correção Concluída                          │
│              Resultado identificado automaticamente            │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Aluno           │ Marina Costa                        │  │
│  │  Acertos         │ 18/20                              │  │
│  │  Nota Final      │           9.0                      │  │
│  │                  │ (grande, destaque azul)            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│           ┌─────────────────────────────────┐                │
│           │ ✨ Gerar Feedback Pedagógico IA │                │
│           └─────────────────────────────────┘                │
│                                                                │
│   ┌──────────────────┐    ┌───────────────────┐              │
│   │ 🔄 Nova Leitura  │    │ 📊 Ver Dashboard  │              │
│   └──────────────────┘    └───────────────────┘              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Wireframe Detalhado - Dashboard View

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ┌─────────────────────┐  ┌──────────────────────────┐        │
│  │     MÉDIA           │  │   TOTAL CORRIGIDO        │        │
│  │                     │  │                          │        │
│  │      8.5            │  │         15               │        │
│  └─────────────────────┘  └──────────────────────────┘        │
│                                                                │
│                    ┌────────────────────────────────┐          │
│                    │ ⬇️ Baixar Backup  │ 🗑️ Limpar  │          │
│                    └────────────────────────────────┘          │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Taxa de Acerto por Questão                                  │
│                                                                │
│  Q1 ███████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 87%        │
│  Q2 ██████████████████████░░░░░░░░░░░░░░░░░░░░░░ 93%        │
│  Q3 ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 20%        │
│  Q4 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0%        │
│  Q5 ███████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 52%        │
│  ...                                                           │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  💡 Insight Pedagógico (IA)                                  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ A Questão 4 apresentou 0% de acerto (maior dificuldade)│  │
│  │ Recomenda-se:                                          │  │
│  │ • Revisão do conteúdo com exemplos contextualizados   │  │
│  │ • Prática guiada em sala                              │  │
│  │ • Discussão sobre conceitos-chave                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Wireframe Detalhado - Template View (Impressão A4)

```
┌─────────────────────────────────────────────────────┐
│ 📄 GABARITO OFICIAL - Leitor Dracker               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Preencha os campos com caneta escura.              │
│                                                     │
│ Nome do Aluno: ___________________                 │
│ Turma:        ___________________                 │
│                                                     │
│ Q1   (●) ( ) ( )     Q6   (●) ( ) ( )              │
│      A   B   C            A   B   C                │
│                                                     │
│ Q2   ( ) ( ) (●)     Q7   ( ) ( ) ( )              │
│      A   B   C            A   B   C                │
│                                                     │
│ Q3   ( ) (●) ( )     Q8   (●) ( ) ( )              │
│      A   B   C            A   B   C                │
│                                                     │
│ Q4   (●) ( ) ( )     Q9   ( ) (●) ( )              │
│      A   B   C            A   B   C                │
│                                                     │
│ Q5   ( ) ( ) (●)     Q10  ( ) ( ) (●)              │
│      A   B   C            A   B   C                │
│                                                     │
│ ... (continuação em A4) ...                        │
│                                                     │
└─────────────────────────────────────────────────────┘

(● = Bolha preenchida com resposta oficial)
( ) = Bolha vazia para o aluno preencher
```

---

## Paleta de Cores (Light Mode)

```
CORES PRIMÁRIAS:
├─ Fundo App:    slate-50     (#f8fafc)
├─ Cards:        white        (#ffffff)
├─ Bordas:       slate-200    (#e2e8f0)
└─ Destaques:    blue-600     (#2563eb)

TEXTOS:
├─ Primário:     slate-900    (#0f172a)
├─ Secundário:   slate-500    (#64748b)
└─ Hover:        slate-100    (#f1f5f9)

SEMANTICOS:
├─ Sucesso:      emerald-600  (#16a34a)
├─ Aviso:        amber-600    (#d97706)
├─ Erro:         rose-600     (#e11d48)
└─ Info:         fuchsia-600  (#d946ef)
```

---

## Tipografia

```
Headings:
├─ h1: text-3xl font-bold text-slate-900
├─ h2: text-xl font-semibold text-slate-900
└─ h3: text-lg font-semibold text-slate-700

Body Text:
├─ Regular: text-sm font-normal text-slate-600
├─ Semibold: text-sm font-semibold text-slate-700
└─ Mono: font-mono text-xs text-slate-500

Buttons:
└─ text-xs font-medium uppercase tracking-wide
```

---

## Responsividade

```
Desktop (≥1024px):
├─ Max width: 1280px (max-w-5xl)
├─ Padding: 20-24px (px-6)
├─ Grid: 2 colunas
└─ Font size: sm/base

Mobile (<640px):
├─ Full width
├─ Padding: 16px (px-4)
├─ Grid: 1 coluna
└─ Font size: xs/sm
```

---

## Animações

```
Transitions:
├─ Hover states: transition 150ms
├─ Active states: active:scale-95 (buttons)
├─ Focus: ring focus:ring-blue-600
└─ Smooth color changes

Loading States:
└─ "Iniciando câmara..." (text-white no overlay)

Print Mode:
└─ @media print: display: none para elementos no-print
```

---

**Versão 1.0.0** | Design System Completo
