"use strict";

/* =========================================================
JDDHM PRODUCT OF AI
COMPLETE SCRIPT.JS
========================================================= */

/* =========================================================
CONFIGURATION
========================================================= */

const FREE_LIMIT = 20;
const WAIT_HOURS = 7;
const MAX_TOTAL_MESSAGES = 1000;
const PAYMENT_CODE = "777";

/* =========================================================
STORAGE KEYS
========================================================= */

const STORAGE = {
chats: "jddhm_chats",
usage: "jddhm_usage",
totalUsage: "jddhm_total_usage",
waitUntil: "jddhm_wait_until",
unlocked: "jddhm_unlocked",
dark: "jddhm_dark",
large: "jddhm_large",
font: "jddhm_font",
user: "jddhm_user"
};

/* =========================================================
HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

function getStoredJSON(key, fallback) {
try {
const value = localStorage.getItem(key);
return value ? JSON.parse(value) : fallback;
} catch {
return fallback;
}
}

function getStoredNumber(key, fallback = 0) {
const value = Number(localStorage.getItem(key));
return Number.isFinite(value) ? value : fallback;
}

function saveItem(key, value) {
try {
localStorage.setItem(key, String(value));
} catch (error) {
console.error("Storage error:", error);
}
}

/* =========================================================
STATE
========================================================= */

const state = {
messages: [],
chats: getStoredJSON(STORAGE.chats, []),
usage: getStoredNumber(STORAGE.usage, 0),
totalUsage: getStoredNumber(STORAGE.totalUsage, 0),
waitUntil: getStoredNumber(STORAGE.waitUntil, 0),
unlocked: localStorage.getItem(STORAGE.unlocked) === "true",
attachedFile: null,
sending: false
};

/* =========================================================
ELEMENTS
========================================================= */

const messageInput = $("messageInput");
const sendButton = $("sendButton");
const messagesEl = $("messages");
const welcomeScreen = $("welcomeScreen");
const typingIndicator = $("typingIndicator");

const fileInput = $("fileInput");
const filePreview = $("filePreview");

/* =========================================================
SAVE STATE
========================================================= */

function saveState() {
try {
localStorage.setItem(
STORAGE.chats,
JSON.stringify(state.chats)
);

saveItem(STORAGE.usage, state.usage);
saveItem(STORAGE.totalUsage, state.totalUsage);
saveItem(STORAGE.waitUntil, state.waitUntil);

localStorage.setItem(
  STORAGE.unlocked,
  state.unlocked ? "true" : "false"
);

} catch (error) {
console.error("Unable to save state:", error);
}
}

/* =========================================================
NOTIFICATIONS
========================================================= */

function notify(message, icon = "✓") {
const box = $("notification");
const text = $("notificationMessage");
const iconElement = $("notificationIcon");

if (!box || !text) {
console.log(message);
return;
}

text.textContent = message;

if (iconElement) {
iconElement.textContent = icon;
}

box.hidden = false;

clearTimeout(window.jddhmNotificationTimer);

window.jddhmNotificationTimer = setTimeout(() => {
box.hidden = true;
}, 3500);
}

/* =========================================================
USAGE
========================================================= */

function updateUsage() {
const count = $("usageCount");
const progress = $("usageProgress");

if (count) {
count.textContent =
"${state.totalUsage} / ${MAX_TOTAL_MESSAGES}";
}

if (progress) {
const percentage =
Math.min(
(state.totalUsage / MAX_TOTAL_MESSAGES) * 100,
100
);

progress.style.width = `${percentage}%`;

}

const usageText = $("usageText");

if (usageText) {
if (state.unlocked) {
usageText.textContent =
"Premium access active.";
} else if (isWaiting()) {
usageText.textContent =
"Free messages used. Wait ${getRemainingWaitText()}.";
} else {
usageText.textContent =
"${Math.max(FREE_LIMIT - state.usage, 0)} free messages remaining.";
}
}
}

/* =========================================================
WAIT SYSTEM
========================================================= */

function isWaiting() {
if (!state.waitUntil) return false;

const now = Date.now();

if (now >= state.waitUntil) {
state.waitUntil = 0;
state.usage = 0;

saveState();
updateUsage();

return false;

}

return true;
}

function getRemainingWaitText() {
if (!state.waitUntil) return "";

const remaining =
Math.max(
state.waitUntil - Date.now(),
0
);

const totalMinutes =
Math.ceil(remaining / 60000);

const hours =
Math.floor(totalMinutes / 60);

const minutes =
totalMinutes % 60;

if (hours > 0) {
return "${hours}h ${minutes}m";
}

return "${minutes} minutes";
}

