
import React, { useEffect, useState, useRef } from "react";

export default function SearchBar({ onSearch, initial = "" }) {
  const [value, setValue] = useState(initial);
  const lastSentRef = useRef(initial);
  const timerRef = useRef(null);

  useEffect(() => {
    const q = value.trim();
    if (!q) {
      // clear results via onSearch (but only if lastSent was non-empty)
      if (lastSentRef.current !== "") {
        onSearch("");
        lastSentRef.current = "";
      }
      return;
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (q !== lastSentRef.current) {
        onSearch(q);
        lastSentRef.current = q;
      }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [value, onSearch]);

  function onKeyDown(e) {
    if (e.key === "Enter") {
      const q = value.trim();
      if (q) onSearch(q);
    }
  }

  function clear() {
    setValue("");
    onSearch("");
    lastSentRef.current = "";
  }

  return (
    <div className="search-wrap" style={{ marginBottom: 12, position: "relative" }}>
      <input
        aria-label="Search movies or series"
        className="search-input"
        placeholder="Search movies, series or episodes..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus
      />
      {value && (
        <button aria-label="Clear search" onClick={clear} style={{ position: "absolute", right: 12, top: 13, background: "transparent", border: "0", cursor: "pointer" }}>
          ×
        </button>
      )}
    </div>
  );
}
