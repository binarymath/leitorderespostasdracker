# 🔧 Guia de Desenvolvimento

## Setup Local

### Pré-requisitos
- Node.js 16+ (recomenda-se 18+)
- npm ou yarn
- Navegador moderno (Chrome, Firefox, Edge, Safari)

### Instalação

```bash
# Clone ou navegue até o diretório
cd /home/arthguins/leitorderespostadracker

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev

# Acesso: http://localhost:5173
```

## Estrutura de Arquivos

```
leitorderespostadracker/
├─ src/
│  ├─ App.jsx                 # Componente principal (SPA)
│  ├─ main.jsx                # Ponto de entrada React
│  └─ index.css               # Estilos globais (Tailwind)
│
├─ index.html                 # HTML template
├─ package.json               # Dependências e scripts
├─ vite.config.js             # Configuração Vite
├─ tailwind.config.js         # Configuração Tailwind
├─ postcss.config.js          # Configuração PostCSS
├─ .gitignore
├─ README.md                  # Documentação principal
├─ ARCHITECTURE.md            # Arquitetura técnica
└─ TESTING.md                 # Guia de testes (este arquivo)
```

## Desenvolvimento

### Hot Module Replacement (HMR)
A aplicação suporta HMR automático via Vite. Qualquer mudança em `App.jsx` será refletida instantaneamente no navegador.

```bash
# Terminal mantém processo aberto
npm run dev

# Edite App.jsx e salve
# Mudanças aparecem em tempo real
```

### Console Debugging
```javascript
// Para acessar dados do localStorage no console do navegador:

// Ver gabarito oficial
JSON.parse(localStorage.getItem('dracker_official_key'))

// Ver resultados dos alunos
JSON.parse(localStorage.getItem('dracker_students_results'))

// Limpar dados (cuidado!)
localStorage.clear()

// Adicionar resultado manualmente (teste)
const newResult = {
  id: Date.now(),
  studentName: "João TestDev",
  studentAnswers: ["A", "B", "C", "D", "E"],
  correctCount: 5,
  totalQuestions: 5,
  score: 10.0,
  createdAt: new Date().toISOString()
}
const results = JSON.parse(localStorage.getItem('dracker_students_results')) || []
results.unshift(newResult)
localStorage.setItem('dracker_students_results', JSON.stringify(results))
```

### Build para Produção

```bash
# Generate optimized build
npm run build

# Arquivos gerados em: dist/
# O Vite gera arquivos com hash para cache busting

# Preview localmente
npm run preview
```

## Testando as Funcionalidades

### 1. Teste: Configurar Gabarito
```
1. Clique em "Gabarito" no header
2. Defina quantidade de questões (ex: 10)
3. Marque as respostas corretas (A, B, C, etc.)
4. Clique "Salvar Gabarito"
→ Verifique no console: localStorage.getItem('dracker_official_key')
```

### 2. Teste: Capturar Prova
```
1. Clique em "Câmera" no header
2. Clique no botão circular branco grande
3. Resultado deve aparecer com nota calculada
4. Veja localStorage.getItem('dracker_students_results')
```

### 3. Teste: Dashboard
```
1. Capte múltiplas provas (clique "Nova Leitura" após cada captura)
2. Acumule várias provas
3. Clique "Dashboard"
4. Verifique:
   - Média é calculada corretamente
   - Total de provas aparece
   - Gráfico de taxa de acerto por questão
   - Insight pedagógico está visível
```

### 4. Teste: Exportar Dados
```
1. Vá para Dashboard
2. Clique "Baixar Backup (.json)"
3. Arquivo deve fazer download como: dracker-backup-YYYY-MM-DD.json
4. Abra o arquivo em editor de texto/JSON viewer
5. Verifique estrutura de dados
```

### 5. Teste: Impressão
```
1. Clique "Imprimir" no header
2. Página muda para "Template"
3. Verifique formato A4 com bubbles
4. Clique "Imprimir Agora"
5. Dialog de impressão deve abrir
6. Imprima para PDF ou papel
```

### 6. Teste: Limpar Dados
```
1. Vá para Dashboard
2. Clique "Limpar Dados da Turma"
3. Verifique localStorage.clear() foi chamado
4. Redirecionado para fresh state
5. Todos os dados deletados permanentemente
```

## Casos de Uso para Teste

