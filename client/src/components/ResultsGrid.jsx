
import React from "react";
import ResultCard from "./ResultCard";

export default function ResultsGrid({ items = [], favoritesMap = new Set(), onToggleFavorite, onOpen }) {
  return (
    <div className="results-grid" role="list">
      {items.map(it => (
        <ResultCard
          key={it.imdbID}
          item={it}
          isFavorited={favoritesMap.has(it.imdbID)}
          onToggleFavorite={onToggleFavorite}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
