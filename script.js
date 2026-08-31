const state = {
  messages: [],
  chats: JSON.parse(localStorage.getItem("jddhm_chats") || "[]"),
  usage: Number(localStorage.getItem("jddhm_usage") || 0),
  attachedFile: null
};

const $ = (id) => document.getElementById(id);

const messageInput = $("messageInput");
const sendButton = $("sendButton");
const messagesEl = $("messages");
const welcomeScreen = $("welcomeScreen");
const typingIndicator = $("typingIndicator");
const fileInput = $("fileInput");
const filePreview = $("filePreview");

function saveState() {
  localStorage.setItem("jddhm_chats", JSON.stringify(state.chats));
  localStorage.setItem("jddhm_usage", String(state.usage));
}

function notify(message, icon = "✓") {
  const box = $("notification");
  const text = $("notificationMessage");
  const ico = $("notificationIcon");

  if (!box || !text) return;

  text.textContent = message;
  if (ico) ico.textContent = icon;

  box.hidden = false;

  clearTimeout(window.notificationTimer);
  window.notificationTimer = setTimeout(() => {
    box.hidden = true;
  }, 3500);
}

function updateUsage() {
  const count = $("usageCount");
  const progress = $("usageProgress");

  if (count) count.textContent = `${state.usage} / 20`;

  if (progress) {
    progress.style.width =
      `${Math.min((state.usage / 20) * 100, 100)}%`;
  }
}

function addMessage(role, content) {
  if (!messagesEl) return null;

  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = role === "user" ? "👤" : "🤖";

  const body = document.createElement("div");
  body.className = "message-body";

  const text = document.createElement("div");
  text.className = "message-text";
  text.textContent = content;

  body.appendChild(text);

  if (role === "assistant") {
    const actions = document.createElement("div");
    actions.className = "message-actions";

    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = "📋 Copy";

    copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(content);
        notify("Answer copied", "✓");
      } catch {
        notify("Copy failed", "!");
      }
    };

    const share = document.createElement("button");
    share.type = "button";
    share.textContent = "📤 Share";

    share.onclick = async () => {
      try {
        if (navigator.share) {
          await navigator.share({
            title: "JDDHM AI Chatbot",
            text: content
          });
        } else {
          await navigator.clipboard.writeText(content);
          notify("Answer copied for sharing", "✓");
        }
      } catch {
        // User cancelled share.
      }
    };

    const download = document.createElement("button");
    download.type = "button";
    download.textContent = "💾 Download";

    download.onclick = () => {
      const blob = new Blob([content], {
        type: "text/plain"
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = "jddhm-ai-answer.txt";
      a.click();

      URL.revokeObjectURL(url);

      notify("Answer downloaded", "✓");
    };

    actions.append(copy, share, download);
    body.appendChild(actions);
  }

  wrapper.append(avatar, body);
  messagesEl.appendChild(wrapper);

  messagesEl.scrollTop = messagesEl.scrollHeight;

  return wrapper;
}

function showThinking() {
  if (typingIndicator) {
    typingIndicator.hidden = false;
  }
}

function hideThinking() {
  if (typingIndicator) {
    typingIndicator.hidden = true;
  }
}

function newChat() {
  state.messages = [];
  state.attachedFile = null;

  if (messagesEl) messagesEl.innerHTML = "";

  if (welcomeScreen) welcomeScreen.hidden = false;

  if (messageInput) messageInput.value = "";

  if (filePreview) filePreview.hidden = true;

  notify("New chat started", "＋");
}

