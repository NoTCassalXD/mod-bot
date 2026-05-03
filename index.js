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

// ===== ELEMENT EMOJIS =====
const elementEmoji = {
  Pyro: '🔥', Hydro: '💧', Electro: '⚡', Cryo: '❄️',
  Anemo: '🌀', Geo: '🪨', Dendro: '🌿'
};

// ===== ALL GENSHIN CHARACTERS =====
const genshinCharacters = [
  // MONDSTADT 5★
  { name: 'Albedo', stars: 5, element: 'Geo', icon: 'https://enka.network/ui/UI_AvatarIcon_Albedo.png', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Albedo.png' },
  { name: 'Aloy', stars: 5, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Aloy.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Aloy.png' },
  { name: 'Diluc', stars: 5, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Diluc.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Diluc.png' },
  { name: 'Eula', stars: 5, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Eula.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Eula.png' },
  { name: 'Jean', stars: 5, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Jean.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Jean.png' },
  { name: 'Klee', stars: 5, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Klee.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Klee.png' },
  { name: 'Mona', stars: 5, element: 'Hydro', icon: 'https://enka.network/ui/UI_AvatarIcon_Mona.png', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Mona.png' },
  { name: 'Venti', stars: 5, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Venti.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Venti.png' },
  // MONDSTADT 4★
  { name: 'Amber', stars: 4, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Ambor.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ambor.png' },
  { name: 'Barbara', stars: 4, element: 'Hydro', icon: 'https://enka.network/ui/UI_AvatarIcon_Barbara.png', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Barbara.png' },
  { name: 'Bennett', stars: 4, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Bennett.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Bennett.png' },
  { name: 'Diona', stars: 4, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Diona.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Diona.png' },
  { name: 'Fischl', stars: 4, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Fischl.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Fischl.png' },
  { name: 'Kaeya', stars: 4, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Kaeya.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kaeya.png' },
  { name: 'Lisa', stars: 4, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Lisa.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Lisa.png' },
  { name: 'Mika', stars: 4, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Mika.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Mika.png' },
  { name: 'Noelle', stars: 4, element: 'Geo', icon: 'https://enka.network/ui/UI_AvatarIcon_Noel.png', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Noel.png' },
  { name: 'Razor', stars: 4, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Razor.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Razor.png' },
  { name: 'Rosaria', stars: 4, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Rosaria.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Rosaria.png' },
  { name: 'Sucrose', stars: 4, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Sucrose.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Sucrose.png' },
  // LIYUE 5★
  { name: 'Baizhu', stars: 5, element: 'Dendro', icon: 'https://enka.network/ui/UI_AvatarIcon_Baizhuer.png', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Baizhuer.png' },
  { name: 'Ganyu', stars: 5, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Ganyu.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ganyu.png' },
  { name: 'Hu Tao', stars: 5, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Hutao.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Hutao.png' },
  { name: 'Keqing', stars: 5, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Keqing.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Keqing.png' },
  { name: 'Qiqi', stars: 5, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Qiqi.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Qiqi.png' },
  { name: 'Shenhe', stars: 5, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Shenhe.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Shenhe.png' },
  { name: 'Xiao', stars: 5, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Xiao.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Xiao.png' },
  { name: 'Xianyun', stars: 5, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Liuyun.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Liuyun.png' },
  { name: 'Yelan', stars: 5, element: 'Hydro', icon: 'https://enka.network/ui/UI_AvatarIcon_Yelan.png', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Yelan.png' },
  { name: 'Zhongli', stars: 5, element: 'Geo', icon: 'https://enka.network/ui/UI_AvatarIcon_Zhongli.png', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Zhongli.png' },
  // LIYUE 4★
  { name: 'Beidou', stars: 4, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Beidou.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Beidou.png' },
  { name: 'Chongyun', stars: 4, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Chongyun.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Chongyun.png' },
  { name: 'Gaming', stars: 4, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Gaming.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Gaming.png' },
  { name: 'Lan Yan', stars: 4, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Lanyan.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Lanyan.png' },
  { name: 'Ningguang', stars: 4, element: 'Geo', icon: 'https://enka.network/ui/UI_AvatarIcon_Ningguang.png', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ningguang.png' },
  { name: 'Xiangling', stars: 4, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Xiangling.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Xiangling.png' },
  { name: 'Xingqiu', stars: 4, element: 'Hydro', icon: 'https://enka.network/ui/UI_AvatarIcon_Xingqiu.png', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Xingqiu.png' },
  { name: 'Xinyan', stars: 4, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Xinyan.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Xinyan.png' },
  { name: 'Yanfei', stars: 4, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Feiyan.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Feiyan.png' },
  { name: 'Yaoyao', stars: 4, element: 'Dendro', icon: 'https://enka.network/ui/UI_AvatarIcon_Yaoyao.png', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Yaoyao.png' },
  { name: 'Yun Jin', stars: 4, element: 'Geo', icon: 'https://enka.network/ui/UI_AvatarIcon_Yunjin.png', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Yunjin.png' },
  // INAZUMA 5★
  { name: 'Arataki Itto', stars: 5, element: 'Geo', icon: 'https://enka.network/ui/UI_AvatarIcon_Itto.png', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Itto.png' },
  { name: 'Chiori', stars: 5, element: 'Geo', icon: 'https://enka.network/ui/UI_AvatarIcon_Chiori.png', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Chiori.png' },
  { name: 'Kaedehara Kazuha', stars: 5, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Kazuha.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kazuha.png' },
  { name: 'Kamisato Ayaka', stars: 5, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Ayaka.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ayaka.png' },
  { name: 'Kamisato Ayato', stars: 5, element: 'Hydro', icon: 'https://enka.network/ui/UI_AvatarIcon_Ayato.png', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ayato.png' },
  { name: 'Raiden Shogun', stars: 5, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Shougun.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Shougun.png' },
  { name: 'Sangonomiya Kokomi', stars: 5, element: 'Hydro', icon: 'https://enka.network/ui/UI_AvatarIcon_Kokomi.png', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kokomi.png' },
  { name: 'Yae Miko', stars: 5, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Yae.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Yae.png' },
  { name: 'Yoimiya', stars: 5, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Yoimiya.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Yoimiya.png' },
  { name: 'Yumemizuki Mizuki', stars: 5, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Mizuki.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Mizuki.png' },
  // INAZUMA 4★
  { name: 'Gorou', stars: 4, element: 'Geo', icon: 'https://enka.network/ui/UI_AvatarIcon_Gorou.png', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Gorou.png' },
  { name: 'Kujou Sara', stars: 4, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Sara.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Sara.png' },
  { name: 'Kuki Shinobu', stars: 4, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Shinobu.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Shinobu.png' },
  { name: 'Kirara', stars: 4, element: 'Dendro', icon: 'https://enka.network/ui/UI_AvatarIcon_Kirara.png', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kirara.png' },
  { name: 'Sayu', stars: 4, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Sayu.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Sayu.png' },
  { name: 'Shikanoin Heizou', stars: 4, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Heizo.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Heizo.png' },
  { name: 'Thoma', stars: 4, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Tohma.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Tohma.png' },
  // SUMERU 5★
  { name: 'Alhaitham', stars: 5, element: 'Dendro', icon: 'https://enka.network/ui/UI_AvatarIcon_Alhatham.png', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Alhatham.png' },
  { name: 'Cyno', stars: 5, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Cyno.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Cyno.png' },
  { name: 'Dehya', stars: 5, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Dehya.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Dehya.png' },
  { name: 'Nahida', stars: 5, element: 'Dendro', icon: 'https://enka.network/ui/UI_AvatarIcon_Nahida.png', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Nahida.png' },
  { name: 'Nilou', stars: 5, element: 'Hydro', icon: 'https://enka.network/ui/UI_AvatarIcon_Nilou.png', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Nilou.png' },
  { name: 'Tighnari', stars: 5, element: 'Dendro', icon: 'https://enka.network/ui/UI_AvatarIcon_Tighnari.png', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Tighnari.png' },
  { name: 'Wanderer', stars: 5, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Wanderer.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Wanderer.png' },
  // SUMERU 4★
  { name: 'Candace', stars: 4, element: 'Hydro', icon: 'https://enka.network/ui/UI_AvatarIcon_Candace.png', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Candace.png' },
  { name: 'Collei', stars: 4, element: 'Dendro', icon: 'https://enka.network/ui/UI_AvatarIcon_Collei.png', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Collei.png' },
  { name: 'Dori', stars: 4, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Dori.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Dori.png' },
  { name: 'Faruzan', stars: 4, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Faruzan.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Faruzan.png' },
  { name: 'Kaveh', stars: 4, element: 'Dendro', icon: 'https://enka.network/ui/UI_AvatarIcon_Kaveh.png', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kaveh.png' },
  { name: 'Layla', stars: 4, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Layla.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Layla.png' },
  { name: 'Sethos', stars: 4, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Sethos.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Sethos.png' },
  // FONTAINE 5★
  { name: 'Arlecchino', stars: 5, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Arlecchino.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Arlecchino.png' },
  { name: 'Clorinde', stars: 5, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Clorinde.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Clorinde.png' },
  { name: 'Emilie', stars: 5, element: 'Dendro', icon: 'https://enka.network/ui/UI_AvatarIcon_Emilie.png', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Emilie.png' },
  { name: 'Escoffier', stars: 5, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Escoffier.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Escoffier.png' },
  { name: 'Furina', stars: 5, element: 'Hydro', icon: 'https://enka.network/ui/UI_AvatarIcon_Furina.png', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Furina.png' },
  { name: 'Lyney', stars: 5, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Lyney.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Lyney.png' },
  { name: 'Navia', stars: 5, element: 'Geo', icon: 'https://enka.network/ui/UI_AvatarIcon_Navia.png', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Navia.png' },
  { name: 'Neuvillette', stars: 5, element: 'Hydro', icon: 'https://enka.network/ui/UI_AvatarIcon_Neuvillette.png', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Neuvillette.png' },
  { name: 'Sigewinne', stars: 5, element: 'Hydro', icon: 'https://enka.network/ui/UI_AvatarIcon_Sigewinne.png', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Sigewinne.png' },
  { name: 'Wriothesley', stars: 5, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Wriothesley.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Wriothesley.png' },
  // FONTAINE 4★
  { name: 'Charlotte', stars: 4, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Charlotte.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Charlotte.png' },
  { name: 'Chevreuse', stars: 4, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Chevreuse.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Chevreuse.png' },
  { name: 'Freminet', stars: 4, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Freminet.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Freminet.png' },
  { name: 'Lynette', stars: 4, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Linette.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Linette.png' },
  // NATLAN 5★
  { name: 'Chasca', stars: 5, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Chasca.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Chasca.png' },
  { name: 'Citlali', stars: 5, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Citlali.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Citlali.png' },
  { name: 'Kinich', stars: 5, element: 'Dendro', icon: 'https://enka.network/ui/UI_AvatarIcon_Kinich.png', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kinich.png' },
  { name: 'Mavuika', stars: 5, element: 'Pyro', icon: 'https://enka.network/ui/UI_AvatarIcon_Mavuika.png', color: 0xFF6B35, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Mavuika.png' },
  { name: 'Mualani', stars: 5, element: 'Hydro', icon: 'https://enka.network/ui/UI_AvatarIcon_Mualani.png', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Mualani.png' },
  { name: 'Xilonen', stars: 5, element: 'Geo', icon: 'https://enka.network/ui/UI_AvatarIcon_Xilonen.png', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Xilonen.png' },
  { name: 'Varesa', stars: 5, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Varesa.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Varesa.png' },
  // NATLAN 4★
  { name: 'Iansan', stars: 4, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Iansan.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Iansan.png' },
  { name: 'Ifa', stars: 4, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Sayu.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Sayu.png' },
  { name: 'Kachina', stars: 4, element: 'Geo', icon: 'https://enka.network/ui/UI_AvatarIcon_Kachina.png', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kachina.png' },
  { name: 'Ororon', stars: 4, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Ororon.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Ororon.png' },
  // NOD-KRAI 5★
  { name: 'Columbina', stars: 5, element: 'Hydro', icon: 'https://enka.network/ui/UI_AvatarIcon_Kokomi.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Kokomi.png' },
  { name: 'Ineffa', stars: 5, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Clorinde.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Clorinde.png' },
  { name: 'Lauma', stars: 5, element: 'Dendro', icon: 'https://enka.network/ui/UI_AvatarIcon_Nahida.png', color: 0x86EFAC, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Nahida.png' },
  { name: 'Linnea', stars: 5, element: 'Geo', icon: 'https://enka.network/ui/UI_AvatarIcon_Navia.png', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Navia.png' },
  { name: 'Flins', stars: 5, element: 'Electro', icon: 'https://enka.network/ui/UI_AvatarIcon_Yae.png', color: 0xA855F7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Yae.png' },
  // NOD-KRAI 4★
  { name: 'Aino', stars: 4, element: 'Hydro', icon: 'https://enka.network/ui/UI_AvatarIcon_Barbara.png', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Barbara.png' },
  { name: 'Illuga', stars: 4, element: 'Geo', icon: 'https://enka.network/ui/UI_AvatarIcon_Noel.png', color: 0xF5A623, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Noel.png' },
  { name: 'Jahoda', stars: 4, element: 'Anemo', icon: 'https://enka.network/ui/UI_AvatarIcon_Sucrose.png', color: 0x6EE7B7, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Sucrose.png' },
  // INDEPENDENT
  { name: 'Skirk', stars: 5, element: 'Cryo', icon: 'https://enka.network/ui/UI_AvatarIcon_Eula.png', color: 0xBAE6FD, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Eula.png' },
  { name: 'Tartaglia', stars: 5, element: 'Hydro', icon: 'https://enka.network/ui/UI_AvatarIcon_Tartaglia.png', color: 0x4CC9F0, image: 'https://enka.network/ui/UI_Gacha_AvatarImg_Tartaglia.png' },
];

// Build lookup map for quick access
const charMap = {};
const uniqueChars = [];
const seenNames = new Set();
for (const char of genshinCharacters) {
  if (!seenNames.has(char.name)) {
    uniqueChars.push(char);
    charMap[char.name] = char;
    seenNames.add(char.name);
  }
}
const chars = uniqueChars;
const sortedChars = [...chars].sort((a, b) => a.name.localeCompare(b.name));

const PULL_COST = 160;
const BUY_LIMIT = 20000;
const afkUsers = new Map();
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
    if (!arr.length) return '';
    const f = arr[0].name[0].toUpperCase();
    const l = arr[arr.length - 1].name[0].toUpperCase();
    return f === l ? `(${f})` : `(${f}–${l})`;
  };
  const formatCol = (arr) => arr.length
    ? arr.map(c => `${elementEmoji[c.element] || '✨'} ${c.name}`).join('\n')
    : '\u200b';
  const endIndex = Math.min(start + CHARS_PER_PAGE, sortedChars.length);
  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`📚 Genshin Impact Characters (${start + 1}–${endIndex}/${sortedChars.length})`)
    .addFields(
      { name: `꩜ ${getRange(col1)}`, value: formatCol(col1), inline: true },
      { name: `꩜ ${getRange(col2)}`, value: formatCol(col2), inline: true },
      { name: `꩜ ${getRange(col3)}`, value: formatCol(col3), inline: true }
    )
    .setFooter({ text: `Use /pull to wish for these characters! • Page ${page}/${totalPages}` })
    .setTimestamp();
}

// ===== BUILD INVENTORY EMBED =====
function buildInventoryEmbed(target, data, page, totalPages) {
  const total = data.characters.length;
  const fiveStars = data.characters.filter(c => c && c.stars === 5).length;
  const fourStars = data.characters.filter(c => c && c.stars === 4).length;

  const charCounts = {};
  for (const c of data.characters) {
    if (!c || !c.name || !c.stars) continue;
    if (!charCounts[c.name]) {
      charCounts[c.name] = {
        name: c.name,
        stars: c.stars,
        element: c.element || 'Unknown',
        image: c.image || '',
        color: c.color || 0x5865F2,
        count: 0
      };
    }
    charCounts[c.name].count++;
  }

  const sorted = Object.values(charCounts).sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name));
  const shown = sorted.slice((page - 1) * 10, page * 10);
  const highlight = shown.find(c => c.stars === 5) || shown[0];

  const list = shown.length > 0
    ? shown.map(c => {
        const dup = c.count > 1 ? ` ×${c.count}` : '';
        const star = c.stars === 5 ? '🌟' : '✨';
        const elem = elementEmoji[c.element] || '✨';
        return `${star} **${c.name}**${dup} — ${elem} ${c.element} ${'⭐'.repeat(c.stars)}`;
      }).join('\n')
    : 'No characters on this page.';

  return new EmbedBuilder()
    .setColor(highlight?.color || 0x5865F2)
    .setAuthor({ name: `📦 ${target.username}'s Collection`, iconURL: target.displayAvatarURL() })
    .setDescription(list)
    .setThumbnail(highlight?.image || target.displayAvatarURL())
    .addFields(
      { name: '📊 Total Pulls', value: `${total}`, inline: true },
      { name: '🌟 5★', value: `${fiveStars}`, inline: true },
      { name: '✨ 4★', value: `${fourStars}`, inline: true },
      { name: '🎯 Unique', value: `${sorted.length}`, inline: true },
      { name: '📄 Page', value: `${page} / ${totalPages}`, inline: true }
    )
    .setFooter({ text: '🎰 Use /pull or /pull10 to get more characters!' })
    .setTimestamp();
}

// ===== BUILD PULL10 EMBED =====
function buildPull10Embed(user, results, updatedPlayer) {
  const fiveStarResults = results.filter(r => r.is5Star);
  const featuredChar = fiveStarResults.length > 0 ? fiveStarResults[0].char : results[results.length - 1].char;

  const pullList = results.map(r => {
    const elem = elementEmoji[r.char.element] || '✨';
    const stars = '⭐'.repeat(r.char.stars);
    if (r.is5Star) {
      return `✦ **${r.char.name}** ${stars} — ${elem} ${r.char.element} 🌟`;
    }
    return `${r.char.name} ${stars} — ${elem} ${r.char.element}`;
  }).join('\n');

  return new EmbedBuilder()
    .setColor(fiveStarResults.length > 0 ? featuredChar.color : 0x5865F2)
    .setAuthor({ name: `✨ Genshin Impact — 10 Wish Results`, iconURL: user.displayAvatarURL() })
    .setTitle(fiveStarResults.length > 0
      ? `🎉 ${fiveStarResults.map(r => r.char.name).join(', ')} obtained!`
      : '💫 10 Wishes Complete!')
    .setDescription(pullList)
    .setThumbnail(featuredChar.image)
    .addFields(
      { name: '💎 Primogems Left', value: `${updatedPlayer.primogems}`, inline: true },
      { name: '🎯 Current Pity', value: `${updatedPlayer.pity}/90`, inline: true },
      { name: '🌟 5★ Obtained', value: fiveStarResults.length > 0
          ? fiveStarResults.map(r => `${elementEmoji[r.char.element]} ${r.char.name}`).join(', ')
          : 'None this time...', inline: true }
    )
    .setFooter({ text: fiveStarResults.length > 0 ? '✦ Rare character(s) added to your inventory!' : 'No 5★ this time... Keep wishing!' })
    .setTimestamp();
}

// ===== PAGE BUTTONS =====
function buildCharListButtons(page) {
  const totalPages = Math.ceil(sortedChars.length / CHARS_PER_PAGE);
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`cl_first_1`).setLabel('|◀◀').setStyle(ButtonStyle.Primary).setDisabled(page <= 1),
    new ButtonBuilder().setCustomId(`cl_prev_${page - 1}`).setLabel('◀').setStyle(ButtonStyle.Primary).setDisabled(page <= 1),
    new ButtonBuilder().setCustomId(`cl_cur_0`).setLabel(`${page}/${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId(`cl_next_${page + 1}`).setLabel('▶').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages),
    new ButtonBuilder().setCustomId(`cl_last_${totalPages}`).setLabel('▶▶|').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages),
  );
}

function buildInvButtons(userId, page, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`inv_${userId}_1`).setLabel('|◀◀').setStyle(ButtonStyle.Primary).setDisabled(page <= 1),
    new ButtonBuilder().setCustomId(`inv_${userId}_${Math.max(1, page - 1)}`).setLabel('◀').setStyle(ButtonStyle.Primary).setDisabled(page <= 1),
    new ButtonBuilder().setCustomId(`inv_cur_0`).setLabel(`${page}/${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId(`inv_${userId}_${Math.min(totalPages, page + 1)}`).setLabel('▶').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages),
    new ButtonBuilder().setCustomId(`inv_${userId}_${totalPages}`).setLabel('▶▶|').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages),
  );
}

// ===== COMMANDS =====
const commands = [
  new SlashCommandBuilder().setName('pull').setDescription('Pull a Genshin character (costs 160 💎)'),

  new SlashCommandBuilder().setName('shop').setDescription('View the Primogem shop 🛒'),

  new SlashCommandBuilder().setName('buy').setDescription('Buy Primogems (20k limit per 24h) 💳')
    .addIntegerOption(o => o.setName('amount').setDescription('Amount to buy').setRequired(true)),

  new SlashCommandBuilder().setName('gift').setDescription('Gift Primogems 🎁')
    .addUserOption(o => o.setName('user').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setRequired(true)),

  new SlashCommandBuilder().setName('inventory').setDescription('View inventory 📦')
    .addUserOption(o => o.setName('user')),

  new SlashCommandBuilder().setName('avatar').setDescription("Show avatar")
    .addUserOption(o => o.setName('user')),

  new SlashCommandBuilder().setName('coinflip').setDescription('Flip a coin'),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Server info'),
  new SlashCommandBuilder().setName('userinfo').setDescription('User info')
    .addUserOption(o => o.setName('user')),

  new SlashCommandBuilder().setName('roast').setDescription('Roast someone')
    .addUserOption(o => o.setName('user').setRequired(true)),

  new SlashCommandBuilder().setName('say').setDescription('Bot says something')
    .addStringOption(o => o.setName('text').setRequired(true)),

  new SlashCommandBuilder().setName('meme').setDescription('Random meme'),

  new SlashCommandBuilder().setName('love').setDescription('Love meter')
    .addUserOption(o => o.setName('user1').setRequired(true))
    .addUserOption(o => o.setName('user2').setRequired(true)),

  // ✅ NEW
  new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set AFK')
    .addUserOption(o => o.setName('user').setRequired(true))
    .addStringOption(o => o.setName('reason')),

  new SlashCommandBuilder()
    .setName('send-codes')
    .setDescription('Send Genshin redeem codes')
    .addStringOption(o => o.setName('code1').setRequired(true))
    .addStringOption(o => o.setName('code2'))
    .addStringOption(o => o.setName('code3')),
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

  // ===== BUTTON HANDLER =====
  if (interaction.isButton()) {
    try {
      const parts = interaction.customId.split('_');

      if (parts[0] === 'cl') {
        const page = parseInt(parts[2]);
        const totalPages = Math.ceil(sortedChars.length / CHARS_PER_PAGE);
        const clampedPage = Math.max(1, Math.min(page, totalPages));
        const embed = buildCharListEmbed(clampedPage);
        const row = buildCharListButtons(clampedPage);
        return interaction.update({ embeds: [embed], components: [row] });
      }

      if (parts[0] === 'inv' && parts[1] !== 'cur') {
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
          if (!charCounts[c.name]) charCounts[c.name] = { name: c.name, stars: c.stars, element: c.element, image: c.image, color: c.color, count: 0 };
          charCounts[c.name].count++;
        }
        const sorted = Object.values(charCounts);
        const totalPages = Math.max(1, Math.ceil(sorted.length / 10));
        const clampedPage = Math.max(1, Math.min(page, totalPages));

        const embed = buildInventoryEmbed(target, data, clampedPage, totalPages);
        const row = buildInvButtons(userId, clampedPage, totalPages);
        return interaction.update({ embeds: [embed], components: [row] });
      }
    } catch (err) {
      console.error('❌ Button error:', err);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const name = interaction.commandName;

  if (name === 'afk') {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
  
    afkUsers.set(user.id, { reason, time: Date.now() });
  
    return interaction.reply({
      content: `💤 ${user.username} is now AFK — ${reason}`
    });
  }

  try {


    if (name === 'shop') {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xFFD700).setTitle('🛒 Primogem Shop')
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
          .setFooter({ text: 'Use /daily every day to earn free Primogems!' })]
      });
    } 

    if (name === 'send-codes') {
      const codes = [
        interaction.options.getString('code1'),
        interaction.options.getString('code2'),
        interaction.options.getString('code3')
      ].filter(Boolean);
    
      const rows = codes.map(code =>
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel(`Redeem ${code}`)
            .setStyle(ButtonStyle.Link)
            .setURL(`https://genshin.hoyoverse.com/en/gift?code=${code}`)
        )
      );
    
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x00FFAA)
            .setTitle('🎁 Genshin Redeem Codes')
            .setDescription(codes.map(c => `🔹 ${c}`).join('\n'))
        ],
        components: rows
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
          embeds: [new EmbedBuilder().setColor(0xFF5555).setTitle('❌ Not Enough Primogems!')
            .setDescription(`You need **160 💎** to pull!\n\nYou have: **${player.primogems} 💎**\n\nGet more with **/daily** or **/buy**!`)]
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
      const elem = elementEmoji[char.element] || '✨';
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor(char.color)
          .setAuthor({ name: '✨ Genshin Impact — Wish Result' })
          .setTitle(char.name)
          .setDescription(`${elem} **${char.element}** • ${'⭐'.repeat(char.stars)}\n\n${is5Star ? '🎉 **RARE 5★ PULL! You got lucky!**' : '💫 A fine addition to your roster!'}\n\n💎 **Remaining:** ${updatedPlayer.primogems} | 🎯 **Pity:** ${updatedPlayer.pity}/90`)
          .setImage(char.image)
          .setFooter({ text: is5Star ? '✦ 5★ Character Obtained!' : '✦ 4★ Character Obtained! | Added to /inventory' })
          .setTimestamp()]
      });
    }


    if (name === 'inventory') {
      await interaction.deferReply();
      const target = interaction.options.getUser('user') || interaction.user;

      let data;
      try {
        data = await Player.findOne({ userId: target.id });
      } catch (e) {
        console.error('DB error in inventory:', e);
        return interaction.editReply({ content: '❌ Database error. Please try again.' });
      }

      if (!data || data.characters.length === 0) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`📦 ${target.username}'s Collection`)
            .setDescription(target.id === interaction.user.id
              ? "You haven't pulled any characters yet!\nUse **/pull** to start your collection! ✨"
              : `**${target.username}** hasn't pulled any characters yet!`)
            .setThumbnail(target.displayAvatarURL())]
        });
      }

      const charCounts = {};
      for (const c of data.characters) {
        if (!c || !c.name || !c.stars) continue;
        if (!charCounts[c.name]) charCounts[c.name] = { name: c.name, stars: c.stars, element: c.element, image: c.image, color: c.color, count: 0 };
        charCounts[c.name].count++;
      }
      const sorted = Object.values(charCounts);
      const totalPages = Math.max(1, Math.ceil(sorted.length / 10));
      const embed = buildInventoryEmbed(target, data, 1, totalPages);
      const row = buildInvButtons(target.id, 1, totalPages);
      return interaction.editReply({ embeds: [embed], components: totalPages > 1 ? [row] : [] });
    }

    if (name === 'gift') {
      if (!OWNERS.includes(interaction.user.id)) {
        return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFF5555).setTitle('❌ Owner Only!').setDescription('Only the bot owner can use this command.')], ephemeral: true });
      }
      const target = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      if (amount <= 0) return interaction.reply({ embeds: [new EmbedBuilder().setColor(0xFF5555).setTitle('❌ Invalid Amount!')], ephemeral: true });
      await Player.findOneAndUpdate({ userId: target.id }, { $setOnInsert: { username: target.username, primogems: 0, pity: 0, guaranteed: false, lastDaily: null, characters: [] } }, { upsert: true });
      const updated = await Player.findOneAndUpdate({ userId: target.id }, { $inc: { primogems: amount }, $set: { username: target.username } }, { new: true });
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x00FF00).setTitle('🎁 Primogems Gifted!')
          .setDescription(`Successfully gifted **${amount} 💎** to **${target.username}**!\n\n**Their New Balance:** ${updated.primogems} 💎`)
          .setThumbnail(target.displayAvatarURL())]
      });
    }

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
      let boughtToday = hoursSince >= 24 ? 0 : (player.boughtToday || 0);
      if (boughtToday + amount > BUY_LIMIT) {
        const remaining = BUY_LIMIT - boughtToday;
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0xFF5555).setTitle('❌ Daily Limit Exceeded!')
            .setDescription(`Max **${BUY_LIMIT} 💎** per 24 hours.\n\n**Bought today:** ${boughtToday} 💎\n**Still available:** ${remaining} 💎\n**Resets:** <t:${Math.floor((lastBuy.getTime() + 24 * 60 * 60 * 1000) / 1000)}:R>`)],
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
        embeds: [new EmbedBuilder().setColor(0x00FF00).setTitle('✅ Purchase Successful!')
          .setDescription(`You got **${amount} 💎 Primogems!**\n\n**New Balance:** ${updated.primogems} 💎\n**Bought Today:** ${updated.boughtToday} / ${BUY_LIMIT} 💎\n**Next Reset:** <t:${Math.floor(nextReset.getTime() / 1000)}:R>`)
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({ text: 'Use /pull to wish for characters!' })]
      });
    }

    if (name === 'avatar') {
      const target = interaction.options.getUser('user') || interaction.user;
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`🖼️ ${target.username}'s Avatar`).setImage(target.displayAvatarURL({ size: 512 }))] });
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
        embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`👤 ${target.username}`).setThumbnail(target.displayAvatarURL())
          .addFields(
            { name: '🆔 User ID', value: target.id, inline: true },
            { name: '🤖 Bot?', value: target.bot ? 'Yes' : 'No', inline: true },
            { name: '📅 Account Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:D>`, inline: true },
            { name: '📥 Joined Server', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : 'Unknown', inline: true }
          )]
      });
    }

    if (name === 'serverinfo') {
      const g = interaction.guild;
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`📊 ${g.name}`).setThumbnail(g.iconURL())
          .addFields(
            { name: '👑 Owner', value: `<@${g.ownerId}>`, inline: true },
            { name: '👥 Members', value: `${g.memberCount}`, inline: true },
            { name: '📺 Channels', value: `${g.channels.cache.size}`, inline: true },
            { name: '🎭 Roles', value: `${g.roles.cache.size}`, inline: true },
            { name: '🚀 Boosts', value: `${g.premiumSubscriptionCount ?? 0}`, inline: true },
            { name: '🆔 Server ID', value: g.id }
          )]
      });
    }

    if (name === 'roast') {
      const target = interaction.options.getUser('user');
      const roast = roasts[Math.floor(Math.random() * roasts.length)];
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xFF4500).setTitle(`🔥 Roasting ${target.username}...`)
          .setDescription(roast).setThumbnail(target.displayAvatarURL({ size: 256 }))
          .setFooter({ text: 'Just a joke, no harm intended 😄' })]
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
        embeds: [new EmbedBuilder().setColor(color).setTitle(`❤️ Love Meter`)
          .setDescription(`**${user1.username}** ❤️ **${user2.username}**\n\n**${percentage}% compatibility!**\n\n${message}`)
          .setThumbnail(user1.displayAvatarURL({ size: 256 }))]
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

client.on('messageCreate', message => {
  if (message.author.bot) return;

  const mentioned = message.mentions.users.first();

  if (mentioned && afkUsers.has(mentioned.id)) {
    const afk = afkUsers.get(mentioned.id);
    message.reply(`💤 ${mentioned.username} is AFK — ${afk.reason}`);
  }

  if (afkUsers.has(message.author.id)) {
    afkUsers.delete(message.author.id);
    message.reply('👋 Welcome back! AFK removed.');
  }
});

client.login(TOKEN);
