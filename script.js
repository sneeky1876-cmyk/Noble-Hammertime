// ---------- CONFIG ----------

const formats = [
  { code: "d", label: "Short Date" },
  { code: "D", label: "Long Date" },
  { code: "t", label: "Short Time" },
  { code: "T", label: "Long Time" },
  { code: "f", label: "Short Date/Time" },
  { code: "F", label: "Long Date/Time" },
  { code: "R", label: "Relative Time" },
];

const utcQuickHours = [15, 16, 17, 18, 19, 20, 21, 22, 23];

const sessionKinds = [
  {
    value: "solos",
    label: "Noble Solos",
    short: "Solos",
    accentDot: "amber",
    icon: "img/noble-solos.png",
    description: "Solos ladder with 20m delay to first game.",
  },
  {
    value: "solos_closed",
    label: "Noble Solos Closed",
    short: "Solos Closed",
    accentDot: "amber",
    icon: "img/noble-closedsolos.png",
    description: "Closed solos; top 3 get Division 3 invite.",
  },
  {
    value: "div0",
    label: "Noble Division 0",
    short: "Div 0",
    accentDot: "purple",
    icon: "img/noble-div0.png",
    description: "Highest division practice with 20m delay.",
  },
  {
    value: "div2",
    label: "Noble Division 2",
    short: "Div 2",
    accentDot: "lime",
    icon: "img/noble-div2.png",
    description: "Division 2 practice with 15m delay.",
  },
  {
    value: "div3",
    label: "Noble Division 3",
    short: "Div 3",
    accentDot: "blue",
    icon: "img/noble-div3.png",
    description: "Division 3 practice with 15m delay.",
  },
  {
    value: "247",
    label: "Noble 24/7",
    short: "24/7",
    accentDot: "yellow",
    icon: "img/noble-247.png",
    description: "24/7 queue with 15m delay.",
  },
];

const queueTypes = [
  { value: "duos", label: "Duos" },
  { value: "squads", label: "Squads" },
];

const LS_KEY_DISCORD = "nobleDiscordId";
const LS_KEY_THEME = "nobleTheme";
const LS_KEY_ANNOUNCE = "nobleAnnounceMode";
const LS_KEY_TS_HELPER = "nobleTimestampHelper";
const LS_KEY_LAST_PAGE = "nobleLastPage";


// division-specific config (not solos / solos_closed)
const divisionConfig = {
  div0: {
    name: "Division 0",
    delayMinutes: 20,
    emoji: "<:ArrowRight:1398422494817419385>",
    channels:
      "<#1282840995846950962>, <#1282841044521717761> & <#1282841572336996372>",
    reactsDuo: { first: 55, second: 110 },
    reactsSquad: { first: 25, second: 50 },
  },
  div2: {
    name: "Division 2",
    delayMinutes: 15,
    emoji: "<:arrow:1398419775574511766>",
    channels:
      "<#757574098359550082>, <#860622870563520513> & <#912669854543269888>",
    reactsDuo: { first: 55, second: 110 },
    reactsSquad: { first: 25, second: 50 },
  },
  div3: {
    name: "Division 3",
    delayMinutes: 15,
    emoji: "<:ArrowRight:1398315425913372872>",
    channels:
      "<#902656971801493545>, <#902656971801493547> & <#1383042801754968135>",
    reactsDuo: { first: 55, second: 110 },
    reactsSquad: { first: 25, second: 50 },
  },
  "247": {
    name: "24/7",
    delayMinutes: 15,
    emoji: "<:ArrowRight:1398422494817419385>",
    channels:
      "<#1282840995846950962>, <#1282841044521717761> & <#1282841572336996372>",
    reactsDuo: { first: 55, second: 110 },
    reactsSquad: { first: 25, second: 50 },
  },
};

// ---------- STATE ----------

let state = {
  unix: null,
  announceMode: false,
  includeSecondLobby: false,
  sessionKind: "solos",
  queueType: "duos",
  discordId: "",

  // scrims
  scrimUnix: null,
  scrimQueueType: "solos", // "solos" | "duos" | "squads"
};


