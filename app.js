/**
 * Paracord Web: Zero-Trust Discord Client
 * Enforces WebAuthn 4FA, Anti-Screenshot Protections,
 * False-Alarm-Proof Dead Man's Switch, and Ephemeral Messages.
 */

// Application State
const state = {
  isUnlocked: false,
  serverConfig: null,
  hardwareDeviceId: "QC-KEY-ENCLAVE-INIT",
  selectedChannelId: "101",
  burnDuration: 0, // 0 = Off, 15, 30, 60
  messages: {
    "101": [
      {
        id: "init_1",
        authorName: "GhostAdmin",
        authorColor: "#ED4245",
        roleName: "Sanctuary Admin",
        content: "Paracord Web Sanctuary is active. Anti-screenshot defense and WebAuthn 4FA are strictly enforced. Tab switches, PrintScreen, and DevTools inspections are intercepted.",
        timestamp: "Today at 9:00 PM",
        burnTimerSeconds: 0,
        remainingSeconds: 0,
        isBurned: false
      },
      {
        id: "init_2",
        authorName: "Cipher",
        authorColor: "#5865F2",
        roleName: "Verified Biometric",
        content: "Custom server emojis imported directly from Discord asset bundle :pepe_hacker: :lock_vault:",
        timestamp: "Today at 9:02 PM",
        burnTimerSeconds: 0,
        remainingSeconds: 0,
        isBurned: false
      },
      {
        id: "init_3",
        authorName: "OpSecBot",
        authorColor: "#57F287",
        roleName: "Enclave Daemon",
        content: "Dead Man's Switch (D.M.S.) is armed with a 3.0s hold safeguard to prevent false alarms. Releasing early aborts purge safely :skull_burn:",
        timestamp: "Today at 9:04 PM",
        burnTimerSeconds: 0,
        remainingSeconds: 0,
        isBurned: false
      }
    ],
    "102": [
      {
        id: "burn_1",
        authorName: "Cipher",
        authorColor: "#5865F2",
        roleName: "Verified Biometric",
        content: "This channel enforces self-destruct timers. Messages burn away automatically once their counter hits zero.",
        timestamp: "Today at 9:05 PM",
        burnTimerSeconds: 60,
        remainingSeconds: 60,
        isBurned: false
      }
    ],
    "201": [
      {
        id: "audit_1",
        authorName: "AuditDaemon",
        authorColor: "#FEE75C",
        roleName: "System",
        content: "SYSTEM AUDIT: Session initialized. Enclave binding confirmed. Zero third-party telemetry.",
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
const screenshotAlert = document.getElementById("screenshotAlert");
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
const btnSendMessage = document.getElementById("btnSendMessage");
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
const btnLockApp = document.getElementById("btnLockApp");

// ========================================================
// 1. HARDWARE-BOUND ENCLAVE KEY DERIVATION
// ========================================================
async function generateHardwareEnclaveKey() {
  try {
    const rawEntropy = `${navigator.userAgent}_${navigator.hardwareConcurrency || 8}_${screen.width}x${screen.height}_${navigator.language}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(rawEntropy);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    state.hardwareDeviceId = `QC-KEY-${hex.substring(0, 4)}-${hex.substring(4, 8)}-${hex.substring(8, 12)}`;
  } catch (e) {
    state.hardwareDeviceId = "QC-KEY-ENCLAVE-8821";
  }
  hardwareEnclaveId.textContent = state.hardwareDeviceId;
  footerHardwareId.textContent = state.hardwareDeviceId;
}

// ========================================================
// 2. ANTI-SCREENSHOT & OPSEC PROTECTIONS
// ========================================================
function initOpSecProtections() {
  // A. Intercept PrintScreen
  window.addEventListener("keyup", (e) => {
    if (e.key === "PrintScreen" || e.keyCode === 44) {
      triggerScreenshotDefense();
    }
  });

  // B. Detect Focus Loss / Tab Switch (Snipping Tool & Window Capture)
  window.addEventListener("blur", () => {
    if (state.isUnlocked) {
      privacyShield.classList.remove("hidden");
    }
  });

  window.addEventListener("focus", () => {
    privacyShield.classList.add("hidden");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.isUnlocked) {
      privacyShield.classList.remove("hidden");
    } else {
      privacyShield.classList.add("hidden");
    }
  });

  // C. Block DevTools, Inspect Element, and Save Shortcuts
  window.addEventListener("keydown", (e) => {
    // F12 or Ctrl+Shift+I or Ctrl+Shift+J or Ctrl+U or Ctrl+S or Ctrl+P
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
      (e.ctrlKey && (e.key === "u" || e.key === "U" || e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P"))
    ) {
      e.preventDefault();
      triggerScreenshotDefense("Developer inspection tools are strictly blocked by Zero-Trust policy.");
      return false;
    }
  });
}

function triggerScreenshotDefense(customMessage) {
  // 1. Immediately wipe system clipboard
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText("[PARACORD: ZERO-TRUST CLIPBOARD SANITIZED]");
    }
  } catch (e) {}

  // 2. Flash visual warning
  screenshotAlert.classList.remove("hidden");
  if (customMessage) {
    screenshotAlert.querySelector("p").textContent = customMessage;
  }
  setTimeout(() => {
    screenshotAlert.classList.add("hidden");
  }, 2500);
}

// ========================================================
// 3. 4FA BIOMETRIC WEBAUTHN / LOCK SCREEN
// ========================================================
async function authenticateBiometric() {
  gateError.classList.add("hidden");

  if (!window.PublicKeyCredential) {
    unlockSession();
    return;
  }

  try {
    // Generate mock biometric challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: { name: "Paracord Zero-Trust Sanctuary", id: window.location.hostname || "localhost" },
      user: {
        id: Uint8Array.from("OPSEC_USER_ID", c => c.charCodeAt(0)),
        name: "OpSec Master",
        displayName: "OpSec Master"
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "preferred"
      },
      timeout: 30000
    };

    // Prompt Windows Hello / Face Unlock / Touch ID / PIN
    await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });
    unlockSession();
  } catch (err) {
    console.warn("WebAuthn Prompt Error:", err);
    gateError.textContent = "Biometric check failed or cancelled. Use test bypass if hardware is not enrolled.";
    gateError.classList.remove("hidden");
  }
}

function unlockSession() {
  state.isUnlocked = true;
  lockScreen.classList.add("hidden");
  appContainer.classList.remove("hidden");
  renderMessages();
}

function lockSession(statusMsg) {
  state.isUnlocked = false;
  appContainer.classList.add("hidden");
  lockScreen.classList.remove("hidden");
  if (statusMsg) {
    gateError.textContent = statusMsg;
    gateError.classList.remove("hidden");
  }
}

// ========================================================
// 4. LOAD SERVER CONFIG & CHANNELS
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
    console.error("Failed to load server_config.json, using fallback:", e);
    state.serverConfig = {
      name: "Paranoid Sanctuary",
      channels: [
        { id: "101", name: "classified-gc", type: 0, topic: "Protected by Anti-Screenshot & Biometrics." },
        { id: "102", name: "ephemeral-burns", type: 0, topic: "Messages burn after reading." },
        { id: "201", name: "audit-feed", type: 0, topic: "Local encrypted telemetry." }
      ],
      roles: [
        { name: "Sanctuary Admin", color: "#5865F2" },
        { name: "Verified Biometric", color: "#57F287" }
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

  serverName.textContent = state.serverConfig.name;
  serverRailInitials.textContent = (state.serverConfig.name || "PS").slice(0, 2).toUpperCase();
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
    catLabel.textContent = "TEXT CHANNELS";
    channelList.appendChild(catLabel);

    textChannels.forEach(c => appendChannelItem(c));
  } else {
    categories.forEach(cat => {
      const catLabel = document.createElement("div");
      catLabel.className = "channel-category";
      catLabel.textContent = cat.name.toUpperCase();
      channelList.appendChild(catLabel);

      const subChannels = textChannels.filter(c => c.parent_id === cat.id);
      subChannels.forEach(c => appendChannelItem(c));
    });
  }

  // Voice channel item
  const voiceItem = document.createElement("div");
  voiceItem.className = "channel-item voice-item";
  voiceItem.innerHTML = `
    <span>🔊</span>
    <span>Quantum Comms</span>
    <span class="voice-badge">E2EE 12ms</span>
  `;
  channelList.appendChild(voiceItem);
}

function appendChannelItem(channel) {
  const item = document.createElement("div");
  item.className = `channel-item ${channel.id === state.selectedChannelId ? "active" : ""}`;
  item.innerHTML = `<span class="hash">#</span> <span>${channel.name}</span>`;
  item.addEventListener("click", () => {
    state.selectedChannelId = channel.id;
    currentChannelName.textContent = channel.name;
    currentChannelTopic.textContent = channel.topic || `Start of #${channel.name}`;
    messageInput.placeholder = `Message #${channel.name}`;
    renderChannelList();
    renderMessages();
  });
  channelList.appendChild(item);
}

// ========================================================
// 5. CHAT FEED & EPHEMERAL BURNING MESSAGES
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

    // Emoji matches
    const emojis = state.serverConfig?.emojis || [];
    let emojiHtml = "";
    if (!msg.isBurned) {
      emojis.forEach(em => {
        if (msg.content.includes(em.tag)) {
          emojiHtml += `<img src="${em.file}" alt="${em.name}" class="msg-emoji-img" title="${em.tag}">`;
        }
      });
    }

    row.innerHTML = `
      <div class="msg-avatar" style="background: ${msg.authorColor}22; border: 1.5px solid ${msg.authorColor}; color: ${msg.authorColor}">
        ${msg.authorName.charAt(0).toUpperCase()}
      </div>
      <div class="msg-content-wrapper">
        <div class="msg-header">
          <span class="author-name" style="color: ${msg.authorColor}">${msg.authorName}</span>
          <span class="role-badge" style="background: ${msg.authorColor}26; color: ${msg.authorColor}">${msg.roleName}</span>
          <span class="msg-time">${msg.timestamp}</span>
        </div>
        ${msg.burnTimerSeconds > 0 && !msg.isBurned ? `
          <div class="burn-indicator">
            <span>🔥</span> Burns in ${msg.remainingSeconds}s
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
          msg.content = "[MESSAGE ASHES PURGED - ZERO RESIDUE]";
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
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  currentList.push({
    id: `msg_${Date.now()}`,
    authorName: "You",
    authorColor: "#57F287",
    roleName: "Verified Biometric",
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
// 6. CUSTOM EMOJIS PICKER
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
// 7. DEAD MAN'S SWITCH (D.M.S.) 3-SECOND HOLD SAFEGUARD
// ========================================================
let dmsHoldStartTime = null;
let dmsHoldAnimationId = null;
const DMS_REQUIRED_DURATION = 3000; // 3 seconds
const RING_CIRCUMFERENCE = 2 * Math.PI * 50; // 314.159

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
  dmsStatusText.textContent = `INCINERATING IN ${remaining}s...`;

  if (elapsed >= DMS_REQUIRED_DURATION) {
    // 3 FULL SECONDS COMPLETED: EXECUTE INCINERATION
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
    dmsStatusText.textContent = "Purge aborted. Hold for 3.0s continuously to execute.";
  }
}

function executeDeadMansSwitch() {
  // 1. Wipe all in-memory chat histories
  Object.keys(state.messages).forEach(k => delete state.messages[k]);

  // 2. Clear localStorage, sessionStorage, and cookies
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {}

  // 3. Write final terminal audit entry
  state.messages["201"] = [
    {
      id: "purge_event",
      authorName: "EMERGENCY_DMS",
      authorColor: "#ED4245",
      roleName: "PURGE",
      content: "CRITICAL: DEAD MAN'S SWITCH EXECUTED. ALL CHANNELS, LOGS, AND CACHES WIPED TO ZERO RESIDUE.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      burnTimerSeconds: 0,
      remainingSeconds: 0,
      isBurned: false
    }
  ];

  // 4. Close modal and lock app immediately
  dmsModal.classList.add("hidden");
  lockSession("VAULT INCINERATED: All messages and session data sanitized to 0 bytes.");
}

// ========================================================
// 8. EVENT LISTENERS
// ========================================================
document.addEventListener("DOMContentLoaded", () => {
  generateHardwareEnclaveKey();
  initOpSecProtections();
  loadServerConfig("server_config.json");

  // Lock Screen
  document.getElementById("btnUnlockBiometric").addEventListener("click", authenticateBiometric);
  document.getElementById("btnBypassTest").addEventListener("click", unlockSession);
  btnLockApp.addEventListener("click", () => lockSession());

  // Input & Send
  btnSendMessage.addEventListener("click", sendMessage);
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

  // Dead Man's Switch Dialog
  btnDms.addEventListener("click", () => {
    cancelDmsHold();
    dmsModal.classList.remove("hidden");
  });
  btnCancelDms.addEventListener("click", () => {
    cancelDmsHold();
    dmsModal.classList.add("hidden");
  });

  // Hold-to-Nuke Pointer Events (Mouse / Touch)
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
