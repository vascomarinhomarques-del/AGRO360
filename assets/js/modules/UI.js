const icons = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  land: '<path d="M3 20h18M5 20V9l7-5 7 5v11M9 20v-6h6v6"/><path d="m3 9 9 5 9-5"/>',
  leaf: '<path d="M20.8 3.2C14 2.8 8.1 3.6 5 6.7c-3 3-1.8 8.4 2.1 9.2 4.6 1 9-4.6 13.7-12.7Z"/><path d="M3 21c3.2-5.5 6.7-8.2 12-11"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="m9 15 2 2 4-4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 13h4"/>',
  'chevron-down': '<path d="m7 10 5 5 5-5"/>',
  close: '<path d="m18 6-12 12M6 6l12 12"/>',
  plus: '<path d="M12 5v14m-7-7h14"/>',
  arrow: '<path d="M5 12h14m-7-7 7 7-7 7"/>',
  sprout: '<path d="M12 22v-9m0 0C5 13 3 9 3 5c5 0 9 2 9 8Zm0-2c0-5 3-8 9-8 0 5-2 8-9 8Z"/>'
};

export function icon(name) {
  const path = icons[name];
  return path ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>` : '';
}

export function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

const crops = [
  { name: 'Olival tradicional', field: 'Quinta da Ribeira', type: 'Oliveira · Arbequina', emoji: '🫒', progress: 72, date: 'Colheita em outubro', tone: '' },
  { name: 'Vinha do norte', field: 'Herdade do Vale', type: 'Videira · Touriga Nacional', emoji: '🍇', progress: 54, date: 'Floração em curso', tone: 'purple' },
  { name: 'Horta de verão', field: 'Campo Novo', type: 'Tomate · Coração de boi', emoji: '🍅', progress: 38, date: 'Colheita em outubro', tone: 'orange' }
];

const fields = [
  { name: 'Quinta da Ribeira', place: 'Santarém · Ribatejo', area: '12,4 ha', crop: 'Olival tradicional', tone: '' },
  { name: 'Herdade do Vale', place: 'Évora · Alentejo', area: '8,2 ha', crop: 'Vinha do norte', tone: 'gold' },
  { name: 'Campo Novo', place: 'Leiria · Oeste', area: '4,2 ha', crop: 'Horta de verão', tone: 'blue' }
];

function heading(kicker, title, description, action = '') {
  return `<div class="page-heading"><div><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
}

function taskRow(task) {
  return `<div class="task-row${task.completed ? ' is-complete' : ''}" data-task-id="${escapeHTML(task.id)}">
    <input class="task-check" type="checkbox" aria-label="Marcar ${escapeHTML(task.name)} como concluída"${task.completed ? ' checked' : ''}>
    <div class="task-copy"><strong>${escapeHTML(task.name)}</strong><span>${escapeHTML(task.field)}</span></div>
    <span class="task-date${task.today ? ' today' : ''}">${escapeHTML(task.dueLabel)}</span>
  </div>`;
}

