require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  PermissionsBitField,
  SlashCommandBuilder,
  REST,
  Routes,
  ChannelType
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

const logChannels = new Map();

// ===== COMMANDS =====
const commands = [

  new SlashCommandBuilder().setName('kick').setDescription('Kick user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),

  new SlashCommandBuilder().setName('ban').setDescription('Ban user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),

  new SlashCommandBuilder().setName('clear').setDescription('Clear messages')
    .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true)),

  new SlashCommandBuilder().setName('warn').setDescription('Warn user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),

  new SlashCommandBuilder().setName('ping').setDescription('Ping'),

  new SlashCommandBuilder().setName('avatar').setDescription('Avatar')
    .addUserOption(o => o.setName('user').setDescription('User')),

  new SlashCommandBuilder().setName('userinfo').setDescription('User info')
    .addUserOption(o => o.setName('user').setDescription('User')),

  new SlashCommandBuilder().setName('mute').setDescription('Mute user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true))
    .addIntegerOption(o => o.setName('minutes').setDescription('Minutes').setRequired(true)),

  new SlashCommandBuilder().setName('unmute').setDescription('Unmute user')
    .addUserOption(o => o.setName('user').setDescription('User').setRequired(true)),

  new SlashCommandBuilder().setName('purge').setDescription('Delete messages')
    .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true)),

  new SlashCommandBuilder().setName('setlog').setDescription('Set log channel')
    .addChannelOption(o => 
      o.setName('channel')
       .setDescription('Text channel')
       .addChannelTypes(ChannelType.GuildText)
       .setRequired(true)
    ),

  new SlashCommandBuilder().setName('meme').setDescription('Random meme'),

  new SlashCommandBuilder().setName('coinflip').setDescription('Flip coin'),

  new SlashCommandBuilder().setName('say').setDescription('Make bot say something')
    .addStringOption(o => o.setName('text').setDescription('Message').setRequired(true)),
];

// ===== REGISTER COMMANDS =====
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands.map(cmd => cmd.toJSON())
    });

    console.log("Commands loaded globally (may take time to appear)");
  } catch (err) {
    console.error(err);
  }
});

// ===== COMMAND HANDLER =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.guild) return;

  const name = interaction.commandName;
  const member = interaction.member;
  const isMod = member.permissions.has(PermissionsBitField.Flags.ModerateMembers);

  try {

    if (name === "kick") {
      if (!isMod) return interaction.reply({ content: "No permission", ephemeral: true });

      const user = interaction.options.getUser("user");
      const target = await interaction.guild.members.fetch(user.id);

      if (!target.kickable) return interaction.reply("❌ Cannot kick this user");

      await target.kick();
      return interaction.reply(`👢 ${user.tag} kicked`);
    }

    if (name === "ban") {
      if (!isMod) return interaction.reply({ content: "No permission", ephemeral: true });

      const user = interaction.options.getUser("user");
      const target = await interaction.guild.members.fetch(user.id);

      if (!target.bannable) return interaction.reply("❌ Cannot ban this user");

      await target.ban();
      return interaction.reply(`🔨 ${user.tag} banned`);
    }

    if (name === "clear" || name === "purge") {
      if (!isMod) return interaction.reply({ content: "No permission", ephemeral: true });

      const amount = interaction.options.getInteger("amount");

      await interaction.channel.bulkDelete(amount, true);
      return interaction.reply({ content: `🗑️ Deleted ${amount}`, ephemeral: true });
    }

    if (name === "warn") {
      const user = interaction.options.getUser("user");
      return interaction.reply(`⚠️ ${user.tag} warned`);
    }

    if (name === "mute") {
      if (!isMod) return interaction.reply({ content: "No permission", ephemeral: true });

      await interaction.deferReply();

      const user = interaction.options.getUser("user");
      const minutes = interaction.options.getInteger("minutes");
      const target = await interaction.guild.members.fetch(user.id);

      if (!target.moderatable) return interaction.editReply("❌ Cannot mute this user");

      await target.timeout(minutes * 60000);

      return interaction.editReply(`🔇 ${user.tag} muted for ${minutes} min`);
    }

    if (name === "unmute") {
      if (!isMod) return interaction.reply({ content: "No permission", ephemeral: true });

      await interaction.deferReply();

      const user = interaction.options.getUser("user");
      const target = await interaction.guild.members.fetch(user.id);

      if (!target.moderatable) return interaction.editReply("❌ Cannot unmute this user");

      await target.timeout(null);

      return interaction.editReply(`🔊 ${user.tag} unmuted`);
    }

    if (name === "setlog") {
      if (!isMod) return interaction.reply({ content: "No permission", ephemeral: true });

      const channel = interaction.options.getChannel("channel");

      if (channel.type !== ChannelType.GuildText) {
        return interaction.reply({ content: "❌ Must be a text channel", ephemeral: true });
      }

      logChannels.set(interaction.guild.id, channel.id);

      return interaction.reply(`📌 Logs set to ${channel}`);
    }

    if (name === "ping") return interaction.reply(`🏓 ${client.ws.ping}ms`);

    if (name === "avatar") {
      const user = interaction.options.getUser("user") || interaction.user;
      return interaction.reply(user.displayAvatarURL({ size: 1024 }));
    }

    if (name === "userinfo") {
      const user = interaction.options.getUser("user") || interaction.user;
      return interaction.reply(`👤 ${user.tag}\n🆔 ${user.id}`);
    }

    if (name === "meme") {
      const res = await axios.get("https://meme-api.com/gimme");
      return interaction.reply(res.data.url);
    }

    if (name === "coinflip") {
      return interaction.reply(Math.random() < 0.5 ? "Heads 🪙" : "Tails 🪙");
    }

    if (name === "say") {
      const text = interaction.options.getString("text");
      return interaction.reply(text);
    }

  } catch (err) {
    console.error(err);
    if (interaction.deferred || interaction.replied) {
      interaction.editReply("❌ Error occurred");
    } else {
      interaction.reply("❌ Error occurred");
    }
  }
});

// ===== LOGS =====
client.on("messageDelete", msg => {
  const logId = logChannels.get(msg.guild?.id);
  if (!logId) return;

  const ch = msg.guild.channels.cache.get(logId);
  if (ch) ch.send(`🗑️ Deleted: ${msg.content}`);
});

client.on("guildBanAdd", ban => {
  const logId = logChannels.get(ban.guild.id);
  if (!logId) return;

  const ch = ban.guild.channels.cache.get(logId);
  if (ch) ch.send(`🔨 ${ban.user.tag} banned`);
});

client.login(TOKEN);