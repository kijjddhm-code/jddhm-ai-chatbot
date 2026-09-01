const state = {
messages: [],
chats: JSON.parse(
localStorage.getItem("jddhm_chats") || "[]"
),
usage: Number(
localStorage.getItem("jddhm_usage") || 0
),
attachedFile: null
};

/* =========================
HELPER
========================= */

const $ = (id) => document.getElementById(id);

/* =========================
ELEMENTS
========================= */

const messageInput = $("messageInput");
const sendButton = $("sendButton");
const messagesEl = $("messages");
const welcomeScreen = $("welcomeScreen");
const typingIndicator = $("typingIndicator");
const fileInput = $("fileInput");
const filePreview = $("filePreview");
const sidebarBackdrop = $("sidebarBackdrop");

/* =========================
SAVE STATE
========================= */

function saveState() {
localStorage.setItem(
"jddhm_chats",
JSON.stringify(state.chats)
);

localStorage.setItem(
"jddhm_usage",
String(state.usage)
);
}

/* =========================
NOTIFICATIONS
========================= */

function notify(message, icon = "✓") {
const box = $("notification");
const text = $("notificationMessage");
const ico = $("notificationIcon");

if (!box || !text) return;

text.textContent = message;

if (ico) {
ico.textContent = icon;
}

box.hidden = false;

clearTimeout(window.notificationTimer);

window.notificationTimer = setTimeout(() => {
box.hidden = true;
}, 3500);
}

/* =========================
USAGE
========================= */

function updateUsage() {
const count = $("usageCount");
const progress = $("usageProgress");

if (count) {
count.textContent = "${state.usage} / 20";
}

if (progress) {
const percentage =
Math.min(
(state.usage / 20) * 100,
100
);

progress.style.width =
  `${percentage}%`;

}
}

/* =========================
ADD MESSAGE
========================= */

function addMessage(role, content) {
if (!messagesEl) return null;

const wrapper =
document.createElement("div");

wrapper.className =
"message ${role}";

/* AVATAR */

const avatar =
document.createElement("div");

avatar.className =
"message-avatar";

avatar.textContent =
role === "user"
? "👤"
: "🤖";

/* BODY */

const body =
document.createElement("div");

body.className =
"message-body";

/* TEXT */

const text =
document.createElement("div");

text.className =
"message-text";

text.textContent = content;

body.appendChild(text);

/* ASSISTANT ACTIONS */

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
          title:
            "JDDHM AI Chatbot",
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
            "text/plain"
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

messagesEl.scrollTo({
top:
messagesEl.scrollHeight,
behavior:
"smooth"
});

return wrapper;
}

/* =========================
THINKING INDICATOR
========================= */

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

/* =========================
NEW CHAT
========================= */

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

/* =========================
SEND MESSAGE
========================= */

async function sendMessage(text = null) {

const message =
text !== null
? text.trim()
: messageInput?.value.trim();

if (!message) return;

if (state.usage >= 20) {

openModal(
  "upgradeModal"
);

notify(
  "Free message limit reached",
  "⭐"
);

return;

}

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

if (messageInput) {

messageInput.value = "";

updateCharacterCount();

}

showThinking();

if (sendButton) {
sendButton.disabled = true;
}

try {

const response =
  await fetch(
    "/api/chat",
    {
      method:
        "POST",

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


state.usage++;

updateUsage();


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


messageInput?.focus();

}

}

/* =========================
SAVE RECENT CHAT
========================= */

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
chat.messages?.[0]?.content ===
firstUser.content
);

if (existing) {

existing.messages =
  [...state.messages];

existing.updated =
  Date.now();

} else {

state.chats.unshift({

  id:
    Date.now(),

  title:
    firstUser.content
      .slice(0, 40),

  messages:
    [...state.messages],

  updated:
    Date.now()

});

}

state.chats =
state.chats.slice(
0,
20
);

saveState();

renderRecentChats();

}

/* =========================
RENDER RECENT CHATS
========================= */

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
    document.createElement("button");


  button.type =
    "button";


  button.className =
    "recent-chat-item";


  button.textContent =
    chat.title;


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

/* =========================
LOAD CHAT
========================= */

function loadChat(id) {

const chat =
state.chats.find(
(item) =>
item.id === id
);

if (!chat) return;

state.messages =
[...chat.messages];

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

/* CLOSE MOBILE MENU */

document.body.classList.remove(
"sidebar-open"
);

notify(
"Chat opened",
"🕘"
);

}

/* =========================
CHARACTER COUNT
========================= */

