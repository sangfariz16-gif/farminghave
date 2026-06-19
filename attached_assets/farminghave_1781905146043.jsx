import { useState, useEffect, useCallback } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────
const SEEDS = [
  { id: "carrot",     name: "Carrot",     emoji: "🥕", cost: 10,  growTime: 8,  sellMin: 18,  sellMax: 30,  color: "#FF6B35" },
  { id: "tomato",     name: "Tomato",     emoji: "🍅", cost: 20,  growTime: 12, sellMin: 35,  sellMax: 55,  color: "#E63946" },
  { id: "corn",       name: "Corn",       emoji: "🌽", cost: 30,  growTime: 16, sellMin: 55,  sellMax: 85,  color: "#F4D03F" },
  { id: "strawberry", name: "Strawberry", emoji: "🍓", cost: 50,  growTime: 20, sellMin: 90,  sellMax: 140, color: "#E91E8C" },
  { id: "watermelon", name: "Watermelon", emoji: "🍉", cost: 80,  growTime: 28, sellMin: 150, sellMax: 250, color: "#4CAF50" },
  { id: "grape",      name: "Grape",      emoji: "🍇", cost: 120, growTime: 36, sellMin: 220, sellMax: 380, color: "#9B59B6" },
];

const QUALITIES = {
  common:    { label: "Common",    color: "#9E9E9E", multiplier: 1.0,  star: "⭐" },
  uncommon:  { label: "Uncommon",  color: "#4CAF50", multiplier: 1.5,  star: "⭐⭐" },
  rare:      { label: "Rare",      color: "#2196F3", multiplier: 2.2,  star: "⭐⭐⭐" },
  epic:      { label: "Epic",      color: "#9C27B0", multiplier: 3.5,  star: "💜💜💜" },
  legendary: { label: "Legendary", color: "#FF9800", multiplier: 6.0,  star: "🌟🌟🌟🌟🌟" },
};

const ACHIEVEMENTS = [
  { id: "first_harvest",    title: "First Harvest",       desc: "Harvest your first crop",           icon: "🌾", condition: s => s.totalHarvested >= 1 },
  { id: "green_thumb",      title: "Green Thumb",         desc: "Harvest 20 crops",                  icon: "👍", condition: s => s.totalHarvested >= 20 },
  { id: "rich_farmer",      title: "Rich Farmer",         desc: "Earn $1,000 total",                 icon: "💰", condition: s => s.totalEarned >= 1000 },
  { id: "legend_seeker",    title: "Legend Seeker",       desc: "Get your first Legendary quality",  icon: "🌟", condition: s => s.legendaryCount >= 1 },
  { id: "legend_master",    title: "Legendary Master",    desc: "Get 5 Legendary harvests",          icon: "👑", condition: s => s.legendaryCount >= 5 },
  { id: "millionaire",      title: "Millionaire Farmer",  desc: "Earn $10,000 total",                icon: "🏆", condition: s => s.totalEarned >= 10000 },
  { id: "watermaster",      title: "Water Master",        desc: "Water crops 50 times",              icon: "💧", condition: s => s.totalWatered >= 50 },
  { id: "grape_king",       title: "Grape King",          desc: "Harvest 10 Grapes",                 icon: "🍇", condition: s => (s.harvestCounts?.grape || 0) >= 10 },
  { id: "speed_farmer",     title: "Speed Farmer",        desc: "Harvest 5 crops in one session",    icon: "⚡", condition: s => s.sessionHarvests >= 5 },
  { id: "legendary_streak", title: "Legendary Streak",   desc: "Get 3 Legendary harvests in a row", icon: "🔥", condition: s => s.legendaryStreak >= 3 },
];

const GRID_SIZE = 12;

function randomQuality() {
  const roll = Math.random();
  if (roll < 0.02)  return "legendary";
  if (roll < 0.08)  return "epic";
  if (roll < 0.22)  return "rare";
  if (roll < 0.45)  return "uncommon";
  return "common";
}

function calcSell(seed, quality) {
  const base = Math.floor(Math.random() * (seed.sellMax - seed.sellMin + 1)) + seed.sellMin;
  return Math.floor(base * QUALITIES[quality].multiplier);
}

