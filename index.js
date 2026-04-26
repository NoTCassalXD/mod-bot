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
const mongoose = require('mongoose');

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
const MONGODB_URI = process.env.MONGODB_URI;

// ===== MONGODB CONNECT =====
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ===== INVENTORY SCHEMA =====
const inventorySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String },
  characters: [
    {
      name: { type: String, required: true },
      stars: { type: Number, required: true },
      element: { type: String, required: true },
      icon: { type: String, required: true },
      image: { type: String, required: true },
      color: { type: Number, required: true },
      pulledAt: { type: Date, default: Date.now }
    }
  ]
});

const Inventory = mongoose.model('Inventory', inventorySchema);

// ===== GENSHIN CHARACTERS =====
const genshinCharacters = [
  { name: 'Neuvillette', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Neuvillette.png' },
  { name: 'Furina', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Furina.png' },
  { name: 'Zhongli', stars: 5, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Zhongli.png' },
  { name: 'Raiden Shogun', stars: 5, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Shougun.png' },
  { name: 'Kazuha', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kazuha.png' },
  { name: 'Hu Tao', stars: 5, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Hutao.png' },
  { name: 'Ganyu', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ganyu.png' },
  { name: 'Nahida', stars: 5, element: 'Dendro', icon: '🌿', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Nahida.png' },
  { name: 'Yelan', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Yelan.png' },
  { name: 'Xiao', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Xiao.png' },
  { name: 'Arlecchino', stars: 5, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Arlecchino.png' },
  { name: 'Navia', stars: 5, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Navia.png' },
  { name: 'Clorinde', stars: 5, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Clorinde.png' },
  { name: 'Wriothesley', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Wriothesley.png' },
  { name: 'Lyney', stars: 5, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Lyney.png' },
  { name: 'Wanderer', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Wanderer.png' },
  { name: 'Cyno', stars: 5, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Cyno.png' },
  { name: 'Nilou', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Nilou.png' },
  { name: 'Ayaka', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ayaka.png' },
  { name: 'Ayato', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ayato.png' },
  { name: 'Itto', stars: 5, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Itto.png' },
  { name: 'Eula', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Eula.png' },
  { name: 'Venti', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Venti.png' },
  { name: 'Noelle', stars: 4, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Noel.png' },
  { name: 'Bennett', stars: 4, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Bennett.png' },
  { name: 'Xingqiu', stars: 4, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Xingqiu.png' },
  { name: 'Fischl', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Fischl.png' },
  { name: 'Xiangling', stars: 4, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Xiangling.png' },
  { name: 'Sucrose', stars: 4, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Sucrose.png' },
  { name: 'Beidou', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Beidou.png' },
  { name: 'Razor', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Razor.png' },
  { name: 'Chongyun', stars: 4, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Chongyun.png' },
  { name: 'Rosaria', stars: 4, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Rosaria.png' },
];

const roasts = [
  "you are the reason god created middle finger 💀",
  "You have a face that would make onions cry.",
  "I look at you and think, 'Two billion years of evolution, for this?'",
  "Reality check: your opinion missed the update. Streaming platforms crash less than your arguments.",
  "Behti hai nadi girta hai jharna, are madarchod apna kaam krna 💀",
  "TikTok trends move faster than your life plans.",
  "Watching your excuses is like binge-watching a glitchy reality show.",
  "AI can write novels faster than you finish a sentence.",
];

// ===== COMMANDS =====
const commands = [
  new SlashCommandBuilder().setName('avatar').setDescription("Show a user's avatar")
    .addUserOption(o => o.setName('user').setDescription('User (leave empty for yourself)')),

  new SlashCommandBuilder().setName('coinflip').setDescription('Flip a coin'),

  new SlashCommandBuilder().setName('pull').setDescription('Pull a random Genshin Impact character ✨'),

  new SlashCommandBuilder().setName('inventory').setDescription('View your pulled Genshin characters 📦')
    .addUserOption(o => o.setName('user').setDescription("View another user's inventory")),

  new SlashCommandBuilder().setName('serverinfo').setDescription('Show server info'),

  new SlashCommandBuilder().setName('userinfo').setDescription('Show info about a user')
    .addUserOption(o => o.setName('user').setDescription('User (leave empty for yourself)')),

  new SlashCommandBuilder().setName('roast').setDescription('Roast someone 🔥')
    .addUserOption(o => o.setName('user').setDescription('User to roast').setRequired(true)),

  new SlashCommandBuilder().setName('say').setDescription('Make the bot say something')
    .addStringOption(o => o.setName('text').setDescription('Message to send').setRequired(true)),

  new SlashCommandBuilder().setName('love').setDescription('Check love compatibility ❤️')
    .addUserOption(o => o.setName('user1').setDescription('First user').setRequired(true))
    .addUserOption(o => o.setName('user2').setDescription('Second user').setRequired(true)),
];

// ===== REGISTER COMMANDS GLOBALLY =====
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('⏳ Registering commands globally...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map(c => c.toJSON()) });
    console.log(`✅ Successfully registered ${commands.length} commands globally!`);
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
  }
});

// ===== INTERACTIONS =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const name = interaction.commandName;

  try {

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

    if (name === 'coinflip') {
      return interaction.reply(Math.random() < 0.5 ? '🪙 Heads!' : '🪙 Tails!');
    }

    if (name === 'say') {
      return interaction.reply(interaction.options.getString('text'));
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

    if (name === 'pull') {
      const roll = Math.random();
      const pool = roll < 0.20
        ? genshinCharacters.filter(c => c.stars === 5)
        : genshinCharacters.filter(c => c.stars === 4);
      const char = pool[Math.floor(Math.random() * pool.length)];
      const stars = '⭐'.repeat(char.stars);
      const is5Star = char.stars === 5;

      await Inventory.findOneAndUpdate(
        { userId: interaction.user.id },
        {
          $set: { username: interaction.user.username },
          $push: {
            characters: {
              name: char.name,
              stars: char.stars,
              element: char.element,
              icon: char.icon,
              image: char.image,
              color: char.color,
              pulledAt: new Date()
            }
          }
        },
        { upsert: true, new: true }
      );

      return interaction.reply({
        embeds: [{
          color: char.color,
          author: { name: '✨ Genshin Impact — Wish Result' },
          title: `${char.icon} ${char.name}`,
          description: `**Element:** ${char.element}\n**Rarity:** ${stars}\n\n${is5Star ? '🎉 **RARE 5★ PULL! You got lucky!**' : '💫 A fine addition to your roster!'}\n\n*Added to your inventory! Use /inventory to view.*`,
          image: { url: char.image },
          footer: { text: is5Star ? '✦ 5★ Character Obtained!' : '✦ 4★ Character Obtained!' },
          timestamp: new Date().toISOString()
        }]
      });
    }

    if (name === 'inventory') {
      try {
        await interaction.deferReply();

        const target = interaction.options.getUser('user') || interaction.user;
        const data = await Inventory.findOne({ userId: target.id });

        if (!data || data.characters.length === 0) {
          return interaction.editReply({
            embeds: [{
              color: 0x5865F2,
              title: `📦 ${target.username}'s Inventory`,
              description: target.id === interaction.user.id
                ? "You haven't pulled any characters yet!\nUse **/pull** to start your collection! ✨"
                : `${target.username} hasn't pulled any characters yet!`,
              thumbnail: { url: target.displayAvatarURL({ size: 256 }) }
            }]
          });
        }

        const total = data.characters.length;
        const fiveStars = data.characters.filter(c => c.stars === 5);
        const fourStars = data.characters.filter(c => c.stars === 4);

        const charCounts = {};
        for (const c of data.characters) {
          if (!c || !c.name) continue;
          if (!charCounts[c.name]) charCounts[c.name] = { ...c._doc, count: 0 };
          charCounts[c.name].count++;
        }

        const sorted = Object.values(charCounts)
          .filter(c => c && c.name && c.stars)
          .sort((a, b) => {
            if (b.stars !== a.stars) return b.stars - a.stars;
            return a.name.localeCompare(b.name);
          });

        const shown = sorted.slice(0, 20);
        const inventoryList = shown.length > 0
          ? shown.map(c => {
              const dupText = c.count > 1 ? ` ×${c.count}` : '';
              return `${c.icon || '✨'} **${c.name}**${dupText} — ${c.element || '?'} ${'⭐'.repeat(c.stars)}`;
            }).join('\n')
          : 'No characters found — use **/pull** to get some!';

        const moreText = sorted.length > 20 ? `\n*...and ${sorted.length - 20} more characters*` : '';
        const lastChar = data.characters[data.characters.length - 1];

        return interaction.editReply({
          embeds: [{
            color: 0xFFD700,
            author: { name: `📦 ${target.username}'s Inventory`, icon_url: target.displayAvatarURL() },
            description: inventoryList + moreText,
            thumbnail: { url: lastChar?.image || target.displayAvatarURL() },
            fields: [
              { name: '📊 Total Pulls', value: `${total}`, inline: true },
              { name: '⭐ 5★ Characters', value: `${fiveStars.length}`, inline: true },
              { name: '✨ 4★ Characters', value: `${fourStars.length}`, inline: true },
              { name: '🎯 Unique Characters', value: `${sorted.length}`, inline: true },
            ],
            footer: { text: 'Keep pulling to grow your collection!' },
            timestamp: new Date().toISOString()
          }]
        });
      } catch (err) {
        console.error('❌ Inventory error:', err);
        return interaction.editReply({ content: '❌ Failed to load inventory. Try again!' });
      }
    }

  } catch (err) {
    console.error('❌ Command error:', err);
    if (!interaction.replied && !interaction.deferred) {
      interaction.reply({ content: '❌ Something went wrong.', ephemeral: true });
    } else if (interaction.deferred) {
      interaction.editReply({ content: '❌ Something went wrong.' });
    }
  }
});

client.login(TOKEN);
