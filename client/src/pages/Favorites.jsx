import React, { useEffect, useState } from "react";
import { listFavorites, deleteFavorite } from "../api/api";

export default function FavoritesPage({
  favorites: initialFavs = [],
  onOpen,
  onDeleteOne,
  onBulkDelete,
  onRefresh
}) {
  // initialize from props to avoid immediate setState inside effect
  const [items, setItems] = useState(initialFavs || []);
  const [selected, setSelected] = useState(new Set());
  const [collapsed, setCollapsed] = useState(false);

  // keep items in sync when parent passes new favorites
  useEffect(() => {
    if (initialFavs && initialFavs.length) setItems(initialFavs);
  }, [initialFavs]);

  // initial load if nothing provided from parent
  useEffect(() => {
    if (!initialFavs || initialFavs.length === 0) {
      (async () => {
        try {
          const data = await listFavorites();
          setItems(data || []);
        } catch (e) {
          console.warn("Failed to load favorites", e);
        }
      })();
    }
    // intentionally run only on mount if initialFavs empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep selection set cleared if favorites list changes (avoid stale selection)
  useEffect(() => {
    // compute new set of ids
    const present = new Set((items || []).map(f => f.imdbID));
    const next = new Set(Array.from(selected).filter(id => present.has(id)));
    // only update if changed (avoid unnecessary renders)
    if (next.size !== selected.size || Array.from(next).some(id => !selected.has(id))) {
      setSelected(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  function toggleSelect(id, e) {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelected(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  async function deleteOne(id, e) {
    if (e && e.stopPropagation) e.stopPropagation();
    if (onDeleteOne) {
      await onDeleteOne(id);
      if (onRefresh) onRefresh();
    } else {
      try {
        await deleteFavorite(id);
        const refreshed = await listFavorites();
        setItems(refreshed || []);
      } catch (err) {
        console.error(err);
        alert("Delete failed");
      }
    }
  }

  async function bulkDeleteHandler() {
    const list = Array.from(selected);
    if (list.length === 0) return;
    if (onBulkDelete) {
      await onBulkDelete(list);
      setSelected(new Set());
      if (onRefresh) onRefresh();
    } else {
      await Promise.all(list.map(id => deleteFavorite(id).catch(e => console.warn(e))));
      setSelected(new Set());
      const refreshed = await listFavorites();
      setItems(refreshed || []);
    }
  }

  return (
    <section className="fav-list" style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>Favorites</h3>
        <div>
          <button className="btn-outline" onClick={() => { setCollapsed(s => !s); }}>
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {selected.size > 0 && (
            <div style={{ marginBottom: 8 }}>
              <button className="btn-outline" onClick={bulkDeleteHandler}>Delete selected ({selected.size})</button>
            </div>
          )}

          <div className="results-grid fav-grid">
            {(items || []).map(it => (
              <div
                key={it.imdbID}
                className="card"
                onClick={() => onOpen ? onOpen(it.imdbID) : null}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") onOpen ? onOpen(it.imdbID) : null; }}
              >
                <div style={{ position: "relative" }}>
                  <img
                    className="poster"
                    src={it.poster && it.poster !== "N/A" ? it.poster : "/placeholder.png"}
                    alt={it.title}
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "stretch", gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, lineHeight: 1.1 }}>{it.title}</div>
                    <div className="card-meta">{it.releaseYear || it.year}</div>
                  </div>

                  <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(it.imdbID)}
                      onClick={(e) => { e.stopPropagation(); toggleSelect(it.imdbID, e); }}
                      onChange={() => {}}
                      aria-label={`Select ${it.title}`}
                    />
                    <button
                      className="btn-outline"
                      onClick={(e) => deleteOne(it.imdbID, e)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
