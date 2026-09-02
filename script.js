ated:
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
