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
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    province TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    product_id TEXT,
    product_name TEXT,
    brand TEXT,
    category TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

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

  // Auth Routes
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, firstName, lastName, phone, province } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    try {
      const stmt = db.prepare(`
        INSERT INTO users (id, email, password, first_name, last_name, phone, province)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, email, password, firstName, lastName, phone, province);
      const user = db.prepare("SELECT id, email, first_name, last_name, province FROM users WHERE id = ?").get(id);
      res.json({ success: true, user });
    } catch (error) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT id, email, first_name, last_name, province FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Purchase Patterns Routes
  app.get("/api/purchases/:userId", (req, res) => {
    const purchases = db.prepare(`
      SELECT * FROM purchases 
      WHERE user_id = ? 
      ORDER BY timestamp DESC
    `).all(req.params.userId);
    res.json(purchases);
  });

  app.post("/api/purchases", (req, res) => {
    const { userId, productId, productName, brand, category } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    const stmt = db.prepare(`
      INSERT INTO purchases (id, user_id, product_id, product_name, brand, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, userId, productId, productName, brand, category);
    res.json({ success: true });
  });

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