// ---------- HELPERS ----------

function setTimezoneLabel() {
  const el = document.getElementById("timezoneLabel");
  if (!el) return;
  try {
    const tz =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "System time";
    el.textContent = tz;
  } catch {
    el.textContent = "System time";
  }
}

function pad(n) {
  return String(n).padStart(2, "0");
}

// exact current local time including seconds
function defaultDateTimeLocal() {
  const now = new Date();
  return dateTimeStringFromDate(now);
}

function dateTimeStringFromDate(d) {
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes()) +
    ":" +
    pad(d.getSeconds())
  );
}

function buildPreview(unix, fmt) {
  const date = new Date(unix * 1000);
  if (fmt === "R") {
    const now = Date.now();
    const diffMs = date.getTime() - now;
    const diffSec = Math.round(diffMs / 1000);
    const abs = Math.abs(diffSec);
    const units = [
      { name: "year", secs: 365 * 24 * 3600 },
      { name: "month", secs: 30 * 24 * 3600 },
      { name: "day", secs: 24 * 3600 },
      { name: "hour", secs: 3600 },
      { name: "minute", secs: 60 },
      { name: "second", secs: 1 },
    ];
    const unit = units.find((u) => abs >= u.secs) || units[units.length - 1];
    const value = Math.round(abs / unit.secs);
    const label = value + " " + unit.name + (value !== 1 ? "s" : "");
    return diffSec >= 0 ? "in " + label : label + " ago";
  }

  let options;
  switch (fmt) {
    case "d":
      options = { dateStyle: "short" };
      break;
    case "D":
      options = { dateStyle: "full" };
      break;
    case "t":
      options = { timeStyle: "short" };
      break;
    case "T":
      options = { timeStyle: "medium" };
      break;
    case "f":
      options = { dateStyle: "medium", timeStyle: "short" };
      break;
    case "F":
      options = { dateStyle: "full", timeStyle: "short" };
      break;
    default:
      options = { dateStyle: "medium", timeStyle: "short" };
  }
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

function toUnixFromLocalInput(value) {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return Math.floor(d.getTime() / 1000);
}

function showToast(text) {
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1400);
}

async function copyText(text) {
  if (!text) return;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const tmp = document.createElement("textarea");
      tmp.value = text;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand("copy");
      document.body.removeChild(tmp);
    }
    showToast(
      "Copied: " + (text.length > 40 ? text.slice(0, 40) + "…" : text)
    );
  } catch (e) {
    console.error(e);
    showToast("Could not copy :(");
  }
}

function setInputsFromUnix(unix) {
  if (unix == null) return;
  const d = new Date(unix * 1000);
  const dtInput = document.getElementById("datetime");
  if (dtInput) {
    dtInput.value = dateTimeStringFromDate(d);
  }
}

function applyUnix(unix) {
  state.unix = unix;
  if (unix != null) setInputsFromUnix(unix);
  renderAll();
}

// ---------- SCRIMS HELPERS ----------

// next scrim time based on weekday/weekend & queue type
function computeNextScrimUnix(queueType) {
  const now = new Date();

  for (let i = 0; i < 10; i++) {
    const d = new Date(now.getTime());
    d.setDate(now.getDate() + i);

    const day = d.getDay(); // 0=Sun, 6=Sat
    const isWeekend = day === 0 || day === 6;

    let hour = isWeekend ? 13 : 14; // 1h earlier on weekend
    let minute = 30; // solos default

    if (queueType === "duos") minute = 40;
    if (queueType === "squads") minute = 50;

    d.setHours(hour, minute, 0, 0);

    // pick the *next* time in the future
    if (d.getTime() > now.getTime()) {
      return Math.floor(d.getTime() / 1000);
    }
  }

  // fallback: now
  return Math.floor(now.getTime() / 1000);
}

function buildScrimFirstMessage() {
  if (state.scrimUnix == null) return "";

  const t = state.scrimUnix;

  return (
    "<@&854727975550320650>\n\n" +
    `<:ArrowRight:1398394460941062327> The **First Match** is @ <t:${t}:t> ~ <t:${t}:R>!\n\n` +
    "• Please read the <#854739679320473610> before playing. 🏆"
  );
}

