// web.js — Express web dashboard
// Shows bot status, config, and verified user count in a simple dark UI

require('dotenv').config();

const express = require('express');
const path    = require('path');
const db      = require('./database');

const app  = express();
const PORT = process.env.DASHBOARD_PORT || 3000;

// Use EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Dashboard route ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const config        = db.getConfig();
  const verifiedCount = db.getVerifiedCount();

  res.render('dashboard', {
    status:       'Online ✅',
    serverId:     config.server_id  || 'Not configured',
    inviteLink:   config.invite_link || null,
    roleId:       config.role_id    || 'Not configured',
    verifiedCount,
    timestamp:    new Date().toUTCString(),
  });
});

// ─── Start the server ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌐 Dashboard running at http://localhost:${PORT}`);
});

module.exports = app;