function startWaitPeriod() {
state.waitUntil =
Date.now() +
WAIT_HOURS * 60 * 60 * 1000;

saveState();
updateUsage();
}

function canSendMessage() {

if (state.unlocked) {
return true;
}

if (state.totalUsage >= MAX_TOTAL_MESSAGES) {
openModal("upgradeModal");

notify(
  "Maximum usage reached. Upgrade is required.",
  "⭐"
);

return false;

}

if (isWaiting()) {
openModal("upgradeModal");

notify(
  `Please wait ${getRemainingWaitText()} or upgrade.`,
  "⏳"
);

return false;

}

if (state.usage >= FREE_LIMIT) {
startWaitPeriod();

openModal("upgradeModal");

notify(
  `You used ${FREE_LIMIT} messages. Wait ${WAIT_HOURS} hours or upgrade.`,
  "⭐"
);

return false;

}

return true;
}

/* =========================================================
MESSAGE DISPLAY
========================================================= */

function addMessage(role, content) {

if (!messagesEl) return null;

const wrapper =
document.createElement("div");

wrapper.className =
"message ${role}";

const avatar =
document.createElement("div");

avatar.className =
"message-avatar";

avatar.textContent =
role === "user"
? "👤"
: "🤖";

const body =
document.createElement("div");

body.className =
"message-body";

const text =
document.createElement("div");

text.className =
"message-text";

text.textContent = content;

body.appendChild(text);

/* =========================
ASSISTANT ACTIONS
========================= */

if (role === "assistant") {

const actions =
  document.createElement("div");

actions.className =
  "message-actions";

/* COPY */

const copy =
  document.createElement("button");

copy.type = "button";

copy.textContent =
  "📋 Copy";

copy.addEventListener(
  "click",
  async () => {

    try {

      await navigator.clipboard.writeText(
        content
      );

      notify(
        "Answer copied",
        "✓"
      );

    } catch {

      notify(
        "Copy failed",
        "!"
      );

    }

  }
);

/* SHARE */

const share =
  document.createElement("button");

share.type = "button";

share.textContent =
  "📤 Share";

share.addEventListener(
  "click",
  async () => {

    try {

      if (navigator.share) {

        await navigator.share({
          title: "JDDHM AI Chatbot",
          text: content
        });

      } else {

        await navigator.clipboard.writeText(
          content
        );

        notify(
          "Answer copied for sharing",
          "✓"
        );

      }

    } catch (error) {

      if (
        error &&
        error.name !== "AbortError"
      ) {

        console.error(
          "Share error:",
          error
        );

      }

    }

  }
);

/* DOWNLOAD */

const download =
  document.createElement("button");

download.type = "button";

download.textContent =
  "💾 Download";

download.addEventListener(
  "click",
  () => {

    const blob =
      new Blob(
        [content],
        {
          type:
            "text/plain;charset=utf-8"
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "jddhm-ai-answer.txt";

    document.body.appendChild(link);

    link.click();

    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    notify(
      "Answer downloaded",
      "✓"
    );

  }
);

actions.append(
  copy,
  share,
  download
);

body.appendChild(actions);

}

wrapper.append(
avatar,
body
);

messagesEl.appendChild(wrapper);

scrollMessagesToBottom();

return wrapper;
}

function scrollMessagesToBottom() {

if (!messagesEl) return;

messagesEl.scrollTop =
messagesEl.scrollHeight;

}

/* =========================================================
THINKING INDICATOR
========================================================= */

function showThinking() {

if (typingIndicator) {
typingIndicator.hidden = false;
}

scrollMessagesToBottom();

}

function hideThinking() {

if (typingIndicator) {
typingIndicator.hidden = true;
}

}

/* =========================================================
NEW CHAT
========================================================= */

function newChat() {

state.messages = [];
state.attachedFile = null;

if (messagesEl) {
messagesEl.innerHTML = "";
}

if (welcomeScreen) {
welcomeScreen.hidden = false;
}

if (messageInput) {
messageInput.value = "";
}

if (fileInput) {
fileInput.value = "";
}

if (filePreview) {
filePreview.hidden = true;
}

updateCharacterCount();

document.body.classList.remove(
"sidebar-open"
);

notify(
"New chat started",
"＋"
);

}

/* =========================================================
SEND MESSAGE
========================================================= */

async function sendMessage(text = null) {

if (state.sending) return;

const message =
text !== null
? String(text).trim()
: messageInput?.value.trim();

if (!message) return;

if (!canSendMessage()) {
return;
}

if (welcomeScreen) {
welcomeScreen.hidden = true;
}

state.messages.push({
role: "user",
content: message
});

addMessage(
"user",
message
);

if (messageInput) {

messageInput.value = "";

updateCharacterCount();

}

state.sending = true;

if (sendButton) {
sendButton.disabled = true;
}

showThinking();

try {

const response =
  await fetch(
    "/api/chat",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify({
          messages:
            state.messages
        })
    }
  );

let data;

try {

  data =
    await response.json();

} catch {

  throw new Error(
    "The server returned an invalid response."
  );

}

if (!response.ok) {

  throw new Error(
    data?.error ||
    `AI request failed (${response.status}).`
  );

}

const answer =
  data?.reply ||
  data?.text ||
  data?.message ||
  "The AI returned no answer.";

state.messages.push({
  role: "assistant",
  content: answer
});

addMessage(
  "assistant",
  answer
);

/* Count successful AI request */

state.usage += 1;
state.totalUsage += 1;

saveRecentChat();

saveState();

updateUsage();

} catch (error) {

console.error(
  "Chat error:",
  error
);

addMessage(
  "assistant",
  `⚠️ ${
    error?.message ||
    "Unable to contact the AI service."
  }`
);

notify(
  "AI request failed",
  "!"
);

} finally {

hideThinking();

state.sending = false;

if (sendButton) {
  sendButton.disabled = false;
}

messageInput?.focus();

}

}

/* =========================================================
RECENT CHATS
========================================================= */

function saveRecentChat() {

const firstUser =
state.messages.find(
(message) =>
message.role === "user"
);

if (!firstUser) return;

let existing =
state.chats.find(
(chat) =>
chat.messages &&
chat.messages[0] &&
chat.messages[0].content ===
firstUser.content
);

if (existing) {

existing.messages =
  [...state.messages];

existing.updated =
  Date.now();

} else {

existing = {

  id:
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,

  title:
    firstUser.content
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 45),

  messages:
    [...state.messages],

  updated:
    Date.now()

};

state.chats.unshift(
  existing
);

}

state.chats.sort(
(a, b) =>
Number(b.updated || 0) -
Number(a.updated || 0)
);

state.chats =
state.chats.slice(0, 20);

saveState();

renderRecentChats();

}

