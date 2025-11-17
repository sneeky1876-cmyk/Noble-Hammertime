
const LS_KEY_LAST_PAGE = "nobleLastPage";

// SCRIMS HELPERS
let state = {
  scrimQueueType: "solos",
  scrimUnix: null,
};

function berlinLocalToUtc(year, month, day, hour, minute) {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let d = new Date(utcMs);

  const fmtHM = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  const hmParts = fmtHM.formatToParts(d);
  const bh = parseInt(hmParts.find((p) => p.type === "hour").value, 10);
  const bm = parseInt(hmParts.find((p) => p.type === "minute").value, 10);
  const diffMinutes = hour * 60 + minute - (bh * 60 + bm);

  if (diffMinutes !== 0) {
    utcMs += diffMinutes * 60 * 1000;
    d = new Date(utcMs);
  }

  return d;
}

function computeNextScrimUnix(queueType) {
  const nowUtcMs = Date.now();

  const fmtYMD = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  for (let i = 0; i < 10; i++) {
    const base = new Date(nowUtcMs + i * 86400000);
    const parts = fmtYMD.formatToParts(base);
    const year = parseInt(parts.find((p) => p.type === "year").value, 10);
    const month = parseInt(parts.find((p) => p.type === "month").value, 10);
    const day = parseInt(parts.find((p) => p.type === "day").value, 10);

    const middayUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const dow = middayUtc.getUTCDay();
    const isWeekend = dow === 0 || dow === 6;

    let hour = isWeekend ? 13 : 14;
    let minute = 30;
    if (queueType === "duos") minute = 40;
    else if (queueType === "squads") minute = 50;

    const candidate = berlinLocalToUtc(year, month, day, hour, minute);

    if (candidate.getTime() > nowUtcMs) {
      return Math.floor(candidate.getTime() / 1000);
    }
  }

  return Math.floor(nowUtcMs / 1000);
}


function buildScrimFirstMessage() {
  const t = state.scrimUnix;
  return (
    "<@&854727975550320650>\n\n" +
    `<:ArrowRight:1398394460941062327> The **First Match** is @ <t:${t}:t> ~ <t:${t}:R>!\n\n` +
    "• Please read the <#854739679320473610> before playing. 🏆"
  );
}

function buildScrimConcludeMessage() {
  const t = state.scrimUnix;
  const map = { solos: "solo", duos: "duo", squads: "squad" };
  const label = map[state.scrimQueueType];

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
    btn.className = "pill-btn";

    if (state.scrimQueueType === t.value)
      btn.classList.add("selected");

    btn.textContent = t.label;

    btn.onclick = () => {
      state.scrimQueueType = t.value;
      renderScrimQueueButtons();  
      updateScrimTime();          
    };

    container.appendChild(btn);
  });
}


function updateScrimTime() {
  state.scrimUnix = computeNextScrimUnix(state.scrimQueueType);

  const d = new Date(state.scrimUnix * 1000);
  document.getElementById("scrimTimeInput").value =
  d.getFullYear() + "-" +
  String(d.getMonth() + 1).padStart(2, "0") + "-" +
  String(d.getDate()).padStart(2, "0") + "T" +
  String(d.getHours()).padStart(2, "0") + ":" +
  String(d.getMinutes()).padStart(2, "0");


  renderScrims();
}

function renderScrims() {
  const t = state.scrimUnix;
  if (!t) return;

    const d = new Date(t * 1000);

  const berlinStr = new Intl.DateTimeFormat([], {
    timeZone: "Europe/Berlin",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);

  document.getElementById("scrimTimePreview").textContent =
    "Scrim time (CET): " + berlinStr + " — Discord: <t:" + t + ":t>";

  document.getElementById("scrimFirstText").value = buildScrimFirstMessage();
  document.getElementById("scrimConcludeText").value =
    buildScrimConcludeMessage();
}


document.addEventListener("DOMContentLoaded", () => {
  try { localStorage.setItem(LS_KEY_LAST_PAGE, "scrims"); } catch {}
  renderScrimQueueButtons();
  updateScrimTime();

  document.getElementById("scrimAutoNext").onclick = updateScrimTime;

  document.getElementById("scrimTimeInput").oninput = (e) => {
    state.scrimUnix = Math.floor(new Date(e.target.value) / 1000);
    renderScrims();
  };

  document.getElementById("copyScrimFirst").onclick = () =>
    navigator.clipboard.writeText(
      document.getElementById("scrimFirstText").value
    );

  document.getElementById("copyScrimConclude").onclick = () =>
    navigator.clipboard.writeText(
      document.getElementById("scrimConcludeText").value
    );
});
