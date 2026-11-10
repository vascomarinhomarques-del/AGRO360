import { isAuthenticated, registerUser, signIn } from './modules/auth.js';

const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const message = document.querySelector('#auth-message');
const loginPanel = document.querySelector('#login-panel');
const registerPanel = document.querySelector('#register-panel');

function showMessage(text, isError = true) {
  message.textContent = text;
  message.classList.toggle('is-error', isError);
  message.classList.toggle('is-success', !isError);
}

function setAuthView(view) {
  const showLogin = view === 'login';
  loginPanel.hidden = !showLogin;
  registerPanel.hidden = showLogin;
  message.textContent = '';
  message.classList.remove('is-error', 'is-success');
  document.querySelector('#auth-title').textContent = showLogin ? 'Bem-vindo de volta' : 'Criar conta';
  document.querySelector('#auth-description').textContent = showLogin
    ? 'Entra na tua conta para continuares a gerir a exploração.'
    : 'Regista os teus dados para começares a utilizar o AGRO360.';
  document.title = `${showLogin ? 'Entrar' : 'Registo'} | AGRO360`;
}

document.querySelectorAll('[data-auth-view]').forEach((control) => {
  control.addEventListener('click', (event) => {
    event.preventDefault();
    setAuthView(control.dataset.authView);
  });
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;
  const submitButton = loginForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  showMessage('A validar os teus dados…', false);
  try {
    const values = new FormData(loginForm);
    await signIn(String(values.get('email')), String(values.get('password')));
    location.replace('./index.html');
  } catch (error) {
    console.error('Não foi possível iniciar sessão.', error);
    showMessage(error.message || 'Ocorreu um erro ao iniciar sessão.');
  } finally {
    submitButton.disabled = false;
  }
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!registerForm.reportValidity()) return;
  const values = new FormData(registerForm);
  const password = String(values.get('password'));
  if (password !== String(values.get('confirm-password'))) {
    showMessage('As palavras-passe não coincidem.');
    registerForm.querySelector('#register-confirm-password').focus();
    return;
  }

  const submitButton = registerForm.querySelector('[type="submit"]');
  submitButton.disabled = true;
  showMessage('A criar a tua conta…', false);
  try {
    await registerUser(String(values.get('name')), String(values.get('email')), password);
    location.replace('./index.html');
  } catch (error) {
    console.error('Não foi possível criar a conta.', error);
    showMessage(error.message || 'Ocorreu um erro ao criar a conta.');
  } finally {
    submitButton.disabled = false;
  }
});

try {
  if (isAuthenticated()) location.replace('./index.html');
} catch (error) {
  console.error('Não foi possível consultar a sessão.', error);
  showMessage(error.message || 'Não foi possível consultar a sessão.');
}
