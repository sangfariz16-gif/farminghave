import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gameSavesTable = pgTable("game_saves", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  money: integer("money").notNull().default(200),
  plots: text("plots").notNull().default("[]"),
  stats: text("stats").notNull().default("{}"),
  unlockedAchievements: text("unlocked_achievements").notNull().default("[]"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGameSaveSchema = createInsertSchema(gameSavesTable).omit({ id: true, updatedAt: true });
export type InsertGameSave = z.infer<typeof insertGameSaveSchema>;
export type GameSave = typeof gameSavesTable.$inferSelect;
