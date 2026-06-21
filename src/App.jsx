import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "hemden-tracker-v2";

const SHIRT_COLORS = [
  { id: "weiss", label: "Weiß", hex: "#f8f8f6", border: "#d0ccc0" },
  { id: "hellblau", label: "Hellblau", hex: "#d6e8f5", border: "#8ab8d8" },
  { id: "blau", label: "Blau", hex: "#2a5fa5", border: "#1a3f75" },
  { id: "grau", label: "Grau", hex: "#a8a8a8", border: "#787878" },
  { id: "schwarz", label: "Schwarz", hex: "#2c2c2c", border: "#111" },
  { id: "rosa", label: "Rosa", hex: "#f0c8d0", border: "#d09098" },
  { id: "gestreift", label: "Gestreift", hex: "repeating-linear-gradient(90deg,#fff 0px,#fff 8px,#c8d8ee 8px,#c8d8ee 16px)", border: "#8ab8d8" },
];

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Zählt wie oft das Hemd seit dem letzten Waschen getragen wurde
function wearsSinceWash(shirt) {
  const { lastWashed, wearLog = [] } = shirt;
  if (!lastWashed) return wearLog.length; // noch nie gewaschen → alle Einträge
  return wearLog.filter(d => d > lastWashed).length;
}

function StatusBadge({ count, lastWashed }) {
  if (!lastWashed && count === 0) return <span style={{ color: "#888", fontSize: 13 }}>Noch nie getragen</span>;
  if (count === 0) return <span style={{ background: "#e8f5e9", color: "#2e7d32", borderRadius: 20, padding: "2px 10px", fontSize: 13, fontWeight: 600 }}>✓ Frisch gewaschen</span>;
  if (count === 1) return <span style={{ background: "#e8f5e9", color: "#2e7d32", borderRadius: 20, padding: "2px 10px", fontSize: 13, fontWeight: 600 }}>✓ 1× getragen</span>;
  if (count === 2) return <span style={{ background: "#e8f5e9", color: "#2e7d32", borderRadius: 20, padding: "2px 10px", fontSize: 13, fontWeight: 600 }}>✓ 2× getragen</span>;
  if (count === 3) return <span style={{ background: "#fff8e1", color: "#f57f17", borderRadius: 20, padding: "2px 10px", fontSize: 13, fontWeight: 600 }}>⚠ 3× getragen</span>;
  if (count === 4) return <span style={{ background: "#fff8e1", color: "#e65100", borderRadius: 20, padding: "2px 10px", fontSize: 13, fontWeight: 600 }}>⚠ 4× getragen</span>;
  return <span style={{ background: "#fde8e8", color: "#c62828", borderRadius: 20, padding: "2px 10px", fontSize: 13, fontWeight: 600 }}>🔴 {count}× getragen</span>;
}

function ShirtIcon({ color }) {
  const isGradient = color.hex.startsWith("repeating");
  return (
    <svg viewBox="0 0 48 48" width="48" height="48">
      <defs>
        {isGradient && (
          <pattern id="stripes" x="0" y="0" width="16" height="1" patternUnits="userSpaceOnUse">
            <rect width="8" height="1" fill="#fff" />
            <rect x="8" width="8" height="1" fill="#c8d8ee" />
          </pattern>
        )}
      </defs>
      <path
        d="M6 14 L14 8 L18 12 C18 12 20 15 24 15 C28 15 30 12 30 12 L34 8 L42 14 L37 22 L33 19 L33 42 L15 42 L15 19 L11 22 Z"
        fill={isGradient ? "url(#stripes)" : color.hex}
        stroke={color.border}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Compress image to base64 with max size ~200KB
function compressImage(file, maxSize = 600) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > h && w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; }
        else if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function PhotoUpload({ photo, onPhoto, size = 80 }) {
  const ref = useRef();
  return (
    <div
      onClick={() => ref.current.click()}
      style={{
        width: size, height: size, borderRadius: 12, overflow: "hidden",
        background: photo ? "transparent" : "#f0f0ee",
        border: photo ? "none" : "2px dashed #ccc",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", flexShrink: 0, position: "relative"
      }}
    >
      {photo
        ? <img src={photo} alt="Hemd" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: 28, color: "#bbb" }}>📷</span>
      }
      {photo && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "rgba(0,0,0,0.4)", color: "#fff",
          fontSize: 10, textAlign: "center", padding: "3px 0"
        }}>ändern</div>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={async (e) => {
          if (e.target.files[0]) {
            const compressed = await compressImage(e.target.files[0]);
            onPhoto(compressed);
          }
        }}
      />
    </div>
  );
}

