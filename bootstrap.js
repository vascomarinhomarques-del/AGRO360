import { isAuthenticated } from './modules/auth.js';

try {
  if (isAuthenticated()) {
    import('./app.js').catch((error) => {
      console.error('Não foi possível iniciar a aplicação.', error);
    });
  } else {
    location.replace('./login.html');
  }
} catch (error) {
  console.error('Não foi possível validar a sessão.', error);
  location.replace('./login.html');
}
