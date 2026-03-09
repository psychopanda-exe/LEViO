import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const commands = [
  // General
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot\'s latency'),
  
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands'),

  // AI Chat
  new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask LEViO anything')
    .addStringOption(option => 
      option.setName('prompt')
        .setDescription('Your question for LEViO')
        .setRequired(true)),

  // Economy
  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your LEViO coin balance'),
  
  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward'),

  // Leveling
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your current level and XP'),

  // Music
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song in your voice channel')
    .addStringOption(option => 
      option.setName('query')
        .setDescription('The song name or URL')
        .setRequired(true)),
  
  new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),
  
  new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),

  // Moderation
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(option => option.setName('target').setDescription('The member to kick').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for the kick'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(option => option.setName('target').setDescription('The member to ban').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for the ban'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear a specific amount of messages')
    .addIntegerOption(option => option.setName('amount').setDescription('Number of messages to clear').setMinValue(1).setMaxValue(100).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
].map(command => command.toJSON());
