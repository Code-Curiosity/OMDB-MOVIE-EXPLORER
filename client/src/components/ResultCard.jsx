
import React from "react";

export default function ResultCard({ item, isFavorited, onOpen, onToggleFavorite }) {
  return (
    <div className="card" onClick={() => onOpen(item.imdbID)} role="button" tabIndex={0}>
      <div style={{ position: "relative" }}>
        <img
          className="poster"
          src={item.Poster && item.Poster !== "N/A" ? item.Poster : "/placeholder.png"}
          alt={item.Title}
          loading="lazy"
          onClick={() => onOpen(item.imdbID)}
        />

        <button
          className={`btn-fav ${isFavorited ? "faved" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.imdbID); }}
          aria-pressed={!!isFavorited}
          title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          style={{ position: "absolute", top: 8, right: 8 }}
        >
          {isFavorited ? "★" : "☆"}
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 700 }}>{item.Title}</div>
        <div className="card-meta">{item.Year}</div>
      </div>
    </div>
  );
}
