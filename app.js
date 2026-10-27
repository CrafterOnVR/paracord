/**
 * Paracord Web: Discord Client
 * Clean Discord experience with:
 * - Direct Messages (DMs) by default
 * - Zero pre-populated random servers or fake users
 * - Create a server from scratch
 * - Import real Discord server settings & emojis (server_config.json)
 * - Anti-screenshot protections & ephemeral self-destructing messages
 */

// Application State with LocalStorage Persistence
const state = {
  isUnlocked: false,
  activeView: "dm", // "dm" or "server"
  activeServerId: null,
  activeChannelId: null,
  activeDmId: null,
  burnDuration: 0, // 0 = Off, 15, 30, 60

  // Stored in localStorage
  servers: [],
  dms: [],
  messages: {}
};

// Load saved data or start clean
function loadPersistedData() {
  try {
    const savedServers = localStorage.getItem("paracord_servers");
    if (savedServers) state.servers = JSON.parse(savedServers);

    const savedDms = localStorage.getItem("paracord_dms");
    if (savedDms) state.dms = JSON.parse(savedDms);

    const savedMessages = localStorage.getItem("paracord_messages");
    if (savedMessages) state.messages = JSON.parse(savedMessages);
  } catch (e) {
    console.warn("Storage load error:", e);
  }
}

function persistData() {
  try {
    localStorage.setItem("paracord_servers", JSON.stringify(state.servers));
    localStorage.setItem("paracord_dms", JSON.stringify(state.dms));
    localStorage.setItem("paracord_messages", JSON.stringify(state.messages));
  } catch (e) {
    console.warn("Storage save error:", e);
  }
}

// DOM References
const lockScreen = document.getElementById("lockScreen");
const appContainer = document.getElementById("appContainer");
const privacyShield = document.getElementById("privacyShield");
const gateError = document.getElementById("gateError");
const footerHardwareId = document.getElementById("footerHardwareId");

// Left Rail & Sidebars
const btnHomeDM = document.getElementById("btnHomeDM");
const serverRailList = document.getElementById("serverRailList");
const btnAddServerModal = document.getElementById("btnAddServerModal");
const configFileInput = document.getElementById("configFileInput");

const dmSidebarContent = document.getElementById("dmSidebarContent");
const serverSidebarContent = document.getElementById("serverSidebarContent");
const btnFriendsTab = document.getElementById("btnFriendsTab");
const btnNewDm = document.getElementById("btnNewDm");
const dmList = document.getElementById("dmList");

const serverName = document.getElementById("serverName");
const channelList = document.getElementById("channelList");

// Main Views
const homeFriendsPane = document.getElementById("homeFriendsPane");
const activeChatPane = document.getElementById("activeChatPane");
const topbarIcon = document.getElementById("topbarIcon");
const currentChannelName = document.getElementById("currentChannelName");
const currentChannelTopic = document.getElementById("currentChannelTopic");
const messagesFeed = document.getElementById("messagesFeed");

// Input Bar
const messageInput = document.getElementById("messageInput");
const btnBurnTimer = document.getElementById("btnBurnTimer");
const burnTimerLabel = document.getElementById("burnTimerLabel");
const btnToggleEmoji = document.getElementById("btnToggleEmoji");
const emojiPickerTray = document.getElementById("emojiPickerTray");
const btnCloseEmojiTray = document.getElementById("btnCloseEmojiTray");
const emojiGrid = document.getElementById("emojiGrid");

// Dashboard Buttons
const btnActionCreateServer = document.getElementById("btnActionCreateServer");
const btnActionImportServer = document.getElementById("btnActionImportServer");
const btnOpenAddServer = document.getElementById("btnOpenAddServer");

