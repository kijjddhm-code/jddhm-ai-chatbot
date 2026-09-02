/* =========================================
JDDHM PRODUCT OF AI
COMPLETE SCRIPT.JS
========================================= */

"use strict";

/* =========================================
CONFIGURATION
========================================= */

const MAX_FREE_SEARCHES = 1000;

/*
DEMO ACCESS CODE

IMPORTANT:
This is visible in the browser JavaScript.
For a real payment system, verify payment
on the server instead.
*/
const ACCESS_CODE = "777";

const STORAGE_KEYS = {
chats: "jddhm_chats",
usage: "jddhm_usage",
access: "jddhm_access",
dark: "jddhm_dark",
large: "jddhm_large",
font: "jddhm_font",
user: "jddhm_user"
};

/* =========================================
HELPERS
========================================= */

const $ = (id) => document.getElementById(id);

function safeJSON(value, fallback) {
try {
return JSON.parse(value);
} catch {
return fallback;
}
}

/* =========================================
STATE
========================================= */

const state = {
messages: [],
chats: safeJSON(
localStorage.getItem(STORAGE_KEYS.chats) || "[]",
[]
),

totalUsage: Number(
localStorage.getItem(STORAGE_KEYS.usage) || 0
),

hasAccess:
localStorage.getItem(STORAGE_KEYS.access) === "true",

attachedFile: null,

isSending: false
};

/* =========================================
ELEMENTS
========================================= */

const messageInput = $("messageInput");
const sendButton = $("sendButton");
const messagesEl = $("messages");
const welcomeScreen = $("welcomeScreen");
const typingIndicator = $("typingIndicator");

const fileInput = $("fileInput");
const filePreview = $("filePreview");

const sidebarBackdrop = $("sidebarBackdrop");

/* =========================================
STORAGE
========================================= */

function saveChats() {
localStorage.setItem(
STORAGE_KEYS.chats,
JSON.stringify(state.chats)
);
}

function saveUsage() {
localStorage.setItem(
STORAGE_KEYS.usage,
String(state.totalUsage)
);
}

function saveAccess() {
localStorage.setItem(
STORAGE_KEYS.access,
String(state.hasAccess)
);
}

/* =========================================
NOTIFICATIONS
========================================= */

function notify(message, icon = "✓") {
const box = $("notification");
const text = $("notificationMessage");
const iconEl = $("notificationIcon");

if (!box || !text) return;

text.textContent = message;

if (iconEl) {
iconEl.textContent = icon;
}

box.hidden = false;

clearTimeout(window.jddhmNotificationTimer);

window.jddhmNotificationTimer = setTimeout(() => {
box.hidden = true;
}, 4000);
}

/* =========================================
USAGE
========================================= */

function updateUsage() {
const usageCount = $("usageCount");
const progress = $("usageProgress");
const usageBox = $("usageBox");

if (usageCount) {
if (state.hasAccess) {
usageCount.textContent = "Unlimited";
} else {
usageCount.textContent =
"${state.totalUsage} / ${MAX_FREE_SEARCHES}";
}
}

if (progress) {
const percentage = Math.min(
(state.totalUsage / MAX_FREE_SEARCHES) * 100,
100
);

progress.style.width = `${percentage}%`;

}

if (usageBox) {
const paragraph = usageBox.querySelector("p");

if (paragraph) {
  if (state.hasAccess) {
    paragraph.textContent =
      "Access code accepted. You can continue using AI.";
  } else if (state.totalUsage >= MAX_FREE_SEARCHES) {
    paragraph.textContent =
      "Free searches finished. Upgrade to continue.";
  } else {
    const remaining =
      MAX_FREE_SEARCHES - state.totalUsage;

    paragraph.textContent =
      `${remaining} free messages remaining.`;
  }
}

}
}

function canSendMessage() {
return (
state.hasAccess ||
state.totalUsage < MAX_FREE_SEARCHES
);
}

/* =========================================
MESSAGE DISPLAY
========================================= */

