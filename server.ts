import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("nutriscan.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    name TEXT,
    brand TEXT,
    image_url TEXT,
    score INTEGER,
    label TEXT,
    summary TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS saved_recipes (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    name TEXT,
    description TEXT,
    ingredients TEXT,
    instructions TEXT,
    calories INTEGER,
    health_note TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS preferences (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    diet TEXT DEFAULT 'none',
    personalized_recommendations BOOLEAN DEFAULT 1
  );

  INSERT OR IGNORE INTO preferences (id, diet, personalized_recommendations) VALUES (1, 'none', 1);
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/history", (req, res) => {
    const history = db.prepare("SELECT * FROM history ORDER BY timestamp DESC LIMIT 50").all();
    res.json(history);
  });

  app.post("/api/history", (req, res) => {
    const { id, name, brand, image_url, score, label, summary } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO history (id, name, brand, image_url, score, label, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, brand, image_url, score, label, summary);
    res.json({ success: true });
  });

  app.delete("/api/history", (req, res) => {
    db.prepare("DELETE FROM history").run();
    res.json({ success: true });
  });

  app.get("/api/preferences", (req, res) => {
    const prefs = db.prepare("SELECT * FROM preferences WHERE id = 1").get();
    res.json(prefs);
  });

  app.post("/api/preferences", (req, res) => {
    const { diet, personalized_recommendations } = req.body;
    db.prepare("UPDATE preferences SET diet = ?, personalized_recommendations = ? WHERE id = 1")
      .run(diet, personalized_recommendations ? 1 : 0);
    res.json({ success: true });
  });

  app.get("/api/saved-recipes", (req, res) => {
    const recipes = db.prepare("SELECT * FROM saved_recipes ORDER BY timestamp DESC").all();
    res.json(recipes.map(r => ({
      ...r,
      ingredients: JSON.parse(r.ingredients),
      instructions: JSON.parse(r.instructions)
    })));
  });

  app.post("/api/saved-recipes", (req, res) => {
    const { id, product_id, name, description, ingredients, instructions, calories, health_note } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO saved_recipes (id, product_id, name, description, ingredients, instructions, calories, health_note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, product_id, name, description, JSON.stringify(ingredients), JSON.stringify(instructions), calories, health_note);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
