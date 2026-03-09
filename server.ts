import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import { LevioBot } from "./src/bot/index.ts";
import db from "./src/lib/db.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const DISABLE_DASHBOARD = process.env.DISABLE_DASHBOARD === 'true';

  if (!DISABLE_DASHBOARD) {
    // API Routes for Dashboard
    app.get("/api/stats", (req, res) => {
      try {
        const totalUsers = db.prepare('SELECT COUNT(DISTINCT user_id) as count FROM users').get() as any;
        const topUsers = db.prepare('SELECT user_id as id, level, xp FROM users ORDER BY xp DESC LIMIT 5').all();
        const serverStats = db.prepare(`
          SELECT date, SUM(messages_sent) as messages_sent, SUM(commands_used) as commands_used 
          FROM server_stats 
          GROUP BY date 
          ORDER BY date DESC 
          LIMIT 7
        `).all();
        
        res.json({
          totalUsers: totalUsers?.count || 0,
          topUsers: topUsers || [],
          serverStats: serverStats || []
        });
      } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "Internal Server Error", details: (error as Error).message });
      }
    });

    // Catch-all for other /api routes to prevent falling through to Vite
    app.all("/api/*", (req, res) => {
      res.status(404).json({ error: "API Route Not Found" });
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static("dist"));
    }
    console.log(`📊 Dashboard enabled on port ${PORT}`);
  } else {
    console.log("🚀 Dashboard is disabled to save resources.");
  }

  // Start Discord Bot
  const bot = new LevioBot(process.env.DISCORD_TOKEN || 'YOUR_DISCORD_TOKEN');
  await bot.start();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 LEViO Dashboard running on http://localhost:${PORT}`);
  });
}

startServer();