const DEFAULT_SHIRTS = [
  { id: 1, name: "Hemd 1", colorId: "weiss", photo: null, lastWashed: null, wearLog: [] },
  { id: 2, name: "Hemd 2", colorId: "hellblau", photo: null, lastWashed: null, wearLog: [] },
  { id: 3, name: "Hemd 3", colorId: "blau", photo: null, lastWashed: null, wearLog: [] },
];

export default function HemdenTracker() {
  const [shirts, setShirts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SHIRTS;
    } catch { return DEFAULT_SHIRTS; }
  });
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("weiss");
  const [newPhoto, setNewPhoto] = useState(null);
  const [confirmWash, setConfirmWash] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(shirts)); } catch {}
  }, [shirts]);

  const today = new Date().toISOString().split("T")[0];

  function markWorn(id) {
    setShirts(prev => prev.map(s => {
      if (s.id !== id) return s;
      const log = s.wearLog || [];
      if (log[log.length - 1] === today) return s;
      return { ...s, wearLog: [...log, today] };
    }));
  }

  function markWashed(id) {
    setShirts(prev => prev.map(s => s.id !== id ? s : { ...s, lastWashed: today }));
    setConfirmWash(null);
  }

  function updatePhoto(id, photo) {
    setShirts(prev => prev.map(s => s.id !== id ? s : { ...s, photo }));
  }

  function addShirt() {
    if (!newName.trim()) return;
    const id = Date.now();
    setShirts(prev => [...prev, { id, name: newName.trim(), colorId: newColor, photo: newPhoto, lastWashed: null, wearLog: [] }]);
    setNewName(""); setNewColor("weiss"); setNewPhoto(null);
    setView("list");
  }

  function deleteShirt(id) {
    setShirts(prev => prev.filter(s => s.id !== id));
    setView("list"); setSelected(null);
  }

  const selectedShirt = shirts.find(s => s.id === selected);

  const s = {
    wrap: { fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 420, margin: "0 auto", background: "#f5f4f0", minHeight: "100vh", paddingBottom: 32 },
    header: { background: "#1a1a1a", color: "#fff", padding: "18px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    title: { margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" },
    subtitle: { margin: "2px 0 0", fontSize: 12, color: "#999", fontWeight: 400 },
    card: { background: "#fff", borderRadius: 14, margin: "10px 14px", padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 },
    cardInfo: { flex: 1, minWidth: 0 },
    cardName: { fontWeight: 600, fontSize: 15, margin: 0, color: "#1a1a1a" },
    cardSub: { fontSize: 12, color: "#888", margin: "2px 0 4px" },
    btn: (color = "#1a1a1a") => ({ background: color, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }),
    btnOutline: { background: "transparent", color: "#1a1a1a", border: "1.5px solid #d0d0d0", borderRadius: 10, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer" },
    fab: { position: "fixed", bottom: 24, right: 20, background: "#1a1a1a", color: "#fff", border: "none", borderRadius: 50, width: 52, height: 52, fontSize: 26, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" },
    input: { border: "1.5px solid #e0e0e0", borderRadius: 10, padding: "10px 14px", fontSize: 15, width: "100%", boxSizing: "border-box", outline: "none" },
    section: { padding: "10px 14px 0" },
    label: { fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#888", textTransform: "uppercase", margin: "14px 0 6px" },
  };

  // Thumbnail in der Liste: Foto wenn vorhanden, sonst Hemd-Icon
  function CardThumb({ shirt }) {
    const color = SHIRT_COLORS.find(c => c.id === shirt.colorId) || SHIRT_COLORS[0];
    if (shirt.photo) {
      return (
        <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
          <img src={shirt.photo} alt={shirt.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      );
    }
    return <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ShirtIcon color={color} /></div>;
  }

  // --- LIST VIEW ---
  if (view === "list") {
    const sorted = [...shirts].sort((a, b) => wearsSinceWash(b) - wearsSinceWash(a));
    return (
      <div style={s.wrap}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>👔 Hemden-Tracker</h1>
            <p style={s.subtitle}>{shirts.length} Hemd{shirts.length !== 1 ? "en" : ""} im Schrank</p>
          </div>
        </div>
        <div style={{ paddingTop: 8 }}>
          {sorted.length === 0 && (
            <div style={{ textAlign: "center", color: "#aaa", padding: "40px 20px", fontSize: 15 }}>
              Noch keine Hemden. Füge dein erstes hinzu!
            </div>
          )}
          {sorted.map(shirt => {
            const count = wearsSinceWash(shirt);
            const wornToday = (shirt.wearLog || []).includes(today);
            return (
              <div key={shirt.id} style={s.card} onClick={() => { setSelected(shirt.id); setView("detail"); }}>
                <CardThumb shirt={shirt} />
                <div style={s.cardInfo}>
                  <p style={s.cardName}>{shirt.name}</p>
                  <p style={s.cardSub}>Gewaschen: {formatDate(shirt.lastWashed)}</p>
                  <StatusBadge count={count} lastWashed={shirt.lastWashed} />
                </div>
                <div>
                  {wornToday
                    ? <span style={{ fontSize: 11, color: "#2e7d32", fontWeight: 600, textAlign: "center", display: "block" }}>✓ Heute<br />getragen</span>
                    : <button style={{ ...s.btn(), fontSize: 12, padding: "7px 12px" }}
                        onClick={e => { e.stopPropagation(); markWorn(shirt.id); }}>Getragen</button>
                  }
                </div>
              </div>
            );
          })}
        </div>
        <button style={s.fab} onClick={() => setView("add")}>+</button>
      </div>
    );
  }

  // --- DETAIL VIEW ---
  if (view === "detail" && selectedShirt) {
    const shirt = selectedShirt;
    const color = SHIRT_COLORS.find(c => c.id === shirt.colorId) || SHIRT_COLORS[0];
    const count = wearsSinceWash(shirt);
    const wornToday = (shirt.wearLog || []).includes(today);
    const wearLog = [...(shirt.wearLog || [])].reverse().slice(0, 10);
    const timesWornTotal = (shirt.wearLog || []).length;

    return (
      <div style={s.wrap}>
        <div style={s.header}>
          <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", padding: 0 }}>←</button>
          <h1 style={{ ...s.title, flex: 1, textAlign: "center" }}>{shirt.name}</h1>
          <button onClick={() => deleteShirt(shirt.id)} style={{ background: "none", border: "none", color: "#ff6b6b", fontSize: 18, cursor: "pointer", padding: 0 }}>🗑</button>
        </div>

        {/* Hero foto oder Icon */}
        <div style={{ position: "relative", background: shirt.photo ? "#000" : "#e8e6e0", height: 200, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {shirt.photo
            ? <img src={shirt.photo} alt={shirt.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.92 }} />
            : <ShirtIcon color={color} />
          }
          {/* Foto-Ändern-Button */}
          <label style={{
            position: "absolute", bottom: 10, right: 12,
            background: "rgba(0,0,0,0.55)", color: "#fff",
            borderRadius: 20, padding: "5px 12px", fontSize: 12,
            cursor: "pointer", fontWeight: 600, backdropFilter: "blur(4px)"
          }}>
            {shirt.photo ? "📷 Foto ändern" : "📷 Foto hinzufügen"}
            <input type="file" accept="image/*" style={{ display: "none" }}
              onChange={async (e) => {
                if (e.target.files[0]) {
                  const compressed = await compressImage(e.target.files[0]);
                  updatePhoto(shirt.id, compressed);
                }
              }}
            />
          </label>
        </div>

        {/* Status */}
        <div style={{ background: "#fff", padding: "16px 16px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <StatusBadge count={count} lastWashed={shirt.lastWashed} />
            <p style={{ color: "#888", fontSize: 12, margin: "6px 0 0" }}>
              Gewaschen: <strong>{formatDate(shirt.lastWashed)}</strong>
            </p>
            <p style={{ color: "#888", fontSize: 12, margin: "3px 0 0" }}>
              {timesWornTotal}× getragen insgesamt
            </p>
          </div>
          {shirt.photo && (
            <button
              onClick={() => updatePhoto(shirt.id, null)}
              style={{ background: "none", border: "none", color: "#aaa", fontSize: 11, cursor: "pointer", textDecoration: "underline" }}
            >
              Foto löschen
            </button>
          )}
        </div>

        <div style={s.section}>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {wornToday
              ? <div style={{ ...s.btn("#2e7d32"), flex: 1, opacity: 0.7, cursor: "default" }}>✓ Heute getragen</div>
              : <button style={{ ...s.btn(), flex: 1 }} onClick={() => markWorn(shirt.id)}>👔 Heute getragen</button>
            }
            <button style={{ ...s.btn("#1565c0"), flex: 1 }} onClick={() => setConfirmWash(shirt.id)}>🧺 Gewaschen</button>
          </div>
        </div>

        {confirmWash === shirt.id && (
          <div style={{ background: "#fff8e1", border: "1.5px solid #ffe082", borderRadius: 12, margin: "12px 14px", padding: 16 }}>
            <p style={{ margin: "0 0 12px", fontWeight: 600, fontSize: 15 }}>Als heute gewaschen markieren?</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...s.btn("#1565c0"), flex: 1 }} onClick={() => markWashed(shirt.id)}>Ja, gewaschen</button>
              <button style={{ ...s.btnOutline, flex: 1 }} onClick={() => setConfirmWash(null)}>Abbrechen</button>
            </div>
          </div>
        )}

        <div style={s.section}>
          <div style={s.label}>Zuletzt getragen</div>
          {wearLog.length === 0
            ? <p style={{ color: "#aaa", fontSize: 13 }}>Noch keine Einträge</p>
            : wearLog.map((d, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0", fontSize: 14 }}>
                <span>{formatDate(d)}</span>
                <span style={{ color: "#aaa", fontSize: 12 }}>{d === today ? "Heute" : new Date(d).toLocaleDateString("de-DE", {day:"2-digit",month:"2-digit"})}</span>
              </div>
            ))
          }
        </div>
      </div>
    );
  }

  // --- ADD VIEW ---
  if (view === "add") {
    return (
      <div style={s.wrap}>
        <div style={s.header}>
          <button onClick={() => { setView("list"); setNewPhoto(null); }} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", padding: 0 }}>←</button>
          <h1 style={{ ...s.title, flex: 1, textAlign: "center" }}>Neues Hemd</h1>
          <div style={{ width: 32 }} />
        </div>
        <div style={{ padding: "20px 16px" }}>

          {/* Foto beim Anlegen */}
          <div style={s.label}>Foto (optional)</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            <PhotoUpload photo={newPhoto} onPhoto={setNewPhoto} size={90} />
            <p style={{ color: "#888", fontSize: 13, margin: 0 }}>
              {newPhoto ? "Foto ausgewählt ✓" : "Tippe auf das Kamera-Symbol um ein Foto aufzunehmen oder aus der Galerie zu wählen."}
            </p>
          </div>

          <div style={s.label}>Name</div>
          <input
            style={s.input}
            placeholder="z.B. Weißes Oxford, Blaues Slim Fit..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />

          <div style={s.label}>Farbe (Fallback ohne Foto)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
            {SHIRT_COLORS.map(c => {
              const isGradient = c.hex.startsWith("repeating");
              return (
                <button
                  key={c.id}
                  onClick={() => setNewColor(c.id)}
                  style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: isGradient ? undefined : c.hex,
                    backgroundImage: isGradient ? c.hex : undefined,
                    border: newColor === c.id ? "3px solid #1a1a1a" : `2px solid ${c.border}`,
                    cursor: "pointer",
                    boxShadow: newColor === c.id ? "0 0 0 2px #fff, 0 0 0 4px #1a1a1a" : "none",
                  }}
                  title={c.label}
                />
              );
            })}
          </div>
          <p style={{ fontSize: 12, color: "#888", margin: "6px 0 20px" }}>
            {SHIRT_COLORS.find(c => c.id === newColor)?.label}
          </p>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{ ...s.btn(), flex: 1, opacity: newName.trim() ? 1 : 0.4 }}
              onClick={addShirt}
              disabled={!newName.trim()}
            >
              Hemd hinzufügen
            </button>
            <button style={s.btnOutline} onClick={() => { setView("list"); setNewPhoto(null); }}>Abbrechen</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