function buildScrimConcludeMessage() {
  if (state.scrimUnix == null) return "";

  const map = { solos: "solo", duos: "duo", squads: "squad" };
  const label = map[state.scrimQueueType] || "squad";
  const t = state.scrimUnix;

  return (
    `**The ${label} Scrims have __concluded__!**\n\n` +
    `<:ArrowRight:1398394460941062327> Games will resume **at <t:${t}:t>** <a:heartcartoon:919242010123206666>\n\n` +
    "• Make sure to invite your friends over, https://discord.gg/EU"
  );
}

function renderScrimQueueButtons() {
  const container = document.getElementById("scrimQueueButtons");
  container.innerHTML = "";

  const types = [
    { value: "solos", label: "Solos" },
    { value: "duos", label: "Duos" },
    { value: "squads", label: "Squads" },
  ];

  types.forEach((t) => {
    const btn = document.createElement("button");
    btn.className =
      "pill-btn" + (state.scrimQueueType === t.value ? " selected" : "");
    btn.textContent = t.label;

    btn.onclick = () => {
      state.scrimQueueType = t.value;
      renderScrimQueueButtons(); // 🔥 THIS LINE IS THE IMPORTANT ONE
      updateScrimTime();
    };

    container.appendChild(btn);
  });
}



function renderScrims() {
  const firstArea = document.getElementById("scrimFirstText");
  const concludeArea = document.getElementById("scrimConcludeText");
  const preview = document.getElementById("scrimTimePreview");

  if (!firstArea || !concludeArea || !preview) return;

  if (state.scrimUnix == null) {
    firstArea.value =
      "Pick a scrim time above (auto or manual) to generate the First Match message.";
    concludeArea.value =
      "Pick a scrim time above (auto or manual) to generate the conclude message.";
    preview.textContent =
      'Select a scrim time or use "Set to next scheduled time".';
    return;
  }

  const d = new Date(state.scrimUnix * 1000);
  const localStr = d.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });

  preview.textContent =
    `Using scrim time: ${localStr}  — Discord: ` +
    `<t:${state.scrimUnix}:t>`;

  firstArea.value = buildScrimFirstMessage();
  concludeArea.value = buildScrimConcludeMessage();
}


// ---------- RENDERING ----------

function renderUtcButtons() {
  const container = document.getElementById("utcButtons");
  container.innerHTML = "";
  utcQuickHours.forEach((h) => {
    const btn = document.createElement("button");
    btn.className = "utc-btn";
    btn.textContent = pad(h) + ":00";
    btn.addEventListener("click", () => {
      const today = new Date();
      today.setHours(h, 0, 0, 0);
      const unix = Math.floor(today.getTime() / 1000);
      applyUnix(unix);
    });
    container.appendChild(btn);
  });
}

function renderSessionCards() {
  const container = document.getElementById("sessionCards");
  container.innerHTML = "";

  sessionKinds.forEach((s) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className =
      "session-card" + (state.sessionKind === s.value ? " selected" : "");

    // icon
    const iconWrap = document.createElement("div");
    iconWrap.className = "session-icon-wrap";
    const img = document.createElement("img");
    img.src = s.icon;
    img.alt = s.label;
    img.className = "session-icon";
    iconWrap.appendChild(img);

    // text container
    const texts = document.createElement("div");
    texts.className = "session-texts";

    // row with title + dot
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.justifyContent = "space-between";

    const title = document.createElement("div");
    title.className = "session-title";
    title.textContent = s.label;

    const dot = document.createElement("span");
    dot.className = "session-dot " + s.accentDot;
    if (state.sessionKind !== s.value) dot.style.visibility = "hidden";

    row.appendChild(title);
    row.appendChild(dot);
    texts.appendChild(row);

    card.appendChild(iconWrap);
    card.appendChild(texts);

    card.addEventListener("click", () => {
      state.sessionKind = s.value;
      renderSessionCards();
      renderAnnouncement();
    });

    container.appendChild(card);
  });
}


