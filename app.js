import { escapeHTML, icon, renderView, updateIcons } from './modules/UI.js';
import { getCurrentUser, signOut } from './modules/auth.js';
import { loadRecords, recordModules, saveRecords } from './modules/records.js';
import { loadFields, saveFields } from './modules/fields.js';
import { getCurrentWeather, refreshInterval, requestTimeout } from './modules/weather.js';

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
  return updateDueDateInfo({ id, name, field, dueDate: dateKey(dueDate), completed, demo: true });
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
const fieldModal = document.querySelector('#field-modal');
const fieldForm = document.querySelector('#field-form');
const toast = document.querySelector('#toast');
const currentUser = getCurrentUser();
let activeView = 'dashboard';
let toastTimer;
let weatherRequestId = 0;
let weatherController = null;

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
      && (task.demo === undefined || typeof task.demo === 'boolean')
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

const state = { tasks: loadTasks(), records: loadRecords(), fields: loadFields(), weatherFieldId: '' };
state.weatherFieldId = state.fields[0]?.id || '';

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

async function refreshWeather() {
  const fieldSelect = document.querySelector('#weather-field');
  if (!fieldSelect) return;

  const field = state.fields.find((item) => item.id === fieldSelect.value);
  const temperature = document.querySelector('#weather-temperature');
  const condition = document.querySelector('#weather-condition');
  const precipitation = document.querySelector('#weather-precipitation');
  const updated = document.querySelector('#weather-updated');
  const refreshButton = document.querySelector('#weather-refresh');
  if (!field) {
    condition.textContent = 'Adiciona uma exploração para consultar a meteorologia.';
    return;
  }

  weatherController?.abort();
  const controller = new AbortController();
  weatherController = controller;
  const requestId = ++weatherRequestId;
  const timeout = window.setTimeout(() => controller.abort(), requestTimeout);
  refreshButton.disabled = true;
  condition.textContent = 'A atualizar…';
  updated.textContent = 'A consultar dados atuais';

  try {
    const weather = await getCurrentWeather(field.place, controller.signal);
    if (requestId !== weatherRequestId) return;
    temperature.textContent = `${weather.temperature}°C`;
    condition.textContent = weather.description;
    precipitation.textContent = weather.precipitationProbability === null
      ? '—%'
      : `${weather.precipitationProbability}%`;
    document.querySelector('#weather-icon').innerHTML = icon(weather.icon);
    updated.textContent = `Dados às ${weather.validAt}`;
  } catch (error) {
    if (requestId !== weatherRequestId) return;
    console.error('Não foi possível atualizar a meteorologia.', error);
    condition.textContent = error.name === 'AbortError'
      ? 'A meteorologia demorou demasiado tempo a responder.'
      : error instanceof TypeError
        ? 'Não foi possível ligar ao serviço meteorológico.'
        : error.message || 'Meteorologia indisponível. Tenta novamente.';
    updated.textContent = 'Verifica a ligação à internet';
  } finally {
    window.clearTimeout(timeout);
    if (requestId === weatherRequestId) {
      refreshButton.disabled = false;
      weatherController = null;
    }
  }
}