async function sendMessage(text = null) {
  const message =
    text !== null
      ? text.trim()
      : messageInput?.value.trim();

  if (!message) return;

  if (state.usage >= 20) {
    openModal("upgradeModal");
    notify("Free message limit reached", "⭐");
    return;
  }

  if (welcomeScreen) {
    welcomeScreen.hidden = true;
  }

  state.messages.push({
    role: "user",
    content: message
  });

  addMessage("user", message);

  if (messageInput) {
    messageInput.value = "";
    updateCharacterCount();
  }

  showThinking();

  if (sendButton) {
    sendButton.disabled = true;
  }

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: state.messages
      })
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("Server returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(
        data.error || `AI request failed (${response.status}).`
      );
    }

    const answer =
      data.reply ||
      data.text ||
      data.message ||
      "The AI returned no answer.";

    state.messages.push({
      role: "assistant",
      content: answer
    });

    addMessage("assistant", answer);

    state.usage++;
    updateUsage();
    saveState();

    saveRecentChat();

  } catch (error) {
    console.error("Chat error:", error);

    addMessage(
      "assistant",
      `⚠️ ${error.message || "Unable to contact the AI."}`
    );

    notify("AI request failed", "!");
  } finally {
    hideThinking();

    if (sendButton) {
      sendButton.disabled = false;
    }

    messageInput?.focus();
  }
}

function saveRecentChat() {
  const firstUser = state.messages.find(
    (m) => m.role === "user"
  );

  if (!firstUser) return;

  const existing = state.chats.find(
    (chat) =>
      chat.messages?.[0]?.content === firstUser.content
  );

  if (existing) {
    existing.messages = [...state.messages];
    existing.updated = Date.now();
  } else {
    state.chats.unshift({
      id: Date.now(),
      title: firstUser.content.slice(0, 40),
      messages: [...state.messages],
      updated: Date.now()
    });
  }

  state.chats = state.chats.slice(0, 20);

  saveState();
  renderRecentChats();
}

function renderRecentChats() {
  const container = $("recentChats");
  if (!container) return;

  container.innerHTML = "";

  if (!state.chats.length) {
    const empty = document.createElement("div");
    empty.className = "empty-recent";
    empty.textContent = "No recent chats";
    container.appendChild(empty);
    return;
  }

  state.chats.forEach((chat) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "recent-chat-item";
    button.textContent = chat.title;

    button.onclick = () => loadChat(chat.id);

    container.appendChild(button);
  });
}

function loadChat(id) {
  const chat = state.chats.find((item) => item.id === id);

  if (!chat) return;

  state.messages = [...chat.messages];

  if (welcomeScreen) {
    welcomeScreen.hidden = true;
  }

  if (messagesEl) {
    messagesEl.innerHTML = "";
  }

  state.messages.forEach((message) => {
    addMessage(message.role, message.content);
  });

  closeAllModals();

  notify("Chat opened", "🕘");
}

function updateCharacterCount() {
  const counter = $("characterCount");

  if (counter && messageInput) {
    counter.textContent =
      `${messageInput.value.length} / 10000`;
  }
}

/* =========================
   MODALS
========================= */

function openModal(id) {
  const modal = $(id);
  if (modal) modal.hidden = false;
}

function closeAllModals() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.hidden = true;
  });
}

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeAllModals);
});

/* =========================
   BUTTONS
========================= */

$("newChatButton")?.addEventListener("click", newChat);
$("headerNewChat")?.addEventListener("click", newChat);
$("mobileNewChat")?.addEventListener("click", newChat);

$("sendButton")?.addEventListener("click", () => {
  sendMessage();
});

$("loginButton")?.addEventListener("click", () => {
  openModal("loginModal");
});

$("signupButton")?.addEventListener("click", () => {
  openModal("signupModal");
});

$("settingsButton")?.addEventListener("click", () => {
  openModal("settingsModal");
});

$("headerSettings")?.addEventListener("click", () => {
  openModal("settingsModal");
});

$("upgradeButton")?.addEventListener("click", () => {
  openModal("upgradeModal");
});

$("openSignupFromLogin")?.addEventListener("click", () => {
  closeAllModals();
  openModal("signupModal");
});

$("openLoginFromSignup")?.addEventListener("click", () => {
  closeAllModals();
  openModal("loginModal");
});

$("clearChatsButton")?.addEventListener("click", () => {
  state.chats = [];
  saveState();
  renderRecentChats();
  notify("Recent chats cleared", "🗑️");
});

/* =========================
   LOGIN / ACCOUNT DEMO
========================= */

$("loginForm")?.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = $("loginEmail")?.value.trim();

  if (!email) return;

  localStorage.setItem(
    "jddhm_user",
    JSON.stringify({ email })
  );

  closeAllModals();
  notify("Login saved on this device", "✓");
});

