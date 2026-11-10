const usersKey = 'agro360.users';
const sessionKey = 'agro360.session';
const passwordIterations = 210000;
const encoder = new TextEncoder();

function requireCrypto() {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) {
    throw new Error('A autenticação requer um navegador atualizado e uma ligação segura (HTTPS ou localhost).');
  }
}

function readUsers() {
  let saved;
  try {
    saved = localStorage.getItem(usersKey);
  } catch (error) {
    throw new Error('Não foi possível aceder às contas guardadas neste navegador.', { cause: error });
  }
  if (!saved) return [];

  let users;
  try {
    users = JSON.parse(saved);
  } catch (error) {
    throw new Error('Os dados das contas guardadas estão inválidos.', { cause: error });
  }
  if (!Array.isArray(users) || !users.every((user) => user
    && typeof user.name === 'string'
    && typeof user.email === 'string'
    && typeof user.salt === 'string'
    && typeof user.passwordHash === 'string'
    && Number.isInteger(user.iterations))) {
    throw new Error('Os dados das contas guardadas não têm o formato esperado.');
  }
  return users;
}

function toBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function hashPassword(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: fromBase64(salt),
    iterations,
    hash: 'SHA-256'
  }, key, 256);
  return toBase64(new Uint8Array(bits));
}

function saveSession(email) {
  try {
    sessionStorage.setItem(sessionKey, email);
  } catch (error) {
    throw new Error('Não foi possível iniciar a sessão neste navegador.', { cause: error });
  }
}

export async function registerUser(name, email, password) {
  requireCrypto();
  const users = readUsers();
  const normalizedEmail = email.trim().toLocaleLowerCase('pt-PT');
  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('Já existe uma conta registada com este e-mail.');
  }

  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = toBase64(saltBytes);
  const passwordHash = await hashPassword(password, salt, passwordIterations);
  const user = {
    name: name.trim(),
    email: normalizedEmail,
    salt,
    passwordHash,
    iterations: passwordIterations
  };

  try {
    localStorage.setItem(usersKey, JSON.stringify([...users, user]));
  } catch (error) {
    throw new Error('Não foi possível guardar a conta neste navegador.', { cause: error });
  }
  saveSession(normalizedEmail);
  return user;
}

export async function signIn(email, password) {
  requireCrypto();
  const normalizedEmail = email.trim().toLocaleLowerCase('pt-PT');
  const user = readUsers().find((item) => item.email === normalizedEmail);
  if (!user) throw new Error('E-mail ou palavra-passe incorretos.');

  const passwordHash = await hashPassword(password, user.salt, user.iterations);
  if (passwordHash !== user.passwordHash) throw new Error('E-mail ou palavra-passe incorretos.');
  saveSession(user.email);
  return user;
}

export function getCurrentUser() {
  let email;
  try {
    email = sessionStorage.getItem(sessionKey);
  } catch (error) {
    throw new Error('Não foi possível consultar a sessão neste navegador.', { cause: error });
  }
  if (!email) return null;
  return readUsers().find((user) => user.email === email) ?? null;
}

export function isAuthenticated() {
  return getCurrentUser() !== null;
}

export function signOut() {
  try {
    sessionStorage.removeItem(sessionKey);
  } catch (error) {
    throw new Error('Não foi possível terminar a sessão neste navegador.', { cause: error });
  }
}
