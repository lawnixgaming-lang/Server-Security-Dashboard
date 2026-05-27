// database.js — SQLite setup and helper functions
// Uses better-sqlite3 (synchronous, works great on Termux)

const Database = require('better-sqlite3');

// Open (or create) the database file
const db = new Database('./data.db');

// ─── Create tables if they don't exist yet ───────────────────────────────────

// Stores the bot's configuration (one row)
db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    id          INTEGER PRIMARY KEY CHECK (id = 1),
    server_id   TEXT,
    invite_link TEXT,
    role_id     TEXT
  );

  -- Insert a blank config row if none exists
  INSERT OR IGNORE INTO config (id) VALUES (1);
`);

// Stores verified users
db.exec(`
  CREATE TABLE IF NOT EXISTS verified_users (
    user_id    TEXT PRIMARY KEY,
    guild_id   TEXT,
    verified_at TEXT DEFAULT (datetime('now'))
  );
`);

// ─── Config helpers ───────────────────────────────────────────────────────────

/** Get the current bot config row */
function getConfig() {
  return db.prepare('SELECT * FROM config WHERE id = 1').get();
}

/** Save the required server ID and invite link */
function setRequiredServer(serverId, inviteLink) {
  db.prepare(
    'UPDATE config SET server_id = ?, invite_link = ? WHERE id = 1'
  ).run(serverId, inviteLink);
}

/** Save the verified role ID */
function setVerifiedRole(roleId) {
  db.prepare('UPDATE config SET role_id = ? WHERE id = 1').run(roleId);
}

// ─── Verified-user helpers ────────────────────────────────────────────────────

/** Mark a user as verified in a specific guild */
function addVerifiedUser(userId, guildId) {
  db.prepare(
    'INSERT OR REPLACE INTO verified_users (user_id, guild_id) VALUES (?, ?)'
  ).run(userId, guildId);
}

/** Check whether a user is already verified */
function isVerified(userId) {
  const row = db.prepare(
    'SELECT 1 FROM verified_users WHERE user_id = ?'
  ).get(userId);
  return !!row;
}

/** Return the total count of verified users */
function getVerifiedCount() {
  return db.prepare('SELECT COUNT(*) AS count FROM verified_users').get().count;
}

module.exports = {
  getConfig,
  setRequiredServer,
  setVerifiedRole,
  addVerifiedUser,
  isVerified,
  getVerifiedCount,
};