function setView(view) {
  const allowed = ['dashboard', 'exploracoes', 'culturas', 'atividades', ...Object.keys(recordModules)];
  activeView = allowed.includes(view) ? view : 'dashboard';
  if (!state.fields.some((field) => field.id === state.weatherFieldId)) {
    state.weatherFieldId = state.fields[0]?.id || '';
  }
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
  if (activeView === 'dashboard') refreshWeather();
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

function openModal(task = null) {
  updateActivityFieldOptions();
  document.querySelector('#modal-title').textContent = task ? 'Editar atividade' : 'Nova atividade';
  form.querySelector('[type="submit"]').innerHTML = `${icon('plus')}${task ? 'Guardar alterações' : 'Adicionar atividade'}`;
  form.elements.id.value = task?.id || '';
  form.elements.name.value = task?.name || '';
  form.elements.field.value = task?.field || state.fields[0]?.name || '';
  modal.hidden = false;
  form.elements.date.value = task?.dueDate || dateKey(new Date());
  form.elements.name.focus();
}

function updateActivityFieldOptions() {
  const select = document.querySelector('#activity-field');
  const selectedField = select.value;
  select.replaceChildren(...state.fields.map((field) => {
    const option = document.createElement('option');
    option.value = field.name;
    option.textContent = field.name;
    return option;
  }));
  if (state.fields.some((field) => field.name === selectedField)) select.value = selectedField;
}

function closeModal() {
  modal.hidden = true;
  form.reset();
  document.querySelector('#modal-title').textContent = 'Nova atividade';
  form.querySelector('[type="submit"]').innerHTML = `${icon('plus')}Adicionar atividade`;
}

function openFieldModal(field = null) {
  const values = fieldForm.elements;
  document.querySelector('#field-modal-title').textContent = field ? 'Editar exploração' : 'Nova exploração';
  fieldForm.querySelector('[type="submit"]').innerHTML = `${icon('plus')}${field ? 'Guardar alterações' : 'Adicionar exploração'}`;
  values.id.value = field?.id || '';
  values.name.value = field?.name || '';
  values.place.value = field?.place || '';
  values.area.value = field ? Number.parseFloat(field.area.replace(',', '.')) : '';
  values.crop.value = field?.crop === 'Por definir' ? '' : (field?.crop || '');
  values.status.value = field?.status || 'Saudável';
  fieldModal.hidden = false;
  values.name.focus();
}

function closeFieldModal() {
  fieldModal.hidden = true;
  fieldForm.reset();
  document.querySelector('#field-modal-title').textContent = 'Nova exploração';
  fieldForm.querySelector('[type="submit"]').innerHTML = `${icon('plus')}Adicionar exploração`;
}

function openRecordModal(moduleId, record = null) {
  const module = recordModules[moduleId];
  if (!module) return;
  const fields = module.fields.map((field) => {
    if (field.optionSource === 'fields') {
      return { ...field, options: state.fields.map((item) => ({ value: item.id, label: item.name })) };
    }
    if (field.optionSource === 'parcels') {
      return {
        ...field,
        options: state.records.parcelas.map((item) => {
          const owner = state.fields.find((property) => property.id === item.fieldId);
          return { value: item.id, label: `${item.name}${owner ? ` · ${owner.name}` : ''}` };
        })
      };
    }
    return field;
  });
  const unavailableRelation = fields.find((field) => field.optionSource && field.options.length === 0);
  if (unavailableRelation) {
    showToast(unavailableRelation.optionSource === 'fields'
      ? 'Regista primeiro uma exploração para adicionar parcelas.'
      : 'Regista primeiro uma parcela nesta exploração.');
    setView(unavailableRelation.optionSource === 'fields' ? 'exploracoes' : 'parcelas');
    return;
  }
  document.querySelector('#record-modal-eyebrow').textContent = module.eyebrow;
  document.querySelector('#record-modal-title').textContent = record ? `Editar ${module.title.toLocaleLowerCase('pt-PT')}` : `Novo registo de ${module.title.toLocaleLowerCase('pt-PT')}`;
  recordForm.dataset.module = moduleId;
  recordForm.innerHTML = `<input type="hidden" name="id" value="${record ? escapeHTML(record.id) : ''}">${fields.map((field) => {
    const id = `record-${field.name}`;
    const value = record ? record[field.name] : '';
    const required = field.required === false ? '' : ' required';
    const attributes = `${field.min ? ` min="${field.min}"` : ''}${field.step ? ` step="${field.step}"` : ''}${field.placeholder ? ` placeholder="${escapeHTML(field.placeholder)}"` : ''}`;
    const control = field.type === 'select'
      ? `<select class="form-input" id="${id}" name="${field.name}"${required}>${field.optionSource ? `<option value=""${value ? '' : ' selected'} disabled>Seleciona uma opção</option>` : ''}${field.options.map((option) => {
        const optionValue = typeof option === 'string' ? option : option.value;
        const optionLabel = typeof option === 'string' ? option : option.label;
        return `<option value="${escapeHTML(optionValue)}"${value === optionValue ? ' selected' : ''}>${escapeHTML(optionLabel)}</option>`;
      }).join('')}</select>`
      : field.type === 'textarea'
        ? `<textarea class="form-input form-textarea" id="${id}" name="${field.name}"${required}${attributes}>${escapeHTML(value)}</textarea>`
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
  const editTaskButton = event.target.closest('[data-action="edit-task"]');
  if (editTaskButton) {
    const task = state.tasks.find((item) => item.id === editTaskButton.closest('[data-task-id]')?.dataset.taskId);
    if (task) openModal(task);
    return;
  }
  const deleteTaskButton = event.target.closest('[data-action="delete-task"]');
  if (deleteTaskButton) {
    const task = state.tasks.find((item) => item.id === deleteTaskButton.closest('[data-task-id]')?.dataset.taskId);
    if (task && window.confirm('Queres eliminar esta atividade?')) {
      state.tasks = state.tasks.filter((item) => item.id !== task.id);
      const saved = saveTasks();
      setView('atividades');
      showToast(saved ? 'Atividade eliminada.' : 'Atividade eliminada, mas não foi possível guardá-la.');
    }
    return;
  }
  if (event.target.closest('#weather-refresh')) {
    refreshWeather();
    return;
  }
  if (event.target.closest('[data-action="new-field"]')) {
    openFieldModal();
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
  const editFieldButton = event.target.closest('[data-action="edit-field"]');
  if (editFieldButton) {
    const field = state.fields.find((item) => item.id === editFieldButton.dataset.fieldId);
    if (field) openFieldModal(field);
    return;
  }
  const deleteFieldButton = event.target.closest('[data-action="delete-field"]');
  if (deleteFieldButton) {
    const field = state.fields.find((item) => item.id === deleteFieldButton.dataset.fieldId);
    if (field) {
      const hasParcels = state.records.parcelas.some((parcel) => parcel.fieldId === field.id);
      const hasTasks = state.tasks.some((task) => task.field === field.name);
      if (hasParcels || hasTasks) {
        showToast('Não é possível eliminar esta exploração enquanto tiver parcelas ou tarefas associadas.');
      } else if (window.confirm(`Queres eliminar a exploração "${field.name}"?`)) {
        state.fields = state.fields.filter((item) => item.id !== field.id);
        const saved = saveFields(state.fields);
        updateActivityFieldOptions();
        setView('exploracoes');
        showToast(saved ? 'Exploração eliminada.' : 'Exploração eliminada, mas não foi possível guardá-la.');
      }
    }
    return;
  }
  const deleteRecordButton = event.target.closest('[data-action="delete-record"]');
  if (deleteRecordButton) {
    const moduleId = deleteRecordButton.dataset.module;
    const row = deleteRecordButton.closest('[data-record-id]');
    const record = state.records[moduleId]?.find((item) => item.id === row?.dataset.recordId);
    const hasDependencies = moduleId === 'parcelas' && record
      && Object.keys(recordModules).some((relatedModule) => relatedModule !== 'parcelas'
        && state.records[relatedModule].some((item) => item.parcelId === record.id));
    if (record && hasDependencies) {
      showToast('Não é possível eliminar esta parcela enquanto tiver culturas, registos ou movimentos financeiros associados.');
    } else if (record && window.confirm('Queres eliminar este registo? Esta ação não pode ser desfeita.')) {
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
  if (event.target.closest('.close-field-modal') || event.target === fieldModal) {
    closeFieldModal();
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
  if (event.target.matches('#weather-field')) {
    state.weatherFieldId = event.target.value;
    refreshWeather();
    return;
  }
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
  const id = String(values.get('id'));
  const dueDate = String(values.get('date'));
  if (!isDateKey(dueDate)) {
    showToast('A data indicada não é válida.');
    return;
  }
  const updatedTask = updateDueDateInfo({
    id: id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: String(values.get('name')).trim(),
    field: String(values.get('field')),
    dueDate,
    completed: id ? state.tasks.find((task) => task.id === id)?.completed ?? false : false,
    demo: false
  });
  const existingIndex = state.tasks.findIndex((task) => task.id === id);
  if (existingIndex < 0) state.tasks.unshift(updatedTask);
  else state.tasks[existingIndex] = updatedTask;
  const saved = saveTasks();
  closeModal();
  setView('atividades');
  showToast(saved ? (id ? 'Atividade atualizada.' : 'Nova atividade adicionada.') : 'Alteração aplicada, mas não foi possível guardá-la.');
});

fieldForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!fieldForm.reportValidity()) return;

  const values = new FormData(fieldForm);
  const id = String(values.get('id'));
  const name = String(values.get('name')).trim();
  if (state.fields.some((field) => field.id !== id && field.name.toLocaleLowerCase('pt-PT') === name.toLocaleLowerCase('pt-PT'))) {
    showToast('Já existe uma exploração com esse nome.');
    document.querySelector('#field-name').focus();
    return;
  }

  const area = Number(values.get('area'));
  const updatedField = {
    id: id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    place: String(values.get('place')).trim(),
    area: `${area.toLocaleString('pt-PT', { maximumFractionDigits: 2 })} ha`,
    crop: String(values.get('crop')).trim() || 'Por definir',
    status: String(values.get('status')),
    tone: '',
    demo: false
  };
  const existingIndex = state.fields.findIndex((field) => field.id === id);
  let tasksSaved = true;
  if (existingIndex < 0) state.fields.push(updatedField);
  else {
    const oldName = state.fields[existingIndex].name;
    state.fields[existingIndex] = updatedField;
    state.tasks.forEach((task) => {
      if (task.field === oldName) task.field = name;
    });
    tasksSaved = saveTasks();
  }
  const saved = saveFields(state.fields);
  updateActivityFieldOptions();
  closeFieldModal();
  setView('exploracoes');
  if (!saved) showToast('Alteração aplicada, mas não foi possível guardá-la.');
  else if (!tasksSaved) showToast('Exploração atualizada, mas não foi possível guardar o nome nas tarefas.');
  else showToast(id ? 'Exploração atualizada.' : 'Nova exploração adicionada.');
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
  if (event.key === 'Escape' && !fieldModal.hidden) closeFieldModal();
});

updateIcons();
setView(location.hash.slice(1));
window.setInterval(() => {
  if (!document.hidden) refreshWeather();
}, refreshInterval);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.error('Não foi possível registar o modo offline.', error);
  });
}