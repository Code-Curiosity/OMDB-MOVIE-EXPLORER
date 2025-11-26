
import React, { useState, useCallback, useEffect, useRef } from "react";
import SearchBar from "./components/SearchBar";
import ResultsGrid from "./components/ResultsGrid";
import DetailPanel from "./components/DetailPanel";
import FavoritesPage from "./pages/Favorites";
import {
  searchMovies,
  listFavorites,
  getMovieById,
  addFavoriteByImdb,
  deleteFavorite
} from "./api/api";
import useIsMobile from "./hooks/useIsMobile";
import "./App.css";

/* Simple toast system */
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = (text, ttl = 2500) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ttl);
  };
  const Toasts = () => (
    <div className="toasts" aria-live="polite">
      {toasts.map(t => <div key={t.id} className="toast">{t.text}</div>)}
    </div>
  );
  return { push, Toasts };
}

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile(700);

  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);
  const { push, Toasts } = useToasts();

  // FAVORITE MAP for quick lookup
  const favSet = new Set(favorites.map(f => f.imdbID));

  // load favorites
  const refreshFavorites = useCallback(async () => {
    try {
      const favs = await listFavorites();
      setFavorites(favs || []);
    } catch (e) {
      console.warn("Failed to load favorites", e);
    }
  }, []);

  useEffect(() => { refreshFavorites(); }, [refreshFavorites]);

  // search + append logic
  const doSearch = useCallback(async (q, p = 1, append = false) => {
    if (!q || q.trim().length === 0) {
      setResults([]);
      setTotalResults(0);
      setPage(1);
      return;
    }
    setLoading(true);
    loadingRef.current = true;
    try {
      const data = await searchMovies(q, p);
      if (data && data.Search) {
        if (append) {
          setResults(prev => {
            const seen = new Set(prev.map(r => r.imdbID));
            const merged = [...prev];
            for (const item of data.Search) {
              if (!seen.has(item.imdbID)) {
                merged.push(item);
                seen.add(item.imdbID);
              }
            }
            return merged;
          });
        } else {
          setResults(data.Search);
        }
        setTotalResults(Number(data.totalResults || 0));
        setPage(p);
      } else {
        if (!append) setResults([]);
        setTotalResults(0);
      }
    } catch (err) {
      console.error("Search failed", err);
      if (!append) setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // infinite scroll observer (sentinel)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !loadingRef.current && results.length > 0 && results.length < totalResults) {
          const next = page + 1;
          doSearch(query, next, true);
        }
      });
    }, { rootMargin: "400px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [results, totalResults, page, query, doSearch]);

  // called by SearchBar
  const handleSearch = useCallback((q) => {
    setQuery(q);
    doSearch(q, 1, false);
  }, [doSearch]);

  // open details
  async function openDetails(id) {
    setOpenId(id);
    setDetailData(null);
    try {
      const d = await getMovieById(id);
      setDetailData(d);
    } catch (e) {
      console.error("Failed to fetch detail", e);
    }
  }

  function closeDetails() {
    setOpenId(null);
    setDetailData(null);
  }

  // toggle favorite (add if not present, else delete)
  const toggleFavorite = useCallback(async (imdbID) => {
    try {
      const exists = favSet.has(imdbID);
      if (exists) {
        // remove
        await deleteFavorite(imdbID);
        push("Removed from favorites");
      } else {
        // optimistic UI add minimal placeholder
        setFavorites(prev => {
          if (prev.find(f => f.imdbID === imdbID)) return prev;
          return [...prev, { imdbID, title: "Saving…", releaseYear: "", poster: "" }];
        });
        await addFavoriteByImdb(imdbID);
        push("Added to favorites");
      }
      // guarantee consistent state from server
      await refreshFavorites();
    } catch (e) {
      console.error("toggleFavorite failed", e);
      push("Action failed");
      await refreshFavorites();
    }
  }, [favSet, push, refreshFavorites]);

  // Bulk delete helper (called by FavoritesPage)
  const bulkDelete = useCallback(async (ids) => {
    try {
      await Promise.all(ids.map(id => deleteFavorite(id).catch(e => console.warn(e))));
      push(`Deleted ${ids.length} favorite(s)`);
      await refreshFavorites();
    } catch (e) {
      console.error("Bulk delete failed", e);
      push("Bulk delete failed");
      await refreshFavorites();
    }
  }, [push, refreshFavorites]);

  return (
    <div>
      <div className="container">
        <h1 className="site-title">OMDb Movie Explorer</h1>

        <SearchBar onSearch={handleSearch} />

        {/* Collapsible Favorites (moved above results) */}
        <FavoritesPage
          favorites={favorites}
          onOpen={openDetails}
          onDeleteOne={async (id) => { await deleteFavorite(id); await refreshFavorites(); }}
          onBulkDelete={bulkDelete}
          onRefresh={refreshFavorites}
        />

        {loading && <div className="loading">Loading…</div>}

        <ResultsGrid
          items={results}
          favoritesMap={favSet}
          onToggleFavorite={toggleFavorite}
          onOpen={openDetails}
        />

        {/* sentinel for infinite scroll */}
        <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />

        <div style={{ height: 30 }} />
      </div>

      <DetailPanel
        imdbID={openId}
        open={!!openId}
        onClose={closeDetails}
        isMobile={isMobile}
        data={detailData}
        onToggleFavorite={toggleFavorite}
        isFavorited={favSet.has(openId)}
      />

      {/* render the toasts component from the hook */}
      <Toasts />
    </div>
  );
}

