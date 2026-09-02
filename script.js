"use strict";

/* =========================================
   JDDHM PRODUCT OF AI - AI CHATBOT
   COMPLETE SCRIPT.JS
   NO UPGRADE / NO ACCESS CODE / NO PAYMENT
========================================= */

/* =========================================
   STORAGE KEYS
========================================= */

const STORAGE_KEYS = {
  chats: "jddhm_chats",
  user: "jddhm_user",
  dark: "jddhm_dark",
  large: "jddhm_large",
  font: "jddhm_font"
};

/* =========================================
   APPLICATION STATE
========================================= */

const state = {
  messages: [],
  chats: [],
  currentChatId: null,
  attachedFile: null,
  isSending: false
};

/* =========================================
   HELPERS
========================================= */

const $ = (id) => document.getElementById(id);

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

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
   LOAD SAVED CHATS
========================================= */

function loadSavedChats() {
  const saved = safeParse(
    localStorage.getItem(STORAGE_KEYS.chats),
    []
  );

  state.chats = Array.isArray(saved) ? saved : [];
}

/* =========================================
   SAVE CHATS
========================================= */

function saveChats() {
  localStorage.setItem(
    STORAGE_KEYS.chats,
    JSON.stringify(state.chats)
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
  }, 3500);
}

/* =========================================
   ADD MESSAGE TO SCREEN
========================================= */

function addMessage(role, content) {
  if (!messagesEl) return;

  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent =
    role === "user" ? "👤" : "🤖";

  const body = document.createElement("div");
  body.className = "message-body";

  const text = document.createElement("div");
  text.className = "message-text";
  text.textContent = content;

  body.appendChild(text);

  /* ASSISTANT MESSAGE ACTIONS */

  if (role === "assistant") {
    const actions = document.createElement("div");
    actions.className = "message-actions";

    /* COPY */

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.textContent = "📋 Copy";

    copyButton.addEventListener(
      "click",
      async () => {
        try {
          await navigator.clipboard.writeText(content);

          notify(
            "Answer copied",
            "✓"
          );
        } catch {
          notify(
            "Could not copy answer",
            "!"
          );
        }
      }
    );

    /* SHARE */

    const shareButton = document.createElement("button");
    shareButton.type = "button";
    shareButton.textContent = "📤 Share";

    shareButton.addEventListener(
      "click",
      async () => {
        try {
          if (navigator.share) {
            await navigator.share({
              title: "JDDHM AI Chatbot",
              text: content
            });
          } else {
            await navigator.clipboard.writeText(content);

            notify(
              "Answer copied for sharing",
              "✓"
            );
          }
        } catch {
          /* User cancelled or sharing failed */
        }
      }
    );

    /* DOWNLOAD */

    const downloadButton = document.createElement("button");
    downloadButton.type = "button";
    downloadButton.textContent = "💾 Download";

    downloadButton.addEventListener(
      "click",
      () => {
        const blob = new Blob(
          [content],
          {
            type: "text/plain"
          }
        );

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "jddhm-ai-answer.txt";

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
}

/* =========================================
   THINKING INDICATOR
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
  state.currentChatId = null;
  state.attachedFile = null;

  if (messagesEl) {
    messagesEl.innerHTML = "";
  }

  if (welcomeScreen) {
    welcomeScreen.hidden = false;
  }

  if (messageInput) {
    messageInput.value = "";
    messageInput.focus();
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

/* =========================================
   SEND MESSAGE
========================================= */

async function sendMessage(customText = null) {
  if (state.isSending) return;

  const message =
    customText !== null
      ? String(customText).trim()
      : messageInput?.value.trim();

  if (!message) return;

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

  state.isSending = true;

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
        "Unable to contact the AI server."
      }`
    );

    notify(
      "AI request failed",
      "!"
    );

  } finally {
    hideThinking();

    state.isSending = false;

    if (sendButton) {
      sendButton.disabled = false;
    }

    messageInput?.focus();
  }
}

/* =========================================
   SAVE RECENT CHAT
========================================= */

function saveRecentChat() {
  const firstUserMessage =
    state.messages.find(
      (message) =>
        message.role === "user"
    );

  if (!firstUserMessage) return;

  if (!state.currentChatId) {
    state.currentChatId =
      Date.now().toString();
  }

  const existingIndex =
    state.chats.findIndex(
      (chat) =>
        chat.id === state.currentChatId
    );

  const chatData = {
    id: state.currentChatId,

    title:
      firstUserMessage.content
        .slice(0, 50),

    messages:
      [...state.messages],

    updated:
      Date.now()
  };

  if (existingIndex >= 0) {
    state.chats[existingIndex] =
      chatData;
  } else {
    state.chats.unshift(chatData);
  }

  state.chats.sort(
    (a, b) =>
      b.updated - a.updated
  );

  /* Keep the latest 20 chats */

  state.chats =
    state.chats.slice(0, 20);

  saveChats();

  renderRecentChats();
}

/* =========================================
   RENDER RECENT CHATS
========================================= */

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
        chat.title ||
        "New Chat";

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

/* =========================================
   LOAD CHAT
========================================= */

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
      `${messageInput.value.length} / 10000`;
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
   MENU
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
    `${fontSize}px`
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
        file.type.startsWith("text/") ||
        /\.(txt|json|csv|js|html|css|md)$/i.test(
          file.name
        );

      if (isTextFile) {
        try {
          const fileText =
            await file.text();

          if (messageInput) {
            const maxText = 8000;

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
          "File attached. Automatic reading works with text files.",
          "📎"
        );
      }
    }
  );

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
          if (event.target === modal) {
            modal.hidden = true;
          }
        }
      );
    }
  );

/* =========================================
   CLOSE NOTIFICATION
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
  loadSavedChats();

  updateCharacterCount();

  renderRecentChats();

  applySettings();

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