function renderFormatTable() {
  const tbody = document.getElementById("formatRows");
  tbody.innerHTML = "";

  if (state.unix == null) {
    const tr = document.createElement("tr");
    const tdFmt = document.createElement("td");
    const tdMsg = document.createElement("td");
    tdMsg.colSpan = 2;
    tdMsg.textContent = "Select a base time to generate Discord timestamps.";
    tdMsg.style.color = "#6b7280";
    tr.appendChild(tdFmt);
    tr.appendChild(tdMsg);
    tbody.appendChild(tr);
    return;
  }

  // 1) normal format rows (no Copy unix buttons here)
  formats.forEach((fmt) => {
    const tr = document.createElement("tr");

    const tdFmt = document.createElement("td");
    const pill = document.createElement("div");
    pill.className = "format-pill";
    const codeEl = document.createElement("code");
    codeEl.textContent = fmt.code;
    const spanLabel = document.createElement("span");
    spanLabel.textContent = fmt.label;
    pill.appendChild(codeEl);
    pill.appendChild(spanLabel);
    tdFmt.appendChild(pill);

    const tdSyntax = document.createElement("td");

    const syntaxRow = document.createElement("div");
    syntaxRow.className = "syntax-row";
    const input = document.createElement("input");
    input.type = "text";
    input.readOnly = true;
    input.className = "syntax-input";

    const snippet =
      fmt.code === "f"
        ? `<t:${state.unix}>`
        : `<t:${state.unix}:${fmt.code}>`;
    input.value = snippet;
    input.addEventListener("focus", () => input.select());

    const btnTag = document.createElement("button");
    btnTag.type = "button";
    btnTag.className = "btn-copy";
    btnTag.textContent = "Copy tag";
    btnTag.addEventListener("click", () => copyText(snippet));

    syntaxRow.appendChild(input);
    syntaxRow.appendChild(btnTag);
    tdSyntax.appendChild(syntaxRow);

    const tdPreview = document.createElement("td");
    tdPreview.className = "hide-sm";
    tdPreview.textContent = buildPreview(state.unix, fmt.code);
    tdPreview.style.fontSize = "0.82rem";
    tdPreview.style.color = "#e5e7eb";

    tr.appendChild(tdFmt);
    tr.appendChild(tdSyntax);
    tr.appendChild(tdPreview);
    tbody.appendChild(tr);
  });

  // 2) unix-only row LAST (this is the only place with Copy unix)
  const trUnix = document.createElement("tr");
  const tdUnixFmt = document.createElement("td");
  const pillUnix = document.createElement("div");
  pillUnix.className = "format-pill";
  const codeUnix = document.createElement("code");
  codeUnix.textContent = "unix";
  const spanUnix = document.createElement("span");
  spanUnix.textContent = "Raw timestamp";
  pillUnix.appendChild(codeUnix);
  pillUnix.appendChild(spanUnix);
  tdUnixFmt.appendChild(pillUnix);

  const tdUnixSyntax = document.createElement("td");
  const rowUnix = document.createElement("div");
  rowUnix.className = "syntax-row";
  const inputUnix = document.createElement("input");
  inputUnix.type = "text";
  inputUnix.readOnly = true;
  inputUnix.className = "syntax-input";
  inputUnix.value = String(state.unix);
  inputUnix.addEventListener("focus", () => inputUnix.select());
  const btnUnixCopy = document.createElement("button");
  btnUnixCopy.type = "button";
  btnUnixCopy.className = "btn-copy";
  btnUnixCopy.textContent = "Copy unix";
  btnUnixCopy.addEventListener("click", () =>
    copyText(String(state.unix))
  );
  rowUnix.appendChild(inputUnix);
  rowUnix.appendChild(btnUnixCopy);
  tdUnixSyntax.appendChild(rowUnix);

  const tdUnixPreview = document.createElement("td");
  tdUnixPreview.className = "hide-sm";
  tdUnixPreview.textContent = state.unix;
  tdUnixPreview.style.fontSize = "0.82rem";

  trUnix.appendChild(tdUnixFmt);
  trUnix.appendChild(tdUnixSyntax);
  trUnix.appendChild(tdUnixPreview);
  tbody.appendChild(trUnix);
}



