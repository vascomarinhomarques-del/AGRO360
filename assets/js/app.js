import { renderView, updateIcons } from './modules/UI.js';

const initialTasks = [
  { id: 'irrigation', name: 'Verificar sistema de rega', field: 'Quinta da Ribeira', dueLabel: 'Hoje', today: true, completed: false },
  { id: 'vineyard', name: 'Inspecionar videiras', field: 'Herdade do Vale', dueLabel: 'Hoje', today: true, completed: false },
  { id: 'soil', name: 'Analisar humidade do solo', field: 'Campo Novo', dueLabel: '13 out', today: false, completed: false },
  { id: 'fertilizer', name: 'Preparar fertilização', field: 'Quinta da Ribeira', dueLabel: '14 out', today: false, completed: false },
  { id: 'pruning', name: 'Registar poda da vinha', field: 'Herdade do Vale', dueLabel: '10 out', today: false, completed: true },
  { id: 'seedlings', name: 'Verificar viveiro', field: 'Campo Novo', dueLabel: '15 out', today: false, completed: false }
];

const storageKey = 'agro360.activities';
const content = document.querySelector('#app-content');
const modal = document.querySelector('#activity-modal');
const form = document.querySelector('#activity-form');
const toast = document.querySelector('#toast');
let activeView = 'dashboard';
let toastTimer;

function loadTasks() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return initialTasks;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every((task) => task && typeof task.id === 'string' && typeof task.name === 'string' && typeof task.field === 'string' && typeof task.dueLabel === 'string' && typeof task.today === 'boolean' && typeof task.completed === 'boolean')) {
      throw new Error('Os dados guardados das atividades não têm o formato esperado.');
    }
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof DOMException && error.name === 'SecurityError')) {
      console.error('Não foi possível carregar as atividades guardadas.', error);
      return initialTasks;
    }
    throw error;
  }
}

const state = { tasks: loadTasks() };

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
  const allowed = ['dashboard', 'exploracoes', 'culturas', 'atividades'];
  activeView = allowed.includes(view) ? view : 'dashboard';
  const labels = { dashboard: 'Painel geral', exploracoes: 'Explorações', culturas: 'Culturas', atividades: 'Atividades' };
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
  content.querySelectorAll('[data-searchable]').forEach((row) => {
    row.hidden = normalized !== '' && !row.dataset.searchable.includes(normalized);
  });
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

document.addEventListener('click', (event) => {
  const viewLink = event.target.closest('[data-view]');
  if (viewLink) {
    event.preventDefault();
    setView(viewLink.dataset.view);
    history.replaceState(null, '', `#${activeView}`);
    return;
  }
  if (event.target.closest('[data-action="new-activity"]')) {
    openModal();
    return;
  }
  if (event.target.closest('.close-modal') || event.target === modal) {
    closeModal();
    return;
  }
  if (event.target.closest('.notification-button')) showToast('Não tens notificações novas.');
});

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
  const date = new Date(`${values.get('date')}T12:00:00`);
  const today = new Date();
  const dueToday = date.toDateString() === today.toDateString();
  const dateLabel = date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }).replace('.', '');
  state.tasks.unshift({
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: String(values.get('name')).trim(),
    field: String(values.get('field')),
    dueLabel: dueToday ? 'Hoje' : dateLabel,
    today: dueToday,
    completed: false
  });
  const saved = saveTasks();
  closeModal();
  setView('atividades');
  showToast(saved ? 'Nova atividade adicionada.' : 'Atividade adicionada, mas não foi possível guardá-la.');
});

document.querySelector('#global-search').addEventListener('input', (event) => filterSearch(event.target.value));
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    document.querySelector('#global-search').focus();
  }
  if (event.key === 'Escape' && !modal.hidden) closeModal();
});

updateIcons();
setView(location.hash.slice(1));

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.error('Não foi possível registar o modo offline.', error);
  });
}