function addMessage(role, content) {
if (!messagesEl) return null;

const wrapper = document.createElement("div");

wrapper.className = "message ${role}";

/* AVATAR */

const avatar = document.createElement("div");

avatar.className = "message-avatar";

avatar.textContent =
role === "user"
? "👤"
: "🤖";

/* BODY */

const body = document.createElement("div");

body.className = "message-body";

/* TEXT */

const text = document.createElement("div");

text.className = "message-text";

text.textContent = content;

body.appendChild(text);

/* ASSISTANT ACTIONS */

if (role === "assistant") {
const actions =
document.createElement("div");

actions.className =
  "message-actions";

/* COPY */

const copyButton =
  document.createElement("button");

copyButton.type = "button";

copyButton.textContent =
  "📋 Copy";

copyButton.addEventListener(
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

const shareButton =
  document.createElement("button");

shareButton.type = "button";

shareButton.textContent =
  "📤 Share";

shareButton.addEventListener(
  "click",
  async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title:
            "JDDHM Product of AI",
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
    } catch {
      /* User cancelled sharing */
    }
  }
);

/* DOWNLOAD */

const downloadButton =
  document.createElement("button");

downloadButton.type = "button";

downloadButton.textContent =
  "💾 Download";

downloadButton.addEventListener(
  "click",
  () => {
    const blob = new Blob(
      [content],
      {
        type: "text/plain"
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

    URL.revokeObjectURL(url);

    notify(
      "Answer downloaded",
      "✓"
    );
  }
);

actions.append(
  copyButton,
  shareButton,
  downloadButton
);

body.appendChild(actions);

}

wrapper.append(
avatar,
body
);

messagesEl.appendChild(wrapper);

messagesEl.scrollTo({
top: messagesEl.scrollHeight,
behavior: "smooth"
});

return wrapper;
}

/* =========================================
TYPING INDICATOR
========================================= */

function showThinking() {
if (typingIndicator) {
typingIndicator.hidden = false;
}

if (messagesEl) {
messagesEl.scrollTop =
messagesEl.scrollHeight;
}
}

function hideThinking() {
if (typingIndicator) {
typingIndicator.hidden = true;
}
}

/* =========================================
NEW CHAT
========================================= */

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

messageInput?.focus();

notify(
"New chat started",
"＋"
);
}

/* =========================================
ACCESS / UPGRADE
========================================= */

function showUpgrade() {
openModal("upgradeModal");

notify(
"You have used all 1000 free searches.",
"⭐"
);
}

/* =========================================
SEND MESSAGE
========================================= */