function chart() {
  return `<div class="chart-area">
    <div class="chart-legend"><span><i class="legend-dot"></i>Esta semana</span><span><i class="legend-dot muted"></i>Semana anterior</span></div>
    <svg class="chart" viewBox="0 0 600 190" role="img" aria-label="Gráfico ilustrativo da atividade semanal, de segunda-feira a domingo">
      <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6e9b72" stop-opacity=".18"/><stop offset="1" stop-color="#6e9b72" stop-opacity="0"/></linearGradient></defs>
      <path class="grid-line" d="M42 25H590M42 65H590M42 105H590M42 145H590"/>
      <text x="3" y="28">12</text><text x="8" y="68">8</text><text x="8" y="108">4</text><text x="12" y="148">0</text>
      <path d="M50 125 C87 120 101 83 139 92 S196 119 227 88 S286 57 316 72 S374 106 405 70 S462 41 493 58 S550 44 580 32" fill="none" stroke="#d2e0d0" stroke-width="2" stroke-dasharray="4 5"/>
      <path class="area-fill" d="M50 112 C86 104 100 70 139 78 S194 105 227 67 S286 50 316 63 S374 90 405 54 S462 37 493 48 S550 37 580 24 V151 H50Z"/>
      <path class="chart-line" d="M50 112 C86 104 100 70 139 78 S194 105 227 67 S286 50 316 63 S374 90 405 54 S462 37 493 48 S550 37 580 24"/>
      <circle class="chart-point" cx="50" cy="112" r="3.5"/><circle class="chart-point" cx="139" cy="78" r="3.5"/><circle class="chart-point" cx="227" cy="67" r="3.5"/><circle class="chart-point" cx="316" cy="63" r="3.5"/><circle class="chart-point" cx="405" cy="54" r="3.5"/><circle class="chart-point" cx="493" cy="48" r="3.5"/><circle class="chart-point" cx="580" cy="24" r="3.5"/>
      <text x="46" y="174">Seg</text><text x="134" y="174">Ter</text><text x="222" y="174">Qua</text><text x="310" y="174">Qui</text><text x="399" y="174">Sex</text><text x="487" y="174">Sáb</text><text x="574" y="174">Dom</text>
    </svg>
  </div><div class="panel-footer"><span>Atividades agrícolas concluídas</span><strong>+12% esta semana</strong></div>`;
}

function metric(iconName, tone, label, number, unit, note) {
  return `<article class="metric-card"><div class="metric-top"><span class="metric-label">${label}</span><span class="metric-icon ${tone}">${icon(iconName)}</span></div><div class="metric-number">${number}<small>${unit}</small></div><div class="metric-note">${note}</div></article>`;
}

function fieldCard(field) {
  return `<article class="field-card"><div class="field-illustration ${field.tone}"><span class="field-tag">EM PRODUÇÃO</span></div><div class="field-body"><div class="field-title-row"><h2>${field.name}</h2><span>${field.area}</span></div><p>${field.place}</p><div class="field-stats"><div><span>Cultura principal</span><strong>${field.crop}</strong></div><div><span>Estado</span><strong>Saudável</strong></div></div></div></article>`;
}

function cropCard(crop) {
  return `<article class="crop-card"><div class="crop-body"><div class="crop-top"><span class="crop-emoji ${crop.tone}">${crop.emoji}</span><div><h2 class="crop-title">${crop.name}</h2><small>${crop.type}</small></div></div><p>${crop.field}</p><div class="progress-label"><span>Progresso da época</span><strong>${crop.progress}%</strong></div><div class="progress-track"><div class="progress-value" style="width:${crop.progress}%"></div></div><div class="crop-meta"><span>Próximo marco</span><strong>${crop.date}</strong></div></div></article>`;
}

function renderDashboard(state) {
  const pending = state.tasks.filter((task) => !task.completed).length;
  const pendingToday = state.tasks.filter((task) => task.today && !task.completed).length;
  const tasks = state.tasks.filter((task) => !task.completed).slice(0, 4);
  const date = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const today = date.charAt(0).toLocaleUpperCase('pt-PT') + date.slice(1);
  return `${heading(today.toLocaleUpperCase('pt-PT'), 'Painel geral', 'Um olhar simples sobre o que está a acontecer na tua exploração.', '<button class="button button-primary" type="button" data-action="new-activity">' + icon('plus') + 'Nova atividade</button>')}
    <section class="welcome-banner"><div class="welcome-copy"><span class="eyebrow">A TUA EXPLORAÇÃO, NUM SÓ LUGAR</span><h2>Bom dia, agricultor.</h2><p>As tuas culturas estão a crescer bem. Aqui tens o resumo do que merece a tua atenção hoje.</p></div><div class="weather-summary"><span class="weather-sun">${icon('sun')}</span><div class="weather-text"><strong>22°</strong><span>Sol com nuvens</span></div><div class="weather-extra">10%<br>prob. chuva</div></div></section>
    <section class="metrics-grid" aria-label="Resumo da exploração">
      ${metric('land', 'green', 'Área gerida', '24,8', 'ha', '<span class="positive">3 explorações</span> registadas')}
      ${metric('leaf', 'gold', 'Culturas ativas', '3', 'culturas', '<span class="positive">Em desenvolvimento</span>')}
      ${metric('calendar', 'blue', 'Tarefas pendentes', String(pending), 'tarefas', pendingToday ? `<span class="highlight">${pendingToday} ${pendingToday === 1 ? 'tarefa' : 'tarefas'} para hoje</span> na exploração` : 'Sem tarefas previstas para hoje')}
      ${metric('sprout', 'rose', 'Próxima colheita', '18', 'out', 'Tomate · Campo Novo')}
    </section>
    <section class="dashboard-grid">
      <article class="panel"><div class="panel-header"><div><h2>Ritmo da exploração</h2><p>Atividades realizadas ao longo da semana</p></div><a class="text-link" href="#atividades" data-view="atividades">Ver atividades ${icon('arrow')}</a></div>${chart()}</article>
      <article class="panel"><div class="panel-header"><div><h2>Para fazer</h2><p>As próximas tarefas da tua lista</p></div><a class="text-link" href="#atividades" data-view="atividades">Ver todas ${icon('arrow')}</a></div><div class="tasks-list">${tasks.length ? tasks.map(taskRow).join('') : '<div class="empty-state"><strong>Tudo em dia!</strong>Não tens tarefas pendentes.</div>'}</div></article>
    </section>`;
}

