// deploy-commands.js — Registers slash commands with Discord
// Run this once (or whenever you change commands): node deploy-commands.js

require('dotenv').config();

const { REST, Routes } = require('@discordjs/rest');
const { ApplicationCommandOptionType } = require('discord-api-types/v10');

// ─── Command definitions ──────────────────────────────────────────────────────

const commands = [
  // /invite — sends the required server invite link
  {
    name: 'invite',
    description: 'Get the invite link for the required Discord server.',
  },

  // /requiredjoin — explains the required-join system
  {
    name: 'requiredjoin',
    description: 'Learn about the required server you must join to access this server.',
  },

  // /verify — checks membership and grants role
  {
    name: 'verify',
    description: 'Verify that you have joined the required server and get your role.',
  },

  // /setrequiredserver — admin: set required server
  {
    name: 'setrequiredserver',
    description: '[Admin] Set the required server ID and invite link.',
    options: [
      {
        name: 'server_id',
        description: 'The ID of the required Discord server.',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: 'invite_link',
        description: 'The invite link for that server (e.g. https://discord.gg/abc123).',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  // /setverifiedrole — admin: set verified role
  {
    name: 'setverifiedrole',
    description: '[Admin] Set the role to give verified users.',
    options: [
      {
        name: 'role',
        description: 'The role to assign when a user is verified.',
        type: ApplicationCommandOptionType.Role,
        required: true,
      },
    ],
  },

  // /panel — admin: show current bot settings
  {
    name: 'panel',
    description: '[Admin] View current bot settings and verified user count.',
  },
];

// ─── Register commands ────────────────────────────────────────────────────────

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('Registering slash commands with Discord...');

    // Use CLIENT_ID from .env — this deploys commands globally (may take up to 1 hour to propagate)
    // For instant testing on a single server, replace Routes.applicationCommands with
    // Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Slash commands registered successfully!');
    console.log('Note: Global commands may take up to 1 hour to appear in Discord.');
    console.log('Tip: For instant testing, switch to guild (server) commands — see the comment above.');
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
})();
