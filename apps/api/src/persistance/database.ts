import { Database } from "bun:sqlite";

/** Shared DB instance; created when this module is loaded. */
export const db = new Database("oss-forums.sqlite", { create: true });

export function initDatabase() {

  console.log('Initializing database');

  db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL,
      title TEXT,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.query(`
    CREATE TABLE IF NOT EXISTS device_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      session_fingerprint TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (device_id, session_fingerprint),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run();

  db.query(`
    CREATE TABLE IF NOT EXISTS user_private_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      key_hash TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      revoked_at TIMESTAMP DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run();

  db.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      bio TEXT,
      location TEXT,
      website_url TEXT,
      avatar_url TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run();

  db.query(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      accent TEXT DEFAULT NULL,
      deleted BOOLEAN DEFAULT FALSE,
      deleted_at TIMESTAMP DEFAULT NULL,
      guidelines TEXT NOT NULL DEFAULT '[]'
    )
  `).run();

  db.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      title TEXT,
      body TEXT NOT NULL,
      deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP DEFAULT NULL,
      moderation_status TEXT DEFAULT NULL,
      moderation_reason TEXT DEFAULT NULL,
      moderated_by TEXT DEFAULT NULL,
      moderated_at TIMESTAMP DEFAULT NULL,
      FOREIGN KEY (channel_id) REFERENCES channels(id),
      FOREIGN KEY (author_id) REFERENCES users(id),
      FOREIGN KEY (moderated_by) REFERENCES users(id)
    )
  `).run();

  db.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      parent_id TEXT,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      moderation_status TEXT,
      moderation_reason TEXT,
      moderated_by TEXT,
      moderated_at TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (author_id) REFERENCES users(id),
      FOREIGN KEY (parent_id) REFERENCES comments(id),
      FOREIGN KEY (moderated_by) REFERENCES users(id)
    )
  `).run();

  db.query(`
    CREATE TABLE IF NOT EXISTS profile_comments (
      id TEXT PRIMARY KEY,
      profile_user_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      parent_id TEXT,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      moderation_status TEXT,
      moderation_reason TEXT,
      moderated_by TEXT,
      moderated_at TIMESTAMP,
      FOREIGN KEY (profile_user_id) REFERENCES users(id),
      FOREIGN KEY (author_id) REFERENCES users(id),
      FOREIGN KEY (parent_id) REFERENCES profile_comments(id),
      FOREIGN KEY (moderated_by) REFERENCES users(id)
    )
  `).run();

  db.query(`
    CREATE TABLE IF NOT EXISTS admin_queue (
      id TEXT PRIMARY KEY,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      reporter_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_by TEXT,
      resolved_at TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    )
  `).run();

  db.query(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      event_type TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (actor_id) REFERENCES users(id)
    )
  `).run();

  console.log('Database initialized');
}
