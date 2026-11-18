import { recordModules } from './records.js';

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
  sprout: '<path d="M12 22v-9m0 0C5 13 3 9 3 5c5 0 9 2 9 8Zm0-2c0-5 3-8 9-8 0 5-2 8-9 8Z"/>',
  cloud: '<path d="M20 16.2A4.5 4.5 0 0 0 18.5 7.5 6 6 0 0 0 7 9a4 4 0 0 0 .5 8H19"/>',
  rain: '<path d="M20 13.2A4.5 4.5 0 0 0 18.5 4.5 6 6 0 0 0 7 6a4 4 0 0 0 .5 8H19"/><path d="m8 17-1 3m6-3-1 3m6-3-1 3"/>',
  snow: '<path d="M20 13.2A4.5 4.5 0 0 0 18.5 4.5 6 6 0 0 0 7 6a4 4 0 0 0 .5 8H19"/><path d="M8 17v4m-2-2h4m-2-2 2 2-2 2m7-4v4m-2-2h4m-2-2 2 2-2 2"/>',
  storm: '<path d="M20 13.2A4.5 4.5 0 0 0 18.5 4.5 6 6 0 0 0 7 6a4 4 0 0 0 .5 8H19"/><path d="m13 14-3 5h4l-2 4"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2"/>',
  machine: '<path d="M3 19h18M5 19v-5l4-3h6l4 3v5M9 11V7h5l3 4M3 14h3m12 0h3"/><circle cx="8" cy="19" r="2"/><circle cx="17" cy="19" r="2"/>',
  animal: '<path d="M8 11c-2-2-5-1-5 2 0 2 2 3 4 2m9-4c2-2 5-1 5 2 0 2-2 3-4 2M8 11c0-3 2-5 4-5s4 2 4 5v5c0 3-2 5-4 5s-4-2-4-5z"/><path d="M10 14h.01M14 14h.01m-2 2v1"/>',
  stock: '<path d="M3 7h18l-2 13H5L3 7Zm0 0 2-4h14l2 4M9 11v5m6-5v5"/>',
  people: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-8a4 4 0 0 1 0 8"/>'
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

function searchableText(...values) {
  return values.join(' ').toLocaleLowerCase('pt-PT');
}

function formatDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function heading(kicker, title, description, action = '') {
  return `<div class="page-heading"><div><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
}

function taskRow(task) {
  return `<div class="task-row${task.completed ? ' is-complete' : ''}" data-task-id="${escapeHTML(task.id)}" data-searchable="${escapeHTML(searchableText(task.name, task.field))}">
    <input class="task-check" type="checkbox" aria-label="Marcar ${escapeHTML(task.name)} como concluída"${task.completed ? ' checked' : ''}>
    <div class="task-copy"><strong>${escapeHTML(task.name)}${task.demo ? '<small class="demo-badge">Demonstração</small>' : ''}</strong><span>${escapeHTML(task.field)}</span></div>
    <span class="task-date${task.today ? ' today' : task.overdue ? ' overdue' : ''}">${escapeHTML(task.dueLabel)}</span>
  </div>`;
}

function metric(iconName, tone, label, number, unit, note) {
  return `<article class="metric-card"><div class="metric-top"><span class="metric-label">${label}</span><span class="metric-icon ${tone}">${icon(iconName)}</span></div><div class="metric-number">${number}<small>${unit}</small></div><div class="metric-note">${note}</div></article>`;
}

function fieldCard(field, state) {
  const parcelCount = state.records.parcelas.filter((parcel) => parcel.fieldId === field.id).length;
  const tag = field.demo ? 'DADOS DE DEMONSTRAÇÃO' : field.status;
  return `<article class="field-card" data-searchable="${escapeHTML(searchableText(field.name, field.place, field.area, field.crop, field.status))}"><div class="field-illustration ${escapeHTML(field.tone)}"><span class="field-tag">${escapeHTML(tag)}</span></div><div class="field-body"><div class="field-title-row"><h2>${escapeHTML(field.name)}</h2><span>${escapeHTML(field.area)}</span></div><p>${escapeHTML(field.place)}</p><div class="field-stats"><div><span>Cultura principal</span><strong>${escapeHTML(field.crop)}</strong></div><div><span>Parcelas</span><strong>${parcelCount}</strong></div></div><div class="record-actions"><button class="button button-quiet" type="button" data-action="edit-field" data-field-id="${escapeHTML(field.id)}">Editar</button><button class="button button-quiet record-delete" type="button" data-action="delete-field" data-field-id="${escapeHTML(field.id)}">Eliminar</button></div></div></article>`;
}

function cropCard(crop, state) {
  const parcel = state.records.parcelas.find((item) => item.id === crop.parcelId);
  const field = parcel && state.fields.find((item) => item.id === parcel.fieldId);
  const location = parcel ? `${parcel.name}${field ? ` · ${field.name}` : ''}` : 'Parcela não indicada';
  const plantingDate = formatDate(crop.plantingDate);
  return `<article class="crop-card" data-record-id="${escapeHTML(crop.id)}" data-searchable="${escapeHTML(searchableText(crop.name, crop.type, location, crop.status))}"><div class="crop-body"><div class="crop-top"><span class="crop-emoji">${icon('leaf')}</span><div><h2 class="crop-title">${escapeHTML(crop.name)}</h2><small>${escapeHTML(crop.type)}</small></div></div><p>${escapeHTML(location)}</p><div class="crop-meta"><span>Estado</span><strong>${escapeHTML(crop.status)}</strong></div><div class="crop-meta"><span>Plantação</span><strong>${escapeHTML(plantingDate)}</strong></div><div class="crop-meta"><span>Produção prevista</span><strong>${escapeHTML(crop.expectedProduction || 'Não indicada')}</strong></div><div class="record-actions"><button class="button button-quiet" type="button" data-action="edit-record" data-module="culturas">Editar</button><button class="button button-quiet record-delete" type="button" data-action="delete-record" data-module="culturas">Eliminar</button></div></div></article>`;
}

function renderDashboard(state) {
  const pending = state.tasks.filter((task) => !task.completed).length;
  const pendingToday = state.tasks.filter((task) => task.today && !task.completed).length;
  const tasks = state.tasks
    .filter((task) => !task.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);
  const livestock = state.records.animais.reduce((total, record) => total + (Number(record.quantity) || 0), 0);
  const expenses = state.records.financas.filter((record) => record.type === 'Despesa')
    .reduce((total, record) => total + (Number(record.value) || 0), 0);
  const revenue = state.records.financas.filter((record) => record.type === 'Receita')
    .reduce((total, record) => total + (Number(record.value) || 0), 0);
  const balance = (revenue - expenses).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const recentNotes = [...state.records.caderno].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  const hasDemoData = state.fields.some((field) => field.demo) || state.tasks.some((task) => task.demo);
  const date = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const today = date.charAt(0).toLocaleUpperCase('pt-PT') + date.slice(1);
  return `${heading(today.toLocaleUpperCase('pt-PT'), 'Painel geral', 'Um olhar simples sobre o que está a acontecer na tua exploração.', '<button class="button button-primary" type="button" data-action="new-activity">' + icon('plus') + 'Nova atividade</button>')}
    ${hasDemoData ? '<p class="demo-notice">Os registos marcados como demonstração são exemplos e não representam dados reais da tua exploração.</p>' : ''}
    <section class="welcome-banner"><div class="welcome-copy"><span class="eyebrow">A TUA EXPLORAÇÃO, NUM SÓ LUGAR</span><h2>Bem-vindo ao AGRO360.</h2><p>Consulta os dados registados e acompanha tarefas, culturas e movimentos financeiros num só lugar.</p></div><section class="weather-summary" aria-label="Meteorologia atual"><span class="weather-sun" id="weather-icon">${icon('sun')}</span><div class="weather-text"><strong id="weather-temperature">--°C</strong><span id="weather-condition" role="status">A carregar meteorologia...</span><label class="weather-location-label" for="weather-field"><span class="visually-hidden">Exploração para consultar</span><select id="weather-field" aria-label="Exploração para consultar meteorologia">${state.fields.map((field) => `<option value="${escapeHTML(field.id)}"${field.id === state.weatherFieldId ? ' selected' : ''}>${escapeHTML(field.name)}</option>`).join('')}</select></label><small class="weather-updated"><span id="weather-updated">A consultar dados atuais</span> · <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a></small></div><div class="weather-extra"><span id="weather-precipitation">--%</span><br>prob. chuva<button class="weather-refresh" id="weather-refresh" type="button" aria-label="Atualizar meteorologia" title="Atualizar meteorologia">${icon('refresh')}</button></div></section></section>
    <section class="metrics-grid" aria-label="Resumo da exploração">
      ${metric('land', 'green', 'Explorações', String(state.fields.length), 'registos', 'Propriedades registadas')}
      ${metric('land', 'gold', 'Parcelas', String(state.records.parcelas.length), 'registos', 'Parcelas associadas')}
      ${metric('leaf', 'green', 'Culturas', String(state.records.culturas.length), 'registos', 'Culturas registadas')}
      ${metric('calendar', 'blue', 'Tarefas pendentes', String(pending), 'tarefas', pendingToday ? `<span class="highlight">${pendingToday} ${pendingToday === 1 ? 'tarefa' : 'tarefas'} para hoje</span>` : 'Sem tarefas para hoje')}
      ${metric('animal', 'gold', 'Animais', String(livestock), 'animais', `${state.records.animais.length} registos de pecuária`)}
      ${metric('machine', 'blue', 'Máquinas', String(state.records.maquinas.length), 'registos', 'Equipamentos registados')}
      ${metric('people', 'green', 'Funcionários', String(state.records.funcionarios.length), 'registos', 'Elementos registados')}
      ${metric('stock', 'rose', 'Saldo registado', balance, '€', `${revenue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} € receitas · ${expenses.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} € despesas`)}
    </section>
    <section class="module-shortcuts" aria-labelledby="module-shortcuts-title">
      <div class="section-heading"><div><span class="eyebrow">GESTÃO DA EXPLORAÇÃO</span><h2 id="module-shortcuts-title">As tuas áreas</h2></div></div>
      <div class="module-shortcuts-grid">${[
        { id: 'exploracoes', title: 'Explorações', description: 'Talhões e terrenos', icon: 'land' },
        ...Object.entries(recordModules).map(([id, module]) => ({ id, ...module })),
        { id: 'atividades', title: 'Atividades', description: 'Planeamento e tarefas', icon: 'calendar' }
      ].map((module) => `<a class="module-shortcut" href="#${module.id}" data-view="${module.id}"><span class="module-shortcut-icon">${icon(module.icon)}</span><span class="module-shortcut-copy"><strong>${escapeHTML(module.title)}</strong><small>${escapeHTML(module.description)}</small></span><span class="module-shortcut-arrow">${icon('arrow')}</span></a>`).join('')}</div>
    </section>
    <section class="dashboard-grid">
      <article class="panel"><div class="panel-header"><div><h2>Atividade recente</h2><p>Últimos registos do caderno de campo</p></div><a class="text-link" href="#caderno" data-view="caderno">Ver caderno ${icon('arrow')}</a></div><div class="tasks-list">${recentNotes.length ? recentNotes.map((note) => {
        const parcel = state.records.parcelas.find((item) => item.id === note.parcelId);
        const field = parcel && state.fields.find((item) => item.id === parcel.fieldId);
        const dateLabel = formatDate(note.date);
        return `<div class="task-row"><span class="activity-date">${escapeHTML(dateLabel)}</span><div class="task-copy"><strong>${escapeHTML(note.activity)}</strong><span>${escapeHTML(parcel ? `${parcel.name}${field ? ` · ${field.name}` : ''}` : 'Parcela removida')}</span></div></div>`;
      }).join('') : '<div class="empty-state"><strong>Sem atividade registada</strong>Os registos do caderno de campo vão aparecer aqui.</div>'}</div></article>
      <article class="panel"><div class="panel-header"><div><h2>Para fazer</h2><p>As próximas tarefas da tua lista</p></div><a class="text-link" href="#atividades" data-view="atividades">Ver todas ${icon('arrow')}</a></div><div class="tasks-list">${tasks.length ? tasks.map(taskRow).join('') : '<div class="empty-state"><strong>Tudo em dia!</strong>Não tens tarefas pendentes.</div>'}</div></article>
    </section>`;
}

function renderFields(state) {
  return `${heading('A TUA TERRA', 'Explorações', 'Conhece os teus campos e acompanha cada parcela.', '<button class="button button-primary" type="button" data-action="new-field">' + icon('plus') + 'Nova exploração</button>')}
    <section class="section-grid" aria-label="Lista de explorações">${state.fields.map((field) => fieldCard(field, state)).join('') || '<div class="empty-state"><strong>Ainda sem explorações</strong>Adiciona a primeira exploração para começar.</div>'}</section>`;
}

function renderCrops(state) {
  const crops = state.records.culturas;
  return `${heading('CICLO AGRÍCOLA', 'Culturas', 'Acompanha as culturas associadas às parcelas.', `<button class="button button-primary" type="button" data-action="new-record" data-module="culturas">${icon('plus')}Adicionar cultura</button>`)}
    <section class="section-grid" aria-label="Lista de culturas">${crops.map((crop) => cropCard(crop, state)).join('') || '<div class="empty-state"><strong>Ainda sem culturas registadas</strong>Adiciona uma parcela antes de registar uma cultura.</div>'}</section>`;
}

function renderActivities(state) {
  const sorted = [...state.tasks].sort((a, b) => Number(a.completed) - Number(b.completed) || a.dueDate.localeCompare(b.dueDate));
  const rows = sorted.map((task) => {
    const dateParts = task.dueLabel.split(' ');
    const status = task.completed ? 'done' : task.overdue ? 'late' : '';
    const statusText = task.completed ? 'Concluída' : task.overdue ? 'Atrasada' : task.today ? 'Hoje' : 'Planeada';
    return `<div class="activity-row" data-task-id="${escapeHTML(task.id)}" data-searchable="${escapeHTML(searchableText(task.name, task.field))}"><div class="activity-date"><strong>${escapeHTML(dateParts[0] || '—')}</strong><span>${escapeHTML(dateParts[1] || '')}</span></div><div class="activity-details"><strong>${escapeHTML(task.name)}${task.demo ? '<small class="demo-badge">Demonstração</small>' : ''}</strong><span>${escapeHTML(task.field)}</span></div><label class="activity-status ${status}"><input class="task-check" type="checkbox" aria-label="Marcar ${escapeHTML(task.name)} como concluída"${task.completed ? ' checked' : ''}> ${statusText}</label><div class="task-actions"><button class="button button-quiet" type="button" data-action="edit-task">Editar</button><button class="button button-quiet record-delete" type="button" data-action="delete-task">Eliminar</button></div></div>`;
  }).join('');
  return `${heading('PLANEAMENTO', 'Atividades', 'Uma lista clara para saberes sempre o que vem a seguir.', '<button class="button button-primary" type="button" data-action="new-activity">' + icon('plus') + 'Nova atividade</button>')}
    <section class="panel activity-panel"><div class="panel-header"><div><h2>Agenda da exploração</h2><p>${state.tasks.length} atividades registadas</p></div><span class="task-date">${state.tasks.filter((task) => !task.completed).length} pendentes</span></div>${rows || '<div class="empty-state">Ainda não tens atividades registadas.</div>'}</section>`;
}

function recordValue(moduleId, field, record, state) {
  const value = record[field.name];
  if (!value) return 'Não indicado';
  if (field.name === 'fieldId') return state.fields.find((item) => item.id === value)?.name || 'Exploração não encontrada';
  if (field.name === 'parcelId') {
    const parcel = state.records.parcelas.find((item) => item.id === value);
    if (!parcel) return 'Parcela não encontrada';
    const fieldRecord = state.fields.find((item) => item.id === parcel.fieldId);
    return `${parcel.name}${fieldRecord ? ` · ${fieldRecord.name}` : ''}`;
  }
  if (moduleId === 'stock' && field.name === 'value') {
    return `${Number(value).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  }
  if (moduleId === 'financas' && field.name === 'value') {
    return `${Number(value).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  }
  if (moduleId === 'parcelas' && field.name === 'area') {
    return `${Number(value).toLocaleString('pt-PT', { maximumFractionDigits: 2 })} ha`;
  }
  if (field.type === 'date') {
    return formatDate(value);
  }
  if (moduleId === 'stock' && field.name === 'quantity') return `${value} ${record.unit}`;
  return value;
}

function renderRecords(moduleId, state) {
  const module = recordModules[moduleId];
  const records = state.records[moduleId];
  const entries = records.map((record) => {
    const searchable = searchableText(...module.fields.map((field) => recordValue(moduleId, field, record, state)));
    const details = module.fields.map((field) => `<div class="record-detail"><span>${escapeHTML(field.label)}</span><strong>${escapeHTML(recordValue(moduleId, field, record, state))}</strong></div>`).join('');
    return `<article class="record-card" data-record-id="${escapeHTML(record.id)}" data-searchable="${escapeHTML(searchable)}">
      <div class="record-card-content">${details}</div>
      <div class="record-actions"><button class="button button-quiet" type="button" data-action="edit-record" data-module="${moduleId}">Editar</button><button class="button button-quiet record-delete" type="button" data-action="delete-record" data-module="${moduleId}">Eliminar</button></div>
    </article>`;
  }).join('');
  return `${heading(module.eyebrow, module.title, module.description, `<button class="button button-primary" type="button" data-action="new-record" data-module="${moduleId}">${icon('plus')}Adicionar registo</button>`)}
    <section class="records-section" aria-label="Registos de ${escapeHTML(module.title)}">
      <div class="records-summary"><h2>Registos</h2><span>${records.length} ${records.length === 1 ? 'registo' : 'registos'}</span></div>
      ${entries ? `<div class="records-grid">${entries}</div>` : '<div class="empty-state records-empty"><strong>Ainda sem registos</strong>Adiciona o primeiro registo desta área para começar.</div>'}
    </section>`;
}

export function renderView(view, state) {
  if (view === 'exploracoes') return renderFields(state);
  if (view === 'culturas') return renderCrops(state);
  if (view === 'atividades') return renderActivities(state);
  if (Object.hasOwn(recordModules, view)) return renderRecords(view, state);
  return renderDashboard(state);
}

export function updateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((element) => {
    element.innerHTML = icon(element.dataset.icon);
  });
}