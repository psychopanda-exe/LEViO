import { 
  Client, 
  GatewayIntentBits, 
  Collection, 
  Events, 
  REST, 
  Routes,
  EmbedBuilder,
  PermissionFlagsBits,
  Options
} from 'discord.js';
import { Player } from 'discord-player';
import db from '../lib/db';
import { askLevio } from '../lib/ai';
import { commands } from './commands';

export class LevioBot {
  public client: Client;
  public player: Player;
  private token: string;

  constructor(token: string) {
    this.token = token;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
      ],
      // Memory optimization: Limit caching
      makeCache: Options.cacheWithLimits({
        MessageManager: 10, // Only keep last 10 messages per channel
        StageInstanceManager: 0,
        ThreadManager: 0,
        ThreadMemberManager: 0,
        AutoModerationRuleManager: 0,
        GuildScheduledEventManager: 0,
        ReactionManager: 0,
        PresenceManager: 0, // We don't need presence tracking
      }),
    });

    this.player = new Player(this.client, {
      ytdlOptions: {
        quality: 'lowestaudio', // Use lower quality to save bandwidth and CPU
        highWaterMark: 1 << 25
      }
    });
    
    // Load default extractors
    this.player.extractors.loadDefault();
    
    // Player events for stability
    this.player.events.on('error', (queue, error) => {
      console.error(`[${queue.guild.name}] Error emitted from the queue: ${error.message}`);
    });
    this.player.events.on('playerError', (queue, error) => {
      console.error(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
    });
    
    this.setupEvents();
  }

  private async registerCommands() {
    const rest = new REST({ version: '10' }).setToken(this.token);
    try {
      console.log('Started refreshing application (/) commands.');
      await rest.put(
        Routes.applicationCommands(this.client.user!.id),
        { body: commands },
      );
      console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error('Error registering commands:', error);
    }
  }

  private setupEvents() {
    this.client.once(Events.ClientReady, async (c) => {
      console.log(`✅ LEViO is online as ${c.user.tag}`);
      await this.registerCommands();
    });

    this.client.on(Events.GuildCreate, (guild) => {
      console.log(`Joined new guild: ${guild.name} (${guild.id})`);
      db.prepare('INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)').run(guild.id);
    });

    this.client.on(Events.GuildMemberAdd, (member) => {
      this.trackStats(member.guild.id, 'new_members');
      // Potential welcome message logic here
    });

    this.client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot || !message.guild) return;

      // Track stats
      this.trackStats(message.guild.id, 'messages_sent');

      // Leveling System
      this.handleLeveling(message.author.id, message.guild.id);

      // Conversational trigger
      if (message.content.toLowerCase().includes('levio')) {
        const config = db.prepare('SELECT ai_enabled FROM guild_config WHERE guild_id = ?').get(message.guild.id) as any;
        if (config && config.ai_enabled === 0) return;

        const response = await askLevio(message.content);
        await message.reply(response || "I'm here! How can I help? ✨");
      }
    });

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      if (!interaction.guild) return interaction.reply("Commands can only be used in servers!");

      const { commandName, guildId, user } = interaction;
      this.trackStats(guildId, 'commands_used');

      try {
        if (commandName === 'ping') {
          await interaction.reply(`Pong! 🏓 Latency: ${this.client.ws.ping}ms`);
        }

        if (commandName === 'ask') {
          const prompt = interaction.options.getString('prompt', true);
          await interaction.deferReply();
          const response = await askLevio(prompt);
          await interaction.editReply(response || "I'm not sure how to answer that.");
        }

        if (commandName === 'balance') {
          const userData = db.prepare('SELECT balance FROM users WHERE user_id = ? AND guild_id = ?').get(user.id, guildId) as any;
          const balance = userData?.balance || 100;
          await interaction.reply(`💰 Your current balance in **${interaction.guild.name}** is **${balance}** LEViO coins.`);
        }

        if (commandName === 'rank') {
          const userData = db.prepare('SELECT level, xp FROM users WHERE user_id = ? AND guild_id = ?').get(user.id, guildId) as any;
          if (!userData) return interaction.reply("You haven't started chatting yet!");
          
          const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s Rank`)
            .setColor('#141414')
            .addFields(
              { name: 'Level', value: userData.level.toString(), inline: true },
              { name: 'XP', value: userData.xp.toString(), inline: true }
            )
            .setThumbnail(user.displayAvatarURL());
          
          await interaction.reply({ embeds: [embed] });
        }

        if (commandName === 'kick') {
          const target = interaction.options.getMember('target') as any;
          const reason = interaction.options.getString('reason') || 'No reason provided';
          
          if (!target.kickable) return interaction.reply("I can't kick this user!");
          await target.kick(reason);
          await interaction.reply(`✅ **${target.user.tag}** has been kicked. Reason: ${reason}`);
        }

        if (commandName === 'ban') {
          const target = interaction.options.getMember('target') as any;
          const reason = interaction.options.getString('reason') || 'No reason provided';
          
          if (!target.bannable) return interaction.reply("I can't ban this user!");
          await target.ban({ reason });
          await interaction.reply(`🚫 **${target.user.tag}** has been banned. Reason: ${reason}`);
        }

        if (commandName === 'clear') {
          const amount = interaction.options.getInteger('amount', true);
          await interaction.channel?.messages.fetch({ limit: amount }).then(messages => {
            (interaction.channel as any).bulkDelete(messages);
          });
          await interaction.reply({ content: `🧹 Cleared **${amount}** messages.`, ephemeral: true });
        }

        if (commandName === 'play') {
          const query = interaction.options.getString('query', true);
          const member = interaction.member as any;
          if (!member.voice.channel) return interaction.reply("You need to be in a voice channel! 🎵");

          await interaction.deferReply();
          const { track } = await this.player.play(member.voice.channel, query, {
            nodeOptions: { metadata: interaction }
          });
          await interaction.editReply(`🎶 Added **${track.title}** to the queue!`);
        }

        if (commandName === 'stop') {
          this.player.nodes.get(guildId)?.delete();
          await interaction.reply("⏹️ Music stopped and queue cleared.");
        }

        if (commandName === 'skip') {
          const queue = this.player.nodes.get(guildId);
          if (queue && queue.isPlaying()) {
            queue.node.skip();
            await interaction.reply("⏭️ Skipped to the next song.");
          } else {
            await interaction.reply("❌ Nothing is playing right now!");
          }
        }

      } catch (error) {
        console.error(`Error executing ${commandName}:`, error);
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply("❌ An error occurred while executing this command.");
        } else {
          await interaction.reply({ content: "❌ An error occurred while executing this command.", ephemeral: true });
        }
      }
    });
  }

  private trackStats(guildId: string, type: 'messages_sent' | 'commands_used' | 'new_members') {
    const date = new Date().toISOString().split('T')[0];
    const exists = db.prepare('SELECT 1 FROM server_stats WHERE guild_id = ? AND date = ?').get(guildId, date);
    
    if (!exists) {
      db.prepare('INSERT INTO server_stats (guild_id, date, ' + type + ') VALUES (?, ?, 1)').run(guildId, date);
    } else {
      db.prepare('UPDATE server_stats SET ' + type + ' = ' + type + ' + 1 WHERE guild_id = ? AND date = ?').run(guildId, date);
    }
  }

  private handleLeveling(userId: string, guildId: string) {
    const user = db.prepare('SELECT * FROM users WHERE user_id = ? AND guild_id = ?').get(userId, guildId) as any;
    if (!user) {
      db.prepare('INSERT INTO users (user_id, guild_id, xp, level, balance) VALUES (?, ?, ?, ?, ?)').run(userId, guildId, 5, 1, 100);
    } else {
      const newXp = user.xp + 5;
      const nextLevel = Math.floor(0.1 * Math.sqrt(newXp)) + 1;
      
      if (nextLevel > user.level) {
        db.prepare('UPDATE users SET xp = ?, level = ?, balance = balance + 50 WHERE user_id = ? AND guild_id = ?').run(newXp, nextLevel, userId, guildId);
      } else {
        db.prepare('UPDATE users SET xp = ? WHERE user_id = ? AND guild_id = ?').run(newXp, userId, guildId);
      }
    }
  }

  public async start() {
    if (!this.token || this.token === 'YOUR_DISCORD_TOKEN') {
      console.warn("⚠️ Discord Token not provided. Bot will not start.");
      return;
    }
    try {
      await this.client.login(this.token);
    } catch (error) {
      console.error("❌ Failed to login to Discord:", error);
    }
  }
}
