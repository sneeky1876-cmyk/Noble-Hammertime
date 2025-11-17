
const LS_KEY_LAST_PAGE = "nobleLastPage";

// SCRIMS HELPERS
let state = {
  scrimQueueType: "solos",
  scrimUnix: null,
};

function computeNextScrimUnix(queueType) {
  const now = new Date();

  for (let i = 0; i < 10; i++) {
    const d = new Date();
    d.setDate(now.getDate() + i);

    const day = d.getDay();
    const weekend = day === 0 || day === 6;

    let hour = weekend ? 13 : 14;
    let minute = queueType === "solos" ? 30 : queueType === "duos" ? 40 : 50;

    d.setHours(hour, minute, 0, 0);

    if (d > now) return Math.floor(d / 1000);
  }

  return Math.floor(now / 1000);
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
  document.getElementById("scrimTimePreview").textContent =
    "Scrim time: " + d.toLocaleString();

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
