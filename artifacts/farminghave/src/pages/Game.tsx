import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUser, useAuth } from "@clerk/react";
import { useGetGameSave, useSaveGame } from "@workspace/api-client-react";
import { SEEDS, QUALITIES, ACHIEVEMENTS, GRID_SIZE, randomQuality, calcSell } from "@/lib/game-constants";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TICK_MS = 1000;

export default function Game({ isGuest }: { isGuest: boolean }) {
  const { isSignedIn, user } = useUser();
  const { toast } = useToast();
  
  const [money, setMoney] = useState(200);
  const [plots, setPlots] = useState<any[]>(Array(GRID_SIZE).fill(null));
  const [selectedSeed, setSelectedSeed] = useState(SEEDS[0]);
  const [tab, setTab] = useState("farm");
  const [stats, setStats] = useState({
    totalHarvested: 0, totalEarned: 0, legendaryCount: 0,
    totalWatered: 0, harvestCounts: {} as Record<string, number>, sessionHarvests: 0,
    legendaryStreak: 0,
  });
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [tick, setTick] = useState(0);
  const [saving, setSaving] = useState(false);

  const { data: save, isLoading: isSaveLoading } = useGetGameSave({ query: { enabled: !!isSignedIn && !isGuest } });
  const saveGameMutation = useSaveGame();
  
  const initialized = useRef(false);

  // Load from save
  useEffect(() => {
    if (save && !initialized.current) {
      initialized.current = true;
      setMoney(save.money);
      try {
        if (save.plots) setPlots(JSON.parse(save.plots));
        if (save.stats) setStats(JSON.parse(save.stats));
        if (save.unlockedAchievements) setUnlockedAchievements(JSON.parse(save.unlockedAchievements));
      } catch (e) {
        console.error("Failed to parse save data", e);
      }
    }
  }, [save]);

  // Tick
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Grow
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

  // Achievements
  useEffect(() => {
    ACHIEVEMENTS.forEach(a => {
      if (!unlockedAchievements.includes(a.id) && a.condition(stats)) {
        setUnlockedAchievements(prev => [...prev, a.id]);
        toast({
          title: `🏅 Achievement Unlocked!`,
          description: a.title,
        });
      }
    });
  }, [stats, unlockedAchievements, toast]);

  // Auto-save
  useEffect(() => {
    if (!isSignedIn || isGuest) return;
    const id = setInterval(() => {
      setSaving(true);
      saveGameMutation.mutate({ data: {
        money,
        plots: JSON.stringify(plots),
        stats: JSON.stringify(stats),
        unlockedAchievements: JSON.stringify(unlockedAchievements),
      }}, {
        onSettled: () => setSaving(false)
      });
    }, 30000);
    return () => clearInterval(id);
  }, [isSignedIn, isGuest, money, plots, stats, unlockedAchievements, saveGameMutation]);

  const plant = (i: number) => {
    if (plots[i]) return;
    if (money < selectedSeed.cost) { 
      toast({ title: "Not enough money", variant: "destructive" });
      return; 
    }
    setMoney(m => m - selectedSeed.cost);
    setPlots(prev => {
      const next = [...prev];
      next[i] = { seed: selectedSeed, stage: "dry", progress: 0, quality: null };
      return next;
    });
  };

  const water = (i: number) => {
    if (!plots[i] || plots[i].stage === "ready") return;
    setPlots(prev => {
      const next = [...prev];
      if (next[i] && next[i].stage !== "ready") next[i] = { ...next[i], stage: "watered" };
      return next;
    });
    setStats(s => ({ ...s, totalWatered: s.totalWatered + 1 }));
  };

  const harvest = (i: number) => {
    const p = plots[i];
    if (!p || p.stage !== "ready") return;
    const quality = randomQuality();
    const earned = calcSell(p.seed, quality);
    setMoney(m => m + earned);
    setPlots(prev => { const next = [...prev]; next[i] = null; return next; });

    toast({
      title: `Harvested ${p.seed.name}!`,
      description: `${QUALITIES[quality].star} [${QUALITIES[quality].label}] +$${earned}`,
    });

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

  const handlePlot = (i: number) => {
    const p = plots[i];
    if (!p) { plant(i); return; }
    if (p.stage === "dry") { water(i); return; }
    if (p.stage === "watered") { return; }
    if (p.stage === "ready") { harvest(i); return; }
  };

  const plotDisplay = (p: any) => {
    if (!p) return { emoji: "🟫", label: "Empty", pulse: false, glow: "none" };
    if (p.stage === "dry")   return { emoji: "🌱", label: "Tap to water", pulse: true,  glow: "none" };
    if (p.stage === "watered") {
      const pct = Math.floor((p.progress / p.seed.growTime) * 100);
      return { emoji: p.seed.emoji, label: `${pct}%`, pulse: false, glow: p.seed.color };
    }
    return { emoji: "✨", label: "HARVEST!", pulse: true, glow: "#FFD700" };
  };

  if (isSaveLoading && !isGuest && !initialized.current) {
    return (
      <div className="min-h-screen flex items-center justify-center text-primary">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden bg-background">
      <div className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` }} />
        ))}
      </div>

      <div className="bg-gradient-to-r from-card to-background border-b border-border p-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <div className="text-xl font-bold tracking-wider text-foreground flex items-center gap-2">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="w-6 h-6" />
            FarmingHave
          </div>
          <div className="text-xs text-muted-foreground">Grow. Harvest. Prosper.</div>
        </div>
        <div className="flex items-center gap-4">
          {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <div className="bg-secondary border-2 border-primary rounded-xl px-4 py-1.5 text-lg font-bold text-primary shadow-[0_0_10px_rgba(255,215,0,0.2)]">
            ${money.toLocaleString()}
          </div>
          {isSignedIn && !isGuest ? (
            <Avatar className="w-10 h-10 border-2 border-primary">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback>{user.firstName?.charAt(0)}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="text-xs font-semibold px-2 py-1 bg-secondary rounded text-muted-foreground border border-border">
              Guest Mode
            </div>
          )}
        </div>
      </div>

      <div className="flex bg-card border-b border-border sticky top-[72px] z-10">
        {[["farm", "Farm"], ["shop", "Shop"], ["achievements", "Achievements"]].map(([t, label]) => (
          <button 
            key={t} 
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-bold border-b-4 transition-colors ${tab === t ? 'border-primary text-primary bg-secondary' : 'border-transparent text-muted-foreground hover:bg-secondary/50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-w-md mx-auto relative z-0">
        {tab === "farm" && (
          <div className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-card border-2 rounded-xl p-3 mb-4 flex items-center gap-4" style={{ borderColor: selectedSeed.color }}>
              <span className="text-3xl filter drop-shadow-md">{selectedSeed.emoji}</span>
              <div>
                <div className="font-bold text-lg" style={{ color: selectedSeed.color }}>{selectedSeed.name}</div>
                <div className="text-xs text-muted-foreground">Cost ${selectedSeed.cost} · Ready {selectedSeed.growTime}s · Sells ${selectedSeed.sellMin}-${selectedSeed.sellMax}</div>
              </div>
              <div className="ml-auto text-xs font-bold text-primary">Selected</div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {SEEDS.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => setSelectedSeed(s)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${selectedSeed.id === s.id ? 'bg-secondary' : 'bg-card'}`}
                  style={{ borderColor: selectedSeed.id === s.id ? s.color : 'var(--color-border)', color: selectedSeed.id === s.id ? '#fff' : 'var(--color-muted-foreground)' }}
                >
                  <span className="mr-1">{s.emoji}</span> {s.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {plots.map((p, i) => {
                const d = plotDisplay(p);
                return (
                  <button 
                    key={i} 
                    onClick={() => handlePlot(i)}
                    className="aspect-square relative rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 bg-card overflow-hidden"
                    style={{ 
                      borderColor: d.glow !== "none" ? d.glow : p?.stage === "ready" ? "var(--color-primary)" : "var(--color-border)",
                      animation: d.pulse ? "pulse-glow 2s infinite" : "none"
                    }}
                  >
                    {d.glow !== "none" && <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle, ${d.glow}, transparent)` }} />}
                    <span className="text-3xl relative z-10 filter drop-shadow-md" style={{ filter: !p ? 'grayscale(1) brightness(0.5)' : 'none' }}>{d.emoji}</span>
                    <span className="text-[10px] font-bold relative z-10" style={{ color: p?.stage === "ready" ? "var(--color-primary)" : "var(--color-muted-foreground)" }}>
                      {d.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[["Harvested", stats.totalHarvested], ["Earned", `$${stats.totalEarned}`], ["Legendary", stats.legendaryCount]].map(([lab, val]) => (
                <div key={lab} className="bg-card border border-border rounded-xl p-3 text-center">
                  <div className="text-xl font-black text-primary">{val}</div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{lab}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "shop" && (
          <div className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-bold text-primary mb-4">Seed Shop</h2>
            <div className="flex flex-col gap-3">
              {SEEDS.map(s => {
                const canAfford = money >= s.cost;
                return (
                  <button 
                    key={s.id} 
                    onClick={() => { if(canAfford) { setSelectedSeed(s); setTab("farm"); } }}
                    disabled={!canAfford}
                    className={`text-left bg-card border-2 rounded-xl p-3 flex items-center gap-3 transition-all ${canAfford ? 'hover:bg-secondary active:scale-95' : 'opacity-50 grayscale'}`}
                    style={{ borderColor: selectedSeed.id === s.id ? s.color : 'var(--color-border)' }}
                  >
                    <span className="text-3xl">{s.emoji}</span>
                    <div className="flex-1">
                      <div className="font-bold text-base" style={{ color: s.color }}>{s.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">Grow: {s.growTime}s · Sell: ${s.sellMin}-${s.sellMax}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-sm font-black ${canAfford ? 'bg-secondary text-primary' : 'bg-muted text-muted-foreground'}`}>
                      ${s.cost}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === "achievements" && (
          <div className="p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-lg font-bold text-primary mb-1">Achievements</h2>
            <div className="text-xs text-muted-foreground mb-4">{unlockedAchievements.length} / {ACHIEVEMENTS.length} Unlocked</div>
            
            <div className="h-2 bg-card rounded-full overflow-hidden mb-6 border border-border">
              <div 
                className="h-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-1000" 
                style={{ width: `${(unlockedAchievements.length / ACHIEVEMENTS.length) * 100}%` }}
              />
            </div>

            <div className="flex flex-col gap-3">
              {ACHIEVEMENTS.map(a => {
                const unlocked = unlockedAchievements.includes(a.id);
                return (
                  <div key={a.id} className={`bg-card border-2 rounded-xl p-3 flex items-center gap-3 ${unlocked ? 'border-primary shadow-[0_0_15px_rgba(255,215,0,0.1)]' : 'border-border opacity-60'}`}>
                    <span className={`text-2xl ${!unlocked && 'grayscale opacity-50'}`}>{a.icon}</span>
                    <div className="flex-1">
                      <div className={`font-bold text-sm ${unlocked ? 'text-primary' : 'text-foreground'}`}>{a.title}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{a.desc}</div>
                    </div>
                    {unlocked ? <span className="text-xl">✅</span> : <span className="text-lg opacity-50">🔒</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