function renderQueueButtons() {
  const block = document.getElementById("queueTypeBlock");
  const row = document.getElementById("queueButtons");

  if (state.sessionKind === "solos" || state.sessionKind === "solos_closed") {
    block.style.display = "none";
    return;
  }

  block.style.display = "";
  row.innerHTML = "";

  queueTypes.forEach((q) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill-btn";

    // highlight when selected
    if (state.queueType === q.value) btn.classList.add("selected");

    btn.textContent = q.label;

    btn.addEventListener("click", () => {
      state.queueType = q.value;
      renderQueueButtons();     // redraw buttons AND highlight
      renderAnnouncement();     // update text
    });

    row.appendChild(btn);
  });
}


function renderAnnounceSessionButtons() {
  const container = document.getElementById("announceSessionButtons");
  container.innerHTML = "";
  sessionKinds.forEach((s) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "pill-btn" + (state.sessionKind === s.value ? " selected" : "");
    btn.textContent = s.short;
    btn.addEventListener("click", () => {
      state.sessionKind = s.value;
      renderAnnounceSessionButtons();
      renderQueueButtons();
      renderAnnouncement();
      renderSessionCards();
      updateAnnounceIcon();
    });
    container.appendChild(btn);
  });
}

function updateAnnounceIcon() {
  const iconEl = document.getElementById("announceSessionIcon");
  const titleEl = document.getElementById("announceSessionTitle");
  const current = sessionKinds.find((s) => s.value === state.sessionKind);
  if (!current) return;
  if (iconEl) iconEl.src = current.icon;
  if (titleEl) titleEl.textContent = current.label;
}

// ---------- ANNOUNCEMENT BUILDERS ----------

function buildSolosAnnouncement() {
  const delayMinutes = 20;
  const emoji = "<:ArrowRight:1398336238448152717>";
  const id = state.discordId.trim();

  if (!state.includeSecondLobby) {
    const baseTag = `<t:${state.unix}:t>`;
    const firstUnix = state.unix + delayMinutes * 60;
    const firstTag = `<t:${firstUnix}:t>`;

    let text =
      "@everyone\n\n" +
      "**Noble Solos Practice Session**\n\n" +
      `${emoji} Registration opens @ ${baseTag}\n\n` +
      `${emoji} First Game Commences @ ${firstTag}\n\n` +
      "The host for this session is: <@USER>, Direct Message them for help.\n\n" +
      "• Session lasts 3 Games. **Miss a single game and you will be banned.**\n" +
      "• Make sure to read <#1098721307643875390>, <#1124136360522027179> & <#1098721307643875391> before the games.\n" +
      "• Top 10 = Noble Solos Closed <:solos_closed:1403796828239040534> \n\n" +
      "Required at least **110+ Reacts**";

    if (id) text = text.replace(/<@USER>/g, `<@${id}>`);
    return text;
  }

  const reg2Unix = state.unix + 5 * 60;
  const regTag2 = `<t:${reg2Unix}:t>`;
  const firstUnix2 = reg2Unix + delayMinutes * 60;
  const firstTag2 = `<t:${firstUnix2}:t>`;

  let text2 =
    "@everyone\n\n" +
    "**Noble Solos Practice Session**\n\n" +
    "**Second Lobby**\n\n" +
    `${emoji} Registration opens @ ${regTag2}\n\n` +
    `${emoji} First Game Commences @ ${firstTag2}\n\n` +
    "The host for this session is: <@USER>, Direct Message them for help.\n\n" +
    "• Session lasts 3 Games. **Miss a single game and you will be banned.**\n" +
    "• Make sure to read <#1098721307643875390>, <#1124136360522027179> & <#1098721307643875391> before the games.\n" +
    "• Top 10 = Noble Solos Closed <:solos_closed:1403796828239040534> \n\n" +
    "Required at least **110+ Reacts**";

  if (id) text2 = text2.replace(/<@USER>/g, `<@${id}>`);
  return text2;
}

