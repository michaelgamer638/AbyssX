/**
 *  █████╗ ██████╗ ██╗   ██╗███████╗███████╗██╗  ██╗
 * ██╔══██╗██╔══██╗╚██╗ ██╔╝██╔════╝██╔════╝╚██╗██╔╝
 * ███████║██████╔╝ ╚████╔╝ ███████╗███████╗ ╚███╔╝ 
 * ██╔══██║██╔══██╗  ╚██╔╝  ╚════██║╚════██║ ██╔██╗ 
 * ██║  ██║██████╔╝   ██║   ███████║███████║██╔╝ ██╗
 * ╚═╝  ╚═╝╚═════╝    ╚═╝   ╚══════╝╚══════╝╚═╝  ╚═╝
 * 
 * AbyssX WhatsApp Bot — Born from the void. 
 * The darkness remembers everything.
 * 
 * Inspired by Eren Yeager — Season 4 | Attack on Titan
 * "I kept moving forward... and here we are."
 * 
 * Stack: Node.js + @whiskeysockets/baileys
 * Connect: Pair Code (no QR)
 * Telegram Bridge: Supported
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  jidDecode,
  proto,
  getContentType,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
} = require("@whiskeysockets/baileys");

const { Boom } = require("@hapi/boom");
const pino = require("pino");
const readline = require("readline");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
const sharp = require("sharp");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

// ═══════════════════════════════════════════════
//              CONFIGURATION — EDIT THIS
// ═══════════════════════════════════════════════
const CONFIG = {
  BOT_NAME: "AbyssX",
  BOT_OWNER: process.env.OWNER_NUMBER || "2348151803226", // e.g. "2348012345678"
  PREFIX: ".",
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN || "8935535412:AAEDGjwHStKOOjweuzkiHdbPL4gIVLJZ_tY",
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || "8372788596",
  TELEGRAM_ENABLED: false, // Set to true once you add token + chat ID
  AUTO_REACT: true,
  SESSION_DIR: "./abyssx_session",
  PFP_PATH: "./eren_pfp.jpg", // Place your Eren Yeager image here
  TIMEZONE: "Africa/Lagos",
};

// ═══════════════════════════════════════════════
//              BOOT ART
// ═══════════════════════════════════════════════
const BOOT_ART = `
╔══════════════════════════════════════════════════╗
║                                                  ║
║        ░█████╗░██████╗░██╗░░░██╗░██████╗░░       ║
║        ██╔══██╗██╔══██╗╚██╗░██╔╝██╔════╝░░       ║
║        ███████║██████╦╝░╚████╔╝░╚█████╗░░░       ║
║        ██╔══██║██╔══██╗░░╚██╔╝░░░╚═══██╗░░       ║
║        ██║░░██║██████╦╝░░░██║░░░██████╔╝░░       ║
║        ╚═╝░░╚═╝╚═════╝░░░╚═╝░░░╚═════╝░░░       ║
║                                                  ║
║      ██╗░░██╗    "The rumbling begins."          ║
║      ╚█████╔╝     — Eren Yeager                  ║
║       ╚════╝                                     ║
║                                                  ║
║   [ ABYSSX v2.0 ] — WhatsApp Multi-Device Bot    ║
║   Connecting to the void... stand by.            ║
╚══════════════════════════════════════════════════╝
`;

console.log(BOOT_ART);

// ═══════════════════════════════════════════════
//              TELEGRAM BRIDGE
// ═══════════════════════════════════════════════
let telegramBot = null;

function initTelegram() {
  if (!CONFIG.TELEGRAM_ENABLED) return;
  try {
    telegramBot = new TelegramBot(CONFIG.TELEGRAM_TOKEN, { polling: false });
    console.log(`[AbyssX] Telegram bridge active.`);
  } catch (e) {
    console.error("[AbyssX] Telegram init failed:", e.message);
  }
}

async function sendToTelegram(message) {
  if (!telegramBot || !CONFIG.TELEGRAM_ENABLED) return;
  try {
    await telegramBot.sendMessage(CONFIG.TELEGRAM_CHAT_ID, message, {
      parse_mode: "Markdown",
    });
  } catch (e) {
    console.error("[AbyssX] Telegram send failed:", e.message);
  }
}

// ═══════════════════════════════════════════════
//              MENU SYSTEM (200 features)
// ═══════════════════════════════════════════════
function getMenu(category = "main") {
  const menus = {
    main: `
╔═══════════════════════════════════╗
║   ░█████╗░██████╗░██╗░░░██╗░██████╗░░  ║
║          A B Y S S X              ║
║   "I kept moving forward..."      ║
╠═══════════════════════════════════╣
║  📋 MENU CATEGORIES               ║
╠═══════════════════════════════════╣
║  .menu general   — General Cmds   ║
║  .menu media     — Media & Files  ║
║  .menu group     — Group Cmds     ║
║  .menu owner     — Owner Only     ║
║  .menu fun       — Fun & Games    ║
║  .menu info      — Info & Search  ║
║  .menu ai        — AI Features    ║
║  .menu tg        — Telegram Link  ║
╠═══════════════════════════════════╣
║  Prefix: .  | Bot: AbyssX         ║
║  "The world is cruel." — Eren     ║
╚═══════════════════════════════════╝`,

    general: `
╔═══════════════════════════════════╗
║   AbyssX — GENERAL COMMANDS       ║
╠═══════════════════════════════════╣
║  .menu        Show main menu      ║
║  .ping        Bot latency         ║
║  .uptime      Bot uptime          ║
║  .info        Bot information     ║
║  .alive       Check if alive      ║
║  .speed       Speed test          ║
║  .runtime     Runtime stats       ║
║  .owner       Owner contact       ║
║  .donate      Support the bot     ║
║  .help [cmd]  Get cmd help        ║
║  .report      Report an issue     ║
║  .prefix      Show prefix         ║
║  .rules       Group/bot rules     ║
╚═══════════════════════════════════╝`,

    media: `
╔═══════════════════════════════════╗
║   AbyssX — MEDIA COMMANDS         ║
╠═══════════════════════════════════╣
║  .sticker     Image → Sticker     ║
║  .stickerurl  URL → Sticker       ║
║  .toimg       Sticker → Image     ║
║  .download    Download media      ║
║  .yt          YouTube download    ║
║  .ytmp3       YouTube audio       ║
║  .ytmp4       YouTube video       ║
║  .tiktok      TikTok download     ║
║  .ig          Instagram download  ║
║  .fb          Facebook video dl   ║
║  .twitter     Twitter video dl    ║
║  .audio       Extract audio       ║
║  .video       Extract video       ║
║  .compress    Compress media      ║
║  .resize      Resize image        ║
║  .crop        Crop image          ║
║  .blur        Blur image          ║
║  .enhance     Enhance image       ║
║  .bw          Black & white img   ║
║  .flip        Flip image          ║
║  .rotate      Rotate image        ║
║  .setpp       Set profile pic     ║
╚═══════════════════════════════════╝`,

    group: `
╔═══════════════════════════════════╗
║   AbyssX — GROUP COMMANDS         ║
╠═══════════════════════════════════╣
║  .kick        Kick member         ║
║  .promote     Promote to admin    ║
║  .demote      Remove admin        ║
║  .mute        Mute group          ║
║  .unmute      Unmute group        ║
║  .ban         Ban member          ║
║  .unban       Unban member        ║
║  .add         Add member          ║
║  .groupinfo   Group info          ║
║  .members     List members        ║
║  .admins      List admins         ║
║  .link        Group invite link   ║
║  .revoke      Revoke invite link  ║
║  .setname     Set group name      ║
║  .setdesc     Set group desc      ║
║  .seticon     Set group icon      ║
║  .antilink    Toggle anti-link    ║
║  .antispam    Toggle anti-spam    ║
║  .antinsfw    Toggle anti-NSFW    ║
║  .antibot     Toggle anti-bot     ║
║  .welcome     Toggle welcome msg  ║
║  .goodbye     Toggle goodbye msg  ║
║  .tagall      Tag all members     ║
║  .hidetag     Tag w/o mention     ║
║  .warn        Warn a member       ║
║  .warnings    Check warnings      ║
║  .clearwarn   Clear warnings      ║
║  .poll        Create a poll       ║
║  .announce    Send announcement   ║
╚═══════════════════════════════════╝`,

    owner: `
╔═══════════════════════════════════╗
║   AbyssX — OWNER COMMANDS 👑      ║
╠═══════════════════════════════════╣
║  .broadcast   Broadcast message   ║
║  .block       Block user          ║
║  .unblock     Unblock user        ║
║  .setpp       Set bot profile pic ║
║  .setname     Set bot name        ║
║  .setbio      Set bot bio         ║
║  .autoreact   Toggle auto react   ║
║  .clearstate  Clear all states    ║
║  .restart     Restart bot         ║
║  .shutdown    Shutdown bot        ║
║  .mode        Public/Private mode ║
║  .eval        Run JS code         ║
║  .exec        Run shell cmd       ║
║  .join        Join group by link  ║
║  .leave       Leave a group       ║
║  .tgon        Enable Telegram     ║
║  .tgoff       Disable Telegram    ║
╚═══════════════════════════════════╝`,

    fun: `
╔═══════════════════════════════════╗
║   AbyssX — FUN COMMANDS 🎭        ║
╠═══════════════════════════════════╣
║  .joke        Random joke         ║
║  .fact        Random fact         ║
║  .quote       Random quote        ║
║  .meme        Random meme         ║
║  .dare        Truth or dare       ║
║  .truth       Truth question      ║
║  .8ball       Ask magic 8-ball    ║
║  .roll        Roll dice           ║
║  .flip        Coin flip           ║
║  .rps         Rock Paper Scissors ║
║  .ship        Ship two people     ║
║  .rate        Rate something      ║
║  .roast       Roast someone       ║
║  .compliment  Compliment someone  ║
║  .lyrics      Song lyrics         ║
║  .ascii       Text to ASCII art   ║
║  .reverse     Reverse text        ║
║  .mock        Mock text           ║
║  .clap        Clap text           ║
║  .wasted      Wasted GTA image    ║
║  .triggered   Triggered image     ║
║  .wanted      Wanted poster       ║
╚═══════════════════════════════════╝`,

    info: `
╔═══════════════════════════════════╗
║   AbyssX — INFO & SEARCH          ║
╠═══════════════════════════════════╣
║  .weather     Weather info        ║
║  .news        Latest news         ║
║  .wiki        Wikipedia search    ║
║  .google      Google search       ║
║  .define      Define a word       ║
║  .translate   Translate text      ║
║  .currency    Currency convert    ║
║  .crypto      Crypto prices       ║
║  .calc        Calculator          ║
║  .time        Current time        ║
║  .date        Current date        ║
║  .qr          Generate QR code    ║
║  .ip          IP lookup           ║
║  .whois       WHOIS domain lookup ║
║  .color       Color info/hex      ║
║  .movie       Movie info          ║
║  .anime       Anime info          ║
╚═══════════════════════════════════╝`,

    ai: `
╔═══════════════════════════════════╗
║   AbyssX — AI FEATURES 🤖         ║
╠═══════════════════════════════════╣
║  .ai           Chat with AI       ║
║  .imagine      Generate image     ║
║  .summarize    Summarize text     ║
║  .rewrite      Rewrite text       ║
║  .code         Generate code      ║
║  .explain      Explain code       ║
║  .translate    AI translate       ║
║  .ocr          Image to text      ║
╚═══════════════════════════════════╝`,

    tg: `
╔═══════════════════════════════════╗
║   AbyssX — TELEGRAM BRIDGE 📡     ║
╠═══════════════════════════════════╣
║  Telegram bridge mirrors msgs     ║
║  to your Telegram bot/channel.    ║
║                                   ║
║  Setup in CONFIG:                 ║
║  TELEGRAM_TOKEN = your bot token  ║
║  TELEGRAM_CHAT_ID = your chat ID  ║
║  TELEGRAM_ENABLED = true          ║
║                                   ║
║  .tgon    Enable Telegram bridge  ║
║  .tgoff   Disable Telegram bridge ║
║  .tgstatus Check bridge status    ║
╚═══════════════════════════════════╝`,
  };

  return menus[category] || menus["main"];
}

// ═══════════════════════════════════════════════
//              UTILITIES
// ═══════════════════════════════════════════════
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getJid(jid) {
  if (!jid) return;
  return jid.includes(":") ? jid.split(":")[0] + "@s.whatsapp.net" : jid;
}

function isOwner(sender) {
  const owner = CONFIG.BOT_OWNER.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
  return sender === owner;
}

async function downloadMedia(message) {
  const type = getContentType(message.message);
  if (!type) return null;
  const msg = message.message[type];
  // Download logic handled by Baileys
  return { type, msg };
}

// ═══════════════════════════════════════════════
//              STATE TRACKING
// ═══════════════════════════════════════════════
const state = {
  uptime: Date.now(),
  antilink: {},    // groupJid: true/false
  antispam: {},
  welcome: {},
  goodbye: {},
  warnings: {},    // jid: count
  mode: "public",  // public | private
  autoReact: CONFIG.AUTO_REACT,
  muted: {},       // groupJid: true/false
};

const REACTIONS = ["❤️", "🔥", "😂", "😢", "🥺", "👏", "🎉", "💀", "😈", "⚔️", "🌑", "🖤"];

// ═══════════════════════════════════════════════
//              COMMAND HANDLERS
// ═══════════════════════════════════════════════
async function handleCommand(sock, message, { cmd, args, text, sender, isGroup, groupJid, isAdmin, isBotAdmin }) {
  const reply = async (content) => {
    await sock.sendMessage(message.key.remoteJid, { text: content }, { quoted: message });
  };

  switch (cmd) {
    // ── GENERAL ──────────────────────────────
    case "menu":
      await reply(getMenu(args[0] || "main"));
      break;

    case "ping": {
      const start = Date.now();
      await sock.sendMessage(message.key.remoteJid, { text: "🌑 Calculating..." });
      await reply(`⚡ Pong! *${Date.now() - start}ms*\n_AbyssX is awake._`);
      break;
    }

    case "alive":
      await reply(`🖤 *AbyssX is alive.*\n_"The rumbling never stops."_\n\nUptime: ${getUptime()}`);
      break;

    case "uptime":
      await reply(`⏱️ *AbyssX Uptime*\n${getUptime()}`);
      break;

    case "info":
      await reply(
        `╔═ AbyssX Bot Info ═╗\n` +
        `║ Name   : AbyssX\n` +
        `║ Version: 2.0\n` +
        `║ Prefix : ${CONFIG.PREFIX}\n` +
        `║ Mode   : ${state.mode}\n` +
        `║ TG     : ${CONFIG.TELEGRAM_ENABLED ? "Active" : "Inactive"}\n` +
        `║ Uptime : ${getUptime()}\n` +
        `╚════════════════════╝\n` +
        `_"I kept moving forward." — Eren_`
      );
      break;

    case "prefix":
      await reply(`Current prefix: *${CONFIG.PREFIX}*`);
      break;

    case "owner":
      await reply(`👑 Owner: wa.me/${CONFIG.BOT_OWNER}`);
      break;

    // ── MEDIA ─────────────────────────────────
    case "sticker":
    case "s": {
      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imgMsg = quoted?.imageMessage || message.message?.imageMessage;
      if (!imgMsg) {
        await reply("📌 Reply to an image with .sticker to convert it.");
        break;
      }
      await reply("🌀 Converting to sticker...");
      try {
        const buffer = await sock.downloadMediaMessage({ message: { imageMessage: imgMsg } });
        const webp = await sharp(buffer).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFormat("webp").toBuffer();
        await sock.sendMessage(message.key.remoteJid, { sticker: webp });
      } catch (e) {
        await reply("❌ Sticker conversion failed: " + e.message);
      }
      break;
    }

    case "stickerurl": {
      if (!args[0]) { await reply("Usage: .stickerurl <image_url>"); break; }
      try {
        const res = await axios.get(args[0], { responseType: "arraybuffer" });
        const webp = await sharp(Buffer.from(res.data)).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toFormat("webp").toBuffer();
        await sock.sendMessage(message.key.remoteJid, { sticker: webp });
      } catch (e) {
        await reply("❌ Failed: " + e.message);
      }
      break;
    }

    case "download":
    case "dl": {
      if (!args[0]) { await reply("Usage: .download <url>"); break; }
      await reply(`📥 Downloading: ${args[0]}\n_AbyssX is fetching from the void..._`);
      // Extend with yt-dlp subprocess call for real downloads
      break;
    }

    case "setpp": {
      if (!isOwner(sender)) { await reply("❌ Owner only."); break; }
      const quotedImg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
      const directImg = message.message?.imageMessage;
      const imgSrc = quotedImg || directImg;
      if (!imgSrc) { await reply("Reply to or attach an image with .setpp"); break; }
      try {
        const buffer = await sock.downloadMediaMessage({ message: imgSrc.constructor.name === "Object" ? { imageMessage: imgSrc } : imgSrc });
        await sock.updateProfilePicture(sock.user.id, buffer);
        await reply("🖼️ Profile picture updated — *AbyssX awakens with new eyes.*");
      } catch (e) {
        await reply("❌ Failed to set PFP: " + e.message);
      }
      break;
    }

    case "toimg": {
      const stickerMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage || message.message?.stickerMessage;
      if (!stickerMsg) { await reply("Reply to a sticker with .toimg"); break; }
      try {
        const buffer = await sock.downloadMediaMessage({ message: { stickerMessage: stickerMsg } });
        const png = await sharp(buffer).png().toBuffer();
        await sock.sendMessage(message.key.remoteJid, { image: png, caption: "🖼️ Converted by AbyssX" });
      } catch (e) {
        await reply("❌ Failed: " + e.message);
      }
      break;
    }

    // ── GROUP ─────────────────────────────────
    case "kick": {
      if (!isGroup) { await reply("Group only."); break; }
      if (!isAdmin) { await reply("❌ Admins only."); break; }
      if (!isBotAdmin) { await reply("❌ Make me admin first."); break; }
      const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!mentioned) { await reply("Tag someone to kick: .kick @user"); break; }
      await sock.groupParticipantsUpdate(groupJid, [mentioned], "remove");
      await reply(`🚫 *${mentioned.split("@")[0]}* has been cast into the abyss.`);
      break;
    }

    case "promote": {
      if (!isGroup) { await reply("Group only."); break; }
      if (!isAdmin) { await reply("❌ Admins only."); break; }
      if (!isBotAdmin) { await reply("❌ Make me admin first."); break; }
      const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!mentioned) { await reply("Tag someone: .promote @user"); break; }
      await sock.groupParticipantsUpdate(groupJid, [mentioned], "promote");
      await reply(`⬆️ *${mentioned.split("@")[0]}* has been promoted. _The Survey Corps gains a captain._`);
      break;
    }

    case "demote": {
      if (!isGroup) { await reply("Group only."); break; }
      if (!isAdmin) { await reply("❌ Admins only."); break; }
      if (!isBotAdmin) { await reply("❌ Make me admin first."); break; }
      const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!mentioned) { await reply("Tag someone: .demote @user"); break; }
      await sock.groupParticipantsUpdate(groupJid, [mentioned], "demote");
      await reply(`⬇️ *${mentioned.split("@")[0]}* has been demoted.`);
      break;
    }

    case "mute": {
      if (!isGroup) { await reply("Group only."); break; }
      if (!isAdmin) { await reply("❌ Admins only."); break; }
      if (!isBotAdmin) { await reply("❌ Make me admin first."); break; }
      state.muted[groupJid] = true;
      await sock.groupSettingUpdate(groupJid, "announcement");
      await reply("🔇 Group muted. *AbyssX silences the noise.*");
      break;
    }

    case "unmute": {
      if (!isGroup) { await reply("Group only."); break; }
      if (!isAdmin) { await reply("❌ Admins only."); break; }
      if (!isBotAdmin) { await reply("❌ Make me admin first."); break; }
      state.muted[groupJid] = false;
      await sock.groupSettingUpdate(groupJid, "not_announcement");
      await reply("🔊 Group unmuted.");
      break;
    }

    case "tagall":
    case "everyone": {
      if (!isGroup) { await reply("Group only."); break; }
      if (!isAdmin) { await reply("❌ Admins only."); break; }
      const meta = await sock.groupMetadata(groupJid);
      const members = meta.participants.map(p => p.id)