// Server Create / Import Modal
const addServerModal = document.getElementById("addServerModal");
const modalStepChoice = document.getElementById("modalStepChoice");
const modalStepCreateForm = document.getElementById("modalStepCreateForm");
const modalStepImportForm = document.getElementById("modalStepImportForm");
const btnChooseCreateMyOwn = document.getElementById("btnChooseCreateMyOwn");
const btnChooseImport = document.getElementById("btnChooseImport");
const btnCloseServerModal = document.getElementById("btnCloseServerModal");
const btnBackToChoiceA = document.getElementById("btnBackToChoiceA");
const btnBackToChoiceB = document.getElementById("btnBackToChoiceB");
const inputNewServerName = document.getElementById("inputNewServerName");
const btnConfirmCreateServer = document.getElementById("btnConfirmCreateServer");
const importDropzone = document.getElementById("importDropzone");
const modalConfigFileInput = document.getElementById("modalConfigFileInput");
const importJsonTextarea = document.getElementById("importJsonTextarea");
const btnConfirmImportJson = document.getElementById("btnConfirmImportJson");

// DM Modal
const newDmModal = document.getElementById("newDmModal");
const inputDmUsername = document.getElementById("inputDmUsername");
const btnCloseDmModal = document.getElementById("btnCloseDmModal");
const btnConfirmCreateDm = document.getElementById("btnConfirmCreateDm");

// Covert D.M.S. Modal
const btnDms = document.getElementById("btnDms");
const btnDmsHome = document.getElementById("btnDmsHome");
const dmsModal = document.getElementById("dmsModal");
const btnHoldNuke = document.getElementById("btnHoldNuke");
const btnCancelDms = document.getElementById("btnCancelDms");
const dmsProgressRing = document.getElementById("dmsProgressRing");
const dmsPercent = document.getElementById("dmsPercent");
const dmsStatusText = document.getElementById("dmsStatusText");

