require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits, 
  PermissionsBitField,
  SlashCommandBuilder,
  REST,
  Routes,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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
    .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true)),

  new SlashCommandBuilder().setName('ban').setDescription('Ban user')
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true)),

  new SlashCommandBuilder().setName('clear').setDescription('Clear messages')
    .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true)),

  new SlashCommandBuilder().setName('warn').setDescription('Warn user')
    .addUserOption(o => o.setName('user').setDescription('User to warn').setRequired(true)),

  new SlashCommandBuilder().setName('ping').setDescription('Check latency'),

  new SlashCommandBuilder().setName('avatar').setDescription('Show avatar')
    .addUserOption(o => o.setName('user').setDescription('User')),

  new SlashCommandBuilder().setName('userinfo').setDescription('User info')
    .addUserOption(o => o.setName('user').setDescription('User')),

  new SlashCommandBuilder().setName('serverinfo')
    .setDescription('Show server info'),

  new SlashCommandBuilder().setName('mute').setDescription('Timeout user')
    .addUserOption(o => o.setName('user').setDescription('User to mute').setRequired(true))
    .addIntegerOption(o => o.setName('minutes').setDescription('Minutes').setRequired(true)),

  new SlashCommandBuilder().setName('unmute').setDescription('Remove timeout')
    .addUserOption(o => o.setName('user').setDescription('User to unmute').setRequired(true)),

  new SlashCommandBuilder().setName('purge').setDescription('Delete messages')
    .addIntegerOption(o => o.setName('amount').setDescription('Amount').setRequired(true)),

  new SlashCommandBuilder().setName('setlog').setDescription('Set log channel')
    .addChannelOption(o => 
      o.setName('channel')
       .addChannelTypes(ChannelType.GuildText)
       .setDescription('Select log channel')
       .setRequired(true)
    ),

  new SlashCommandBuilder().setName('meme').setDescription('Random meme'),

  new SlashCommandBuilder().setName('coinflip').setDescription('Flip a coin'),

  new SlashCommandBuilder().setName('say').setDescription('Make bot say something')
    .addStringOption(o => o.setName('text').setDescription('Message').setRequired(true)),

  new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Create role button')
    .addRoleOption(o =>
      o.setName('role')
       .setDescription('Role to give')
       .setRequired(true)
    )
    .addStringOption(o =>
      o.setName('label')
       .setDescription('Button text')
       .setRequired(true)
    ),
];

// ===== REGISTER COMMANDS (INSTANT) =====
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    // 🧹 clear old broken commands
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [] }
    );

    // ✅ load fresh commands
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands.map(cmd => cmd.toJSON()) }
    );

    console.log("✅ Commands loaded instantly");
  } catch (err) {
    console.error(err);
  }
});

// ===== INTERACTIONS =====
client.on('interactionCreate', async interaction => {

  // BUTTONS (REACTION ROLE)
  if (interaction.isButton()) {
    const roleId = interaction.customId.split("_")[1];
    const role = interaction.guild.roles.cache.get(roleId);

    if (!role) return interaction.reply({ content: "Role not found", ephemeral: true });

    if (interaction.member.roles.cache.has(roleId)) {
      await interaction.member.roles.remove(roleId);
      return interaction.reply({ content: `❌ Removed ${role.name}`, ephemeral: true });
    } else {
      await interaction.member.roles.add(roleId);
      return interaction.reply({ content: `✅ Added ${role.name}`, ephemeral: true });
    }
  }

  if (!interaction.isChatInputCommand()) return;

  const name = interaction.commandName;
  const isMod = interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers);

  try {

    if (name === "reactionrole") {
      const role = interaction.options.getRole("role");
      const label = interaction.options.getString("label");

      const btn = new ButtonBuilder()
        .setCustomId(`rr_${role.id}`)
        .setLabel(label)
        .setStyle(ButtonStyle.Primary);

      return interaction.reply({
        content: "Click button to get/remove role:",
        components: [new ActionRowBuilder().addComponents(btn)]
      });
    }

    if (name === "serverinfo") {
      const g = interaction.guild;

      return interaction.reply({
        embeds: [{
          color: 0x5865F2,
          title: `📊 ${g.name}`,
          thumbnail: { url: g.iconURL() },
          fields: [
            { name: "👑 Owner", value: `<@${g.ownerId}>`, inline: true },
            { name: "👥 Members", value: `${g.memberCount}`, inline: true },
            { name: "📺 Channels", value: `${g.channels.cache.size}`, inline: true },
            { name: "🎭 Roles", value: `${g.roles.cache.size}`, inline: true },
            { name: "🚀 Boosts", value: `${g.premiumSubscriptionCount}`, inline: true },
            { name: "🆔 ID", value: g.id }
          ]
        }]
      });
    }

    if (name === "say") {
      return interaction.reply(interaction.options.getString("text"));
    }

    if (name === "ping") return interaction.reply(`🏓 ${client.ws.ping}ms`);

    if (name === "coinflip") return interaction.reply(Math.random() < 0.5 ? "Heads 🪙" : "Tails 🪙");

    if (name === "meme") {
      const res = await axios.get("https://meme-api.com/gimme");
      return interaction.reply(res.data.url);
    }

  } catch (err) {
    console.error(err);
    interaction.reply("❌ Error");
  }
});

client.login(TOKEN);