async function sendMessage(text = null) {
if (state.isSending) return;

const message =
text !== null
? text.trim()
: messageInput?.value.trim();

if (!message) return;

/* CHECK FREE LIMIT */

if (!canSendMessage()) {
showUpgrade();
return;
}

state.isSending = true;

if (welcomeScreen) {
welcomeScreen.hidden = true;
}

/* ADD USER MESSAGE */

state.messages.push({
role: "user",
content: message
});

addMessage(
"user",
message
);

/* CLEAR INPUT */

if (messageInput && text === null) {
messageInput.value = "";

updateCharacterCount();

}

showThinking();

if (sendButton) {
sendButton.disabled = true;
}

try {
const response = await fetch(
"/api/chat",
{
method: "POST",

    headers: {
      "Content-Type":
        "application/json"
    },

    body: JSON.stringify({
      messages: state.messages
    })
  }
);

let data;

try {
  data = await response.json();
} catch {
  throw new Error(
    "Server returned an invalid response."
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

/*
  Count only successful AI searches.
*/

if (!state.hasAccess) {
  state.totalUsage++;

  saveUsage();

  updateUsage();
}

saveRecentChat();

} catch (error) {
console.error(
"Chat error:",
error
);

addMessage(
  "assistant",
  `⚠️ ${
    error.message ||
    "Unable to contact the AI."
  }`
);

notify(
  "AI request failed",
  "!"
);

} finally {
hideThinking();

if (sendButton) {
  sendButton.disabled = false;
}

state.isSending = false;

messageInput?.focus();

}
}

/* =========================================
RECENT CHATS
========================================= */

function saveRecentChat() {
const firstUser =
state.messages.find(
(message) =>
message.role === "user"
);

if (!firstUser) return;

const existing =
state.chats.find(
(chat) =>
chat.id === state.currentChatId
);

if (existing) {
existing.messages =
[...state.messages];

existing.updated =
  Date.now();

} else {
const newId = Date.now();

state.currentChatId = newId;

state.chats.unshift({
  id: newId,

  title:
    firstUser.content
      .slice(0, 50),

  messages:
    [...state.messages],

  updated:
    Date.now()
});

}

state.chats =
state.chats.slice(0, 20);

saveChats();

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

container.appendChild(empty);

return;

}

state.chats.forEach(
(chat) => {
const button =
document.createElement("button");

  button.type = "button";

  button.className =
    "recent-chat-item";

  button.textContent =
    chat.title ||
    "New Chat";

  button.title =
    chat.title;

  button.addEventListener(
    "click",
    () => {
      loadChat(chat.id);
    }
  );

  container.appendChild(button);
}

);
}

function loadChat(id) {
const chat =
state.chats.find(
(item) =>
item.id === id
);

if (!chat) return;

state.currentChatId = id;

state.messages =
[...(chat.messages || [])];

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

notify(
"Chat opened",
"🕘"
);
}

/* =========================================
CLEAR CHATS
========================================= */

function clearChats() {
state.chats = [];

state.currentChatId = null;

saveChats();

renderRecentChats();

notify(
"Recent chats cleared",
"🗑️"
);
}

/* =========================================
CHARACTER COUNT
========================================= */

function updateCharacterCount() {
const counter =
$("characterCount");

if (
counter &&
messageInput
) {
counter.textContent =
"${messageInput.value.length} / 10000";
}
}

/* =========================================
MODALS
========================================= */

function openModal(id) {
const modal = $(id);

if (modal) {
modal.hidden = false;
}
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

/* =========================================
HAMBURGER MENU
========================================= */

$("mobileMenuButton")
?.addEventListener(
"click",
() => {
document.body.classList.toggle(
"sidebar-open"
);
}
);

$("desktopMenuButton")
?.addEventListener(
"click",
() => {
document.body.classList.toggle(
"sidebar-open"
);
}
);

sidebarBackdrop
?.addEventListener(
"click",
() => {
document.body.classList.remove(
"sidebar-open"
);
}
);

/* =========================================
NEW CHAT BUTTONS
========================================= */

[
"newChatButton",
"headerNewChat",
"mobileNewChat"
].forEach(
(id) => {
$(id)?.addEventListener(
"click",
newChat
);
}
);

/* =========================================
SEND BUTTON
========================================= */

sendButton
?.addEventListener(
"click",
() => {
sendMessage();
}
);

/* =========================================
ENTER TO SEND
========================================= */

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

/* =========================================
QUICK ACTIONS
========================================= */

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
        sendMessage(prompt);
      }
    }
  );
}

);

/* =========================================
LOGIN
========================================= */