function buildSolosClosedAnnouncement() {
  const delayMinutes = 20;
  const emoji = "<:ArrowRight:1403465070234701854>";
  const id = state.discordId.trim();

  if (!state.includeSecondLobby) {
    const baseTag = `<t:${state.unix}:t>`;
    const firstUnix = state.unix + delayMinutes * 60;
    const firstTag = `<t:${firstUnix}:t>`;

    let text =
      "@everyone\n\n" +
      "**Noble Solos Closed Practice Session**\n\n" +
      `${emoji} Registration opens @ ${baseTag}\n\n` +
      `${emoji} First Game Commences @ ${firstTag}\n\n` +
      "The host for this session is: <@USER>, Direct Message them for help.\n\n" +
      "• Session lasts 3 Games. **Miss a single game and you will be banned.**\n" +
      "• Make sure to read <#1403403385146704044>, <#1403403385146704045> & <#1403403385146704043> before the games.\n" +
      "• Top 3 = Division 3 Invite <:noble_division3_icon:1403477545348759645>\n\n" +
      "Required at least 110+ Reacts.";

    if (id) text = text.replace(/<@USER>/g, `<@${id}>`);
    return text;
  }

  const reg2Unix = state.unix + 5 * 60;
  const regTag2 = `<t:${reg2Unix}:t>`;
  const firstUnix2 = reg2Unix + delayMinutes * 60;
  const firstTag2 = `<t:${firstUnix2}:t>`;

  let text2 =
    "@everyone\n\n" +
    "**Noble Solos Closed Practice Session**\n\n" +
    "**Second Lobby**\n\n" +
    `${emoji} Registration opens @ ${regTag2}\n\n` +
    `${emoji} First Game Commences @ ${firstTag2}\n\n` +
    "The host for this session is: <@USER>, Direct Message them for help.\n\n" +
    "• Session lasts 3 Games. **Miss a single game and you will be banned.**\n" +
    "• Make sure to read <#1403403385146704044>, <#1403403385146704045> & <#1403403385146704043> before the games.\n" +
    "• Top 3 = Division 3 Invite <:noble_division3_icon:1403477545348759645>\n\n" +
    "Required at least 110+ Reacts.";

  if (id) text2 = text2.replace(/<@USER>/g, `<@${id}>`);
  return text2;
}

function buildDivisionAnnouncement() {
  const cfg = divisionConfig[state.sessionKind];
  if (!cfg) return "";

  const delay = cfg.delayMinutes;
  const emoji = cfg.emoji;
  const channels = cfg.channels;
  const unit = state.queueType === "squads" ? "squad" : "duo";
  const reacts =
    state.queueType === "squads" ? cfg.reactsSquad : cfg.reactsDuo;

  const baseName =
    state.sessionKind === "247"
      ? "Noble 24/7 Practice Session"
      : `Noble ${cfg.name} Practice Session`;
  const titleSuffix = state.queueType === "squads" ? " (Squads)" : "";
  const fullTitle = baseName + titleSuffix;
  const id = state.discordId.trim();

  if (!state.includeSecondLobby) {
    const baseTag = `<t:${state.unix}:t>`;
    const firstUnix1 = state.unix + delay * 60;
    const firstTag1 = `<t:${firstUnix1}:t>`;

    let text =
      "@everyone\n\n" +
      `**${fullTitle}**\n\n` +
      `${emoji} Registration opens @ ${baseTag}\n\n` +
      `${emoji} First Game Commences @ ${firstTag1}\n\n` +
      "The host for this session is: <@USER>, Direct Message them for help.\n\n" +
      "• Session lasts 3 Games. **Miss a single game and you will be banned.**\n" +
      `• Make sure to read ${channels} before the games.\n\n` +
      `Required at least **${reacts.first}+ Reacts** for 1 lobby and **${reacts.second}+ Reacts** for a 2nd lobby (1 per ${unit}).`;

    if (id) text = text.replace(/<@USER>/g, `<@${id}>`);
    return text;
  }

  const reg2Unix = state.unix + 5 * 60;
  const regTag2 = `<t:${reg2Unix}:t>`;
  const firstUnix2 = reg2Unix + delay * 60;
  const firstTag2 = `<t:${firstUnix2}:t>`;

  let text2 =
    "@everyone\n\n" +
    `**${fullTitle}**\n\n` +
    "**Second Lobby**\n\n" +
    `${emoji} Registration opens @ ${regTag2}\n\n` +
    `${emoji} First Game Commences @ ${firstTag2}\n\n` +
    "• The host for this session is: <@USER>, Direct Message them for help. \n\n" +
    `Required at least **${reacts.first}+ Reacts** (1 per ${unit}).`;

  if (id) text2 = text2.replace(/<@USER>/g, `<@${id}>`);
  return text2;
}