function renderRecentChats() {

const container =
$("recentChats");

if (!container) return;

container.innerHTML = "";

if (!state.chats.length) {

const empty =
  document.createElement("div");

empty.className =
  "empty-recent";

empty.textContent =
  "No recent chats";

container.appendChild(
  empty
);

return;

}

state.chats.forEach(
(chat) => {

  const button =
    document.createElement(
      "button"
    );

  button.type = "button";

  button.className =
    "recent-chat-item";

  button.title =
    chat.title ||
    "Recent chat";

  button.textContent =
    chat.title ||
    "Untitled chat";

  button.addEventListener(
    "click",
    () => {

      loadChat(chat.id);

    }
  );

  container.appendChild(
    button
  );

}

);

}

function loadChat(id) {

const chat =
state.chats.find(
(item) =>
String(item.id) ===
String(id)
);

if (!chat) {

notify(
  "Chat was not found",
  "!"
);

return;

}

state.messages =
Array.isArray(chat.messages)
? [...chat.messages]
: [];

if (welcomeScreen) {
welcomeScreen.hidden = true;
}

if (messagesEl) {
messagesEl.innerHTML = "";
}

state.messages.forEach(
(message) => {

  addMessage(
    message.role,
    message.content
  );

}

);

document.body.classList.remove(
"sidebar-open"
);

closeAllModals();

notify(
"Recent chat opened",
"🕘"
);

}

/* =========================================================
CLEAR CHATS
========================================================= */

function clearChats() {

state.chats = [];

saveState();

renderRecentChats();

notify(
"Recent chats cleared",
"🗑️"
);

}

/* =========================================================
CHARACTER COUNT
========================================================= */

function updateCharacterCount() {

const counter =
$("characterCount");

if (!counter || !messageInput) {
return;
}

counter.textContent =
"${messageInput.value.length} / 10000";

}

/* =========================================================
MODALS
========================================================= */

function openModal(id) {

const modal = $(id);

if (!modal) return;

modal.hidden = false;

}

function closeAllModals() {

document
.querySelectorAll(".modal")
.forEach(
(modal) => {

    modal.hidden = true;

  }
);

}

document
.querySelectorAll(
"[data-close-modal]"
)
.forEach(
(button) => {

  button.addEventListener(
    "click",
    closeAllModals
  );

}

);

/* Close modal background */

