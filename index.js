require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  SlashCommandBuilder,
  REST,
  Routes,
} = require('discord.js');

const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ===== MEMBER COMMANDS (everyone can use) =====
const memberCommands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check latency'),

  new SlashCommandBuilder()
    .setName('avatar')
    .setDescription("Show a user's avatar")
    .addUserOption(o => o.setName('user').setDescription('User (leave empty for yourself)')),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show info about a user')
    .addUserOption(o => o.setName('user').setDescription('User (leave empty for yourself)')),

  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Show server info'),

  new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Get a random meme'),

  new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin'),

  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say something')
    .addStringOption(o => o.setName('text').setDescription('Message to send').setRequired(true)),

  new SlashCommandBuilder()
    .setName('gay')
    .setDescription('Check how gay someone is 🏳️‍🌈')
    .addUserOption(o => o.setName('user').setDescription('User (leave empty for yourself)')),
];

// ===== ADMIN COMMANDS (admin/owner only) =====
const adminCommands = [
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('[ADMIN] Kick a user')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
    .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('[ADMIN] Ban a user')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('[ADMIN] Warn a user')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('[ADMIN] Timeout a user')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User to mute').setRequired(true))
    .addIntegerOption(o => o.setName('minutes').setDescription('Duration in minutes').setRequired(true)),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('[ADMIN] Remove timeout from a user')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User to unmute').setRequired(true)),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('[ADMIN] Clear messages (1-100)')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
    .addIntegerOption(o => o.setName('amount').setDescription('Number of messages (1-100)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('[ADMIN] Delete messages (1-100)')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
    .addIntegerOption(o => o.setName('amount').setDescription('Number of messages (1-100)').setRequired(true)),
];

const allCommands = [...memberCommands, ...adminCommands].map(cmd => cmd.toJSON());

// ===== REGISTER COMMANDS GLOBALLY =====
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    console.log('⏳ Registering commands globally...');

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: allCommands }
    );

    console.log(`✅ Successfully registered ${allCommands.length} commands globally!`);
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
  }
});

// ===== PERMISSION CHECK =====
const ADMIN_COMMANDS = ['kick', 'ban', 'warn', 'mute', 'unmute', 'clear', 'purge'];

function isAdminOrOwner(interaction) {
  const member = interaction.member;
  const isOwner = interaction.guild.ownerId === member.id;
  const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
  const canModerate = member.permissions.has(PermissionsBitField.Flags.ModerateMembers);
  const canKick = member.permissions.has(PermissionsBitField.Flags.KickMembers);
  const canBan = member.permissions.has(PermissionsBitField.Flags.BanMembers);
  const canManageMessages = member.permissions.has(PermissionsBitField.Flags.ManageMessages);
  return isOwner || isAdmin || canModerate || canKick || canBan || canManageMessages;
}

