
import React, { useEffect, useCallback } from "react";
import PropTypes from "prop-types";

export default function DetailPanel({
  imdbID,
  open,
  onClose,
  isMobile,
  data,
  onToggleFavorite,
  isFavorited,
  children
}) {
  // lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // close on Escape key
  useEffect(() => {
    function handler(e) {
      if (e.key === "Escape" && open) onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleFav = useCallback((e) => {
    e.stopPropagation();
    if (typeof onToggleFavorite === "function" && imdbID) onToggleFavorite(imdbID);
  }, [onToggleFavorite, imdbID]);

  const className = `detail-panel ${open ? "open" : ""} ${isMobile ? "overlay" : ""}`;

  return (
    <aside
      className={className}
      aria-hidden={!open}
      role="dialog"
      aria-label="Movie details"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="detail-header" style={{ position: "relative" }}>
        <button
          className="btn-outline btn-close"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Close details"
        >
          ✕
        </button>
      </div>

      <div className="detail-content" onClick={(e) => e.stopPropagation()}>
        {data ? (
          <div style={{ display: "flex", gap: 20 }}>
            <img
              src={data.Poster && data.Poster !== "N/A" ? data.Poster : "/placeholder.png"}
              alt={data.Title || "Poster"}
              style={{ width: 200, height: 300, objectFit: "cover", borderRadius: 10 }}
              loading="lazy"
            />

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
                <div>
                  <h2 style={{ margin: "0 0 8px 0" }}>{data.Title}</h2>
                  <div className="muted" style={{ marginBottom: 8 }}>{data.Year} · {data.Genre}</div>
                </div>

                <div style={{ minWidth: 140, textAlign: "right" }}>
                  <button
                    onClick={handleFav}
                    className={`btn-fav ${isFavorited ? "faved" : ""}`}
                    aria-pressed={!!isFavorited}
                  >
                    {isFavorited ? "★ Favorited" : "☆ Add favorite"}
                  </button>
                </div>
              </div>

              <p style={{ marginTop: 6 }}>{data.Plot}</p>

              <div style={{ marginTop: 12 }}>
                <div><strong>Director:</strong> {data.Director}</div>
                <div><strong>Actors:</strong> {data.Actors}</div>
                <div><strong>Runtime:</strong> {data.Runtime}</div>
                <div><strong>IMDB Rating:</strong> {data.imdbRating}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="muted" aria-live="polite">Loading details…</div>
        )}

        {children}
      </div>
    </aside>
  );
}

DetailPanel.propTypes = {
  imdbID: PropTypes.string,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  isMobile: PropTypes.bool,
  data: PropTypes.object,
  onToggleFavorite: PropTypes.func,
  isFavorited: PropTypes.bool,
  children: PropTypes.node
};

DetailPanel.defaultProps = {
  imdbID: undefined,
  open: false,
  onClose: () => {},
  isMobile: false,
  data: null,
  onToggleFavorite: undefined,
  isFavorited: false,
  children: null
};
