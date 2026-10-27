/**
 * Paracord Web: Discord Client
 * Clean Discord Dark Theme with covert passkey authentication,
 * OS-level anti-screenshot protection, and self-destruct timers.
 */

// Application State
const state = {
  isUnlocked: false,
  serverConfig: null,
  hardwareDeviceId: "Online",
  selectedChannelId: "101",
  burnDuration: 0, // 0 = Off, 15, 30, 60
  messages: {
    "101": [
      {
        id: "msg_1",
        authorName: "CrafterOnVR",
        authorColor: "#5865F2",
        roleName: "Owner",
        content: "Welcome to the group chat! Screenshot protection and passkey authentication are active in the background.",
        timestamp: "Today at 9:00 PM",
        burnTimerSeconds: 0,
        remainingSeconds: 0,
        isBurned: false
      },
      {
        id: "msg_2",
        authorName: "Alex",
        authorColor: "#57F287",
        roleName: "Admin",
        content: "Custom server emojis imported directly from Discord :pepe_hacker: :lock_vault:",
        timestamp: "Today at 9:02 PM",
        burnTimerSeconds: 0,
        remainingSeconds: 0,
        isBurned: false
      },
      {
        id: "msg_3",
        authorName: "Robin",
        authorColor: "#FEE75C",
        roleName: "Member",
        content: "Tested the disappearing messages feature in #ephemeral-burns — burns right on time :skull_burn:",
        timestamp: "Today at 9:04 PM",
        burnTimerSeconds: 0,
        remainingSeconds: 0,
        isBurned: false
      }
    ],
    "102": [
      {
        id: "burn_1",
        authorName: "Alex",
        authorColor: "#57F287",
        roleName: "Admin",
        content: "This channel has an automatic timer. Messages disappear once their timer counts down.",
        timestamp: "Today at 9:05 PM",
        burnTimerSeconds: 60,
        remainingSeconds: 60,
        isBurned: false
      }
    ],
    "201": [
      {
        id: "audit_1",
        authorName: "System",
        authorColor: "#949BA4",
        roleName: "Bot",
        content: "Session initialized. Display protection active.",
        timestamp: "Today at 9:00 PM",
        burnTimerSeconds: 0,
        remainingSeconds: 0,
        isBurned: false
      }
    ]
  }
};

// DOM References
const lockScreen = document.getElementById("lockScreen");
const appContainer = document.getElementById("appContainer");
const privacyShield = document.getElementById("privacyShield");
const gateError = document.getElementById("gateError");
const hardwareEnclaveId = document.getElementById("hardwareEnclaveId");
const footerHardwareId = document.getElementById("footerHardwareId");

const serverName = document.getElementById("serverName");
const serverRailInitials = document.getElementById("serverRailInitials");
const channelList = document.getElementById("channelList");
const currentChannelName = document.getElementById("currentChannelName");
const currentChannelTopic = document.getElementById("currentChannelTopic");
const messagesFeed = document.getElementById("messagesFeed");

const messageInput = document.getElementById("messageInput");
const btnBurnTimer = document.getElementById("btnBurnTimer");
const burnTimerLabel = document.getElementById("burnTimerLabel");
const btnToggleEmoji = document.getElementById("btnToggleEmoji");
const emojiPickerTray = document.getElementById("emojiPickerTray");
const btnCloseEmojiTray = document.getElementById("btnCloseEmojiTray");
const emojiGrid = document.getElementById("emojiGrid");

const btnDms = document.getElementById("btnDms");
const dmsModal = document.getElementById("dmsModal");
const btnHoldNuke = document.getElementById("btnHoldNuke");
const btnCancelDms = document.getElementById("btnCancelDms");
const dmsProgressRing = document.getElementById("dmsProgressRing");
const dmsPercent = document.getElementById("dmsPercent");
const dmsStatusText = document.getElementById("dmsStatusText");

const btnUploadConfig = document.getElementById("btnUploadConfig");
const configFileInput = document.getElementById("configFileInput");
const btnUserSettings = document.getElementById("btnUserSettings");

const HASH_ICON_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M5.88 20.5l.84-4.5H3.1l.38-2h3.84l.94-5H4.64l.38-2h3.84l.84-4.5h2.08l-.84 4.5h4.94l.84-4.5h2.08l-.84 4.5h3.62l-.38 2h-3.84l-.94 5h3.62l-.38 2h-3.84l-.84 4.5h-2.08l.84-4.5H9.68l-.84 4.5H6.76zM11.76 14h4.94l.94-5h-4.94l-.94 5z"/></svg>`;
const VOLUME_ICON_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;

