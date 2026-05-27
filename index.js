// index.js — Main bot entry point
// Handles all slash command interactions

require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const db = require('./database');

// ─── Create the bot client ────────────────────────────────────────────────────
// Intents tell Discord which events to send us.
// We need Guilds (servers) and GuildMembers to check required-server membership.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// ─── Bot ready event ──────────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`📡 Serving ${client.guilds.cache.size} server(s)`);
});

// ─── Slash command handler ────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  // Only handle slash commands
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // ── /invite ──────────────────────────────────────────────────────────────
  if (commandName === 'invite') {
    const config = db.getConfig();

    if (!config.invite_link) {
      return interaction.reply({
        content: '⚠️ No invite link has been set yet. Ask an admin to run `/setrequiredserver`.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('📨 Required Server Invite')
      .setDescription(`Click the button below to join our required Discord server.`)
      .setColor(0x5865F2)
      .setFooter({ text: 'Join → then run /verify to get your role.' });

    const button = new ButtonBuilder()
      .setLabel('Join Server')
      .setStyle(ButtonStyle.Link)
      .setURL(config.invite_link)
      .setEmoji('🔗');

    const row = new ActionRowBuilder().addComponents(button);

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  // ── /requiredjoin ─────────────────────────────────────────────────────────
  if (commandName === 'requiredjoin') {
    const config = db.getConfig();

    const embed = new EmbedBuilder()
      .setTitle('🔒 Required Server')
      .setDescription(
        'You must join our required Discord server before you can access this server.\n\n' +
        'Click the button below to join, then run `/verify` here to receive your role.'
      )
      .setColor(0xED4245) // Discord red
      .setFooter({ text: 'No account data is collected by joining.' });

    const components = [];

    if (config.invite_link) {
      const button = new ButtonBuilder()
        .setLabel('Join Required Server')
        .setStyle(ButtonStyle.Link)
        .setURL(config.invite_link)
        .setEmoji('🚀');

      components.push(new ActionRowBuilder().addComponents(button));
    }

    return interaction.reply({ embeds: [embed], components, ephemeral: true });
  }

  // ── /verify ───────────────────────────────────────────────────────────────
  if (commandName === 'verify') {
    const config = db.getConfig();

    // Make sure an admin has configured the required server
    if (!config.server_id) {
      return interaction.reply({
        content: '⚠️ The required server has not been configured yet. Ask an admin to run `/setrequiredserver`.',
        ephemeral: true,
      });
    }
    if (!config.role_id) {
      return interaction.reply({
        content: '⚠️ The verified role has not been set yet. Ask an admin to run `/setverifiedrole`.',
        ephemeral: true,
      });
    }

    // Defer reply so we have time to fetch data from Discord
    await interaction.deferReply({ ephemeral: true });

    // Try to fetch the required server
    let requiredGuild;
    try {
      requiredGuild = await client.guilds.fetch(config.server_id);
    } catch {
      return interaction.editReply(
        '❌ **Bot must be invited to the required server first.**\n' +
        `Please invite the bot to server \`${config.server_id}\` before users can verify.`
      );
    }

    // Check if the user is a member of the required server
    let isMember = false;
    try {
      // fetch() throws if the member is not found
      await requiredGuild.members.fetch(interaction.user.id);
      isMember = true;
    } catch {
      isMember = false;
    }

    if (!isMember) {
      // User hasn't joined the required server — send the invite
      const embed = new EmbedBuilder()
        .setTitle('❌ Not a Member Yet')
        .setDescription(
          `You have not joined the required server yet.\n\n` +
          `Please join first, then run \`/verify\` again.`
        )
        .setColor(0xED4245);

      const components = [];
      if (config.invite_link) {
        const button = new ButtonBuilder()
          .setLabel('Join Required Server')
          .setStyle(ButtonStyle.Link)
          .setURL(config.invite_link);
        components.push(new ActionRowBuilder().addComponents(button));
      }

      return interaction.editReply({ embeds: [embed], components });
    }

    // User is a member — assign the verified role
    const member = interaction.member;
    const role = interaction.guild.roles.cache.get(config.role_id);

    if (!role) {
      return interaction.editReply(
        `❌ The configured role (\`${config.role_id}\`) was not found in this server. Ask an admin to re-run \`/setverifiedrole\`.`
      );
    }

    try {
      await member.roles.add(role);
    } catch {
      return interaction.editReply(
        `❌ I couldn't assign the **${role.name}** role. Please make sure my role is **above** the verified role in the server's role list.`
      );
    }

    // Save to the database
    db.addVerifiedUser(interaction.user.id, interaction.guild.id);

    const embed = new EmbedBuilder()
      .setTitle('✅ Verified!')
      .setDescription(
        `You have been verified and given the **${role.name}** role.\nWelcome!`
      )
      .setColor(0x57F287) // Discord green
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }

  // ── /setrequiredserver ────────────────────────────────────────────────────
  if (commandName === 'setrequiredserver') {
    // Admins only (Manage Guild permission)
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: '🚫 You need the **Manage Server** permission to use this command.',
        ephemeral: true,
      });
    }

    const serverId  = interaction.options.getString('server_id');
    const inviteLink = interaction.options.getString('invite_link');

    // Basic invite-link format check
    if (!inviteLink.startsWith('https://discord.gg/') && !inviteLink.startsWith('https://discord.com/invite/')) {
      return interaction.reply({
        content: '⚠️ Please provide a valid Discord invite link starting with `https://discord.gg/` or `https://discord.com/invite/`.',
        ephemeral: true,
      });
    }

    db.setRequiredServer(serverId, inviteLink);

    return interaction.reply({
      content: `✅ Required server set!\n**Server ID:** \`${serverId}\`\n**Invite link:** ${inviteLink}`,
      ephemeral: true,
    });
  }

  // ── /setverifiedrole ──────────────────────────────────────────────────────
  if (commandName === 'setverifiedrole') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: '🚫 You need the **Manage Server** permission to use this command.',
        ephemeral: true,
      });
    }

    const role = interaction.options.getRole('role');
    db.setVerifiedRole(role.id);

    return interaction.reply({
      content: `✅ Verified role set to **${role.name}** (\`${role.id}\`).`,
      ephemeral: true,
    });
  }

  // ── /panel ────────────────────────────────────────────────────────────────
  if (commandName === 'panel') {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: '🚫 You need the **Manage Server** permission to use this command.',
        ephemeral: true,
      });
    }

    const config = db.getConfig();
    const verifiedCount = db.getVerifiedCount();

    const embed = new EmbedBuilder()
      .setTitle('⚙️ Bot Settings Panel')
      .setColor(0x5865F2)
      .addFields(
        {
          name: '📋 Required Server ID',
          value: config.server_id ? `\`${config.server_id}\`` : '*(not set)*',
          inline: true,
        },
        {
          name: '🔗 Invite Link',
          value: config.invite_link ? config.invite_link : '*(not set)*',
          inline: true,
        },
        {
          name: '🎭 Verified Role ID',
          value: config.role_id ? `\`${config.role_id}\`` : '*(not set)*',
          inline: true,
        },
        {
          name: '✅ Total Verified Users',
          value: `**${verifiedCount}**`,
          inline: true,
        }
      )
      .setFooter({ text: `${client.user.tag} — Admin Panel` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

// ─── Log in with the bot token from .env ─────────────────────────────────────
client.login(process.env.BOT_TOKEN);