document
.querySelectorAll(".modal")
.forEach(
(modal) => {

  modal.addEventListener(
    "click",
    (event) => {

      if (
        event.target === modal
      ) {

        modal.hidden = true;

      }

    }
  );

}

);

/* =========================================================
HAMBURGER MENU
========================================================= */

function toggleMobileSidebar() {

document.body.classList.toggle(
"sidebar-open"
);

}

function toggleDesktopSidebar() {

document.body.classList.toggle(
"sidebar-collapsed"
);

}

$("mobileMenuButton")
?.addEventListener(
"click",
toggleMobileSidebar
);

$("desktopMenuButton")
?.addEventListener(
"click",
toggleDesktopSidebar
);

/* Optional older ID support */

$("menuButton")
?.addEventListener(
"click",
toggleMobileSidebar
);

/* =========================================================
MAIN BUTTONS
========================================================= */

$("newChatButton")
?.addEventListener(
"click",
newChat
);

$("headerNewChat")
?.addEventListener(
"click",
newChat
);

$("mobileNewChat")
?.addEventListener(
"click",
newChat
);

$("sendButton")
?.addEventListener(
"click",
() => {
sendMessage();
}
);

$("loginButton")
?.addEventListener(
"click",
() => {
openModal("loginModal");
}
);

$("signupButton")
?.addEventListener(
"click",
() => {
openModal("signupModal");
}
);

$("settingsButton")
?.addEventListener(
"click",
() => {
openModal("settingsModal");
}
);

$("headerSettings")
?.addEventListener(
"click",
() => {
openModal("settingsModal");
}
);

$("upgradeButton")
?.addEventListener(
"click",
() => {
openModal("upgradeModal");
}
);

$("clearChatsButton")
?.addEventListener(
"click",
clearChats
);

$("clearChatsButtonSettings")
?.addEventListener(
"click",
clearChats
);

/* =========================================================
PAYMENT / UPGRADE CODE
========================================================= */

function verifyPaymentCode() {

const input =
$("paymentCodeInput");

if (!input) {

notify(
  "Payment code input is missing.",
  "!"
);

return;

}

const code =
input.value.trim();

if (
code === PAYMENT_CODE
) {

state.unlocked = true;

state.waitUntil = 0;

state.usage = 0;

saveState();

updateUsage();

closeAllModals();

input.value = "";

notify(
  "Upgrade code accepted. Access unlocked.",
  "🎉"
);

} else {

notify(
  "Incorrect code.",
  "!"
);

}

}

$("verifyPaymentButton")
?.addEventListener(
"click",
verifyPaymentCode
);

/* =========================================================
LOGIN / CREATE ACCOUNT
DEMO — LOCAL DEVICE ONLY
========================================================= */

$("loginForm")
?.addEventListener(
"submit",
(event) => {

  event.preventDefault();

  const email =
    $("loginEmail")
      ?.value
      .trim();

  if (!email) return;

  localStorage.setItem(
    STORAGE.user,
    JSON.stringify({
      email
    })
  );

  closeAllModals();

  notify(
    "Login saved on this device",
    "✓"
  );

}

);

$("signupForm")
?.addEventListener(
"submit",
(event) => {

  event.preventDefault();

  const name =
    $("signupName")
      ?.value
      .trim();

  const email =
    $("signupEmail")
      ?.value
      .trim();

  if (
    !name ||
    !email
  ) return;

  localStorage.setItem(
    STORAGE.user,
    JSON.stringify({
      name,
      email
    })
  );

  closeAllModals();

  notify(
    "Account created on this device",
    "✓"
  );

}

);

$("openSignupFromLogin")
?.addEventListener(
"click",
() => {

  closeAllModals();

  openModal(
    "signupModal"
  );

}

);

$("openLoginFromSignup")
?.addEventListener(
"click",
() => {

  closeAllModals();

  openModal(
    "loginModal"
  );

}

);

/* =========================================================
FILE UPLOAD
========================================================= */

$("attachButton")
?.addEventListener(
"click",
() => {

  fileInput?.click();

}

);

$("removeFileButton")
?.addEventListener(
"click",
() => {

  state.attachedFile = null;

  if (fileInput) {
    fileInput.value = "";
  }

  if (filePreview) {
    filePreview.hidden = true;
  }

  notify(
    "File removed",
    "×"
  );

}

);

