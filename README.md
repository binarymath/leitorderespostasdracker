# 📋 Leitor Dracker - Leitor de Gabaritos Web

Uma Single Page Application (SPA) em React para leitura, correção digital e análise de gabaritos de provas. Ideal para educadores que necessitam de uma solução rápida, educacional e 100% offline.

## 🎯 Características Principais

### ✨ Funcionalidades Implementadas

- **Câmera Simulada (ScannerView)**: Interface imersiva para captura de gabaritos
  - Simulação de câmara com fallback em CSS quando bloqueada
  - Geração automática de respostas simuladas de alunos
  - Cálculo automático de notas (0-10)

- **Configuração de Gabarito (ConfigView)**: Interface intuitiva para setup
  - Definir quantidade de questões (1-50)
  - Marcar respostas corretas (A, B, C, D, E)
  - Salvar gabarito oficial no localStorage

- **Dashboard de Turma (DashboardView)**: Análise completa dos resultados
  - Média da turma em tempo real
  - Total de provas corrigidas
  - Taxa de acerto por questão com gráfico visual
  - Insights pedagógicos baseados em IA
  - Exportação JSON para backup (com data no filename)
  - Botão para limpar todos os dados

- **Template de Impressão (TemplateView)**: Gabarito pronto para impressão
  - Formato A4 conforme @media print
  - Bubbles ABCDE para cada questão
  - Marcação visual das respostas corretas

- **Persistência Offline (localStorage)**:
  - `dracker_official_key`: Gabarito oficial salvo
  - `dracker_students_results`: Array de resultados dos alunos

## 🛠️ Stack Tecnológica

```
├─ React 18.2.0 (com Hooks)
├─ Vite 5.0 (bundler ultrarrápido)
├─ Tailwind CSS 3.3 (estilos minimalistas)
├─ lucide-react 0.344 (ícones)
└─ PostCSS 8.4 + Autoprefixer
```

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js 16+ e npm

### Instalação e Execução

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Abrir no navegador
# Acesso automático em http://localhost:5173/
```

### Build para Produção

```bash
npm run build
npm run preview
```

## 📊 Estrutura de Dados

### Estado do Gabarito Oficial
```javascript
{
  questionCount: 5,
  answers: ["A", "B", "C", "D", "E"]
}
```

### Resultado do Aluno
```javascript
{
  id: 1712908500000,
  studentName: "Ana Silva",
  studentAnswers: ["A", "B", "C", "D", "E"],
  correctCount: 4,
  totalQuestions: 5,
  score: 8.0,
  createdAt: "2026-04-11T13:08:20.000Z"
}
```

## 🎨 Design System (Light Mode)

- **Fundo**: `slate-50` (minimalista)
- **Cartões**: `bg-white` com `shadow-sm`
- **Texto Principal**: `slate-900`
- **Texto Secundário**: `slate-500`
- **Destaques**: `blue-600`
- **Bordas**: `slate-200`

## 🔌 Componentes Principais

### `Header`
Navegação fixa com botões para:
- 📷 Câmera (Scanner)
- ⚙️ Configurar Gabarito
- 📊 Dashboard
- 🖨️ Imprimir Template

### `ScannerView`
- Integração com `getUserMedia()` (API de mídia)
- Fallback visual elegante (CSS Grid pattern)
- Botão circular para captura central
- Overlay com marcadores de scanner

### `ConfigView`
- Input numérico para quantidade de questões
- Seleção visual dos 5 botões (A-E)
- Atualização dinâmica de questões
- Botão "Salvar Gabarito"

### `ResultView`
- Card com ícone de sucesso (checkmark)
- Nome do aluno simulado (banco de nomes)
- Acertos / Total questões
- Nota final em destaque (3xl)
- Botões "Nova Leitura" e "Ver Dashboard"

### `DashboardView`
- Grid de métricas (Média, Total Corrigido)
- Gráfico de acerto por questão (barras)
- Card de insights pedagógicos (Sparkles icon)
- Botões de Exportação JSON e Limpar Dados

### `TemplateView`
- Visualização em A4 (210mm × 297mm)
- Print preview integrado
- Bubble selector visual
- Preenchimento automático das respostas corretas

## 💾 LocalStorage

A aplicação utiliza duas chaves principais:
- **`dracker_official_key`**: Salva o gabarito oficial (persistência permanente)
- **`dracker_students_results`**: Array de resultados dos alunos (histórico completo)

Dados são automaticamente sincronizados entre abas do navegador.

## 🎓 Caso de Uso

1. **Professor configura o gabarito** (ConfigView)
   - Define 20 questões de múltipla escolha
   - Marca as respostas corretas

2. **Scanner captura provas** (ScannerView)
   - Aluno coloca folha de gabarito na câmara
   - Clica para capturar
   - Sistema gera resultado automático

3. **Consulta resultados** (ResultView)
   - Visualiza nota imediata
   - Vê acertos/erros por questão

4. **Analisa turma** (DashboardView)
   - Média da turma em tempo real
   - Identifica questões com menor desempenho
   - Exporta dados em JSON para backup

5. **Imprime gabaritos** (TemplateView)
   - Formato pronto para cópias físicas
   - Impressão A4 perfeita

## 📱 Responsividade

- Grid responsivo (2 cols no desktop, 1 col em mobile)
- Padding adaptativo (`px-4 sm:px-6`)
- Máxima largura de conteúdo: `max-w-5xl`
- Suporte completo a mobile com touch events

## 🔒 Privacidade & Segurança

✅ **100% Offline First** - Nenhum dado é enviado para servidor  
✅ **LocalStorage** - Dados persistidos apenas no navegador do usuário  
✅ **Sem Cookies de Rastreamento** - Privacidade total  
✅ **Exportação Manual** - Controle total sobre backup de dados  

## 🐛 Troubleshooting

### Câmara não funciona?
A aplicação possui fallback elegante com padrão CSS caso:
- Navegador bloqueie acesso à câmara
- Dispositivo não tenha câmara
- Permissão ser negada pelo usuário

### Dados sumindo?
- Verifique se localStorage não foi limpo (settings do navegador)
- Use "Baixar Backup" para exportar dados antes de limpar
- Os dados são específicos do domínio/navegador

### Impressão não está perfeita?
- Teste em Chrome/Edge para melhor suporte a @media print
- Ajuste zoom da página antes de imprimir (Ctrl+0)
- Use "Imprimir para PDF" para melhor qualidade

## 📄 Licença

Projeto desenvolvido para fins educacionais.

---

**Versão 1.0.0** | Atualizado em 11 de Abril de 2026  
Desenvolvido com ❤️ por Engenheiro de Software Sênior  
