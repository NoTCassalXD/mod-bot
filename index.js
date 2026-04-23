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

// ===== GENSHIN CHARACTERS =====
const genshinCharacters = [
  { name: 'Neuvillette', stars: 5, element: 'Hydro', icon: '💧' },
  { name: 'Furina', stars: 5, element: 'Hydro', icon: '💧' },
  { name: 'Zhongli', stars: 5, element: 'Geo', icon: '🪨' },
  { name: 'Raiden Shogun', stars: 5, element: 'Electro', icon: '⚡' },
  { name: 'Kazuha', stars: 5, element: 'Anemo', icon: '🌀' },
  { name: 'Hu Tao', stars: 5, element: 'Pyro', icon: '🔥' },
  { name: 'Ganyu', stars: 5, element: 'Cryo', icon: '❄️' },
  { name: 'Nahida', stars: 5, element: 'Dendro', icon: '🌿' },
  { name: 'Yelan', stars: 5, element: 'Hydro', icon: '💧' },
  { name: 'Xiao', stars: 5, element: 'Anemo', icon: '🌀' },
  { name: 'Arlecchino', stars: 5, element: 'Pyro', icon: '🔥' },
  { name: 'Navia', stars: 5, element: 'Geo', icon: '🪨' },
  { name: 'Clorinde', stars: 5, element: 'Electro', icon: '⚡' },
  { name: 'Wriothesley', stars: 5, element: 'Cryo', icon: '❄️' },
  { name: 'Lyney', stars: 5, element: 'Pyro', icon: '🔥' },
  { name: 'Wanderer', stars: 5, element: 'Anemo', icon: '🌀' },
  { name: 'Cyno', stars: 5, element: 'Electro', icon: '⚡' },
  { name: 'Nilou', stars: 5, element: 'Hydro', icon: '💧' },
  { name: 'Tighnari', stars: 5, element: 'Dendro', icon: '🌿' },
  { name: 'Ayaka', stars: 5, element: 'Cryo', icon: '❄️' },
  { name: 'Ayato', stars: 5, element: 'Hydro', icon: '💧' },
  { name: 'Itto', stars: 5, element: 'Geo', icon: '🪨' },
  { name: 'Eula', stars: 5, element: 'Cryo', icon: '❄️' },
  { name: 'Albedo', stars: 5, element: 'Geo', icon: '🪨' },
  { name: 'Venti', stars: 5, element: 'Anemo', icon: '🌀' },
  { name: 'Noelle', stars: 4, element: 'Geo', icon: '🪨' },
  { name: 'Bennett', stars: 4, element: 'Pyro', icon: '🔥' },
  { name: 'Xingqiu', stars: 4, element: 'Hydro', icon: '💧' },
  { name: 'Fischl', stars: 4, element: 'Electro', icon: '⚡' },
  { name: 'Xiangling', stars: 4, element: 'Pyro', icon: '🔥' },
  { name: 'Sucrose', stars: 4, element: 'Anemo', icon: '🌀' },
  { name: 'Beidou', stars: 4, element: 'Electro', icon: '⚡' },
  { name: 'Razor', stars: 4, element: 'Electro', icon: '⚡' },
  { name: 'Chongyun', stars: 4, element: 'Cryo', icon: '❄️' },
  { name: 'Rosaria', stars: 4, element: 'Cryo', icon: '❄️' },
];

const roasts = [
  "Your Wi-Fi password is probably 'password123' isn't it? 😂",
  "You look like you AFK in the overworld for 3 hours and call it 'exploring' 💀",
  "I've seen slimes with better aim than you 🎯",
  "You're the type to build full ATK on a healer 😭",
  "Even Paimon roams more than you do 🧚",
  "You still haven't cleared Spiral Abyss floor 9, huh? No worries 👀",
  "Your fashion sense makes Childe's outfits look stylish 💅",
  "You're so average even the Traveler has more lore than you 😅",
  "I heard you use Barbara as your main DPS. Respect... I guess 🫡",
  "You probably skip all the story cutscenes and then ask what's happening 🤦",
  "Your team comp is so bad even the hilichurls feel bad for you 🏕️",
  "You're the type to run out of resin and then complain there's nothing to do 😆",
];

// ===== MEMBER COMMANDS =====
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

  new SlashCommandBuilder()
    .setName('sus')
    .setDescription('Check how sus someone is 🔴')
    .addUserOption(o => o.setName('user').setDescription('User (leave empty for yourself)')),

  new SlashCommandBuilder()
    .setName('love')
    .setDescription('Check love compatibility between two users ❤️')
    .addUserOption(o => o.setName('user1').setDescription('First user').setRequired(true))
    .addUserOption(o => o.setName('user2').setDescription('Second user').setRequired(true)),

  new SlashCommandBuilder()
    .setName('roast')
    .setDescription('Roast someone 🔥')
    .addUserOption(o => o.setName('user').setDescription('User to roast').setRequired(true)),

  new SlashCommandBuilder()
    .setName('pull')
    .setDescription('Pull a random Genshin Impact character ✨'),

  new SlashCommandBuilder()
    .setName('main')
    .setDescription('See what Genshin character you main 🎮'),
];