const HASH_ICON_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M5.88 20.5l.84-4.5H3.1l.38-2h3.84l.94-5H4.64l.38-2h3.84l.84-4.5h2.08l-.84 4.5h4.94l.84-4.5h2.08l-.84 4.5h3.62l-.38 2h-3.84l-.94 5h3.62l-.38 2h-3.84l-.84 4.5h-2.08l.84-4.5H9.68l-.84 4.5H6.76zM11.76 14h4.94l.94-5h-4.94l-.94 5z"/></svg>`;
const VOLUME_ICON_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
const AT_ICON_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>`;

// ========================================================
// 1. SILENT OPSEC & ANTI-SCREENSHOT DEFENSE
// ========================================================
function initOpSecProtections() {
  window.addEventListener("keyup", (e) => {
    if (e.key === "PrintScreen" || e.keyCode === 44) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText("");
        }
      } catch (err) {}
    }
  });

  window.addEventListener("blur", () => {
    if (state.isUnlocked) privacyShield.classList.remove("hidden");
  });

  window.addEventListener("focus", () => {
    privacyShield.classList.add("hidden");
  });

  privacyShield.addEventListener("click", () => {
    privacyShield.classList.add("hidden");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.isUnlocked) {
      privacyShield.classList.remove("hidden");
    } else {
      privacyShield.classList.add("hidden");
    }
  });

  window.addEventListener("keydown", (e) => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
      (e.ctrlKey && (e.key === "u" || e.key === "U" || e.key === "s" || e.key === "S"))
    ) {
      e.preventDefault();
      return false;
    }
  });
}

// ========================================================
// 2. AUTHENTIC DISCORD LOGIN / PASSKEY
// ========================================================
async function authenticateBiometric() {
  gateError.classList.add("hidden");

  if (!window.PublicKeyCredential) {
    unlockSession();
    return;
  }

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: { name: "Discord", id: window.location.hostname || "localhost" },
      user: {
        id: Uint8Array.from("USER_ID", c => c.charCodeAt(0)),
        name: "CrafterOnVR",
        displayName: "CrafterOnVR"
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "preferred"
      },
      timeout: 30000
    };

    await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });
    unlockSession();
  } catch (err) {
    console.warn("Passkey cancelled or not supported, unlocking directly:", err);
    unlockSession();
  }
}

function unlockSession() {
  state.isUnlocked = true;
  lockScreen.classList.add("hidden");
  appContainer.classList.remove("hidden");
  renderApp();
}

function lockSession(msg) {
  state.isUnlocked = false;
  appContainer.classList.add("hidden");
  lockScreen.classList.remove("hidden");
  if (msg) {
    gateError.textContent = msg;
    gateError.classList.remove("hidden");
  }
}

// ========================================================
// 3. NAVIGATION: SWITCH BETWEEN DMs AND SERVERS
// ========================================================
function renderApp() {
  renderServerRail();
  renderDmList();

  if (state.activeView === "dm") {
    // Show DM Sidebar, hide server sidebar
    btnHomeDM.classList.add("active");
    dmSidebarContent.classList.remove("hidden");
    serverSidebarContent.classList.add("hidden");

    if (state.activeDmId) {
      homeFriendsPane.classList.add("hidden");
      activeChatPane.classList.remove("hidden");
      renderDmChat();
    } else {
      homeFriendsPane.classList.remove("hidden");
      activeChatPane.classList.add("hidden");
    }
  } else {
    // Show Server View
    btnHomeDM.classList.remove("active");
    dmSidebarContent.classList.add("hidden");
    serverSidebarContent.classList.remove("hidden");

    homeFriendsPane.classList.add("hidden");
    activeChatPane.classList.remove("hidden");
    renderServerChannels();
    renderChannelChat();
  }
}

function renderServerRail() {
  serverRailList.innerHTML = "";

  state.servers.forEach(server => {
    const item = document.createElement("div");
    const isActive = state.activeView === "server" && state.activeServerId === server.id;
    item.className = `server-rail-item ${isActive ? "active" : ""}`;
    item.title = server.name;

    const initials = (server.name || "SV")
      .split(" ")
      .map(w => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();

    item.innerHTML = `
      <div class="pill-indicator"></div>
      <div class="server-btn">${initials}</div>
    `;

    item.addEventListener("click", () => {
      state.activeView = "server";
      state.activeServerId = server.id;
      // Default to first text channel
      const firstTextChannel = (server.channels || []).find(c => c.type === 0);
      state.activeChannelId = firstTextChannel ? firstTextChannel.id : null;
      renderApp();
    });

    serverRailList.appendChild(item);
  });
}

function renderDmList() {
  dmList.innerHTML = "";

  if (state.dms.length === 0) {
    return;
  }

  state.dms.forEach(dm => {
    const item = document.createElement("div");
    const isActive = state.activeView === "dm" && state.activeDmId === dm.id;
    item.className = `channel-item dm-item ${isActive ? "active" : ""}`;
    item.innerHTML = `
      <div class="dm-avatar">${dm.recipientName.charAt(0).toUpperCase()}</div>
      <span>${dm.recipientName}</span>
    `;

    item.addEventListener("click", () => {
      state.activeView = "dm";
      state.activeDmId = dm.id;
      renderApp();
    });

    dmList.appendChild(item);
  });
}

function renderServerChannels() {
  const currentServer = state.servers.find(s => s.id === state.activeServerId);
  if (!currentServer) return;

  serverName.textContent = currentServer.name;
  channelList.innerHTML = "";

  const categories = (currentServer.channels || []).filter(c => c.type === 4);
  const textChannels = (currentServer.channels || []).filter(c => c.type === 0);
  const voiceChannels = (currentServer.channels || []).filter(c => c.type === 2);

  if (categories.length === 0) {
    const catLabel = document.createElement("div");
    catLabel.className = "channel-category";
    catLabel.innerHTML = `
      <svg viewBox="0 0 18 18"><path fill="currentColor" d="M4.5 6.75l4.5 4.5 4.5-4.5"/></svg>
      <span>TEXT CHANNELS</span>
    `;
    channelList.appendChild(catLabel);
    textChannels.forEach(c => appendServerChannelItem(c));
  } else {
    categories.forEach(cat => {
      const catLabel = document.createElement("div");
      catLabel.className = "channel-category";
      catLabel.innerHTML = `
        <svg viewBox="0 0 18 18"><path fill="currentColor" d="M4.5 6.75l4.5 4.5 4.5-4.5"/></svg>
        <span>${cat.name.toUpperCase()}</span>
      `;
      channelList.appendChild(catLabel);

      const subChannels = textChannels.filter(c => c.parent_id === cat.id);
      subChannels.forEach(c => appendServerChannelItem(c));
    });
  }

  if (voiceChannels.length > 0) {
    const voiceCat = document.createElement("div");
    voiceCat.className = "channel-category";
    voiceCat.innerHTML = `
      <svg viewBox="0 0 18 18"><path fill="currentColor" d="M4.5 6.75l4.5 4.5 4.5-4.5"/></svg>
      <span>VOICE CHANNELS</span>
    `;
    channelList.appendChild(voiceCat);

    voiceChannels.forEach(vc => {
      const vItem = document.createElement("div");
      vItem.className = "channel-item";
      vItem.innerHTML = `
        ${VOLUME_ICON_SVG}
        <span>${vc.name}</span>
      `;
      channelList.appendChild(vItem);
    });
  }

  renderServerEmojiGrid(currentServer);
}

function appendServerChannelItem(channel) {
  const item = document.createElement("div");
  item.className = `channel-item ${channel.id === state.activeChannelId ? "active" : ""}`;
  item.innerHTML = `
    ${HASH_ICON_SVG}
    <span>${channel.name}</span>
  `;
  item.addEventListener("click", () => {
    state.activeChannelId = channel.id;
    renderApp();
  });
  channelList.appendChild(item);
}

// ========================================================
// 4. CHAT RENDERING (NO FAKE PEOPLE, ONLY USER MESSAGES)
// ========================================================
function renderChannelChat() {
  const currentServer = state.servers.find(s => s.id === state.activeServerId);
  if (!currentServer) return;

  const currentChannel = (currentServer.channels || []).find(c => c.id === state.activeChannelId);
  const chName = currentChannel ? currentChannel.name : "general";
  const chTopic = currentChannel ? (currentChannel.topic || `Welcome to the start of #${chName}!`) : "";

  topbarIcon.innerHTML = `<path d="M5.88 20.5l.84-4.5H3.1l.38-2h3.84l.94-5H4.64l.38-2h3.84l.84-4.5h2.08l-.84 4.5h4.94l.84-4.5h2.08l-.84 4.5h3.62l-.38 2h-3.84l-.94 5h3.62l-.38 2h-3.84l-.84 4.5h-2.08l.84-4.5H9.68l-.84 4.5H6.76zM11.76 14h4.94l.94-5h-4.94l-.94 5z"/>`;
  currentChannelName.textContent = chName;
  currentChannelTopic.textContent = chTopic;
  messageInput.placeholder = `Message #${chName}`;

  messagesFeed.innerHTML = "";

  // Authentic clean channel welcome banner
  const banner = document.createElement("div");
  banner.className = "channel-welcome-banner";
  banner.innerHTML = `
    <div class="banner-hash">#</div>
    <h1>Welcome to #${chName}!</h1>
    <p>${chTopic}</p>
  `;
  messagesFeed.appendChild(banner);

  const channelMessages = state.messages[state.activeChannelId] || [];
  channelMessages.forEach(msg => {
    messagesFeed.appendChild(createMessageRowElement(msg, currentServer.emojis || []));
  });

  messagesFeed.scrollTop = messagesFeed.scrollHeight;
}

