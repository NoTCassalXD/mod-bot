require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  PermissionsBitField,
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');

const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ===== LOG STORAGE =====
const logChannels = new Map();

// ===== ALL COMMANDS =====
const commands = [

  // OLD
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick user')
    .addUserOption(o => 
      o.setName('user')
       .setDescription('User to kick')
       .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban user')
    .addUserOption(o => 
      o.setName('user')
       .setDescription('User to ban')
       .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear messages')
    .addIntegerOption(o => 
      o.setName('amount')
       .setDescription('Number of messages')
       .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn user')
    .addUserOption(o => 
      o.setName('user')
       .setDescription('User to warn')
       .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check latency'),

  new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Show avatar')
    .addUserOption(o => 
      o.setName('user')
       .setDescription('User (optional)')
       .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('User info')
    .addUserOption(o => 
      o.setName('user')
       .setDescription('User (optional)')
       .setRequired(false)
    ),

  // NEW
  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout user')
    .addUserOption(o => 
      o.setName('user')
       .setDescription('User to mute')
       .setRequired(true)
    )
    .addIntegerOption(o => 
      o.setName('minutes')
       .setDescription('Time in minutes')
       .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove timeout')
    .addUserOption(o => 
      o.setName('user')
       .setDescription('User to unmute')
       .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete messages')
    .addIntegerOption(o => 
      o.setName('amount')
       .setDescription('Number of messages')
       .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('setlog')
    .setDescription('Set log channel')
    .addChannelOption(o => 
      o.setName('channel')
       .setDescription('Channel for logs')
       .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Random meme'),

  new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip coin')
];

// REGISTER COMMANDS
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), {
    body: commands.map(cmd => cmd.toJSON())
  });
  console.log("Commands loaded");
})();

// READY
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// COMMAND HANDLER
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const name = interaction.commandName;
  const member = interaction.member;

  const isMod = member.permissions.has(PermissionsBitField.Flags.ModerateMembers);

  if (name === "kick") {
    if (!isMod) return interaction.reply({ content: "No permission", ephemeral: true });

    const user = interaction.options.getUser("user");
    const target = await interaction.guild.members.fetch(user.id);
    await target.kick();
    interaction.reply(`👢 ${user.tag} kicked`);
  }

  if (name === "ban") {
    if (!isMod) return interaction.reply({ content: "No permission", ephemeral: true });

    const user = interaction.options.getUser("user");
    const target = await interaction.guild.members.fetch(user.id);
    await target.ban();
    interaction.reply(`🔨 ${user.tag} banned`);
  }

  if (name === "clear") {
    if (!isMod) return interaction.reply({ content: "No permission", ephemeral: true });

    const amount = interaction.options.getInteger("amount");
    await interaction.channel.bulkDelete(amount, true);
    interaction.reply({ content: `🗑️ Deleted ${amount}`, ephemeral: true });
  }

  if (name === "warn") {
    if (!isMod) return interaction.reply({ content: "No permission", ephemeral: true });

    const user = interaction.options.getUser("user");
    interaction.reply(`⚠️ ${user.tag} warned`);
  }

  if (name === "mute") {
    if (!isMod) return interaction.reply({ content: "No permission", ephemeral: true });

    const user = interaction.options.getUser("user");
    const minutes = interaction.options.getInteger("minutes");
    const target = await interaction.guild.members.fetch(user.id);

    await target.timeout(minutes * 60 * 1000);
    interaction.reply(`🔇 ${user.tag} muted for ${minutes} min`);
  }

  if (name === "unmute") {
    if (!isMod) return interaction.reply({ content: "No permission", ephemeral: true });

    const user = interaction.options.getUser("user");
    const target = await interaction.guild.members.fetch(user.id);

    await target.timeout(null);
    interaction.reply(`🔊 ${user.tag} unmuted`);
  }

  if (name === "purge") {
    if (!isMod) return interaction.reply({ content: "No permission", ephemeral: true });

    const amount = interaction.options.getInteger("amount");
    await interaction.channel.bulkDelete(amount, true);
    interaction.reply({ content: `🧹 Deleted ${amount}`, ephemeral: true });
  }

  if (name === "setlog") {
    if (!isMod) return interaction.reply({ content: "No permission", ephemeral: true });

    const channel = interaction.options.getChannel("channel");
    logChannels.set(interaction.guild.id, channel.id);

    interaction.reply(`📌 Logs set to ${channel}`);
  }

  if (name === "ping") {
    interaction.reply(`🏓 Pong! ${client.ws.ping}ms`);
  }

  if (name === "avatar") {
    const user = interaction.options.getUser("user") || interaction.user;
    interaction.reply(user.displayAvatarURL({ size: 1024 }));
  }

  if (name === "userinfo") {
    const user = interaction.options.getUser("user") || interaction.user;
    interaction.reply(`👤 ${user.tag}\n🆔 ${user.id}`);
  }

  if (name === "meme") {
    const res = await axios.get("https://meme-api.com/gimme");
    interaction.reply(res.data.url);
  }

  if (name === "coinflip") {
    interaction.reply(Math.random() < 0.5 ? "Heads 🪙" : "Tails 🪙");
  }
});

// LOGS
client.on("messageDelete", msg => {
  const logId = logChannels.get(msg.guild?.id);
  if (!logId) return;

  const ch = msg.guild.channels.cache.get(logId);
  if (!ch) return;

  ch.send(`🗑️ Deleted: ${msg.content}`);
});

client.on("guildBanAdd", ban => {
  const logId = logChannels.get(ban.guild.id);
  if (!logId) return;

  const ch = ban.guild.channels.cache.get(logId);
  ch.send(`🔨 ${ban.user.tag} banned`);
});
console.log("TOKEN:", process.env.TOKEN);

client.login(TOKEN);