// ===== INTERACTIONS =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const name = interaction.commandName;

  if (ADMIN_COMMANDS.includes(name) && !isAdminOrOwner(interaction)) {
    return interaction.reply({
      content: '🚫 You do not have permission to use this command.',
      ephemeral: true
    });
  }

  try {

    if (name === 'ping') {
      return interaction.reply(`🏓 Pong! Latency: **${client.ws.ping}ms**`);
    }

    if (name === 'coinflip') {
      return interaction.reply(Math.random() < 0.5 ? '🪙 Heads!' : '🪙 Tails!');
    }

    if (name === 'say') {
      return interaction.reply(interaction.options.getString('text'));
    }

    if (name === 'meme') {
      const res = await axios.get('https://meme-api.com/gimme');
      return interaction.reply(res.data.url);
    }

    if (name === 'avatar') {
      const target = interaction.options.getUser('user') || interaction.user;
      return interaction.reply({
        embeds: [{
          color: 0x5865F2,
          title: `🖼️ ${target.username}'s Avatar`,
          image: { url: target.displayAvatarURL({ size: 512 }) }
        }]
      });
    }

    if (name === 'userinfo') {
      const target = interaction.options.getUser('user') || interaction.user;
      const member = interaction.guild.members.cache.get(target.id);
      return interaction.reply({
        embeds: [{
          color: 0x5865F2,
          title: `👤 ${target.username}`,
          thumbnail: { url: target.displayAvatarURL() },
          fields: [
            { name: '🆔 User ID', value: target.id, inline: true },
            { name: '🤖 Bot?', value: target.bot ? 'Yes' : 'No', inline: true },
            { name: '📅 Account Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:D>`, inline: true },
            { name: '📥 Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'Unknown', inline: true },
          ]
        }]
      });
    }

    if (name === 'serverinfo') {
      const g = interaction.guild;
      return interaction.reply({
        embeds: [{
          color: 0x5865F2,
          title: `📊 ${g.name}`,
          thumbnail: { url: g.iconURL() },
          fields: [
            { name: '👑 Owner', value: `<@${g.ownerId}>`, inline: true },
            { name: '👥 Members', value: `${g.memberCount}`, inline: true },
            { name: '📺 Channels', value: `${g.channels.cache.size}`, inline: true },
            { name: '🎭 Roles', value: `${g.roles.cache.size}`, inline: true },
            { name: '🚀 Boosts', value: `${g.premiumSubscriptionCount ?? 0}`, inline: true },
            { name: '🆔 Server ID', value: g.id }
          ]
        }]
      });
    }

    if (name === 'gay') {
      const target = interaction.options.getUser('user') || interaction.user;
      const percentage = Math.floor(Math.random() * 101);
      let emoji = '🏳️‍🌈';
      let message = '';

      if (percentage <= 20) message = 'Totally straight!';
      else if (percentage <= 40) message = 'Just a little fruity 🍓';
      else if (percentage <= 60) message = 'Somewhere in the middle 👀';
      else if (percentage <= 80) message = 'Pretty gay ngl 😳';
      else message = 'MAXIMUM RAINBOW ENERGY 🌈';

      return interaction.reply({
        embeds: [{
          color: 0xFF69B4,
          title: `${emoji} Gay Meter`,
          description: `**${target.username}** is **${percentage}% gay!**\n\n${message}`,
          thumbnail: { url: target.displayAvatarURL({ size: 256 }) }
        }]
      });
    }

    if (name === 'kick') {
      const target = interaction.options.getMember('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
      if (!target.kickable) return interaction.reply({ content: '❌ I cannot kick this user.', ephemeral: true });
      await target.kick(reason);
      return interaction.reply({
        embeds: [{ color: 0xFF5555, title: '👢 User Kicked', fields: [{ name: 'User', value: `${target.user.tag}`, inline: true }, { name: 'Reason', value: reason, inline: true }] }]
      });
    }

    if (name === 'ban') {
      const target = interaction.options.getMember('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
      if (!target.bannable) return interaction.reply({ content: '❌ I cannot ban this user.', ephemeral: true });
      await target.ban({ reason });
      return interaction.reply({
        embeds: [{ color: 0xFF0000, title: '🔨 User Banned', fields: [{ name: 'User', value: `${target.user.tag}`, inline: true }, { name: 'Reason', value: reason, inline: true }] }]
      });
    }

    if (name === 'warn') {
      const target = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
      return interaction.reply({
        embeds: [{ color: 0xFFAA00, title: '⚠️ User Warned', fields: [{ name: 'User', value: `${target.tag}`, inline: true }, { name: 'Reason', value: reason, inline: true }] }]
      });
    }

    if (name === 'mute') {
      const target = interaction.options.getMember('user');
      const minutes = interaction.options.getInteger('minutes');
      if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
      if (!target.moderatable) return interaction.reply({ content: '❌ I cannot mute this user.', ephemeral: true });
      await target.timeout(minutes * 60 * 1000, `Muted by ${interaction.user.tag}`);
      return interaction.reply({
        embeds: [{ color: 0xFFAA00, title: '🔇 User Muted', fields: [{ name: 'User', value: `${target.user.tag}`, inline: true }, { name: 'Duration', value: `${minutes} minute(s)`, inline: true }] }]
      });
    }

    if (name === 'unmute') {
      const target = interaction.options.getMember('user');
      if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });
      await target.timeout(null);
      return interaction.reply({
        embeds: [{ color: 0x57F287, title: '🔊 User Unmuted', fields: [{ name: 'User', value: `${target.user.tag}` }] }]
      });
    }

    if (name === 'clear' || name === 'purge') {
      const amount = interaction.options.getInteger('amount');
      if (amount < 1 || amount > 100) {
        return interaction.reply({ content: '❌ Amount must be between 1 and 100.', ephemeral: true });
      }
      await interaction.channel.bulkDelete(amount, true);
      return interaction.reply({ content: `🗑️ Deleted **${amount}** message(s).`, ephemeral: true });
    }

  } catch (err) {
    console.error('❌ Command error:', err);
    if (!interaction.replied && !interaction.deferred) {
      interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
    }
  }
});

client.login(TOKEN);