function renderDmChat() {
  const dm = state.dms.find(d => d.id === state.activeDmId);
  if (!dm) return;

  topbarIcon.innerHTML = `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>`;
  currentChannelName.textContent = `@${dm.recipientName}`;
  currentChannelTopic.textContent = `Direct Message with ${dm.recipientName}. All messages are private.`;
  messageInput.placeholder = `Message @${dm.recipientName}`;

  messagesFeed.innerHTML = "";

  // Authentic DM welcome banner
  const banner = document.createElement("div");
  banner.className = "channel-welcome-banner";
  banner.innerHTML = `
    <div class="banner-hash">@</div>
    <h1>${dm.recipientName}</h1>
    <p>This is the beginning of your direct message history with <strong>${dm.recipientName}</strong>.</p>
  `;
  messagesFeed.appendChild(banner);

  const dmMessages = state.messages[dm.id] || [];
  dmMessages.forEach(msg => {
    messagesFeed.appendChild(createMessageRowElement(msg, []));
  });

  messagesFeed.scrollTop = messagesFeed.scrollHeight;
}

function createMessageRowElement(msg, emojis) {
  const row = document.createElement("div");
  row.className = "message-row";

  let emojiHtml = "";
  if (!msg.isBurned && emojis.length > 0) {
    emojis.forEach(em => {
      if (msg.content.includes(em.tag)) {
        emojiHtml += `<img src="${em.file}" alt="${em.name}" class="msg-emoji-img" title="${em.tag}">`;
      }
    });
  }

  const initial = msg.authorName ? msg.authorName.charAt(0).toUpperCase() : "U";
  row.innerHTML = `
    <div class="msg-avatar" style="background-color: ${msg.authorColor || '#5865F2'}; color: white;">
      ${initial}
    </div>
    <div class="msg-content-wrapper">
      <div class="msg-header">
        <span class="author-name" style="color: ${msg.authorColor || '#F2F3F5'}">${msg.authorName}</span>
        ${msg.roleName ? `<span class="role-badge" style="background: ${msg.authorColor}22; color: ${msg.authorColor}">${msg.roleName}</span>` : ""}
        <span class="msg-time">${msg.timestamp}</span>
      </div>
      ${msg.burnTimerSeconds > 0 && !msg.isBurned ? `
        <div class="burn-indicator">
          <span>🔥</span> Message disappears in ${msg.remainingSeconds}s
        </div>
      ` : ""}
      <div class="msg-text ${msg.isBurned ? "burned" : ""}">${escapeHtml(msg.content)}</div>
      ${emojiHtml ? `<div class="msg-emojis-row">${emojiHtml}</div>` : ""}
    </div>
  `;
  return row;
}