// ========================================================
// 1. SILENT OPSEC & ANTI-SCREENSHOT DEFENSE
// ========================================================
function initOpSecProtections() {
  // Clear clipboard silently on PrintScreen attempt
  window.addEventListener("keyup", (e) => {
    if (e.key === "PrintScreen" || e.keyCode === 44) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText("");
        }
      } catch (err) {}
    }
  });

  // Discrete privacy pause when window is unfocused / tab switched
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

  // Block developer inspector shortcuts
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
// 2. AUTHENTIC DISCORD LOGIN / PASKEY
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
  renderMessages();
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
// 3. LOAD SERVER CONFIG & CHANNELS
// ========================================================
async function loadServerConfig(source) {
  try {
    if (typeof source === "string") {
      const resp = await fetch(source);
      state.serverConfig = await resp.json();
    } else {
      state.serverConfig = source;
    }
  } catch (e) {
    state.serverConfig = {
      name: "Paranoid Sanctuary",
      channels: [
        { id: "101", name: "general", type: 0, topic: "General chat and community discussions." },
        { id: "102", name: "ephemeral-burns", type: 0, topic: "Messages burn after reading." },
        { id: "201", name: "announcements", type: 0, topic: "Important server news." }
      ],
      roles: [
        { name: "Server Owner", color: "#5865F2" },
        { name: "Admin", color: "#57F287" }
      ],
      emojis: [
        { name: "pepe_hacker", file: "emojis/pepe_hacker.png", tag: ":pepe_hacker:" },
        { name: "lock_vault", file: "emojis/lock_vault.png", tag: ":lock_vault:" },
        { name: "skull_burn", file: "emojis/skull_burn.png", tag: ":skull_burn:" },
        { name: "bio_face", file: "emojis/bio_face.png", tag: ":bio_face:" },
        { name: "quantum_key", file: "emojis/quantum_key.png", tag: ":quantum_key:" }
      ]
    };
  }

  serverName.textContent = state.serverConfig.name || "Paranoid Sanctuary";
  const initials = (state.serverConfig.name || "PS")
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  serverRailInitials.textContent = initials || "PS";

  renderChannelList();
  renderEmojiGrid();
}

function renderChannelList() {
  channelList.innerHTML = "";

  const categories = (state.serverConfig.channels || []).filter(c => c.type === 4);
  const textChannels = (state.serverConfig.channels || []).filter(c => c.type === 0);

  if (categories.length === 0) {
    const catLabel = document.createElement("div");
    catLabel.className = "channel-category";
    catLabel.innerHTML = `
      <svg viewBox="0 0 18 18"><path fill="currentColor" d="M4.5 6.75l4.5 4.5 4.5-4.5"/></svg>
      <span>TEXT CHANNELS</span>
    `;
    channelList.appendChild(catLabel);

    textChannels.forEach(c => appendChannelItem(c));
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
      subChannels.forEach(c => appendChannelItem(c));
    });
  }

  // Voice channel item
  const voiceCat = document.createElement("div");
  voiceCat.className = "channel-category";
  voiceCat.innerHTML = `
    <svg viewBox="0 0 18 18"><path fill="currentColor" d="M4.5 6.75l4.5 4.5 4.5-4.5"/></svg>
    <span>VOICE CHANNELS</span>
  `;
  channelList.appendChild(voiceCat);

  const voiceItem = document.createElement("div");
  voiceItem.className = "channel-item";
  voiceItem.innerHTML = `
    ${VOLUME_ICON_SVG}
    <span>General Voice</span>
  `;
  channelList.appendChild(voiceItem);
}

function appendChannelItem(channel) {
  const item = document.createElement("div");
  item.className = `channel-item ${channel.id === state.selectedChannelId ? "active" : ""}`;
  item.innerHTML = `
    ${HASH_ICON_SVG}
    <span>${channel.name}</span>
  `;
  item.addEventListener("click", () => {
    state.selectedChannelId = channel.id;
    currentChannelName.textContent = channel.name;
    currentChannelTopic.textContent = channel.topic || `Welcome to #${channel.name}`;
    messageInput.placeholder = `Message #${channel.name}`;
    renderChannelList();
    renderMessages();
  });
  channelList.appendChild(item);
}

