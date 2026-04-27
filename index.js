require('dotenv').config();
const OWNERS = process.env.OWNERS.split(",");
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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

// ===== MONGODB =====
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ===== PLAYER SCHEMA =====
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

// ===== ALL GENSHIN CHARACTERS =====
const genshinCharacters = [
  // MONDSTADT 5★
  { name: 'Albedo', stars: 5, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Albedo.png' },
  { name: 'Aloy', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Aloy.png' },
  { name: 'Diluc', stars: 5, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Diluc.png' },
  { name: 'Eula', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Eula.png' },
  { name: 'Jean', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Jean.png' },
  { name: 'Klee', stars: 5, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Klee.png' },
  { name: 'Mona', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Mona.png' },
  { name: 'Varka', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Varka.png' },
  { name: 'Venti', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Venti.png' },
  { name: 'Durin', stars: 5, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Durin.png' },

  // MONDSTADT 4★
  { name: 'Amber', stars: 4, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ambor.png' },
  { name: 'Barbara', stars: 4, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Barbara.png' },
  { name: 'Bennett', stars: 4, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Bennett.png' },
  { name: 'Dahlia', stars: 4, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Dahlia.png' },
  { name: 'Diona', stars: 5, element: 'Cryo', icon: '❄️', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Diona.png' },
  { name: 'Fischl', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Fischl.png' },
  { name: 'Kaeya', stars: 5, element: 'Cryo', icon: '❄️', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kaeya.png' },
  { name: 'Mika', stars: 4, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Mika.png' },
  { name: 'Noelle', stars: 4, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Noelle.png' },
  { name: 'Razor', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Razor.png' },
  { name: 'Rosaria', stars: 4, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Rosaria.png' },
  { name: 'Sucrose', stars: 4, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Sucrose.png' },

  // LIYUE 5★
  { name: 'Zibai', stars: 5, element: 'Geo', icon: '🪨', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Zibai.png' },
  { name: 'Baizhu', stars: 5, element: 'Dendro', icon: '🌿', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Baizhuer.png' },
  { name: 'Ganyu', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ganyu.png' },
  { name: 'Hu Tao', stars: 5, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Hutao.png' },
  { name: 'Keqing', stars: 5, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Keqing.png' },
  { name: 'Qiqi', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Qiqi.png' },
  { name: 'Shenhe', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Shenhe.png' },
  { name: 'Xianyun', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Liuyun.png' },
  { name: 'Xiao', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Xiao.png' },
  { name: 'Yelan', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Yelan.png' },
  { name: 'Zhongli', stars: 5, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Zhongli.png' },
  
  // LIYUE 4★
  { name: 'Beidou', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Beidou.png' },
  { name: 'Chongyun', stars: 4, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Chongyun.png' },
  { name: 'Gaming', stars: 4, element: 'Pyro', icon: '🔥', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Gaming.png' },
  { name: 'Lan Yan', stars: 4, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Lanyan.png' },
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
  { name: 'Yumemizuki Mizuki', stars: 5, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Mizuki.png' },
  
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
  { name: 'Varesa', stars: 5, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Varesa.png' },

  // NATLAN 4★
  { name: 'Iansan', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Iansan.png' },
  { name: 'Ifa', stars: 4, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ifa.png' },
  { name: 'Kachina', stars: 4, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kachina.png' },
  { name: 'Ororon', stars: 4, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ororon.png' },

  // NOD-KRAI 5★
  { name: 'Columbina', stars: 5, element: 'Hydro', icon: '💧', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Columbina.png' },
  { name: 'Flins', stars: 5, element: 'Electro', icon: '⚡', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Flins.png' },
  { name: 'Ineffa', stars: 5, element: 'Electro', icon: '⚡', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ineffa.png' },
  { name: 'Lauma', stars: 5, element: 'Dendro', icon: '🌿', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Lauma.png' },
  { name: 'Linnea', stars: 5, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Linnea.png' },
  { name: 'Nefer', stars: 5, element: 'Dendro', icon: '🌿', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Nefer.png' },

  // NOD-KRAI 4★
  { name: 'Aino', stars: 4, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Aino.png' },
  { name: 'Illuga', stars: 4, element: 'Geo', icon: '🪨', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Illuga.png' },
  { name: 'Jahoda', stars: 4, element: 'Anemo', icon: '🌀', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Jahoda.png' },

  // INDEPENDENT
  { name: 'Skirk', stars: 5, element: 'Cryo', icon: '❄️', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Skirk.png' },
  { name: 'Tartaglia', stars: 5, element: 'Hydro', icon: '💧', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Tartaglia.png' },
];

// Remove duplicates
const seen = new Set();
const chars = genshinCharacters.filter(c => {
  if (seen.has(c.name)) return false;
  seen.add(c.name);
  return true;
});

const PULL_COST = 160; // primogems per pull
const BUY_LIMIT = 20000; // daily primogem buy limit

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

  // Hard pity at 90
  if (pity >= 90) {
    is5Star = true;
  } else if (pity >= 74) {
    // Soft pity: increased chance from pull 74+
    const softChance = 0.006 + (pity - 73) * 0.06;
    is5Star = Math.random() < softChance;
  } else {
    is5Star = Math.random() < 0.006; // base 0.6%
  }

  let char;
  if (is5Star) {
    // 50/50 system
    const fiveStarPool = chars.filter(c => c.stars === 5);
    char = fiveStarPool[Math.floor(Math.random() * fiveStarPool.length)];
    player.pity = 0;
    player.guaranteed = false;
  } else {
    const fourStarPool = chars.filter(c => c.stars === 4);
    char = fourStarPool[Math.floor(Math.random() * fourStarPool.length)];
  }

  return { char, is5Star };
}

// ===== COMMANDS =====
const commands = [
  new SlashCommandBuilder().setName('pull').setDescription('Pull a Genshin character (costs 160 💎)'),
  new SlashCommandBuilder().setName('pull10').setDescription('Pull 10 times (costs 1600 💎)'),
  new SlashCommandBuilder().setName('pity').setDescription('Check your current pity count 🎯'),
  new SlashCommandBuilder().setName('daily').setDescription('Claim your daily 60 Primogems 💎'),
  new SlashCommandBuilder().setName('balance').setDescription('Check your Primogem balance 💰'),
  new SlashCommandBuilder().setName('shop').setDescription('Buy Primogems 🛒'),
  new SlashCommandBuilder().setName('inventory').setDescription('View your pulled Genshin characters 📦')
    .addUserOption(o => o.setName('user').setDescription("View another user's inventory")),
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
  new SlashCommandBuilder().setName('gift').setDescription('Gift Primogems to a user (Owner only) 🎁')
    .addUserOption(o => o.setName('user').setDescription('User to gift to').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('Amount of Primogems').setRequired(true)),
  new SlashCommandBuilder().setName('buy').setDescription('Buy Primogems (20k limit per 24h) 💳')
    .addIntegerOption(o => o.setName('amount').setDescription('Amount to buy (max 20000 per day)').setRequired(true)),
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

// ===== HELPER: BUILD INVENTORY EMBED =====
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

  const inventoryList = shown.length > 0
    ? shown.map(c => {
        const dupText = c.count > 1 ? ` ×${c.count}` : '';
        return `${c.icon || '✨'} **${c.name}**${dupText} — ${c.element || '?'} ${'⭐'.repeat(c.stars)}`;
      }).join('\n')
    : 'No characters on this page.';

  const lastChar = [...data.characters].reverse().find(c => c && c.image);

  return {
    color: 0xFFD700,
    author: { name: `📦 ${target.username}'s Inventory`, icon_url: target.displayAvatarURL() },
    description: inventoryList,
    thumbnail: { url: lastChar?.image || target.displayAvatarURL() },
    fields: [
      { name: '📊 Total Pulls', value: `${total}`, inline: true },
      { name: '⭐ 5★', value: `${fiveStars}`, inline: true },
      { name: '✨ 4★', value: `${fourStars}`, inline: true },
      { name: '🎯 Unique', value: `${sorted.length}`, inline: true },
      { name: '📄 Page', value: `${page} / ${totalPages}`, inline: true },
    ],
    footer: { text: 'Keep pulling to grow your collection!' },
    timestamp: new Date().toISOString()
  };
}

// ===== INTERACTIONS =====
client.on('interactionCreate', async interaction => {
  // ===== BUTTON HANDLER FOR INVENTORY PAGES =====
  if (interaction.isButton()) {
    const [action, userId, pageStr] = interaction.customId.split('_');
    if (action !== 'inv') return;

    const page = parseInt(pageStr);
    const target = await client.users.fetch(userId).catch(() => null);
    if (!target) return interaction.reply({ content: '❌ User not found.', ephemeral: true });

    const data = await Player.findOne({ userId: target.id });
    if (!data || data.characters.length === 0) {
      return interaction.reply({ content: '❌ No inventory found.', ephemeral: true });
    }

    const charCounts = {};
    for (const c of data.characters) {
      if (!c || !c.name || !c.stars) continue;
      if (!charCounts[c.name]) charCounts[c.name] = { ...c, count: 0 };
      charCounts[c.name].count++;
    }
    const sorted = Object.values(charCounts);
    const totalPages = Math.ceil(sorted.length / 10);
    const clampedPage = Math.max(1, Math.min(page, totalPages));

    const embed = buildInventoryEmbed(target, data, clampedPage, totalPages);
    const row = buildPageButtons(userId, clampedPage, totalPages);

    return interaction.update({ embeds: [embed], components: [row] });
  }

  if (!interaction.isChatInputCommand()) return;

  const name = interaction.commandName;

  try {

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
          embeds: [{
            color: 0xFF5555,
            title: '⏰ Already Claimed!',
            description: `You already claimed your daily!\nCome back in **${timeLeft} hour(s)**. ⏳`,
          }]
        });
      }

      await Player.findOneAndUpdate(
        { userId: interaction.user.id },
        { $inc: { primogems: 60 }, $set: { lastDaily: now, username: interaction.user.username } }
      );

      const updated = await Player.findOne({ userId: interaction.user.id });

      return interaction.reply({
        embeds: [{
          color: 0xFFD700,
          title: '💎 Daily Primogems Claimed!',
          description: `You received **60 💎 Primogems!**\n\n**Total Balance:** ${updated.primogems} 💎\n\nCome back tomorrow for more! 🌟`,
          thumbnail: { url: interaction.user.displayAvatarURL() },
          footer: { text: 'Tip: Use /pull to wish for characters!' }
        }]
      });
    }

    if (name === 'balance') {
      const player = await Player.findOne({ userId: interaction.user.id });
      const primos = player?.primogems || 0;
      const pulls = Math.floor(primos / PULL_COST);
      return interaction.reply({
        embeds: [{
          color: 0x5865F2,
          title: `💰 ${interaction.user.username}'s Balance`,
          description: `**💎 Primogems:** ${primos}\n**✨ Pulls Available:** ${pulls}\n\nEarn more with **/daily** or buy in **/shop**!`,
          thumbnail: { url: interaction.user.displayAvatarURL() },
        }]
      });
    }

    if (name === 'shop') {
      return interaction.reply({
        embeds: [{
          color: 0xFFD700,
          title: '🛒 Primogem Shop',
          description: [
            '> Buy Primogems to wish for characters!\n',
            '**Package 1** — 💎 60 Primogems → `Free (use /daily)`',
            '**Package 2** — 💎 Up to 20,000 per day → `🎮 /buy <amount>`',
            '**Package 3** — 💎 Unlimited → `🎮 /gift <@user> <amount>` *(Owner only)*\n',
            '> 💡 **1 Pull = 160 Primogems**',
            '> 💡 **10 Pulls = 1600 Primogems**',
            '> 💡 **Hard Pity = 90 Pulls**',
            '> 💡 **Soft Pity starts at pull 74**',
          ].join('\n'),
          footer: { text: 'Use /daily every day to earn free Primogems!' }
        }]
      });
    }

    if (name === 'pity') {
      const player = await Player.findOne({ userId: interaction.user.id });
      const pity = player?.pity || 0;
      const guaranteed = player?.guaranteed || false;
      const pullsLeft = 90 - pity;
      const softPityIn = pity >= 74 ? 0 : 74 - pity;

      return interaction.reply({
        embeds: [{
          color: 0xA855F7,
          title: `🎯 ${interaction.user.username}'s Pity`,
          fields: [
            { name: '🔢 Current Pity', value: `${pity} / 90`, inline: true },
            { name: '🎰 Hard Pity In', value: `${pullsLeft} pulls`, inline: true },
            { name: '📈 Soft Pity In', value: softPityIn === 0 ? '✅ Active now!' : `${softPityIn} pulls`, inline: true },
            { name: '🎲 50/50 Status', value: guaranteed ? '✅ **GUARANTEED** next 5★!' : '⚠️ On 50/50 (50% chance)', inline: false },
          ],
          footer: { text: 'Soft pity starts at pull 74 — higher chance of 5★!' }
        }]
      });
    }

    if (name === 'pull') {
      let player = await Player.findOneAndUpdate(
        { userId: interaction.user.id },
        { $setOnInsert: { username: interaction.user.username, primogems: 0, pity: 0, guaranteed: false, lastDaily: null, characters: [] } },
        { upsert: true, new: true }
      );

      if (player.primogems < PULL_COST) {
        return interaction.reply({
          embeds: [{
            color: 0xFF5555,
            title: '❌ Not Enough Primogems!',
            description: `You need **160 💎** to pull!\n\nYou have: **${player.primogems} 💎**\n\nGet more with **/daily** or **/shop**!`,
          }]
        });
      }

      const { char, is5Star } = doWish(player);

      await Player.findOneAndUpdate(
        { userId: interaction.user.id },
        {
          $inc: { primogems: -PULL_COST },
          $set: { pity: player.pity, guaranteed: player.guaranteed, username: interaction.user.username },
          $push: {
            characters: {
              name: char.name, stars: char.stars, element: char.element,
              icon: char.icon, image: char.image, color: char.color, pulledAt: new Date()
            }
          }
        }
      );

      const updatedPlayer = await Player.findOne({ userId: interaction.user.id });
      const stars = '⭐'.repeat(char.stars);

      return interaction.reply({
        embeds: [{
          color: char.color,
          author: { name: '✨ Genshin Impact — Wish Result' },
          title: `${char.icon} ${char.name}`,
          description: `**Element:** ${char.element}\n**Rarity:** ${stars}\n\n${is5Star ? '🎉 **RARE 5★ PULL! You got lucky!**' : '💫 A fine addition to your roster!'}\n\n💎 **Remaining:** ${updatedPlayer.primogems} | 🎯 **Pity:** ${updatedPlayer.pity}/90`,
          image: { url: char.image },
          footer: { text: is5Star ? '✦ 5★ Character Obtained!' : '✦ 4★ Character Obtained!' },
          timestamp: new Date().toISOString()
        }]
      });
    }

    if (name === 'pull10') {
      let player = await Player.findOneAndUpdate(
        { userId: interaction.user.id },
        { $setOnInsert: { username: interaction.user.username, primogems: 0, pity: 0, guaranteed: false, lastDaily: null, characters: [] } },
        { upsert: true, new: true }
      );

      const cost = PULL_COST * 10;
      if (player.primogems < cost) {
        return interaction.reply({
          embeds: [{
            color: 0xFF5555,
            title: '❌ Not Enough Primogems!',
            description: `You need **1600 💎** for 10 pulls!\n\nYou have: **${player.primogems} 💎**\n\nGet more with **/daily** or **/shop**!`,
          }]
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
      const fiveStar = results.find(r => r.is5Star);
      const pullList = results.map(r => `${r.char.icon} **${r.char.name}** ${'⭐'.repeat(r.char.stars)}`).join('\n');

      return interaction.reply({
        embeds: [{
          color: fiveStar ? 0xFFD700 : 0x5865F2,
          author: { name: '✨ Genshin Impact — 10 Wish Results' },
          description: pullList,
          fields: [
            { name: '💎 Remaining', value: `${updatedPlayer.primogems}`, inline: true },
            { name: '🎯 Pity', value: `${updatedPlayer.pity}/90`, inline: true },
          ],
          footer: { text: fiveStar ? `🎉 Got ${fiveStar.char.name}!` : 'No 5★ this time... Keep pulling!' },
          timestamp: new Date().toISOString()
        }]
      });
    }

    if (name === 'inventory') {
      await interaction.deferReply();

      const target = interaction.options.getUser('user') || interaction.user;
      const data = await Player.findOne({ userId: target.id });

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

      const charCounts = {};
      for (const c of data.characters) {
        if (!c || !c.name || !c.stars) continue;
        if (!charCounts[c.name]) charCounts[c.name] = { name: c.name, stars: c.stars, element: c.element, icon: c.icon, image: c.image, count: 0 };
        charCounts[c.name].count++;
      }
      const sorted = Object.values(charCounts);
      const totalPages = Math.max(1, Math.ceil(sorted.length / 10));

      const embed = buildInventoryEmbed(target, data, 1, totalPages);
      const row = buildPageButtons(target.id, 1, totalPages);

      return interaction.editReply({ embeds: [embed], components: totalPages > 1 ? [row] : [] });
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
      let message = '', color = 0xFF69B4;
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

    if (name === 'gift') {
      // Owner only check
      if (!OWNERS.includes(interaction.user.id)) {
        return interaction.reply({
          embeds: [{
            color: 0xFF5555,
            title: '❌ Owner Only!',
            description: 'Only the bot owner can use this command.',
          }],
          ephemeral: true
        });
      }

      const target = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');

      if (amount <= 0) {
        return interaction.reply({
          embeds: [{
            color: 0xFF5555,
            title: '❌ Invalid Amount!',
            description: 'Amount must be greater than 0.',
          }],
          ephemeral: true
        });
      }

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
        embeds: [{
          color: 0x00FF00,
          title: '🎁 Primogems Gifted!',
          description: `Successfully gifted **${amount} 💎 Primogems** to **${target.username}**!\n\n**Their New Balance:** ${updated.primogems} 💎`,
          thumbnail: { url: target.displayAvatarURL() },
        }]
      });
    }

    if (name === 'buy') {
      let player = await Player.findOneAndUpdate(
        { userId: interaction.user.id },
        { $setOnInsert: { username: interaction.user.username, primogems: 0, pity: 0, guaranteed: false, lastDaily: null, boughtToday: 0, lastBuy: null, characters: [] } },
        { upsert: true, new: true }
      );

      const amount = interaction.options.getInteger('amount');

      if (amount <= 0) {
        return interaction.reply({
          embeds: [{
            color: 0xFF5555,
            title: '❌ Invalid Amount!',
            description: 'Amount must be greater than 0.',
          }],
          ephemeral: true
        });
      }

      // Check daily limit
      const now = new Date();
      const lastBuy = player.lastBuy ? new Date(player.lastBuy) : null;
      const hoursSince = lastBuy ? (now - lastBuy) / 1000 / 60 / 60 : 999;

      // Reset counter if 24 hours have passed
      let boughtToday = player.boughtToday || 0;
      if (hoursSince >= 24) {
        boughtToday = 0;
      }

      if (boughtToday + amount > BUY_LIMIT) {
        const remaining = BUY_LIMIT - boughtToday;
        return interaction.reply({
          embeds: [{
            color: 0xFF5555,
            title: '❌ Daily Limit Exceeded!',
            description: `You can only buy **${BUY_LIMIT} 💎** per 24 hours.\n\n**Already bought today:** ${boughtToday} 💎\n**You can still buy:** ${remaining} 💎\n\n**Next reset:** <t:${Math.floor((lastBuy.getTime() + 24 * 60 * 60 * 1000) / 1000)}:R>`,
          }],
          ephemeral: true
        });
      }

      // Add primogems
      const updated = await Player.findOneAndUpdate(
        { userId: interaction.user.id },
        { 
          $inc: { primogems: amount, boughtToday: amount },
          $set: { lastBuy: now, username: interaction.user.username }
        },
        { new: true }
      );

      const nextReset = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      return interaction.reply({
        embeds: [{
          color: 0x00FF00,
          title: '✅ Purchase Successful!',
          description: `You bought **${amount} 💎 Primogems!**\n\n**New Balance:** ${updated.primogems} 💎\n**Bought Today:** ${updated.boughtToday} / ${BUY_LIMIT} 💎\n**Next Reset:** <t:${Math.floor(nextReset.getTime() / 1000)}:R>`,
          thumbnail: { url: interaction.user.displayAvatarURL() },
          footer: { text: 'Use /pull to wish for characters!' }
        }]
      });
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

function buildPageButtons(userId, page, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`inv_${userId}_${page - 1}`)
      .setLabel('◀ Prev')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),
    new ButtonBuilder()
      .setCustomId(`inv_${userId}_${page + 1}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages),
  );
}

client.login(TOKEN);