$("signupForm")?.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = $("signupName")?.value.trim();
  const email = $("signupEmail")?.value.trim();

  if (!name || !email) return;

  localStorage.setItem(
    "jddhm_user",
    JSON.stringify({ name, email })
  );

  closeAllModals();
  notify("Account created on this device", "✓");
});

/* =========================
   FILE UPLOAD
========================= */

$("attachButton")?.addEventListener("click", () => {
  fileInput?.click();
});

$("removeFileButton")?.addEventListener("click", () => {
  state.attachedFile = null;

  if (fileInput) fileInput.value = "";
  if (filePreview) filePreview.hidden = true;

  notify("File removed", "×");
});

fileInput?.addEventListener("change", async () => {
  const file = fileInput.files?.[0];

  if (!file) return;

  state.attachedFile = file;

  if ($("fileName")) {
    $("fileName").textContent = file.name;
  }

  if ($("fileSize")) {
    $("fileSize").textContent =
      `${Math.round(file.size / 1024)} KB`;
  }

  if (filePreview) {
    filePreview.hidden = false;
  }

  /*
   * Read simple text files and put their contents
   * into the next AI message.
   */

  if (
    file.type.startsWith("text/") ||
    file.name.endsWith(".json") ||
    file.name.endsWith(".csv")
  ) {
    try {
      const text = await file.text();

      if (messageInput) {
        messageInput.value =
          `Please analyze this file:\n\n${text.slice(0, 50000)}`;

        updateCharacterCount();
      }

      notify("File loaded", "📎");
    } catch {
      notify("Could not read the file", "!");
    }
  } else {
    notify(
      "File attached. Text extraction is available for text, CSV and JSON files.",
      "📎"
    );
  }
});

/* =========================
   QUICK ACTIONS
========================= */

document.querySelectorAll(".quick-action[data-prompt]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const prompt = button.dataset.prompt;
      if (prompt) sendMessage(prompt);
    });
  });

/* Remove image/web buttons because
   those features are not being used. */

$("imageButton")?.remove();
$("webButton")?.remove();
$("quickImageButton")?.remove();

/* =========================
   TEXT SETTINGS
========================= */

const savedDark =
  localStorage.getItem("jddhm_dark") === "true";

const savedLarge =
  localStorage.getItem("jddhm_large") === "true";

const savedFont =
  localStorage.getItem("jddhm_font") || "16";

function applySettings() {
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
    `${savedFont}px`
  );
}

$("darkModeToggle")?.addEventListener("change", (event) => {
  localStorage.setItem(
    "jddhm_dark",
    event.target.checked
  );

  document.body.classList.toggle(
    "dark-mode",
    event.target.checked
  );
});

$("largeTextToggle")?.addEventListener("change", (event) => {
  localStorage.setItem(
    "jddhm_large",
    event.target.checked
  );

  document.body.classList.toggle(
    "large-answer-text",
    event.target.checked
  );
});

$("fontSizeSelect")?.addEventListener("change", (event) => {
  localStorage.setItem(
    "jddhm_font",
    event.target.value
  );

  document.documentElement.style.setProperty(
    "--answer-font-size",
    `${event.target.value}px`
  );
});

if ($("darkModeToggle")) {
  $("darkModeToggle").checked = savedDark;
}

if ($("largeTextToggle")) {
  $("largeTextToggle").checked = savedLarge;
}

if ($("fontSizeSelect")) {
  $("fontSizeSelect").value = savedFont;
}

/* =========================
   ENTER TO SEND
========================= */

messageInput?.addEventListener("keydown", (event) => {
  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {
    event.preventDefault();
    sendMessage();
  }
});

messageInput?.addEventListener(
  "input",
  updateCharacterCount
);

/* =========================
   NOTIFICATION CLOSE
========================= */

$("notificationClose")?.addEventListener("click", () => {
  $("notification").hidden = true;
});

/* =========================
   STARTUP
========================= */

updateUsage();
updateCharacterCount();
renderRecentChats();
applySettings();

window.addEventListener("load", () => {
  setTimeout(() => {
    notify(
      "Welcome to JDDHM Product of AI — AI Chatbot",
      "🤖"
    );
  }, 500);
});
