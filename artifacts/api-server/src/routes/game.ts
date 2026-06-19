import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, gameSavesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SaveGameBody } from "@workspace/api-zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  next();
};

// GET /api/game/save
router.get("/game/save", requireAuth, async (req: any, res) => {
  try {
    const rows = await db
      .select()
      .from(gameSavesTable)
      .where(eq(gameSavesTable.userId, req.userId))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No save found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to get game save");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/game/save
router.post("/game/save", requireAuth, async (req: any, res) => {
  const parsed = SaveGameBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { money, plots, stats, unlockedAchievements } = parsed.data;

  try {
    const existing = await db
      .select()
      .from(gameSavesTable)
      .where(eq(gameSavesTable.userId, req.userId))
      .limit(1);

    let row;
    if (existing.length > 0) {
      const updated = await db
        .update(gameSavesTable)
        .set({ money, plots, stats, unlockedAchievements, updatedAt: new Date() })
        .where(eq(gameSavesTable.userId, req.userId))
        .returning();
      row = updated[0];
    } else {
      const inserted = await db
        .insert(gameSavesTable)
        .values({ userId: req.userId, money, plots, stats, unlockedAchievements })
        .returning();
      row = inserted[0];
    }

    return res.json(row);
  } catch (err) {
    req.log.error({ err }, "Failed to save game");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