const TICK_MS = 1000;

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function FarmingHave() {
  const [money, setMoney] = useState(200);
  const [plots, setPlots] = useState(Array(GRID_SIZE).fill(null));
  const [selectedSeed, setSelectedSeed] = useState(SEEDS[0]);
  const [tab, setTab] = useState("farm"); // farm | shop | achievements
  const [stats, setStats] = useState({
    totalHarvested: 0, totalEarned: 0, legendaryCount: 0,
    totalWatered: 0, harvestCounts: {}, sessionHarvests: 0,
    legendaryStreak: 0,
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tick, setTick] = useState(0);

  // ── TICK ──
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // ── GROW ──
  useEffect(() => {
    setPlots(prev => prev.map(p => {
      if (!p || p.stage === "ready" || p.stage === "dry") return p;
      if (p.stage === "watered") {
        const progress = p.progress + 1;
        if (progress >= p.seed.growTime) return { ...p, stage: "ready", progress };
        return { ...p, progress };
      }
      return p;
    }));
  }, [tick]);

  // ── ACHIEVEMENTS ──
  useEffect(() => {
    ACHIEVEMENTS.forEach(a => {
      if (!unlockedAchievements.includes(a.id) && a.condition(stats)) {
        setUnlockedAchievements(prev => [...prev, a.id]);
        pushNotif(`🏅 Achievement: ${a.title}!`, a.id === "legend_master" || a.id === "millionaire" ? "legendary" : "rare");
      }
    });
  }, [stats]);

  const pushNotif = useCallback((msg, quality = "common") => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev.slice(-4), { id, msg, quality }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 3200);
  }, []);

  // ── PLANT ──
  const plant = (i) => {
    if (plots[i]) return;
    if (money < selectedSeed.cost) { pushNotif("❌ Not enough money!"); return; }
    setMoney(m => m - selectedSeed.cost);
    setPlots(prev => {
      const next = [...prev];
      next[i] = { seed: selectedSeed, stage: "dry", progress: 0, quality: null };
      return next;
    });
    pushNotif(`🌱 Planted ${selectedSeed.name}!`);
  };

  // ── WATER ──
  const water = (i) => {
    if (!plots[i] || plots[i].stage === "ready") return;
    setPlots(prev => {
      const next = [...prev];
      if (next[i] && next[i].stage !== "ready") next[i] = { ...next[i], stage: "watered" };
      return next;
    });
    setStats(s => ({ ...s, totalWatered: s.totalWatered + 1 }));
  };

  // ── HARVEST ──
  const harvest = (i) => {
    const p = plots[i];
    if (!p || p.stage !== "ready") return;
    const quality = randomQuality();
    const earned = calcSell(p.seed, quality);
    setMoney(m => m + earned);
    setPlots(prev => { const next = [...prev]; next[i] = null; return next; });

    pushNotif(
      `${QUALITIES[quality].star} ${p.seed.emoji} ${p.seed.name} [${QUALITIES[quality].label}] +$${earned}`,
      quality
    );

    setStats(s => {
      const isLeg = quality === "legendary";
      const streak = isLeg ? s.legendaryStreak + 1 : 0;
      return {
        ...s,
        totalHarvested: s.totalHarvested + 1,
        totalEarned: s.totalEarned + earned,
        legendaryCount: s.legendaryCount + (isLeg ? 1 : 0),
        harvestCounts: { ...s.harvestCounts, [p.seed.id]: (s.harvestCounts[p.seed.id] || 0) + 1 },
        sessionHarvests: s.sessionHarvests + 1,
        legendaryStreak: streak,
      };
    });
  };

  // ── PLOT ACTION ──
  const handlePlot = (i) => {
    const p = plots[i];
    if (!p) { plant(i); return; }
    if (p.stage === "dry") { water(i); return; }
    if (p.stage === "watered") { pushNotif("⏳ Growing… come back soon!"); return; }
    if (p.stage === "ready") { harvest(i); return; }
  };

  // ── STAGE UI ──
  const plotDisplay = (p) => {
    if (!p) return { emoji: "🟫", label: "Empty", pulse: false, glow: "none" };
    if (p.stage === "dry")   return { emoji: "🌱", label: "Tap to water", pulse: true,  glow: "none" };
    if (p.stage === "watered") {
      const pct = Math.floor((p.progress / p.seed.growTime) * 100);
      return { emoji: p.seed.emoji, label: `${pct}%`, pulse: false, glow: p.seed.color };
    }
    return { emoji: "✨", label: "HARVEST!", pulse: true, glow: "#FFD700" };
  };

  const qColor = (q) => QUALITIES[q]?.color || "#fff";

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(160deg,#1a2e1a 0%,#0d1f0d 60%,#1a1a0d 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#e8f5e9", position: "relative",
      overflowX: "hidden",
    }}>

      {/* NOTIFICATIONS */}
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 999, display: "flex", flexDirection: "column", gap: 8 }}>
        {notifications.map(n => (
          <div key={n.id} style={{
            background: n.quality === "legendary" ? "linear-gradient(90deg,#7f4f00,#ffd700,#7f4f00)"
              : n.quality === "epic" ? "linear-gradient(90deg,#4a0072,#ab47bc)" : "#1b3a1b",
            border: `1px solid ${n.quality === "legendary" ? "#ffd700" : n.quality === "epic" ? "#ce93d8" : "#4caf50"}`,
            borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600,
            maxWidth: 280, boxShadow: "0 4px 18px #0008",
            animation: "slideIn 0.3s ease",
          }}>
            {n.msg}
          </div>
        ))}
      </div>

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(90deg,#1b4d1b,#2e7d32,#1b4d1b)",
        padding: "14px 20px", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: "2px solid #4caf50",
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 1 }}>🌾 FarmingHave</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>Grow. Harvest. Prosper.</div>
        </div>
        <div style={{
          background: "#0a1f0a", border: "2px solid #ffd700", borderRadius: 12,
          padding: "8px 18px", fontSize: 20, fontWeight: 900, color: "#ffd700",
        }}>
          💰 ${money.toLocaleString()}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", background: "#0d1f0d", borderBottom: "1px solid #2e7d32" }}>
        {[["farm","🌱 Farm"],["shop","🛒 Shop"],["achievements","🏆 Achievements"]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "11px 0", background: tab === t ? "#1b4d1b" : "transparent",
            color: tab === t ? "#a5d6a7" : "#66bb6a", border: "none", borderBottom: tab === t ? "3px solid #4caf50" : "3px solid transparent",
            cursor: "pointer", fontWeight: 700, fontSize: 13,
          }}>{label}</button>
        ))}
      </div>

      {/* ── FARM TAB ── */}
      {tab === "farm" && (
        <div style={{ padding: 16 }}>
          {/* SELECTED SEED BAR */}
          <div style={{
            background: "#0f2d0f", border: `2px solid ${selectedSeed.color}`, borderRadius: 12,
            padding: "10px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>{selectedSeed.emoji}</span>
            <div>
              <div style={{ fontWeight: 800, color: selectedSeed.color }}>{selectedSeed.name}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Cost ${selectedSeed.cost} · Ready in {selectedSeed.growTime}s · Sells ${selectedSeed.sellMin}–${selectedSeed.sellMax}</div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 12, color: "#81c784" }}>Selected</div>
          </div>

          {/* QUICK SELECT */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
            {SEEDS.map(s => (
              <button key={s.id} onClick={() => setSelectedSeed(s)} style={{
                background: selectedSeed.id === s.id ? s.color + "33" : "#0a1f0a",
                border: `2px solid ${selectedSeed.id === s.id ? s.color : "#2e4d2e"}`,
                borderRadius: 10, padding: "6px 10px", cursor: "pointer", color: "#e8f5e9",
                fontSize: 12, whiteSpace: "nowrap", fontWeight: selectedSeed.id === s.id ? 800 : 400,
                flexShrink: 0,
              }}>
                {s.emoji} {s.name}
              </button>
            ))}
          </div>

          {/* INSTRUCTIONS */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {[["🟫","Tap empty","Plant"],["💧","Tap 🌱","Water"],["⏳","Growing","Wait"],["✨","Tap ✨","Harvest"]].map(([ic, act, label]) => (
              <div key={label} style={{
                flex: 1, minWidth: 70, background: "#0f2d0f", border: "1px solid #2e4d2e",
                borderRadius: 8, padding: "7px 6px", textAlign: "center", fontSize: 11,
              }}>
                <div style={{ fontSize: 18 }}>{ic}</div>
                <div style={{ opacity: 0.6 }}>{act}</div>
                <div style={{ fontWeight: 700, color: "#81c784" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* GRID */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
          }}>
            {plots.map((p, i) => {
              const d = plotDisplay(p);
              return (
                <button key={i} onClick={() => handlePlot(i)} style={{
                  background: d.glow !== "none"
                    ? `radial-gradient(circle at center, ${d.glow}22, #0f2d0f)`
                    : "#0f2d0f",
                  border: `2px solid ${d.glow !== "none" ? d.glow : p?.stage === "ready" ? "#ffd700" : "#2e4d2e"}`,
                  borderRadius: 12, padding: "14px 8px", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  boxShadow: p?.stage === "ready" ? "0 0 12px #ffd70066" : "none",
                  animation: d.pulse ? "pulse 1.2s ease infinite" : "none",
                  transition: "all 0.2s",
                }}>
                  <span style={{ fontSize: 26 }}>{d.emoji}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: p?.stage === "ready" ? "#ffd700" : "#81c784" }}>
                    {d.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* STATS */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16,
          }}>
            {[["🌾","Harvested",stats.totalHarvested],["💰","Earned",`$${stats.totalEarned.toLocaleString()}`],["🌟","Legendary",stats.legendaryCount]].map(([ic,lab,val]) => (
              <div key={lab} style={{
                background: "#0f2d0f", border: "1px solid #2e4d2e", borderRadius: 10,
                padding: "10px 6px", textAlign: "center",
              }}>
                <div style={{ fontSize: 22 }}>{ic}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#a5d6a7" }}>{val}</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>{lab}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SHOP TAB ── */}
      {tab === "shop" && (
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: "#a5d6a7" }}>🛒 Seed Shop</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SEEDS.map(s => {
              const canAfford = money >= s.cost;
              return (
                <div key={s.id} onClick={() => { setSelectedSeed(s); setTab("farm"); }}
                  style={{
                    background: selectedSeed.id === s.id ? `${s.color}22` : "#0f2d0f",
                    border: `2px solid ${selectedSeed.id === s.id ? s.color : "#2e4d2e"}`,
                    borderRadius: 14, padding: "14px 16px",
                    cursor: canAfford ? "pointer" : "not-allowed",
                    opacity: canAfford ? 1 : 0.5, display: "flex", alignItems: "center", gap: 14,
                  }}>
                  <span style={{ fontSize: 36 }}>{s.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, color: s.color, fontSize: 16 }}>{s.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                      Grow time: {s.growTime}s · Sells: ${s.sellMin}–${s.sellMax}
                    </div>
                    <div style={{ fontSize: 11, color: "#ffd700", marginTop: 2 }}>
                      🌟 Legendary = up to ${Math.floor(s.sellMax * QUALITIES.legendary.multiplier)}
                    </div>
                  </div>
                  <div style={{
                    background: canAfford ? "#1b4d1b" : "#1a1a1a",
                    border: `1px solid ${canAfford ? "#4caf50" : "#333"}`,
                    borderRadius: 8, padding: "6px 12px", fontWeight: 800,
                    color: canAfford ? "#ffd700" : "#555", whiteSpace: "nowrap",
                  }}>
                    ${s.cost}
                  </div>
                </div>
              );
            })}
          </div>

          {/* QUALITY INFO */}
          <div style={{ marginTop: 20, background: "#0f2d0f", border: "1px solid #2e4d2e", borderRadius: 14, padding: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 10, color: "#a5d6a7" }}>✨ Quality Tiers</div>
            {Object.entries(QUALITIES).map(([k, q]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1a3a1a" }}>
                <span style={{ color: q.color, fontWeight: 700 }}>{q.star} {q.label}</span>
                <span style={{ color: "#81c784", fontSize: 13 }}>×{q.multiplier} profit</span>
              </div>
            ))}
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>Legendary chance: 2% per harvest</div>
          </div>
        </div>
      )}

      {/* ── ACHIEVEMENTS TAB ── */}
      {tab === "achievements" && (
        <div style={{ padding: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, color: "#ffd700" }}>🏆 Achievements</div>
          <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 14 }}>
            {unlockedAchievements.length}/{ACHIEVEMENTS.length} unlocked
          </div>

          {/* Progress bar */}
          <div style={{ background: "#0f2d0f", borderRadius: 8, height: 8, marginBottom: 16, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 8,
              width: `${(unlockedAchievements.length / ACHIEVEMENTS.length) * 100}%`,
              background: "linear-gradient(90deg,#4caf50,#ffd700)",
              transition: "width 0.5s",
            }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ACHIEVEMENTS.map(a => {
              const unlocked = unlockedAchievements.includes(a.id);
              return (
                <div key={a.id} style={{
                  background: unlocked
                    ? a.id.includes("legendary") || a.id === "millionaire"
                      ? "linear-gradient(90deg,#2d1f00,#3d2d00)"
                      : "#0f2d0f"
                    : "#0a150a",
                  border: `2px solid ${unlocked ? (a.id.includes("legendary") || a.id === "millionaire" ? "#ffd700" : "#4caf50") : "#1a2e1a"}`,
                  borderRadius: 12, padding: "12px 14px",
                  display: "flex", alignItems: "center", gap: 12,
                  opacity: unlocked ? 1 : 0.55,
                }}>
                  <span style={{ fontSize: 28, filter: unlocked ? "none" : "grayscale(1)" }}>{a.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 800,
                      color: unlocked
                        ? a.id.includes("legendary") || a.id === "millionaire" ? "#ffd700" : "#a5d6a7"
                        : "#555",
                    }}>{a.title}</div>
                    <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>{a.desc}</div>
                  </div>
                  {unlocked && <span style={{ fontSize: 18 }}>✅</span>}
                  {!unlocked && <span style={{ fontSize: 16 }}>🔒</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.96)} }
        @keyframes slideIn { from{transform:translateX(60px);opacity:0} to{transform:translateX(0);opacity:1} }
        button:active { transform: scale(0.95); }
      `}</style>
    </div>
  );
}
