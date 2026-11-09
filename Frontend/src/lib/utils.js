export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getApiBase() {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8080';
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes("example.com")) {
    return envUrl.replace(/\/$/, "");
  }
  return 'https://quiz-game-backend-9tet.onrender.com';
}