### Cenário 1: Professor Novo
```javascript
// Novo professor, nenhum dado
localStorage.clear()

// Vai para Config
→ Define gabarito (ex: 5 questões, ABCDE)

// Scanner
→ Captura primeira prova
→ Vê resultado (ex: 8.0/10)

// Dashboard
→ Vê "Média: 8.0" e "Total: 1"
```

### Cenário 2: Turma de 30 Alunos
```javascript
// Professor em método iterativo:

// 1. Setup inicial (5 min)
→ Config gabarito

// 2. Aula de prova (1 hora)
→ ScannerView: clica 30 vezes
→ Simula captura de 30 gabaritos
→ Cada resultado salvo em localStorage

// 3. Análise final (2 min)
→ Dashboard: vê análise completa
→ Exporta JSON para backup

// 4. Impressão (1 min)
→ Template: imprime gabaritos em massa
```

### Cenário 3: Múltiplas Turmas
```javascript
// Usar localStorage da seguinte forma:

// Turma A (Seg-Qua)
localStorage.setItem('dracker_official_key', JSON.stringify({
  questionCount: 10,
  answers: ['A', 'B', 'C', ...]
}))

// ... Coleta dados de 25 alunos ...

// Antes de mudar para Turma B (exportar backup)
const backup = JSON.parse(localStorage.getItem('dracker_students_results'))
// Salve `backup` em arquivo ou outra aba

// Limpe para Turma B
localStorage.clear()

// Configure novo gabarito para Turma B
localStorage.setItem('dracker_official_key', JSON.stringify({
  questionCount: 15,
  answers: [...]
}))
```

## Debugging

### Redux DevTools (Opcional)
Se quiser adicionar Redux DevTools no futuro:

```bash
npm install --save-dev @redux-devtools/extension
```

### React Profiler
Use no Console do navegador:

```javascript
// Performance de renders
window.__REACT_DEVTOOLS_GLOBAL_HOOK__
```

### Network Tab
Em F12 > Network, monitore:
- Sem requisições HTTP (100% offline)
- Apenas localStorage operations
- HMR via WebSocket (Vite)

## Troubleshooting de Desenvolvimento

### Problema: "Cannot find module 'react'"
```bash
# Solução: Reinstale dependências
rm -rf node_modules package-lock.json
npm install
```

### Problema: Port 5173 já em uso
```bash
# Encontre o processo
lsof -i :5173

# Ou mude a porta em vite.config.js
server: { port: 5174 }
```

### Problema: Estilos Tailwind não aparecem
```bash
# Verifique tailwind.config.js tem os paths corretos:
content: [
  "./index.html",
  "./src/**/*.{js,jsx}",  // ← certifique-se disto
]
```

### Problema: localStorage vazio após refresh
```javascript
// Verifique:
// 1. localStorage não foi limpo (Settings > Privacy > Clear Site Data)
// 2. Modo incógnito não persiste localStorage
// 3. Usar modo privado? Use localStorage com expiração
```

## Melhorias Futuras (Roadmap)

### v1.1
- [ ] Integração com câmara real via OCR
- [ ] Feedback pedagógico com IA (Claude API)
- [ ] Autenticação com Google/GitHub
- [ ] Armazenamento em cloud (Firebase)

### v1.2
- [ ] Histórico de turmas arquivadas
- [ ] Relatórios PDF customizados
- [ ] Gráficos avançados (Chart.js)
- [ ] Notificações de performance

### v2.0
- [ ] API backend (Node.js/Express)
- [ ] Database (PostgreSQL)
- [ ] Multi-tenant para escolas
- [ ] Mobile app nativa (React Native)

## Performance & Otimizações

### Atual
- ✅ Vite: Build < 100ms (HMR)
- ✅ React Strict Mode para detectar efeitos colaterais
- ✅ useMemo para dados pesados
- ✅ Lazy cleanup de streams de câmara

### Métricas Esperadas
- FCP: < 500ms
- LCP: < 1s
- Build size: ~ 200KB (com gzip ~60KB)

## Contribuindo

Se quiser adicionar funcionalidades:

1. Create branch: `git checkout -b feature/nova-feature`
2. Commit changes: `git commit -am 'Add nova feature'`
3. Push: `git push origin feature/nova-feature`
4. PR against main

## Resources

- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

**Versão 1.0.0** | Última atualização: Apr 11, 2026
