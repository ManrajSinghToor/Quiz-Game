export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function getApiBase() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes("example.com")) {
    return envUrl.replace(/\/$/, "");
  }
  return window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://quiz-game-backend-9tet.onrender.com';
}