// 1-Second Ephemeral Ticker
setInterval(() => {
  let needsReRender = false;
  Object.values(state.messages).forEach(list => {
    list.forEach(msg => {
      if (msg.burnTimerSeconds > 0 && !msg.isBurned) {
        if (msg.remainingSeconds > 1) {
          msg.remainingSeconds -= 1;
          needsReRender = true;
        } else {
          msg.remainingSeconds = 0;
          msg.isBurned = true;
          msg.content = "[Message expired]";
          needsReRender = true;
        }
      }
    });
  });

  if (needsReRender && state.isUnlocked) {
    persistData();
    if (state.activeView === "server") renderChannelChat();
    else if (state.activeView === "dm" && state.activeDmId) renderDmChat();
  }
}, 1000);

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const targetId = state.activeView === "server" ? state.activeChannelId : state.activeDmId;
  if (!targetId) return;

  const currentList = state.messages[targetId] || [];
  const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  currentList.push({
    id: `msg_${Date.now()}`,
    authorName: "CrafterOnVR",
    authorColor: "#5865F2",
    roleName: state.activeView === "server" ? "Owner" : null,
    content: text,
    timestamp: `Today at ${now}`,
    burnTimerSeconds: state.burnDuration,
    remainingSeconds: state.burnDuration,
    isBurned: false
  });

  state.messages[targetId] = currentList;
  persistData();
  messageInput.value = "";

  if (state.activeView === "server") renderChannelChat();
  else renderDmChat();
}

