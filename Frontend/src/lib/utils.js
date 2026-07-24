export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getApiBase() {
  return import.meta.env.VITE_API_URL || 
         (window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://quiz-game-backend-9tet.onrender.com');
}