fileInput
?.addEventListener(
"change",
async () => {

  const file =
    fileInput.files?.[0];

  if (!file) return;

  state.attachedFile = file;

  const fileName =
    $("fileName");

  const fileSize =
    $("fileSize");

  if (fileName) {
    fileName.textContent =
      file.name;
  }

  if (fileSize) {
    fileSize.textContent =
      `${Math.max(
        1,
        Math.round(
          file.size / 1024
        )
      )} KB`;
  }

  if (filePreview) {
    filePreview.hidden = false;
  }

  const isTextFile =
    file.type.startsWith(
      "text/"
    ) ||
    /\.(txt|json|csv|md|js|html|css)$/i.test(
      file.name
    );

  if (isTextFile) {

    try {

      const fileText =
        await file.text();

      if (messageInput) {

        const safeText =
          fileText.slice(
            0,
            50000
          );

        messageInput.value =
          `Please analyze this file: ${file.name}\n\n${safeText}`;

        updateCharacterCount();

      }

      notify(
        "Text file loaded",
        "📎"
      );

    } catch {

      notify(
        "Could not read this file",
        "!"
      );

    }

  } else {

    notify(
      "File attached. Text files can be automatically read.",
      "📎"
    );

  }

}

);

/* =========================================================
QUICK ACTIONS
========================================================= */

document
.querySelectorAll(
".quick-action[data-prompt]"
)
.forEach(
(button) => {

  button.addEventListener(
    "click",
    () => {

      const prompt =
        button.dataset.prompt;

      if (prompt) {

        sendMessage(
          prompt
        );

      }

    }
  );

}

);

/* =========================================================
SETTINGS
========================================================= */

function applySettings() {

const savedDark =
localStorage.getItem(
STORAGE.dark
) === "true";

const savedLarge =
localStorage.getItem(
STORAGE.large
) === "true";

const savedFont =
localStorage.getItem(
STORAGE.font
) || "16";

document.body.classList.toggle(
"dark-mode",
savedDark
);

document.body.classList.toggle(
"large-answer-text",
savedLarge
);

document.documentElement.style.setProperty(
"--answer-font-size",
"${savedFont}px"
);

const darkToggle =
$("darkModeToggle");

const largeToggle =
$("largeTextToggle");

const fontSelect =
$("fontSizeSelect");

if (darkToggle) {
darkToggle.checked =
savedDark;
}

if (largeToggle) {
largeToggle.checked =
savedLarge;
}

if (fontSelect) {
fontSelect.value =
savedFont;
}

}

$("darkModeToggle")
?.addEventListener(
"change",
(event) => {

  const enabled =
    event.target.checked;

  saveItem(
    STORAGE.dark,
    enabled
  );

  document.body.classList.toggle(
    "dark-mode",
    enabled
  );

}

);

$("largeTextToggle")
?.addEventListener(
"change",
(event) => {

  const enabled =
    event.target.checked;

  saveItem(
    STORAGE.large,
    enabled
  );

  document.body.classList.toggle(
    "large-answer-text",
    enabled
  );

}

);

$("fontSizeSelect")
?.addEventListener(
"change",
(event) => {

  const size =
    event.target.value;

  saveItem(
    STORAGE.font,
    size
  );

  document.documentElement
    .style
    .setProperty(
      "--answer-font-size",
      `${size}px`
    );

}

);

/* =========================================================
ENTER TO SEND
========================================================= */

messageInput
?.addEventListener(
"keydown",
(event) => {

  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {

    event.preventDefault();

    sendMessage();

  }

}

);

messageInput
?.addEventListener(
"input",
updateCharacterCount
);

/* =========================================================
NOTIFICATION CLOSE
========================================================= */

$("notificationClose")
?.addEventListener(
"click",
() => {

  const notification =
    $("notification");

  if (notification) {
    notification.hidden = true;
  }

}

);

/* =========================================================
ESCAPE KEY
========================================================= */

document.addEventListener(
"keydown",
(event) => {

if (
  event.key === "Escape"
) {

  closeAllModals();

  document.body.classList.remove(
    "sidebar-open"
  );

}

}
);

/* =========================================================
WAIT TIMER
========================================================= */

setInterval(
() => {

const wasWaiting =
  Boolean(
    state.waitUntil
  );

const waiting =
  isWaiting();

if (
  wasWaiting &&
  !waiting
) {

  notify(
    "Your free messages are available again.",
    "✓"
  );

}

updateUsage();

},
60000
);

/* =========================================================
STARTUP
========================================================= */

function startApp() {

isWaiting();

updateUsage();

updateCharacterCount();

renderRecentChats();

applySettings();

hideThinking();

window.setTimeout(
() => {

  notify(
    "Welcome to JDDHM Product of AI — AI Chatbot",
    "🤖"
  );

},
500

);

}

startApp();