function renderFields() {
  return `${heading('A TUA TERRA', 'Explorações', 'Conhece os teus campos e acompanha cada parcela.', '<button class="button button-primary" type="button" data-action="new-activity">' + icon('plus') + 'Nova atividade</button>')}
    <section class="section-grid" aria-label="Lista de explorações">${fields.map(fieldCard).join('')}</section>`;
}

function renderCrops() {
  return `${heading('CICLO AGRÍCOLA', 'Culturas', 'Acompanha o desenvolvimento e os próximos marcos de cada cultura.')}
    <section class="section-grid" aria-label="Lista de culturas">${crops.map(cropCard).join('')}</section>`;
}

function renderActivities(state) {
  const sorted = [...state.tasks].sort((a, b) => Number(a.completed) - Number(b.completed));
  const rows = sorted.map((task) => {
    const dateParts = task.dueLabel.split(' ');
    const status = task.completed ? 'done' : task.today ? 'late' : '';
    const statusText = task.completed ? 'Concluída' : task.today ? 'Hoje' : 'Planeada';
    return `<div class="activity-row" data-task-id="${escapeHTML(task.id)}" data-searchable="${escapeHTML(`${task.name} ${task.field}`.toLocaleLowerCase('pt-PT'))}"><div class="activity-date"><strong>${escapeHTML(dateParts[0] || '—')}</strong><span>${escapeHTML(dateParts[1] || '')}</span></div><div class="activity-details"><strong>${escapeHTML(task.name)}</strong><span>${escapeHTML(task.field)}</span></div><label class="activity-status ${status}"><input class="task-check" type="checkbox" aria-label="Marcar ${escapeHTML(task.name)} como concluída"${task.completed ? ' checked' : ''}> ${statusText}</label></div>`;
  }).join('');
  return `${heading('PLANEAMENTO', 'Atividades', 'Uma lista clara para saberes sempre o que vem a seguir.', '<button class="button button-primary" type="button" data-action="new-activity">' + icon('plus') + 'Nova atividade</button>')}
    <section class="panel activity-panel"><div class="panel-header"><div><h2>Agenda da exploração</h2><p>${state.tasks.length} atividades registadas</p></div><span class="task-date">${state.tasks.filter((task) => !task.completed).length} pendentes</span></div>${rows || '<div class="empty-state">Ainda não tens atividades registadas.</div>'}</section>`;
}

export function renderView(view, state) {
  if (view === 'exploracoes') return renderFields();
  if (view === 'culturas') return renderCrops();
  if (view === 'atividades') return renderActivities(state);
  return renderDashboard(state);
}

export function updateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((element) => {
    element.innerHTML = icon(element.dataset.icon);
  });
}