// ========================================================
// 5. SERVER CREATION & IMPORTING (CUSTOM DISCORD EXPORT)
// ========================================================
function createNewServer(name) {
  const sName = name.trim() || "My Server";
  const newId = `srv_${Date.now()}`;
  const defaultChannelId = `ch_${Date.now()}_gen`;

  const newServer = {
    id: newId,
    name: sName,
    channels: [
      { id: defaultChannelId, name: "general", type: 0, topic: "General chat and hangouts.", parent_id: null },
      { id: `ch_${Date.now()}_vc`, name: "General Voice", type: 2, topic: "", parent_id: null }
    ],
    roles: [
      { name: "Owner", color: "#5865F2" }
    ],
    emojis: []
  };

  state.servers.push(newServer);
  persistData();

  // Switch to newly created server
  state.activeView = "server";
  state.activeServerId = newId;
  state.activeChannelId = defaultChannelId;
  renderApp();
}

function importDiscordServerConfig(configJson) {
  try {
    let parsed = typeof configJson === "string" ? JSON.parse(configJson) : configJson;

    const newId = parsed.guild_id || `srv_${Date.now()}`;
    const sName = parsed.name || "Imported Server";

    // Channels
    const channels = (parsed.channels || []).map((c, i) => ({
      id: c.id || `ch_${Date.now()}_${i}`,
      name: c.name || `channel-${i}`,
      type: typeof c.type === "number" ? c.type : 0,
      topic: c.topic || "",
      parent_id: c.parent_id || null
    }));

    // If no text channels were parsed, provide a general one
    if (!channels.some(c => c.type === 0)) {
      channels.unshift({ id: `ch_${Date.now()}_gen`, name: "general", type: 0, topic: "General discussions.", parent_id: null });
    }

    const newServer = {
      id: newId,
      name: sName,
      channels: channels,
      roles: parsed.roles || [],
      emojis: parsed.emojis || []
    };

    // Remove existing server with same ID if updating
    state.servers = state.servers.filter(s => s.id !== newId);
    state.servers.push(newServer);
    persistData();

    // Switch to imported server
    state.activeView = "server";
    state.activeServerId = newId;
    const firstTextChannel = channels.find(c => c.type === 0);
    state.activeChannelId = firstTextChannel ? firstTextChannel.id : channels[0].id;

    closeAllModals();
    renderApp();
  } catch (err) {
    alert("Invalid server_config.json file. Please check the JSON format.");
    console.error("Import error:", err);
  }
}

function renderServerEmojiGrid(currentServer) {
  emojiGrid.innerHTML = "";
  const emojis = currentServer.emojis || [];
  if (emojis.length === 0) {
    emojiGrid.innerHTML = `<span style="color: #949BA4; font-size: 12px;">No custom emojis in this server.</span>`;
    return;
  }

  emojis.forEach(emoji => {
    const btn = document.createElement("div");
    btn.className = "emoji-btn";
    btn.title = emoji.tag || `:${emoji.name}:`;
    btn.innerHTML = `<img src="${emoji.file}" alt="${emoji.name}">`;
    btn.addEventListener("click", () => {
      messageInput.value += ` ${emoji.tag || `:${emoji.name}:`} `;
      messageInput.focus();
    });
    emojiGrid.appendChild(btn);
  });
}

// ========================================================
// 6. CLEAR SESSION / CACHE (COVERT D.M.S.)
// ========================================================
let dmsHoldStartTime = null;
let dmsHoldAnimationId = null;
const DMS_REQUIRED_DURATION = 3000;
const RING_CIRCUMFERENCE = 2 * Math.PI * 34; // 213.628

function startDmsHold() {
  dmsHoldStartTime = Date.now();
  animateDmsRing();
}