function buildAnnouncementText() {
  if (!state.announceMode || state.unix == null) return "";
  if (state.sessionKind === "solos") return buildSolosAnnouncement();
  if (state.sessionKind === "solos_closed")
    return buildSolosClosedAnnouncement();
  return buildDivisionAnnouncement();
}

function renderAnnouncement() {
  const section = document.getElementById("announceSection");
  if (!state.announceMode) {
    section.classList.add("hidden");
    document.getElementById("announcementText").value = "";
    return;
  }
  section.classList.remove("hidden");

  renderAnnounceSessionButtons();
  renderQueueButtons();
  updateAnnounceIcon();

  const ta = document.getElementById("announcementText");
  if (state.unix == null) {
    ta.value = "Select a base time above to generate the announcement.";
  } else {
    ta.value = buildAnnouncementText();
  }
}

function renderAll() {
  renderFormatTable();
  renderAnnouncement();
}

// ---------- THEME ----------

function applyTheme(name) {
  const body = document.body;
  const btn = document.getElementById("themeSwitch");
  if (name === "emerald") {
    body.dataset.theme = "emerald";
    btn.textContent = "Theme: Emerald";
  } else if (name === "clean") {
    body.dataset.theme = "clean";
    btn.textContent = "Theme: Clean";
  } else {
    body.dataset.theme = "classic";
    btn.textContent = "Theme: Classic";
  }
}

// ---------- INIT ----------

