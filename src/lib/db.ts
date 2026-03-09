import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'levio.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT,
    guild_id TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    balance INTEGER DEFAULT 100,
    last_daily INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, guild_id)
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    guild_id TEXT,
    reason TEXT,
    moderator_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS server_stats (
    guild_id TEXT,
    date TEXT,
    messages_sent INTEGER DEFAULT 0,
    commands_used INTEGER DEFAULT 0,
    new_members INTEGER DEFAULT 0,
    PRIMARY KEY (guild_id, date)
  );

  CREATE TABLE IF NOT EXISTS guild_config (
    guild_id TEXT PRIMARY KEY,
    prefix TEXT DEFAULT '!',
    mod_log_channel TEXT,
    welcome_channel TEXT,
    ai_enabled INTEGER DEFAULT 1
  );
`);

export default db;
