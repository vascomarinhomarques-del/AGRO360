import { escapeHTML, renderView, updateIcons } from './modules/UI.js';
import { getCurrentUser, signOut } from './modules/auth.js';
import { loadRecords, recordModules, saveRecords } from './modules/records.js';

const dateFormatter = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short' });

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function daysFromToday(value) {
  const today = new Date(`${dateKey(new Date())}T00:00:00Z`);
  const dueDate = new Date(`${value}T00:00:00Z`);
  return Math.round((dueDate - today) / 86400000);
}

function legacyDateKey(label) {
  if (label === 'Hoje') return dateKey(new Date());
  const numericMatch = /^(\d{1,2})\/(\d{1,2})$/.exec(label);
  const textMatch = /^(\d{1,2})\s+([a-z]{3})\.?$/i.exec(label);
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  if (!numericMatch && !textMatch) return null;
  const day = Number((numericMatch || textMatch)[1]);
  const month = numericMatch
    ? Number(numericMatch[2]) - 1
    : months.indexOf(textMatch[2].toLocaleLowerCase('pt-PT'));
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;

  const currentYear = new Date().getFullYear();
  const candidates = [currentYear - 1, currentYear, currentYear + 1]
    .map((year) => new Date(year, month, day, 12))
    .filter((date) => date.getMonth() === month && date.getDate() === day);
  candidates.sort((a, b) => Math.abs(daysFromToday(dateKey(a))) - Math.abs(daysFromToday(dateKey(b))));
  return candidates.length ? dateKey(candidates[0]) : null;
}

function updateDueDateInfo(task) {
  const difference = daysFromToday(task.dueDate);
  task.today = difference === 0;
  task.overdue = difference < 0 && !task.completed;
  task.dueLabel = difference === 0
    ? 'Hoje'
    : dateFormatter.format(new Date(`${task.dueDate}T12:00:00`)).replace('.', '');
  return task;
}

function createTask(id, name, field, daysFromNow, completed = false) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysFromNow);
  return updateDueDateInfo({ id, name, field, dueDate: dateKey(dueDate), completed });
}

const initialTasks = [
  createTask('irrigation', 'Verificar sistema de rega', 'Quinta da Ribeira', 0),
  createTask('vineyard', 'Inspecionar videiras', 'Herdade do Vale', 0),
  createTask('soil', 'Analisar humidade do solo', 'Campo Novo', 3),
  createTask('fertilizer', 'Preparar fertilização', 'Quinta da Ribeira', 4),
  createTask('pruning', 'Registar poda da vinha', 'Herdade do Vale', -1, true),
  createTask('seedlings', 'Verificar viveiro', 'Campo Novo', 5)
];

const storageKey = 'agro360.activities';
const content = document.querySelector('#app-content');
const modal = document.querySelector('#activity-modal');
const form = document.querySelector('#activity-form');
const recordModal = document.querySelector('#record-modal');
const recordForm = document.querySelector('#record-form');
const toast = document.querySelector('#toast');
const currentUser = getCurrentUser();
let activeView = 'dashboard';
let toastTimer;

if (currentUser) {
  const initials = currentUser.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('pt-PT');
  document.querySelector('#profile-initials').textContent = initials || 'AG';
  document.querySelector('#profile-name').textContent = currentUser.name;
  document.querySelector('#profile-email').textContent = currentUser.email;
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return initialTasks;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every((task) => task
      && typeof task.id === 'string'
      && typeof task.name === 'string'
      && typeof task.field === 'string'
      && typeof task.completed === 'boolean'
      && (isDateKey(task.dueDate) || (typeof task.dueLabel === 'string' && typeof task.today === 'boolean')))) {
      throw new Error('Os dados guardados das atividades não têm o formato esperado.');
    }
    return parsed.map((task) => {
      const dueDate = isDateKey(task.dueDate) ? task.dueDate : legacyDateKey(task.dueLabel);
      if (!dueDate) throw new Error(`Não foi possível interpretar a data da atividade "${task.name}".`);
      return updateDueDateInfo({ ...task, dueDate });
    });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof DOMException && error.name === 'SecurityError')) {
      console.error('Não foi possível carregar as atividades guardadas.', error);
      return initialTasks;
    }
    throw error;
  }
}

const state = { tasks: loadTasks(), records: loadRecords() };