$("loginButton")
?.addEventListener(
"click",
() => {
openModal("loginModal");
}
);

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

  /*
    This is only local browser data.
    It is not a secure login system.
  */

  localStorage.setItem(
    STORAGE_KEYS.user,
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

/* =========================================
CREATE ACCOUNT
========================================= */

$("signupButton")
?.addEventListener(
"click",
() => {
openModal("signupModal");
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

  if (!name || !email) return;

  /*
    Demo only.
    Real accounts require a backend.
  */

  localStorage.setItem(
    STORAGE_KEYS.user,
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

/* =========================================
LOGIN / SIGNUP SWITCH
========================================= */

$("openSignupFromLogin")
?.addEventListener(
"click",
() => {
closeAllModals();

  openModal("signupModal");
}

);

$("openLoginFromSignup")
?.addEventListener(
"click",
() => {
closeAllModals();

  openModal("loginModal");
}

);

/* =========================================
SETTINGS
========================================= */

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

function applySettings() {
const darkEnabled =
localStorage.getItem(
STORAGE_KEYS.dark
) === "true";

const largeEnabled =
localStorage.getItem(
STORAGE_KEYS.large
) === "true";

const fontSize =
localStorage.getItem(
STORAGE_KEYS.font
) || "16";

document.body.classList.toggle(
"dark-mode",
darkEnabled
);

document.body.classList.toggle(
"large-answer-text",
largeEnabled
);

document.documentElement.style.setProperty(
"--answer-font-size",
"${fontSize}px"
);

const darkToggle =
$("darkModeToggle");

const largeToggle =
$("largeTextToggle");

const fontSelect =
$("fontSizeSelect");

if (darkToggle) {
darkToggle.checked =
darkEnabled;
}

if (largeToggle) {
largeToggle.checked =
largeEnabled;
}

if (fontSelect) {
fontSelect.value =
fontSize;
}
}

/* DARK MODE */

$("darkModeToggle")
?.addEventListener(
"change",
(event) => {
const enabled =
event.target.checked;

  localStorage.setItem(
    STORAGE_KEYS.dark,
    String(enabled)
  );

  document.body.classList.toggle(
    "dark-mode",
    enabled
  );
}

);

/* LARGE TEXT */

$("largeTextToggle")
?.addEventListener(
"change",
(event) => {
const enabled =
event.target.checked;

  localStorage.setItem(
    STORAGE_KEYS.large,
    String(enabled)
  );

  document.body.classList.toggle(
    "large-answer-text",
    enabled
  );
}

);

/* FONT SIZE */

$("fontSizeSelect")
?.addEventListener(
"change",
(event) => {
const size =
event.target.value;

  localStorage.setItem(
    STORAGE_KEYS.font,
    size
  );

  document.documentElement.style.setProperty(
    "--answer-font-size",
    `${size}px`
  );
}

);

/* =========================================
CLEAR CHAT BUTTONS
========================================= */

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

/* =========================================
FILE UPLOAD
========================================= */

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

  state.attachedFile =
    file;

  const fileName =
    $("fileName");

  const fileSize =
    $("fileSize");

  if (fileName) {
    fileName.textContent =
      file.name;
  }

  if (fileSize) {
    const sizeInKB =
      Math.max(
        1,
        Math.round(
          file.size / 1024
        )
      );

    fileSize.textContent =
      `${sizeInKB} KB`;
  }

  if (filePreview) {
    filePreview.hidden = false;
  }

  const isTextFile =
    file.type.startsWith(
      "text/"
    ) ||
    /\.(txt|json|csv|js|html|css|md)$/i.test(
      file.name
    );

  if (isTextFile) {
    try {
      const fileText =
        await file.text();

      if (messageInput) {
        const maxText =
          8000;

        messageInput.value =
          `Please analyze this file:\n\n${fileText.slice(
            0,
            maxText
          )}`;

        updateCharacterCount();
      }

      notify(
        "File loaded into the message",
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
      "File attached. Text files are supported for automatic reading.",
      "📎"
    );
  }
}

);

/* =========================================
UPGRADE
========================================= */

$("upgradeButton")
?.addEventListener(
"click",
() => {
openModal("upgradeModal");
}
);

/*
The original HTML does not yet contain
an access-code input.

This function will work automatically
after the code input is added to the
upgrade modal.
*/

function checkAccessCode() {
const codeInput =
$("accessCodeInput");

const codeButton =
$("accessCodeButton");

if (!codeInput || !codeButton) {
return;
}

codeButton.addEventListener(
"click",
() => {
const enteredCode =
codeInput.value.trim();

  if (
    enteredCode === ACCESS_CODE
  ) {
    state.hasAccess = true;

    saveAccess();

    updateUsage();

    closeAllModals();

    codeInput.value = "";

    notify(
      "Access code accepted. You can continue!",
      "✓"
    );

  } else {
    notify(
      "Invalid access code.",
      "!"
    );
  }
}

);
}

/* =========================================
MODAL CLOSE BUTTONS
========================================= */

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

/* CLOSE MODAL WHEN CLICKING OUTSIDE */

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

/* =========================================
NOTIFICATION CLOSE
========================================= */

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

/* =========================================
START APPLICATION
========================================= */

function startApp() {
updateUsage();

updateCharacterCount();

renderRecentChats();

applySettings();

checkAccessCode();

setTimeout(
() => {
notify(
"Welcome to JDDHM Product of AI — AI Chatbot",
"🤖"
);
},
600
);
}

if (
document.readyState ===
"loading"
) {
document.addEventListener(
"DOMContentLoaded",
startApp
);
} else {
startApp();
}