function animateDmsRing() {
  if (!dmsHoldStartTime) return;

  const elapsed = Date.now() - dmsHoldStartTime;
  const progress = Math.min(elapsed / DMS_REQUIRED_DURATION, 1.0);
  const offset = RING_CIRCUMFERENCE * (1 - progress);

  dmsProgressRing.style.strokeDashoffset = offset;
  dmsPercent.textContent = `${Math.floor(progress * 100)}%`;

  const remaining = Math.max((DMS_REQUIRED_DURATION - elapsed) / 1000, 0).toFixed(1);
  dmsStatusText.textContent = `Clearing session in ${remaining}s...`;

  if (elapsed >= DMS_REQUIRED_DURATION) {
    cancelDmsHold();
    executeDeadMansSwitch();
  } else {
    dmsHoldAnimationId = requestAnimationFrame(animateDmsRing);
  }
}

function cancelDmsHold() {
  if (dmsHoldStartTime) {
    dmsHoldStartTime = null;
    cancelAnimationFrame(dmsHoldAnimationId);
    dmsProgressRing.style.strokeDashoffset = RING_CIRCUMFERENCE;
    dmsPercent.textContent = "0%";
    dmsStatusText.textContent = "Hold the button for 3 seconds to confirm.";
  }
}

function executeDeadMansSwitch() {
  state.servers = [];
  state.dms = [];
  state.messages = {};
  state.activeServerId = null;
  state.activeChannelId = null;
  state.activeDmId = null;

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {}

  dmsModal.classList.add("hidden");
  lockSession("Session cleared. All local caches and servers wiped.");
}

function closeAllModals() {
  addServerModal.classList.add("hidden");
  newDmModal.classList.add("hidden");
  dmsModal.classList.add("hidden");
  modalStepChoice.classList.remove("hidden");
  modalStepCreateForm.classList.add("hidden");
  modalStepImportForm.classList.add("hidden");
}