function updateCharacterCount() {

const counter =
$("characterCount");

if (
counter &&
messageInput
) {

counter.textContent =
  `${messageInput.value.length} / 10000`;

}

}

/* =========================
MODALS
========================= */

function openModal(id) {

const modal =
$(id);

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

/* =========================
MODAL BUTTONS
========================= */

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

/* =========================
HAMBURGER MENU
========================= */

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
    "sidebar-collapsed"
  );

}

);

/* CLOSE SIDEBAR BACKDROP */

sidebarBackdrop
?.addEventListener(
"click",
() => {

  document.body.classList.remove(
    "sidebar-open"
  );

}

);

/* =========================
BUTTONS
========================= */

/* NEW CHAT */

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

/* SEND */

sendButton
?.addEventListener(
"click",
() => {
sendMessage();
}
);

/* LOGIN */

$("loginButton")
?.addEventListener(
"click",
() => {
openModal(
"loginModal"
);
}
);

/* SIGNUP */

$("signupButton")
?.addEventListener(
"click",
() => {
openModal(
"signupModal"
);
}
);

/* SETTINGS */

$("settingsButton")
?.addEventListener(
"click",
() => {
openModal(
"settingsModal"
);
}
);

$("headerSettings")
?.addEventListener(
"click",
() => {
openModal(
"settingsModal"
);
}
);

/* UPGRADE */

$("upgradeButton")
?.addEventListener(
"click",
() => {
openModal(
"upgradeModal"
);
}
);

/* LOGIN TO SIGNUP */

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

/* SIGNUP TO LOGIN */

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

/* CLEAR CHATS */

function clearChats() {

state.chats = [];

saveState();

renderRecentChats();

notify(
"Recent chats cleared",
"🗑️"
);

}

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

/* =========================
LOGIN
========================= */

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
    "jddhm_user",
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

/* =========================
SIGNUP
========================= */

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
  ) {
    return;
  }


  localStorage.setItem(
    "jddhm_user",
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

/* =========================
FILE UPLOAD
========================= */

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

  state.attachedFile =
    null;


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

    fileSize.textContent =
      `${Math.round(
        file.size / 1024
      )} KB`;

  }


  if (filePreview) {
    filePreview.hidden = false;
  }


  const isTextFile =
    file.type.startsWith(
      "text/"
    ) ||
    file.name.endsWith(
      ".json"
    ) ||
    file.name.endsWith(
      ".csv"
    ) ||
    file.name.endsWith(
      ".js"
    ) ||
    file.name.endsWith(
      ".html"
    ) ||
    file.name.endsWith(
      ".css"
    );


  if (isTextFile) {

    try {

      const fileText =
        await file.text();


      if (messageInput) {

        messageInput.value =
          `Please analyze this file:\n\n${fileText.slice(
            0,
            50000
          )}`;


        updateCharacterCount();

      }


      notify(
        "File loaded",
        "📎"
      );

    } catch {

      notify(
        "Could not read the file",
        "!"
      );

    }

  } else {

    notify(
      "File attached. Text extraction works with text, JSON, CSV, HTML, CSS and JavaScript files.",
      "📎"
    );

  }

}

);

/* =========================
QUICK ACTIONS
========================= */

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

/* =========================
SETTINGS
========================= */

function applySettings() {

const savedDark =
localStorage.getItem(
"jddhm_dark"
) === "true";

const savedLarge =
localStorage.getItem(
"jddhm_large"
) === "true";

const savedFont =
localStorage.getItem(
"jddhm_font"
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

if ($("darkModeToggle")) {

$("darkModeToggle").checked =
  savedDark;

}

if ($("largeTextToggle")) {

$("largeTextToggle").checked =
  savedLarge;

}

if ($("fontSizeSelect")) {

$("fontSizeSelect").value =
  savedFont;

}

}

$("darkModeToggle")
?.addEventListener(
"change",
(event) => {

  const enabled =
    event.target.checked;


  localStorage.setItem(
    "jddhm_dark",
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


  localStorage.setItem(
    "jddhm_large",
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


  localStorage.setItem(
    "jddhm_font",
    size
  );


  document.documentElement.style.setProperty(
    "--answer-font-size",
    `${size}px`
  );

}

);

/* =========================
ENTER TO SEND
========================= */

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

/* =========================
CLOSE NOTIFICATION
========================= */

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

/* =========================
STARTUP
========================= */

updateUsage();

updateCharacterCount();

renderRecentChats();

applySettings();

window.addEventListener(
"load",
() => {

setTimeout(
  () => {

    notify(
      "Welcome to JDDHM Product of AI — AI Chatbot",
      "🤖"
    );

  },
  500
);

}
);