document.addEventListener("DOMContentLoaded", () => {
  setTimezoneLabel();
  try { localStorage.setItem(LS_KEY_LAST_PAGE, "main"); } catch {}


  const dtInput = document.getElementById("datetime");
  const resetBtn = document.getElementById("resetNow");
  const timestampToggle = document.getElementById("toggleTimestampTable");
  const timestampWrapper = document.getElementById("timestampTableWrapper");
  try {
  const v = localStorage.getItem(LS_KEY_TS_HELPER);
  if (v === "0") {
    timestampToggle.checked = false;
    timestampWrapper.classList.add("hidden");
  }
  if (v === "1") {
    timestampToggle.checked = true;
    timestampWrapper.classList.remove("hidden");
  }
} catch {}

  const themeSwitch = document.getElementById("themeSwitch");

  // initial time = exact now (with seconds)
  const initialStr = defaultDateTimeLocal();
  const initialUnix = toUnixFromLocalInput(initialStr);
  applyUnix(initialUnix);

  // datetime input change
  dtInput.addEventListener("input", () => {
    const unix = toUnixFromLocalInput(dtInput.value);
    applyUnix(unix);
  });

  // reset button -> exact now
  resetBtn.addEventListener("click", () => {
    const nowStr = defaultDateTimeLocal();
    const unix = toUnixFromLocalInput(nowStr);
    applyUnix(unix);
  });

const scrimBtn = document.getElementById("openScrims");
if (scrimBtn) {
  scrimBtn.onclick = () => {
    try { localStorage.setItem(LS_KEY_LAST_PAGE, "scrims"); } catch {}
    window.location.href = "scrims.html";
  };
}


  // timestamp table visibility toggle
timestampToggle.addEventListener("change", (e) => {
  const on = e.target.checked;
  if (on) timestampWrapper.classList.remove("hidden");
  else timestampWrapper.classList.add("hidden");
  try { localStorage.setItem(LS_KEY_TS_HELPER, on ? "1" : "0"); } catch {}
});


  // quick time presets
  renderUtcButtons();

  // load Discord ID
  try {
    const saved = localStorage.getItem(LS_KEY_DISCORD);
    if (saved) {
      state.discordId = saved;
      document.getElementById("discordId").value = saved;
    }
  } catch {
    /* ignore */
  }

  document.getElementById("discordId").addEventListener("input", (e) => {
    state.discordId = e.target.value.trim();
    try {
      if (state.discordId) {
        localStorage.setItem(LS_KEY_DISCORD, state.discordId);
      }
    } catch {
      /* ignore */
    }
    renderAnnouncement();
  });

  // switches
 const announceToggle = document.getElementById("announceMode");
const secondLobbyToggle = document.getElementById("secondLobby");

try {
  const v = localStorage.getItem(LS_KEY_ANNOUNCE);
  if (v === "1") {
    announceToggle.checked = true;
    state.announceMode = true;
  }
  if (v === "0") {
    announceToggle.checked = false;
    state.announceMode = false;
  }
} catch {}

renderAnnouncement();

announceToggle.addEventListener("change", (e) => {
  state.announceMode = e.target.checked;
  try { localStorage.setItem(LS_KEY_ANNOUNCE, state.announceMode ? "1" : "0"); } catch {}
  renderAnnouncement();
});

secondLobbyToggle.addEventListener("change", (e) => {
  state.includeSecondLobby = e.target.checked;
  renderAnnouncement();
});


  document.getElementById("secondLobby").addEventListener("change", (e) => {
    state.includeSecondLobby = e.target.checked;
    renderAnnouncement();
  });

  // session cards
  renderSessionCards();

  // announcement copy
  document
    .getElementById("copyAnnouncement")
    .addEventListener("click", () => {
      const txt = document.getElementById("announcementText").value;
      if (!txt || state.unix == null) return;
      copyText(txt);
    });

  // timestamp table initial render
  renderFormatTable();

  // ----- SCRIMS INIT -----
state.scrimQueueType = "solos";
state.scrimUnix = computeNextScrimUnix(state.scrimQueueType);

renderScrimQueueButtons();

const scrimInput = document.getElementById("scrimTimeInput");
if (scrimInput && state.scrimUnix != null) {
  const d = new Date(state.scrimUnix * 1000);
  scrimInput.value = dateTimeStringFromDate(d);
}

const scrimAutoBtn = document.getElementById("scrimAutoNext");
if (scrimAutoBtn) {
  scrimAutoBtn.addEventListener("click", () => {
    state.scrimUnix = computeNextScrimUnix(state.scrimQueueType);
    if (scrimInput && state.scrimUnix != null) {
      const d = new Date(state.scrimUnix * 1000);
      scrimInput.value = dateTimeStringFromDate(d);
    }
    renderScrims();
  });
}

if (scrimInput) {
  scrimInput.addEventListener("input", () => {
    state.scrimUnix = toUnixFromLocalInput(scrimInput.value);
    renderScrims();
  });
}

const btnFirst = document.getElementById("copyScrimFirst");
const btnConclude = document.getElementById("copyScrimConclude");

if (btnFirst) {
  btnFirst.addEventListener("click", () => {
    const txt = document.getElementById("scrimFirstText").value;
    if (txt) copyText(txt);
  });
}

if (btnConclude) {
  btnConclude.addEventListener("click", () => {
    const txt = document.getElementById("scrimConcludeText").value;
    if (txt) copyText(txt);
  });
}

renderScrims();


  // theme initial + toggle through 3 themes
  const themes = ["classic", "emerald", "clean"];
  let currentThemeIndex = 0;
  try {
    const stored = localStorage.getItem(LS_KEY_THEME);
    const idx = themes.indexOf(stored);
    if (idx >= 0) currentThemeIndex = idx;
  } catch {
    /* ignore */
  }
  applyTheme(themes[currentThemeIndex]);

  themeSwitch.addEventListener("click", () => {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    const name = themes[currentThemeIndex];
    applyTheme(name);
    try {
      localStorage.setItem(LS_KEY_THEME, name);
    } catch {
      /* ignore */
    }
  });
});
