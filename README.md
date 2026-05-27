# Discord Required-Join Bot

A Discord.js v14 bot with a safe **required-join verification** system.  
Users are never force-joined — they are given an invite link, and then use `/verify` to get their role.

---

## Features

| Command | Who | What it does |
|---|---|---|
| `/invite` | Anyone | Sends the required server invite link |
| `/requiredjoin` | Anyone | Explains the required-join system |
| `/verify` | Anyone | Checks membership → assigns verified role |
| `/setrequiredserver` | Admin | Sets required server ID + invite link |
| `/setverifiedrole` | Admin | Sets the verified role |
| `/panel` | Admin | Shows all settings + verified user count |

Web dashboard at `http://localhost:3000` shows bot status, config, and verified count.

---

## Setup on Termux (Android)

### 1. Install Termux

Download **Termux from F-Droid** (not the Play Store version — it is outdated):  
https://f-droid.org/en/packages/com.termux/

### 2. Install Node.js and Git

```bash
pkg update && pkg upgrade -y
pkg install nodejs git -y
```

Check versions:

```bash
node -v   # should be v18 or higher
npm -v
git --version
```

### 3. Clone or create the project

If you pushed to GitHub already:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO/discord-bot
```

Or if starting fresh, just copy the project folder to Termux storage.

### 4. Install dependencies

```bash
npm install
```

> `better-sqlite3` compiles native code — this is normal and may take a minute on Android.

---

## Create a Discord Bot

1. Go to https://discord.com/developers/applications
2. Click **New Application** — give it a name.
3. Click **Bot** in the left sidebar.
4. Click **Add Bot** → **Yes, do it!**
5. Under **Token**, click **Reset Token** → copy it (you will need it for `.env`).
6. Scroll down to **Privileged Gateway Intents** and enable:
   - **Server Members Intent** ← required for `/verify` to check membership
7. Click **Save Changes**.

---

## Enable Required Bot Permissions

Under **OAuth2 → URL Generator**, select:

**Scopes:**
- `bot`
- `applications.commands`

**Bot Permissions:**
- Manage Roles
- Send Messages
- Embed Links
- Use Slash Commands

This generates a bot invite URL — copy it and open it in your browser to invite the bot to your server.

> **Permission integer** (if you want to enter it manually): `268437504`

> **Important:** The bot's role must be **above** the Verified role in your server's role list, or it cannot assign it.

---

## Invite the Bot

1. Use the URL generated in OAuth2 → URL Generator (see above).
2. Invite the bot to **both** your main server **and** the required server.  
   The bot needs to be in the required server to check if users are members.

---

## Fill in .env

```bash
cp .env.example .env
nano .env
```

Fill in:

```env
BOT_TOKEN=paste_your_bot_token_here
CLIENT_ID=paste_your_application_id_here
DASHBOARD_PORT=3000
```

- `BOT_TOKEN` — from the Bot page in the Developer Portal
- `CLIENT_ID` — from **General Information → Application ID**
- Save with `Ctrl+O`, then `Ctrl+X`

---

## Deploy Slash Commands

Run this **once** (or any time you add/change commands):

```bash
node deploy-commands.js
```

> Global commands can take up to 1 hour to appear.  
> For instant testing on a single server, edit `deploy-commands.js` and change `Routes.applicationCommands` to `Routes.applicationGuildCommands(CLIENT_ID, 'YOUR_SERVER_ID')`.

---

## Run the Bot

Start the bot:

```bash
node index.js
```

Start the dashboard (in a second terminal or tmux pane):

```bash
node web.js
```

Or run both together:

```bash
node index.js & node web.js
```

---

## Keep it Running with tmux

`tmux` lets the bot keep running after you close Termux.

```bash
pkg install tmux -y
```

Create a session:

```bash
tmux new -s bot
```

Inside the tmux session, run the bot:

```bash
node index.js
```

Open a second pane (`Ctrl+B` then `%`), and run the dashboard:

```bash
node web.js
```

Detach from tmux (bot keeps running):

```bash
# Press Ctrl+B, then press D
```

Re-attach later:

```bash
tmux attach -t bot
```

---

## Configure the Bot (first time)

Once the bot is running in your server, use these admin commands:

1. `/setrequiredserver server_id:<ID> invite_link:<URL>` — set the server users must join
2. `/setverifiedrole role:@YourRole` — set the role to give verified users
3. `/panel` — confirm the settings look right

Users can then:
1. Run `/requiredjoin` or `/invite` to get the invite link
2. Join the required server
3. Run `/verify` to get their verified role automatically

---

## Push Safely to GitHub

The `.gitignore` already excludes `.env` and `data.db`.  
**Never commit your `.env` file** — it contains your bot token.

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

If you accidentally committed `.env`:

```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
git push
```

Then immediately **reset your bot token** in the Discord Developer Portal.

---

## Project Structure

```
discord-bot/
├── index.js            # Main bot — handles all slash commands
├── deploy-commands.js  # Run once to register commands with Discord
├── database.js         # SQLite helpers (config + verified users)
├── web.js              # Express dashboard server
├── views/
│   └── dashboard.ejs   # Dashboard HTML template
├── .env                # Your secrets (never commit this!)
├── .env.example        # Template — safe to commit
├── .gitignore
├── package.json
└── README.md
```

---

## Security Notes

- Bot token is loaded from `.env` — never hardcoded
- No user tokens, no selfbots, no force-joins
- Only the official Discord Bot API is used
- `.env` and `data.db` are git-ignored
- Users choose to join the required server — the bot never joins them automatically