// ===== ADMIN COMMANDS =====
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
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: allCommands });
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
      let message = '';
      if (percentage <= 20) message = 'Totally straight!';
      else if (percentage <= 40) message = 'Just a little fruity 🍓';
      else if (percentage <= 60) message = 'Somewhere in the middle 👀';
      else if (percentage <= 80) message = 'Pretty gay ngl 😳';
      else message = 'MAXIMUM RAINBOW ENERGY 🌈';
      return interaction.reply({
        embeds: [{
          color: 0xFF69B4,
          title: `🏳️‍🌈 Gay Meter`,
          description: `**${target.username}** is **${percentage}% gay!**\n\n${message}`,
          thumbnail: { url: target.displayAvatarURL({ size: 256 }) }
        }]
      });
    }

    if (name === 'sus') {
      const target = interaction.options.getUser('user') || interaction.user;
      const percentage = Math.floor(Math.random() * 101);
      let message = '';
      let color = 0xFF0000;
      if (percentage <= 20) { message = 'Probably innocent... probably. 🟢'; color = 0x57F287; }
      else if (percentage <= 40) { message = 'A little sus but nothing major 🟡'; color = 0xFFFF00; }
      else if (percentage <= 60) { message = 'Kinda sus ngl... 🟠'; color = 0xFFAA00; }
      else if (percentage <= 80) { message = 'Very sus! I\'m voting them out 🔴'; color = 0xFF5555; }
      else { message = 'MEGA SUS! 100% the impostor 📮'; color = 0xFF0000; }
      return interaction.reply({
        embeds: [{
          color,
          title: `🔴 Sus Meter`,
          description: `**${target.username}** is **${percentage}% sus!**\n\n${message}`,
          thumbnail: { url: target.displayAvatarURL({ size: 256 }) },
          footer: { text: 'Emergency meeting called!' }
        }]
      });
    }

    if (name === 'love') {
      const user1 = interaction.options.getUser('user1');
      const user2 = interaction.options.getUser('user2');
      const percentage = Math.floor(Math.random() * 101);
      let message = '';
      let color = 0xFF69B4;
      if (percentage <= 20) { message = 'Yikes... not a great match 💔'; color = 0x808080; }
      else if (percentage <= 40) { message = 'Could work with some effort 🤔'; color = 0xFFAA00; }
      else if (percentage <= 60) { message = 'A decent match! 💛'; color = 0xFFFF00; }
      else if (percentage <= 80) { message = 'Great chemistry! 💕'; color = 0xFF69B4; }
      else { message = 'SOULMATES! Made for each other 💞'; color = 0xFF0000; }
      return interaction.reply({
        embeds: [{
          color,
          title: `❤️ Love Meter`,
          description: `**${user1.username}** ❤️ **${user2.username}**\n\n**${percentage}% compatibility!**\n\n${message}`,
          thumbnail: { url: user1.displayAvatarURL({ size: 256 }) }
        }]
      });
    }

    if (name === 'roast') {
      const target = interaction.options.getUser('user');
      const roast = roasts[Math.floor(Math.random() * roasts.length)];
      return interaction.reply({
        embeds: [{
          color: 0xFF4500,
          title: `🔥 Roasting ${target.username}...`,
          description: roast,
          thumbnail: { url: target.displayAvatarURL({ size: 256 }) },
          footer: { text: 'Just a joke, no harm intended 😄' }
        }]
      });
    }

    if (name === 'pull') {
      const roll = Math.random();
      const pool = roll < 0.20
        ? genshinCharacters.filter(c => c.stars === 5)
        : genshinCharacters.filter(c => c.stars === 4);
      const char = pool[Math.floor(Math.random() * pool.length)];
      const stars = '⭐'.repeat(char.stars);
      const color = char.stars === 5 ? 0xFFD700 : 0xC0C0C0;
      return interaction.reply({
        embeds: [{
          color,
          title: `✨ Wishing...`,
          description: `${char.icon} **${char.name}** — ${char.element}\n${stars}`,
          footer: { text: char.stars === 5 ? '🎉 RARE PULL! Lucky!' : 'Better luck next time for a 5★!' }
        }]
      });
    }

    if (name === 'main') {
      const char = genshinCharacters[Math.floor(Math.random() * genshinCharacters.length)];
      const stars = '⭐'.repeat(char.stars);
      const color = char.stars === 5 ? 0xFFD700 : 0xC0C0C0;
      const mainerMessages = [
        `You are definitely a ${char.name} main and you know it.`,
        `The algorithm has spoken — you main ${char.name}.`,
        `${char.name} main spotted. No cap.`,
        `You have ${char.name} at C6 and you use them everywhere, don't you?`,
        `Your main is ${char.name}. Accept your fate.`,
      ];
      const msg = mainerMessages[Math.floor(Math.random() * mainerMessages.length)];
      return interaction.reply({
        embeds: [{
          color,
          title: `🎮 Your Genshin Main`,
          description: `${char.icon} **${char.name}** — ${char.element}\n${stars}\n\n${msg}`,
          footer: { text: 'Based on pure randomness (and destiny)' }
        }]
      });
    }

    // ===== ADMIN COMMANDS =====

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