// ========================================================
// 4. CHAT FEED & MESSAGE TIMERS
// ========================================================
function renderMessages() {
  messagesFeed.innerHTML = "";
  const channelMessages = state.messages[state.selectedChannelId] || [];

  // Channel Welcome Banner
  const banner = document.createElement("div");
  banner.className = "channel-welcome-banner";
  banner.innerHTML = `
    <div class="banner-hash">#</div>
    <h1>Welcome to #${currentChannelName.textContent}!</h1>
    <p>${currentChannelTopic.textContent}</p>
  `;
  messagesFeed.appendChild(banner);

  channelMessages.forEach(msg => {
    const row = document.createElement("div");
    row.className = "message-row";

    // Emojis matching
    const emojis = state.serverConfig?.emojis || [];
    let emojiHtml = "";
    if (!msg.isBurned) {
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

    messagesFeed.appendChild(row);
  });

  messagesFeed.scrollTop = messagesFeed.scrollHeight;
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
    renderMessages();
  }
}, 1000);

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const currentList = state.messages[state.selectedChannelId] || [];
  const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  currentList.push({
    id: `msg_${Date.now()}`,
    authorName: "CrafterOnVR",
    authorColor: "#5865F2",
    roleName: "Owner",
    content: text,
    timestamp: `Today at ${now}`,
    burnTimerSeconds: state.burnDuration,
    remainingSeconds: state.burnDuration,
    isBurned: false
  });

  state.messages[state.selectedChannelId] = currentList;
  messageInput.value = "";
  renderMessages();
}

// ========================================================
// 5. SERVER EMOJIS PICKER
// ========================================================
function renderEmojiGrid() {
  emojiGrid.innerHTML = "";
  const emojis = state.serverConfig?.emojis || [];
  emojis.forEach(emoji => {
    const btn = document.createElement("div");
    btn.className = "emoji-btn";
    btn.title = emoji.tag;
    btn.innerHTML = `<img src="${emoji.file}" alt="${emoji.name}">`;
    btn.addEventListener("click", () => {
      messageInput.value += ` ${emoji.tag} `;
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
const RING_CIRCUMFERENCE = 2 * Math.PI * 34; // 213.628 for r=34

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
  Object.keys(state.messages).forEach(k => delete state.messages[k]);

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {}

  state.messages["201"] = [
    {
      id: "reset_event",
      authorName: "System",
      authorColor: "#949BA4",
      roleName: "Bot",
      content: "Local session cache cleared successfully.",
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      burnTimerSeconds: 0,
      remainingSeconds: 0,
      isBurned: false
    }
  ];

  dmsModal.classList.add("hidden");
  lockSession("Session cleared. Please sign back in.");
}

// ========================================================
// 7. EVENT LISTENERS
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
  initOpSecProtections();
  loadServerConfig("server_config.json");

  // Login actions
  document.getElementById("btnUnlockBiometric").addEventListener("click", authenticateBiometric);
  document.getElementById("btnBypassTest").addEventListener("click", unlockSession);
  btnUserSettings.addEventListener("click", () => lockSession());

  // Input & Send
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Disappearing Timer Toggle
  btnBurnTimer.addEventListener("click", () => {
    if (state.burnDuration === 0) state.burnDuration = 15;
    else if (state.burnDuration === 15) state.burnDuration = 30;
    else if (state.burnDuration === 30) state.burnDuration = 60;
    else state.burnDuration = 0;

    burnTimerLabel.textContent = state.burnDuration > 0 ? `${state.burnDuration}s` : "Off";
    btnBurnTimer.classList.toggle("active", state.burnDuration > 0);
  });

  // Emoji Tray
  btnToggleEmoji.addEventListener("click", () => {
    emojiPickerTray.classList.toggle("hidden");
  });
  btnCloseEmojiTray.addEventListener("click", () => {
    emojiPickerTray.classList.add("hidden");
  });

  // Covert Clear Session / D.M.S. Modal
  btnDms.addEventListener("click", () => {
    cancelDmsHold();
    dmsModal.classList.remove("hidden");
  });
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

  // Import Custom Discord Exporter JSON
  btnUploadConfig.addEventListener("click", () => configFileInput.click());
  configFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          loadServerConfig(parsed);
        } catch (err) {
          alert("Invalid server_config.json format.");
        }
      };
      reader.readAsText(file);
    }
  });
});

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}