function saveTasks() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state.tasks));
    return true;
  } catch (error) {
    console.error('Não foi possível guardar as atividades neste dispositivo.', error);
    return false;
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function setView(view) {
  const allowed = ['dashboard', 'exploracoes', 'culturas', 'atividades', ...Object.keys(recordModules)];
  activeView = allowed.includes(view) ? view : 'dashboard';
  state.tasks.forEach(updateDueDateInfo);
  const labels = {
    dashboard: 'Painel geral',
    exploracoes: 'Explorações',
    culturas: 'Culturas',
    atividades: 'Atividades',
    ...Object.fromEntries(Object.entries(recordModules).map(([id, module]) => [id, module.title]))
  };
  document.querySelector('#current-section').textContent = labels[activeView];
  document.title = `${labels[activeView]} | AGRO360`;
  document.querySelectorAll('[data-view]').forEach((link) => {
    const selected = link.dataset.view === activeView;
    link.classList.toggle('is-active', selected);
    if (selected) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  content.innerHTML = renderView(activeView, state);
  updateIcons(content);
  const pendingCount = state.tasks.filter((task) => !task.completed).length;
  document.querySelector('#pending-count').textContent = String(pendingCount);
  document.querySelector('#pending-count').hidden = pendingCount === 0;
  const search = document.querySelector('#global-search');
  if (search.value) filterSearch(search.value);
}

function filterSearch(query) {
  const normalized = query.trim().toLocaleLowerCase('pt-PT');
  const rows = [...content.querySelectorAll('[data-searchable]')];
  rows.forEach((row) => {
    row.hidden = normalized !== '' && !row.dataset.searchable.includes(normalized);
  });
  content.querySelectorAll('.empty-state:not(.search-empty-state)').forEach((emptyState) => {
    emptyState.hidden = normalized !== '';
  });
  content.querySelector('.search-empty-state')?.remove();
  if (normalized && !rows.some((row) => !row.hidden)) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state search-empty-state';
    emptyState.textContent = 'Não foram encontrados resultados para esta pesquisa.';
    content.append(emptyState);
  }
}

function openModal() {
  modal.hidden = false;
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  document.querySelector('#activity-date').value = localDate;
  document.querySelector('#activity-name').focus();
}

function closeModal() {
  modal.hidden = true;
  form.reset();
}

function openRecordModal(moduleId, record = null) {
  const module = recordModules[moduleId];
  if (!module) return;
  document.querySelector('#record-modal-eyebrow').textContent = module.eyebrow;
  document.querySelector('#record-modal-title').textContent = record ? `Editar ${module.title.toLocaleLowerCase('pt-PT')}` : `Novo registo de ${module.title.toLocaleLowerCase('pt-PT')}`;
  recordForm.dataset.module = moduleId;
  recordForm.innerHTML = `<input type="hidden" name="id" value="${record ? escapeHTML(record.id) : ''}">${module.fields.map((field) => {
    const id = `record-${field.name}`;
    const value = record ? record[field.name] : '';
    const required = field.required === false ? '' : ' required';
    const attributes = `${field.min ? ` min="${field.min}"` : ''}${field.step ? ` step="${field.step}"` : ''}${field.placeholder ? ` placeholder="${escapeHTML(field.placeholder)}"` : ''}`;
    const control = field.type === 'select'
      ? `<select class="form-input" id="${id}" name="${field.name}"${required}>${field.options.map((option) => `<option${value === option ? ' selected' : ''}>${option}</option>`).join('')}</select>`
      : `<input class="form-input" id="${id}" name="${field.name}" type="${field.type || 'text'}"${attributes}${required} value="${escapeHTML(value)}">`;
    return `<label class="field-label" for="${id}">${field.label}</label>${control}`;
  }).join('')}<div class="dialog-actions"><button class="button button-quiet close-record-modal" type="button">Cancelar</button><button class="button button-primary" type="submit">${record ? 'Guardar alterações' : 'Adicionar registo'}</button></div>`;
  recordModal.hidden = false;
  recordForm.querySelector('input:not([type="hidden"]), select')?.focus();
  updateIcons(recordModal);
}

function closeRecordModal() {
  recordModal.hidden = true;
  recordForm.reset();
  delete recordForm.dataset.module;
}

document.addEventListener('click', (event) => {
  const viewLink = event.target.closest('[data-view]');
  if (viewLink) {
    event.preventDefault();
    setView(viewLink.dataset.view);
    history.pushState(null, '', `#${activeView}`);
    return;
  }
  if (event.target.closest('[data-action="new-activity"]')) {
    openModal();
    return;
  }
  const newRecordButton = event.target.closest('[data-action="new-record"]');
  if (newRecordButton) {
    openRecordModal(newRecordButton.dataset.module);
    return;
  }
  const editRecordButton = event.target.closest('[data-action="edit-record"]');
  if (editRecordButton) {
    const record = state.records[editRecordButton.dataset.module]?.find((item) => item.id === editRecordButton.closest('[data-record-id]')?.dataset.recordId);
    if (record) openRecordModal(editRecordButton.dataset.module, record);
    return;
  }
  const deleteRecordButton = event.target.closest('[data-action="delete-record"]');
  if (deleteRecordButton) {
    const moduleId = deleteRecordButton.dataset.module;
    const row = deleteRecordButton.closest('[data-record-id]');
    const record = state.records[moduleId]?.find((item) => item.id === row?.dataset.recordId);
    if (record && window.confirm('Queres eliminar este registo? Esta ação não pode ser desfeita.')) {
      state.records[moduleId] = state.records[moduleId].filter((item) => item.id !== record.id);
      const saved = saveRecords(state.records);
      setView(activeView);
      showToast(saved ? 'Registo eliminado.' : 'Registo eliminado, mas não foi possível guardá-lo.');
    }
    return;
  }
  if (event.target.closest('.close-modal') || event.target === modal) {
    closeModal();
    return;
  }
  if (event.target.closest('.close-record-modal') || event.target === recordModal) {
    closeRecordModal();
    return;
  }
  if (event.target.closest('.notification-button')) showToast('Não tens notificações novas.');
  if (event.target.closest('[data-action="logout"]')) {
    try {
      signOut();
      location.replace('./login.html');
    } catch (error) {
      console.error('Não foi possível terminar sessão.', error);
      showToast(error.message || 'Não foi possível terminar sessão.');
    }
  }
});

window.addEventListener('popstate', () => setView(location.hash.slice(1)));

document.addEventListener('change', (event) => {
  if (!event.target.matches('.task-check')) return;
  const row = event.target.closest('[data-task-id]');
  const task = state.tasks.find((item) => item.id === row?.dataset.taskId);
  if (!task) {
    event.target.checked = false;
    return;
  }
  task.completed = event.target.checked;
  const saved = saveTasks();
  setView(activeView);
  const message = task.completed ? 'Atividade marcada como concluída.' : 'Atividade reaberta.';
  showToast(saved ? message : 'Alteração aplicada, mas não foi possível guardá-la.');
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const values = new FormData(form);
  const dueDate = String(values.get('date'));
  if (!isDateKey(dueDate)) {
    showToast('A data indicada não é válida.');
    return;
  }
  state.tasks.unshift(updateDueDateInfo({
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: String(values.get('name')).trim(),
    field: String(values.get('field')),
    dueDate,
    completed: false
  }));
  const saved = saveTasks();
  closeModal();
  setView('atividades');
  showToast(saved ? 'Nova atividade adicionada.' : 'Atividade adicionada, mas não foi possível guardá-la.');
});

recordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!recordForm.reportValidity()) return;
  const moduleId = recordForm.dataset.module;
  const module = recordModules[moduleId];
  if (!module) {
    showToast('Não foi possível identificar a área deste registo.');
    return;
  }

  const values = new FormData(recordForm);
  const id = String(values.get('id')) || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const record = Object.fromEntries([
    ['id', id],
    ...module.fields.map((field) => [field.name, String(values.get(field.name) || '').trim()])
  ]);
  const existingIndex = state.records[moduleId].findIndex((item) => item.id === id);
  if (existingIndex === -1) state.records[moduleId].unshift(record);
  else state.records[moduleId][existingIndex] = record;

  const saved = saveRecords(state.records);
  closeRecordModal();
  setView(moduleId);
  showToast(saved ? (existingIndex === -1 ? 'Registo adicionado.' : 'Registo atualizado.') : 'Alteração aplicada, mas não foi possível guardá-la.');
});

document.querySelector('#global-search').addEventListener('input', (event) => filterSearch(event.target.value));
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    document.querySelector('#global-search').focus();
  }
  if (event.key === 'Escape' && !modal.hidden) closeModal();
  if (event.key === 'Escape' && !recordModal.hidden) closeRecordModal();
});

updateIcons();
setView(location.hash.slice(1));

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.error('Não foi possível registar o modo offline.', error);
  });
}