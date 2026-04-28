require('dotenv').config();
const OWNERS = process.env.OWNERS ? process.env.OWNERS.split(",") : [];
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
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

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const playerSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String },
  primogems: { type: Number, default: 0 },
  pity: { type: Number, default: 0 },
  guaranteed: { type: Boolean, default: false },
  lastDaily: { type: Date, default: null },
  lastBuy: { type: Date, default: null },
  boughtToday: { type: Number, default: 0 },
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

const Player = mongoose.model('Player', playerSchema);

// ===== ALL GENSHIN CHARACTERS WITH REAL ICONS =====
const genshinCharacters = [
  // MONDSTADT 5★
  { name: 'Albedo', stars: 5, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Albedo.png' },
  { name: 'Aloy', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Aloy.png' },
  { name: 'Diluc', stars: 5, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Diluc.png' },
  { name: 'Eula', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Eula.png' },
  { name: 'Jean', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Jean.png' },
  { name: 'Klee', stars: 5, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Klee.png' },
  { name: 'Mona', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Mona.png' },
  { name: 'Venti', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Venti.png' },
  // MONDSTADT 4★
  { name: 'Amber', stars: 4, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ambor.png' },
  { name: 'Barbara', stars: 4, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Barbara.png' },
  { name: 'Bennett', stars: 4, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Bennett.png' },
  { name: 'Diona', stars: 4, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Diona.png' },
  { name: 'Fischl', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Fischl.png' },
  { name: 'Kaeya', stars: 4, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kaeya.png' },
  { name: 'Lisa', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Lisa.png' },
  { name: 'Mika', stars: 4, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Mika.png' },
  { name: 'Noelle', stars: 4, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Noel.png' },
  { name: 'Razor', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Razor.png' },
  { name: 'Rosaria', stars: 4, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Rosaria.png' },
  { name: 'Sucrose', stars: 4, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Sucrose.png' },
  // LIYUE 5★
  { name: 'Baizhu', stars: 5, element: 'Dendro', icon: '🌿', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Baizhuer.png' },
  { name: 'Ganyu', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ganyu.png' },
  { name: 'Hu Tao', stars: 5, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Hutao.png' },
  { name: 'Keqing', stars: 5, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Keqing.png' },
  { name: 'Qiqi', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Qiqi.png' },
  { name: 'Shenhe', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Shenhe.png' },
  { name: 'Xiao', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Xiao.png' },
  { name: 'Yelan', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Yelan.png' },
  { name: 'Zhongli', stars: 5, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Zhongli.png' },
  // LIYUE 4★
  { name: 'Beidou', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Beidou.png' },
  { name: 'Chongyun', stars: 4, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Chongyun.png' },
  { name: 'Gaming', stars: 4, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Gaming.png' },
  { name: 'Ningguang', stars: 4, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ningguang.png' },
  { name: 'Xiangling', stars: 4, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Xiangling.png' },
  { name: 'Xingqiu', stars: 4, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Xingqiu.png' },
  { name: 'Xinyan', stars: 4, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Xinyan.png' },
  { name: 'Yanfei', stars: 4, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Feiyan.png' },
  { name: 'Yaoyao', stars: 4, element: 'Dendro', icon: '🌿', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Yaoyao.png' },
  { name: 'Yun Jin', stars: 4, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Yunjin.png' },
  // INAZUMA 5★
  { name: 'Arataki Itto', stars: 5, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Itto.png' },
  { name: 'Chiori', stars: 5, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Chiori.png' },
  { name: 'Kaedehara Kazuha', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kazuha.png' },
  { name: 'Kamisato Ayaka', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ayaka.png' },
  { name: 'Kamisato Ayato', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ayato.png' },
  { name: 'Raiden Shogun', stars: 5, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Shougun.png' },
  { name: 'Sangonomiya Kokomi', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kokomi.png' },
  { name: 'Yae Miko', stars: 5, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Yae.png' },
  { name: 'Yoimiya', stars: 5, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Yoimiya.png' },
  // INAZUMA 4★
  { name: 'Gorou', stars: 4, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Gorou.png' },
  { name: 'Kujou Sara', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Sara.png' },
  { name: 'Kuki Shinobu', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Shinobu.png' },
  { name: 'Kirara', stars: 4, element: 'Dendro', icon: '🌿', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kirara.png' },
  { name: 'Sayu', stars: 4, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Sayu.png' },
  { name: 'Shikanoin Heizou', stars: 4, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Heizo.png' },
  { name: 'Thoma', stars: 4, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Tohma.png' },
  // SUMERU 5★
  { name: 'Alhaitham', stars: 5, element: 'Dendro', icon: '🌿', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Alhatham.png' },
  { name: 'Cyno', stars: 5, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Cyno.png' },
  { name: 'Dehya', stars: 5, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Dehya.png' },
  { name: 'Nahida', stars: 5, element: 'Dendro', icon: '🌿', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Nahida.png' },
  { name: 'Nilou', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Nilou.png' },
  { name: 'Tighnari', stars: 5, element: 'Dendro', icon: '🌿', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Tighnari.png' },
  { name: 'Wanderer', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Wanderer.png' },
  // SUMERU 4★
  { name: 'Candace', stars: 4, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Candace.png' },
  { name: 'Collei', stars: 4, element: 'Dendro', icon: '🌿', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Collei.png' },
  { name: 'Dori', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Dori.png' },
  { name: 'Faruzan', stars: 4, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Faruzan.png' },
  { name: 'Kaveh', stars: 4, element: 'Dendro', icon: '🌿', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kaveh.png' },
  { name: 'Layla', stars: 4, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Layla.png' },
  { name: 'Sethos', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Sethos.png' },
  // FONTAINE 5★
  { name: 'Arlecchino', stars: 5, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Arlecchino.png' },
  { name: 'Clorinde', stars: 5, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Clorinde.png' },
  { name: 'Emilie', stars: 5, element: 'Dendro', icon: '🌿', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Emilie.png' },
  { name: 'Escoffier', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Escoffier.png' },
  { name: 'Furina', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Furina.png' },
  { name: 'Lyney', stars: 5, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Lyney.png' },
  { name: 'Navia', stars: 5, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Navia.png' },
  { name: 'Neuvillette', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Neuvillette.png' },
  { name: 'Sigewinne', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Sigewinne.png' },
  { name: 'Wriothesley', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Wriothesley.png' },
  // FONTAINE 4★
  { name: 'Charlotte', stars: 4, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Charlotte.png' },
  { name: 'Chevreuse', stars: 4, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Chevreuse.png' },
  { name: 'Freminet', stars: 4, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Freminet.png' },
  { name: 'Lynette', stars: 4, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Linette.png' },
  // NATLAN 5★
  { name: 'Chasca', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Chasca.png' },
  { name: 'Citlali', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Citlali.png' },
  { name: 'Kinich', stars: 5, element: 'Dendro', icon: '🌿', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kinich.png' },
  { name: 'Mavuika', stars: 5, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Mavuika.png' },
  { name: 'Mualani', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Mualani.png' },
  { name: 'Xilonen', stars: 5, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Xilonen.png' },
  // NATLAN 4★
  { name: 'Iansan', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Iansan.png' },
  { name: 'Kachina', stars: 4, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kachina.png' },
  { name: 'Ororon', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ororon.png' },
];

// Remove duplicates properly
const uniqueChars = [];
const seenNames = new Set();

for (const char of genshinCharacters) {
  if (!seenNames.has(char.name)) {
    uniqueChars.push(char);
    seenNames.add(char.name);
  }
}

const chars = uniqueChars;
const sortedChars = [...chars].sort((a, b) => a.name.localeCompare(b.name));

const PULL_COST = 160;
const BUY_LIMIT = 20000;
const CHARS_PER_PAGE = 60;

const roasts = [
  "you are the reason god created middle finger 💀",
  "You have a face that would make onions cry.",
  "I look at you and think, 'Two billion years of evolution, for this?'",
  "Reality check: your opinion missed the update.",
  "Behti hai nadi girta hai jharna, are madarchod apna kaam krna 💀",
  "TikTok trends move faster than your life plans.",
  "Watching your excuses is like binge-watching a glitchy reality show.",
  "AI can write novels faster than you finish a sentence.",
];

// ===== GACHA LOGIC =====
function doWish(player) {
  player.pity += 1;
  const pity = player.pity;
  let is5Star = false;
  if (pity >= 90) {
    is5Star = true;
  } else if (pity >= 74) {
    const softChance = 0.006 + (pity - 73) * 0.06;
    is5Star = Math.random() < softChance;
  } else {
    is5Star = Math.random() < 0.006;
  }
  let char;
  if (is5Star) {
    const pool = chars.filter(c => c.stars === 5);
    char = pool[Math.floor(Math.random() * pool.length)];
    player.pity = 0;
    player.guaranteed = false;
  } else {
    const pool = chars.filter(c => c.stars === 4);
    char = pool[Math.floor(Math.random() * pool.length)];
  }
  return { char, is5Star };
}

// ===== BUILD CHARACTER LIST EMBED =====
function buildCharListEmbed(page) {
  const totalPages = Math.ceil(sortedChars.length / CHARS_PER_PAGE);
  const start = (page - 1) * CHARS_PER_PAGE;
  const pageChars = sortedChars.slice(start, start + CHARS_PER_PAGE);

  const col1 = pageChars.slice(0, 20);
  const col2 = pageChars.slice(20, 40);
  const col3 = pageChars.slice(40, 60);

  const getRange = (arr) => {
    if (arr.length === 0) return '';
    const first = arr[0].name[0].toUpperCase();
    const last = arr[arr.length - 1].name[0].toUpperCase();
    return first === last ? `(${first})` : `(${first}–${last})`;
  };

  const formatCol = (arr) => {
    if (arr.length === 0) return '\u200b';
    return arr.map(c => `${c.icon} ${c.name}`).join('\n');
  };

  const endIndex = Math.min(start + CHARS_PER_PAGE, sortedChars.length);

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`📚 Genshin Impact Character Guides (${start + 1}–${endIndex}/${sortedChars.length})`)
    .addFields(
      { name: `⌁ ${getRange(col1)}`, value: formatCol(col1) || '\u200b', inline: true },
      { name: `꩜ ${getRange(col2)}`, value: formatCol(col2) || '\u200b', inline: true },
      { name: `꩜ ${getRange(col3)}`, value: formatCol(col3) || '\u200b', inline: true }
    )
    .setFooter({ text: `Use /pull to wish for these characters! • Page ${page}/${totalPages}` })
    .setTimestamp();

  return embed;
}

// ===== BUILD INVENTORY EMBED =====
function buildInventoryEmbed(target, data, page, totalPages) {
  const total = data.characters.length;
  const fiveStars = data.characters.filter(c => c && c.stars === 5).length;
  const fourStars = data.characters.filter(c => c && c.stars === 4).length;

  const charCounts = {};
  for (const c of data.characters) {
    if (!c || !c.name || !c.stars) continue;
    if (!charCounts[c.name]) charCounts[c.name] = { name: c.name, stars: c.stars, element: c.element, icon: c.icon, image: c.image, count: 0 };
    charCounts[c.name].count++;
  }

  const sorted = Object.values(charCounts).sort((a, b) => {
    if (b.stars !== a.stars) return b.stars - a.stars;
    return a.name.localeCompare(b.name);
  });

  const perPage = 10;
  const start = (page - 1) * perPage;
  const shown = sorted.slice(start, start + perPage);
  const highlightChar = shown.find(c => c.stars === 5) || shown[0];

  const inventoryList = shown.length > 0
    ? shown.map(c => {
        const dupText = c.count > 1 ? ` ×${c.count}` : '';
        const star = c.stars === 5 ? '🌟' : '✨';
        return `${star} ${c.icon} **${c.name}**${dupText} — ${c.element} ${'⭐'.repeat(c.stars)}`;
      }).join('\n')
    : 'No characters on this page.';

  const embed = new EmbedBuilder()
    .setColor(highlightChar?.stars === 5 ? 0xFFD700 : 0x5865F2)
    .setAuthor({ name: `📦 ${target.username}'s Collection`, iconURL: target.displayAvatarURL() })
    .setDescription(inventoryList)
    .setThumbnail(highlightChar?.image || target.displayAvatarURL())
    .addFields(
      { name: '📊 Total Pulls', value: `${total}`, inline: true },
      { name: '🌟 5★', value: `${fiveStars}`, inline: true },
      { name: '✨ 4★', value: `${fourStars}`, inline: true },
      { name: '🎯 Unique', value: `${sorted.length}`, inline: true },
      { name: '📄 Page', value: `${page} / ${totalPages}`, inline: true }
    )
    .setFooter({ text: '🎰 Keep pulling to grow your collection!' })
    .setTimestamp();

  return embed;
}

// ===== BUILD PAGE BUTTONS =====
function buildCharListButtons(page) {
  const totalPages = Math.ceil(sortedChars.length / CHARS_PER_PAGE);
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`cl_first_1`).setLabel('|◀◀').setStyle(ButtonStyle.Primary).setDisabled(page <= 1),
    new ButtonBuilder().setCustomId(`cl_prev_${page - 1}`).setLabel('◀').setStyle(ButtonStyle.Primary).setDisabled(page <= 1),
    new ButtonBuilder().setCustomId(`cl_cur_${page}`).setLabel(`${page}/${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId(`cl_next_${page + 1}`).setLabel('▶').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages),
    new ButtonBuilder().setCustomId(`cl_last_${totalPages}`).setLabel('▶▶|').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages),
  );
}

function buildInvButtons(userId, page, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`inv_${userId}_1`).setLabel('|◀◀').setStyle(ButtonStyle.Primary).setDisabled(page <= 1),
    new ButtonBuilder().setCustomId(`inv_${userId}_${page - 1}`).setLabel('◀').setStyle(ButtonStyle.Primary).setDisabled(page <= 1),
    new ButtonBuilder().setCustomId(`inv_cur_${page}`).setLabel(`${page}/${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId(`inv_${userId}_${page + 1}`).setLabel('▶').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages),
    new ButtonBuilder().setCustomId(`inv_${userId}_${totalPages}`).setLabel('▶▶|').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages),
  );
}

// ===== COMMANDS =====
const commands = [
  new SlashCommandBuilder().setName('pull').setDescription('Pull a Genshin character (costs 160 💎)'),
  new SlashCommandBuilder().setName('pull10').setDescription('Pull 10 times (costs 1600 💎)'),
  new SlashCommandBuilder().setName('pity').setDescription('Check your current pity count 🎯'),
  new SlashCommandBuilder().setName('daily').setDescription('Claim your daily 60 Primogems 💎'),
  new SlashCommandBuilder().setName('balance').setDescription('Check your Primogem balance 💰'),
  new SlashCommandBuilder().setName('shop').setDescription('View the Primogem shop 🛒'),
  new SlashCommandBuilder().setName('buy').setDescription('Buy Primogems (20k limit per 24h) 💳')
    .addIntegerOption(o => o.setName('amount').setDescription('Amount to buy (max 20000 per day)').setRequired(true)),
  new SlashCommandBuilder().setName('gift').setDescription('Gift Primogems to a user (Owner only) 🎁')
    .addUserOption(o => o.setName('user').setDescription('User to gift to').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Amount of Primogems').setRequired(true)),
  new SlashCommandBuilder().setName('inventory').setDescription('View your pulled Genshin characters 📦')
    .addUserOption(o => o.setName('user').setDescription("View another user's inventory")),
  new SlashCommandBuilder().setName('character-list').setDescription('View all available Genshin Impact characters 📋'),
  new SlashCommandBuilder().setName('avatar').setDescription("Show a user's avatar")
    .addUserOption(o => o.setName('user').setDescription('User (leave empty for yourself)')),
  new SlashCommandBuilder().setName('coinflip').setDescription('Flip a coin'),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Show server info'),
  new SlashCommandBuilder().setName('userinfo').setDescription('Show info about a user')
    .addUserOption(o => o.setName('user').setDescription('User (leave empty for yourself)')),
  new SlashCommandBuilder().setName('roast').setDescription('Roast someone 🔥')
    .addUserOption(o => o.setName('user').setDescription('User to roast').setRequired(true)),
  new SlashCommandBuilder().setName('say').setDescription('Make the bot say something')
    .addStringOption(o => o.setName('text').setDescription('Message to send').setRequired(true)),
  new SlashCommandBuilder().setName('meme').setDescription('Get a random meme'),
  new SlashCommandBuilder().setName('love').setDescription('Check love compatibility ❤️')
    .addUserOption(o => o.setName('user1').setDescription('First user').setRequired(true))
    .addUserOption(o => o.setName('user2').setDescription('Second user').setRequired(true)),
];

// ===== REGISTER COMMANDS =====
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands.map(c => c.toJSON()) });
    console.log(`✅ Registered ${commands.length} commands! Loaded ${chars.length} characters.`);
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
  }
});

// ===== INTERACTIONS =====
client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) {
    const parts = interaction.customId.split('_');

    // Character list buttons
    if (parts[0] === 'cl') {
      const page = parseInt(parts[2]);
      const totalPages = Math.ceil(sortedChars.length / CHARS_PER_PAGE);
      const clampedPage = Math.max(1, Math.min(page, totalPages));
      const embed = buildCharListEmbed(clampedPage);
      const row = buildCharListButtons(clampedPage);
      return interaction.update({ embeds: [embed], components: [row] }).catch(e => console.error('Button error:', e));
    }

    // Inventory buttons
    if (parts[0] === 'inv' && parts[1] !== 'cur') {
      try {
        const userId = parts[1];
        const page = parseInt(parts[2]);
        const target = await client.users.fetch(userId).catch(() => null);
        if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

        const data = await Player.findOne({ userId: target.id });
        if (!data || data.characters.length === 0) {
          return interaction.reply({ content: '❌ No inventory found.', ephemeral: true });
        }

        const charCounts = {};
        for (const c of data.characters) {
          if (!c || !c.name || !c.stars) continue;
          if (!charCounts[c.name]) charCounts[c.name] = { name: c.name, stars: c.stars, element: c.element, icon: c.icon, image: c.image, count: 0 };
          charCounts[c.name].count++;
        }
        const sorted = Object.values(charCounts);
        const totalPages = Math.max(1, Math.ceil(sorted.length / 10));
        const clampedPage = Math.max(1, Math.min(page, totalPages));

        const embed = buildInventoryEmbed(target, data, clampedPage, totalPages);
        const row = buildInvButtons(userId, clampedPage, totalPages);
        return interaction.update({ embeds: [embed], components: [row] });
      } catch (e) {
        console.error('Inventory button error:', e);
        return interaction.reply({ content: '❌ An error occurred.', ephemeral: true });
      }
    }

    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const name = interaction.commandName;

  try {
    // ===== CHARACTER LIST =====
    if (name === 'character-list') {
      const totalPages = Math.ceil(sortedChars.length / CHARS_PER_PAGE);
      const embed = buildCharListEmbed(1);
      const row = buildCharListButtons(1);
      await interaction.deferReply();
      return interaction.editReply({ embeds: [embed], components: [row] });
    }

    // ===== DAILY =====
    if (name === 'daily') {
      const player = await Player.findOneAndUpdate(
        { userId: interaction.user.id },
        { $setOnInsert: { username: interaction.user.username, primogems: 0, pity: 0, guaranteed: false, lastDaily: null, characters: [] } },
        { upsert: true, new: true }
      );
      const now = new Date();
      const last = player.lastDaily ? new Date(player.lastDaily) : null;
      const hoursSince = last ? (now - last) / 1000 / 60 / 60 : 999;
      if (hoursSince < 24) {
        const nextDaily = new Date(last.getTime() + 24 * 60 * 60 * 1000);
        const timeLeft = Math.ceil((nextDaily - now) / 1000 / 60 / 60);
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(0xFF5555)
            .setTitle('⏰ Already Claimed!')
            .setDescription(`Come back in **${timeLeft} hour(s)**. ⏳\n\nNext reset: <t:${Math.floor(nextDaily.getTime() / 1000)}:R>`)
          ]
        });
      }
      await Player.findOneAndUpdate(
        { userId: interaction.user.id },
        { $inc: { primogems: 60 }, $set: { lastDaily: now, username: interaction.user.username } }
      );
      const updated = await Player.findOne({ userId: interaction.user.id });
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xFFD700)
          .setTitle('💎 Daily Primogems Claimed!')
          .setDescription(`You received **60 💎 Primogems!**\n\n**Total Balance:** ${updated.primogems} 💎\n\nCome back tomorrow for more! 🌟`)
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({ text: 'Tip: Use /pull to wish for characters!' })
        ]
      });
    }

    // ===== BALANCE =====
    if (name === 'balance') {
      const player = await Player.findOne({ userId: interaction.user.id });
      const primos = player?.primogems || 0;
      const pulls = Math.floor(primos / PULL_COST);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`💰 ${interaction.user.username}'s Balance`)
          .setDescription(`**💎 Primogems:** ${primos}\n**✨ Pulls Available:** ${pulls}\n\nEarn more with **/daily** or **/buy**!`)
          .setThumbnail(interaction.user.displayAvatarURL())
        ]
      });
    }

    // ===== SHOP =====
    if (name === 'shop') {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xFFD700)
          .setTitle('🛒 Primogem Shop')
          .setDescription([
            '> Buy Primogems to wish for characters!\n',
            '**🆓 Free** — 💎 60 Primogems → `/daily` *(every 24h)*',
            '**💳 Buy** — 💎 Up to 20,000 per day → `/buy <amount>`',
            '**🎁 Gift** — 💎 Unlimited → `/gift @user <amount>` *(Owner only)*\n',
            '> 💡 **1 Pull = 160 Primogems**',
            '> 💡 **10 Pulls = 1600 Primogems**',
            '> 💡 **Soft Pity starts at pull 74**',
            '> 💡 **Hard Pity = pull 90 (guaranteed 5★)**',
          ].join('\n'))
          .setFooter({ text: 'Use /daily every day to earn free Primogems!' })
        ]
      });
    }

    // ===== PITY =====
    if (name === 'pity') {
      const player = await Player.findOne({ userId: interaction.user.id });
      const pity = player?.pity || 0;
      const guaranteed = player?.guaranteed || false;
      const pullsLeft = 90 - pity;
      const softPityIn = pity >= 74 ? 0 : 74 - pity;
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xA855F7)
          .setTitle(`🎯 ${interaction.user.username}'s Pity`)
          .addFields(
            { name: '🔢 Current Pity', value: `${pity} / 90`, inline: true },
            { name: '🎰 Hard Pity In', value: `${pullsLeft} pulls`, inline: true },
            { name: '📈 Soft Pity In', value: softPityIn === 0 ? '✅ Active now!' : `${softPityIn} pulls`, inline: true },
            { name: '🎲 50/50 Status', value: guaranteed ? '✅ **GUARANTEED** next 5★!' : '⚠️ On 50/50 (50% chance)', inline: false }
          )
          .setFooter({ text: 'Soft pity starts at pull 74 — higher chance of 5★!' })
        ]
      });
    }

    // ===== PULL =====
    if (name === 'pull') {
      let player = await Player.findOneAndUpdate(
        { userId: interaction.user.id },
        { $setOnInsert: { username: interaction.user.username, primogems: 0, pity: 0, guaranteed: false, lastDaily: null, characters: [] } },
        { upsert: true, new: true }
      );
      if (player.primogems < PULL_COST) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(0xFF5555)
            .setTitle('❌ Not Enough Primogems!')
            .setDescription(`You need **160 💎** to pull!\n\nYou have: **${player.primogems} 💎**\n\nGet more with **/daily** or **/buy**!`)
          ]
        });
      }
      const { char, is5Star } = doWish(player);
      await Player.findOneAndUpdate(
        { userId: interaction.user.id },
        {
          $inc: { primogems: -PULL_COST },
          $set: { pity: player.pity, guaranteed: player.guaranteed, username: interaction.user.username },
          $push: { characters: { name: char.name, stars: char.stars, element: char.element, icon: char.icon, image: char.image, color: char.color, pulledAt: new Date() } }
        }
      );
      const updatedPlayer = await Player.findOne({ userId: interaction.user.id });
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(char.color)
          .setAuthor({ name: '✨ Genshin Impact — Wish Result' })
          .setTitle(`${char.icon} ${char.name}`)
          .setDescription(`**Element:** ${char.element}\n**Rarity:** ${'⭐'.repeat(char.stars)}\n\n${is5Star ? '🎉 **RARE 5★ PULL! You got lucky!**' : '💫 A fine addition to your roster!'}\n\n💎 **Remaining:** ${updatedPlayer.primogems} | 🎯 **Pity:** ${updatedPlayer.pity}/90`)
          .setImage(char.image)
          .setFooter({ text: is5Star ? '✦ 5★ Character Obtained!' : '✦ 4★ Character Obtained! | Added to /inventory' })
          .setTimestamp()
        ]
      });
    }

    // ===== PULL 10 =====
    if (name === 'pull10') {
      let player = await Player.findOneAndUpdate(
        { userId: interaction.user.id },
        { $setOnInsert: { username: interaction.user.username, primogems: 0, pity: 0, guaranteed: false, lastDaily: null, characters: [] } },
        { upsert: true, new: true }
      );
      const cost = PULL_COST * 10;
      if (player.primogems < cost) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(0xFF5555)
            .setTitle('❌ Not Enough Primogems!')
            .setDescription(`You need **1600 💎** for 10 pulls!\n\nYou have: **${player.primogems} 💎**\n\nGet more with **/daily** or **/buy**!`)
          ]
        });
      }

      const results = [];
      const charsToAdd = [];
      for (let i = 0; i < 10; i++) {
        const { char, is5Star } = doWish(player);
        results.push({ char, is5Star });
        charsToAdd.push({ name: char.name, stars: char.stars, element: char.element, icon: char.icon, image: char.image, color: char.color, pulledAt: new Date() });
      }

      await Player.findOneAndUpdate(
        { userId: interaction.user.id },
        {
          $inc: { primogems: -cost },
          $set: { pity: player.pity, guaranteed: player.guaranteed, username: interaction.user.username },
          $push: { characters: { $each: charsToAdd } }
        }
      );

      const updatedPlayer = await Player.findOne({ userId: interaction.user.id });
      const fiveStarResults = results.filter(r => r.is5Star);
      const featuredChar = fiveStarResults.length > 0 ? fiveStarResults[0].char : results[0].char;

      const pullList = results.map(r => {
        if (r.is5Star) {
          return `✦ **${r.char.name}** ⭐⭐⭐⭐⭐ — ${r.char.element} 🌟`;
        }
        return `**${r.char.name}** ⭐⭐⭐⭐ — ${r.char.element}`;
      }).join('\n');

      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(fiveStarResults.length > 0 ? 0xFFD700 : 0x5865F2)
          .setAuthor({ name: `✨ Genshin Impact — 10 Wish Results`, iconURL: interaction.user.displayAvatarURL() })
          .setTitle(fiveStarResults.length > 0
            ? `🎉 ${fiveStarResults.map(r => r.char.name).join(', ')} obtained!`
            : '💫 10 Wishes Complete!')
          .setDescription(pullList)
          .setThumbnail(featuredChar.image)
          .addFields(
            { name: '💎 Primogems Left', value: `${updatedPlayer.primogems}`, inline: true },
            { name: '🎯 Current Pity', value: `${updatedPlayer.pity}/90`, inline: true },
            { name: '🌟 5★ Obtained', value: fiveStarResults.length > 0 ? fiveStarResults.map(r => `${r.char.name}`).join(', ') : 'None this time...', inline: true }
          )
          .setFooter({ text: fiveStarResults.length > 0 ? `✦ Rare character(s) added to your inventory!` : 'No 5★ this time... Keep wishing! Use /pull10 again' })
          .setTimestamp()
        ]
      });
    }

    // ===== INVENTORY =====
    if (name === 'inventory') {
      await interaction.deferReply();
      const target = interaction.options.getUser('user') || interaction.user;
      const data = await Player.findOne({ userId: target.id });

      if (!data || data.characters.length === 0) {
        return interaction.editReply({
          embeds: [new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle(`📦 ${target.username}'s Collection`)
            .setDescription(target.id === interaction.user.id
              ? "You haven't pulled any characters yet!\nUse **/pull** to start your collection! ✨"
              : `**${target.username}** hasn't pulled any characters yet!`)
            .setThumbnail(target.displayAvatarURL({ size: 256 }))
          ]
        });
      }

      const charCounts = {};
      for (const c of data.characters) {
        if (!c || !c.name || !c.stars) continue;
        if (!charCounts[c.name]) charCounts[c.name] = { name: c.name, stars: c.stars, element: c.element, icon: c.icon, image: c.image, count: 0 };
        charCounts[c.name].count++;
      }
      const sorted = Object.values(charCounts);
      const totalPages = Math.max(1, Math.ceil(sorted.length / 10));

      const embed = buildInventoryEmbed(target, data, 1, totalPages);
      const row = buildInvButtons(target.id, 1, totalPages);
      return interaction.editReply({ embeds: [embed], components: totalPages > 1 ? [row] : [] });
    }

    // ===== GIFT =====
    if (name === 'gift') {
      if (!OWNERS.includes(interaction.user.id)) {
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFF5555).setTitle('❌ Owner Only!').setDescription('Only the bot owner can use this command.')], ephemeral: true });
      }
      const target = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      if (amount <= 0) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFF5555).setTitle('❌ Invalid Amount!')], ephemeral: true });
      await Player.findOneAndUpdate(
        { userId: target.id },
        { $setOnInsert: { username: target.username, primogems: 0, pity: 0, guaranteed: false, lastDaily: null, characters: [] } },
        { upsert: true }
      );
      const updated = await Player.findOneAndUpdate(
        { userId: target.id },
        { $inc: { primogems: amount }, $set: { username: target.username } },
        { new: true }
      );
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('🎁 Primogems Gifted!')
          .setDescription(`Successfully gifted **${amount} 💎** to **${target.username}**!\n\n**Their New Balance:** ${updated.primogems} 💎`)
          .setThumbnail(target.displayAvatarURL())
        ]
      });
    }

    // ===== BUY =====
    if (name === 'buy') {
      let player = await Player.findOneAndUpdate(
        { userId: interaction.user.id },
        { $setOnInsert: { username: interaction.user.username, primogems: 0, pity: 0, guaranteed: false, lastDaily: null, boughtToday: 0, lastBuy: null, characters: [] } },
        { upsert: true, new: true }
      );
      const amount = interaction.options.getInteger('amount');
      if (amount <= 0) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFF5555).setTitle('❌ Invalid Amount!')], ephemeral: true });

      const now = new Date();
      const lastBuy = player.lastBuy ? new Date(player.lastBuy) : null;
      const hoursSince = lastBuy ? (now - lastBuy) / 1000 / 60 / 60 : 999;
      let boughtToday = player.boughtToday || 0;
      if (hoursSince >= 24) boughtToday = 0;

      if (boughtToday + amount > BUY_LIMIT) {
        const remaining = BUY_LIMIT - boughtToday;
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor(0xFF5555)
            .setTitle('❌ Daily Limit Exceeded!')
            .setDescription(`Max **${BUY_LIMIT} 💎** per 24 hours.\n\n**Bought today:** ${boughtToday} 💎\n**Still available:** ${remaining} 💎\n**Resets:** <t:${Math.floor((lastBuy.getTime() + 24 * 60 * 60 * 1000) / 1000)}:R>`)
          ],
          ephemeral: true
        });
      }

      const updated = await Player.findOneAndUpdate(
        { userId: interaction.user.id },
        { $inc: { primogems: amount, boughtToday: amount }, $set: { lastBuy: now, username: interaction.user.username } },
        { new: true }
      );
      const nextReset = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('✅ Purchase Successful!')
          .setDescription(`You got **${amount} 💎 Primogems!**\n\n**New Balance:** ${updated.primogems} 💎\n**Bought Today:** ${updated.boughtToday} / ${BUY_LIMIT} 💎\n**Next Reset:** <t:${Math.floor(nextReset.getTime() / 1000)}:R>`)
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({ text: 'Use /pull to wish for characters!' })
        ]
      });
    }

    // ===== AVATAR =====
    if (name === 'avatar') {
      const target = interaction.options.getUser('user') || interaction.user;
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`🖼️ ${target.username}'s Avatar`).setImage(target.displayAvatarURL({ size: 512 }))]
      });
    }

    if (name === 'coinflip') return interaction.reply(Math.random() < 0.5 ? '🪙 Heads!' : '🪙 Tails!');
    if (name === 'say') return interaction.reply(interaction.options.getString('text'));

    if (name === 'meme') {
      const res = await axios.get('https://meme-api.com/gimme');
      return interaction.reply(res.data.url);
    }

    if (name === 'userinfo') {
      const target = interaction.options.getUser('user') || interaction.user;
      const member = interaction.guild.members.cache.get(target.id);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`👤 ${target.username}`)
          .setThumbnail(target.displayAvatarURL())
          .addFields(
            { name: '🆔 User ID', value: target.id, inline: true },
            { name: '🤖 Bot?', value: target.bot ? 'Yes' : 'No', inline: true },
            { name: '📅 Account Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:D>`, inline: true },
            { name: '📥 Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'Unknown', inline: true }
          )
        ]
      });
    }

    if (name === 'serverinfo') {
      const g = interaction.guild;
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(`📊 ${g.name}`)
          .setThumbnail(g.iconURL())
          .addFields(
            { name: '👑 Owner', value: `<@${g.ownerId}>`, inline: true },
            { name: '👥 Members', value: `${g.memberCount}`, inline: true },
            { name: '📺 Channels', value: `${g.channels.cache.size}`, inline: true },
            { name: '🎭 Roles', value: `${g.roles.cache.size}`, inline: true },
            { name: '🚀 Boosts', value: `${g.premiumSubscriptionCount ?? 0}`, inline: true },
            { name: '🆔 Server ID', value: g.id }
          )
        ]
      });
    }

    if (name === 'roast') {
      const target = interaction.options.getUser('user');
      const roast = roasts[Math.floor(Math.random() * roasts.length)];
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(0xFF4500)
          .setTitle(`🔥 Roasting ${target.username}...`)
          .setDescription(roast)
          .setThumbnail(target.displayAvatarURL({ size: 256 }))
          .setFooter({ text: 'Just a joke, no harm intended 😄' })
        ]
      });
    }

    if (name === 'love') {
      const user1 = interaction.options.getUser('user1');
      const user2 = interaction.options.getUser('user2');
      const percentage = Math.floor(Math.random() * 101);
      let message = '', color = 0xFF69B4;
      if (percentage <= 20) { message = 'Yikes... not a great match 💔'; color = 0x808080; }
      else if (percentage <= 40) { message = 'Could work with some effort 🤔'; color = 0xFFAA00; }
      else if (percentage <= 60) { message = 'A decent match! 💛'; color = 0xFFFF00; }
      else if (percentage <= 80) { message = 'Great chemistry! 💕'; color = 0xFF69B4; }
      else { message = 'SOULMATES! Made for each other 💞'; color = 0xFF0000; }
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(color)
          .setTitle(`❤️ Love Meter`)
          .setDescription(`**${user1.username}** ❤️ **${user2.username}**\n\n**${percentage}% compatibility!**\n\n${message}`)
          .setThumbnail(user1.displayAvatarURL({ size: 256 }))
        ]
      });
    }

  } catch (err) {
    console.error('❌ Command error:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Something went wrong.', ephemeral: true }).catch(e => console.error('Reply error:', e));
    } else if (interaction.deferred) {
      await interaction.editReply({ content: '❌ Something went wrong.' }).catch(e => console.error('Edit error:', e));
    }
  }
});

client.login(TOKEN);