// ========================================================
// 7. EVENT LISTENERS
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
  loadPersistedData();
  initOpSecProtections();

  // Login
  document.getElementById("btnUnlockBiometric").addEventListener("click", authenticateBiometric);
  document.getElementById("btnBypassTest").addEventListener("click", unlockSession);
  document.getElementById("btnUserSettings").addEventListener("click", () => lockSession());

  // Direct Messages Home Click
  btnHomeDM.addEventListener("click", () => {
    state.activeView = "dm";
    state.activeServerId = null;
    state.activeDmId = null;
    renderApp();
  });
  btnFriendsTab.addEventListener("click", () => {
    state.activeView = "dm";
    state.activeDmId = null;
    renderApp();
  });

  // Open "Create or Import Server" Modal
  const openServerModal = () => {
    closeAllModals();
    modalStepChoice.classList.remove("hidden");
    modalStepCreateForm.classList.add("hidden");
    modalStepImportForm.classList.add("hidden");
    addServerModal.classList.remove("hidden");
  };
  btnAddServerModal.addEventListener("click", openServerModal);
  btnActionCreateServer.addEventListener("click", () => {
    openServerModal();
    modalStepChoice.classList.add("hidden");
    modalStepCreateForm.classList.remove("hidden");
    inputNewServerName.focus();
  });
  btnActionImportServer.addEventListener("click", () => {
    openServerModal();
    modalStepChoice.classList.add("hidden");
    modalStepImportForm.classList.remove("hidden");
  });
  btnOpenAddServer.addEventListener("click", openServerModal);

  // Modal Step Navigation
  btnChooseCreateMyOwn.addEventListener("click", () => {
    modalStepChoice.classList.add("hidden");
    modalStepCreateForm.classList.remove("hidden");
    inputNewServerName.focus();
  });
  btnChooseImport.addEventListener("click", () => {
    modalStepChoice.classList.add("hidden");
    modalStepImportForm.classList.remove("hidden");
  });
  btnBackToChoiceA.addEventListener("click", () => {
    modalStepCreateForm.classList.add("hidden");
    modalStepChoice.classList.remove("hidden");
  });
  btnBackToChoiceB.addEventListener("click", () => {
    modalStepImportForm.classList.add("hidden");
    modalStepChoice.classList.remove("hidden");
  });
  btnCloseServerModal.addEventListener("click", closeAllModals);

  // Create Server Form Submit
  btnConfirmCreateServer.addEventListener("click", () => {
    const sName = inputNewServerName.value.trim() || "My Server";
    createNewServer(sName);
    inputNewServerName.value = "";
    closeAllModals();
  });

  // Import Server File Upload
  importDropzone.addEventListener("click", () => modalConfigFileInput.click());
  modalConfigFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => importDiscordServerConfig(event.target.result);
      reader.readAsText(file);
    }
  });

  // Drag and drop into dropzone
  importDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    importDropzone.style.borderColor = "#5865F2";
  });
  importDropzone.addEventListener("dragleave", () => {
    importDropzone.style.borderColor = "rgba(255, 255, 255, 0.15)";
  });
  importDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    importDropzone.style.borderColor = "rgba(255, 255, 255, 0.15)";
    if (e.dataTransfer.files.length > 0) {
      const reader = new FileReader();
      reader.onload = (event) => importDiscordServerConfig(event.target.result);
      reader.readAsText(e.dataTransfer.files[0]);
    }
  });

  // Import JSON Textarea Submit
  btnConfirmImportJson.addEventListener("click", () => {
    const jsonStr = importJsonTextarea.value.trim();
    if (jsonStr) {
      importDiscordServerConfig(jsonStr);
      importJsonTextarea.value = "";
    } else {
      alert("Please paste server_config.json text or choose a file above.");
    }
  });

  // Direct Messages (DMs) Modal
  btnNewDm.addEventListener("click", () => {
    closeAllModals();
    newDmModal.classList.remove("hidden");
    inputDmUsername.focus();
  });
  btnCloseDmModal.addEventListener("click", closeAllModals);
  btnConfirmCreateDm.addEventListener("click", () => {
    const uName = inputDmUsername.value.trim();
    if (uName) {
      const existingDm = state.dms.find(d => d.recipientName.toLowerCase() === uName.toLowerCase());
      if (existingDm) {
        state.activeView = "dm";
        state.activeDmId = existingDm.id;
      } else {
        const newDmId = `dm_${Date.now()}`;
        state.dms.push({ id: newDmId, recipientName: uName });
        state.activeView = "dm";
        state.activeDmId = newDmId;
        persistData();
      }
      inputDmUsername.value = "";
      closeAllModals();
      renderApp();
    }
  });

  // Message Send
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Ephemeral Timer Toggle
  btnBurnTimer.addEventListener("click", () => {
    if (state.burnDuration === 0) state.burnDuration = 15;
    else if (state.burnDuration === 15) state.burnDuration = 30;
    else if (state.burnDuration === 30) state.burnDuration = 60;
    else state.burnDuration = 0;

    burnTimerLabel.textContent = state.burnDuration > 0 ? `${state.burnDuration}s` : "Off";
    btnBurnTimer.classList.toggle("active", state.burnDuration > 0);
  });

  // Emoji Tray Toggle
  btnToggleEmoji.addEventListener("click", () => {
    emojiPickerTray.classList.toggle("hidden");
  });
  btnCloseEmojiTray.addEventListener("click", () => {
    emojiPickerTray.classList.add("hidden");
  });

  // Covert D.M.S. Modal
  const openDms = () => {
    cancelDmsHold();
    dmsModal.classList.remove("hidden");
  };
  btnDms.addEventListener("click", openDms);
  btnDmsHome.addEventListener("click", openDms);
  btnCancelDms.addEventListener("click", () => {
    cancelDmsHold();
    dmsModal.classList.add("hidden");
  });

  btnHoldNuke.addEventListener("mousedown", startDmsHold);
  window.addEventListener("mouseup", cancelDmsHold);
  btnHoldNuke.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startDmsHold();
  });
  window.addEventListener("touchend", cancelDmsHold);
});

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}
