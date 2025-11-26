// const BASE = import.meta.env.VITE_API_BASE_URL

// async function request(path, opts = {}) {
//   const url = `${BASE}${path}`;
//   const res = await fetch(url, {
//     headers: { 'Content-Type': 'application/json' },
//     ...opts
//   });
//   if (!res.ok) {
//     const text = await res.text();
//     // try to parse JSON error
//     try { return Promise.reject({ status: res.status, body: JSON.parse(text) }); }
//     catch { return Promise.reject({ status: res.status, body: text }); }
//   }
//   return res.json();
// }

// export function searchMovies(query, page = 1, type) {
//   const q = new URLSearchParams({ s: query, page: String(page) });
//   if (type) q.set('type', type);
//   return request(`/api/search?${q.toString()}`);
// }

// export function getMovieById(imdbID) {
//   return request(`/api/movie/${encodeURIComponent(imdbID)}`);
// }

// export function listFavorites() {
//   return request('/api/favorites');
// }

// export function getFavorite(imdbID) {
//   return request(`/api/favorites/${encodeURIComponent(imdbID)}`);
// }

// export function addFavoriteByImdb(imdbID) {
//   return request('/api/favorites', { method: 'POST', body: JSON.stringify({ imdbID }) });
// }

// export function addFavoriteByTitle(title) {
//   return request('/api/favorites', { method: 'POST', body: JSON.stringify({ title }) });
// }

// export function deleteFavorite(imdbID) {
//   return request(`/api/favorites/${encodeURIComponent(imdbID)}`, { method: 'DELETE' });
// }

// client/src/api/api.js
const BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });

  const text = await res.text();
  if (!res.ok) {
    try {
      return Promise.reject({ status: res.status, body: JSON.parse(text) });
    } catch {
      return Promise.reject({ status: res.status, body: text });
    }
  }

  try { return JSON.parse(text); } catch { return text; }
}

export function searchMovies(query, page = 1, type) {
  const q = new URLSearchParams({ s: query, page: String(page) });
  if (type) q.set("type", type);
  return request(`/api/search?${q.toString()}`);
}

export function getMovieById(imdbID) {
  return request(`/api/movie/${encodeURIComponent(imdbID)}`);
}

export function listFavorites() {
  return request("/api/favorites");
}

export function getFavorite(imdbID) {
  return request(`/api/favorites/${encodeURIComponent(imdbID)}`);
}

export function addFavoriteByImdb(imdbID) {
  return request("/api/favorites", { method: "POST", body: JSON.stringify({ imdbID }) });
}

export function addFavoriteByTitle(title) {
  return request("/api/favorites", { method: "POST", body: JSON.stringify({ title }) });
}

export function deleteFavorite(imdbID) {
  return request(`/api/favorites/${encodeURIComponent(imdbID)}`, { method: "DELETE" });
}
