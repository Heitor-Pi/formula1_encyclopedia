const JOLPICA_BASE_URL = "https://api.jolpi.ca/ergast/f1";

const ICONIC_YEARS = ["2024", "2021", "2012", "2007", "1994", "1991", "1988", "1976"];

const TEAM_COLORS = {
  ferrari: "#dc0000",
  red_bull: "#3671c6",
  mclaren: "#ff8000",
  mercedes: "#27f4d2",
  aston_martin: "#229971",
  williams: "#64c4ff",
  alpine: "#0093cc",
  renault: "#fff500",
  rb: "#6692ff",
  alphatauri: "#5e8faa",
  toro_rosso: "#469bff",
  sauber: "#52e252",
  alfa: "#c92d4b",
  haas: "#b6babd",
  lotus_f1: "#d4af37",
  team_lotus: "#d4af37",
  lotus_racing: "#006f46",
  brawn: "#b5ff00",
  benetton: "#00a859",
  jordan: "#eab308",
  tyrrell: "#3b82f6",
  brabham: "#38bdf8",
  force_india: "#f596c8",
  racing_point: "#f596c8",
  bar: "#e2e8f0",
  stewart: "#e2e8f0",
  jaguar: "#15803d",
  toyota: "#ef4444",
  honda: "#e2e8f0",
  bmw_sauber: "#2563eb",
};

// Elementos da interface
const teamInput = document.getElementById("team-input");
const driverInput = document.getElementById("driver-input");
const yearInput = document.getElementById("year-input");
const teamsDatalist = document.getElementById("teams-datalist");
const driversDatalist = document.getElementById("drivers-datalist");
const yearsDatalist = document.getElementById("years-datalist");
const searchForm = document.getElementById("f1-search-form");
const teamPillsContainer = document.getElementById("team-pills");
const yearPillsContainer = document.getElementById("year-pills");
const searchFeedback = document.getElementById("search-feedback");

const prevBtn = document.getElementById("prev-entry-btn");
const nextBtn = document.getElementById("next-entry-btn");
const f1Card = document.getElementById("f1-card");
const cardAccentBar = document.getElementById("card-accent-bar");
const cardTeamBadge = document.getElementById("card-team-badge");
const cardSeasonBadge = document.getElementById("card-season-badge");
const cardNumberBadge = document.getElementById("card-number-badge");
const entryCounter = document.getElementById("entry-counter");

const driverVisual = document.getElementById("driver-visual");
const carVisual = document.getElementById("car-visual");
const carMediaTag = document.getElementById("car-media-tag");

const driverTitle = document.getElementById("driver-title");
const driverSubtitle = document.getElementById("driver-subtitle");
const driverPosition = document.getElementById("driver-position");
const specTeam = document.getElementById("spec-team");
const specSeason = document.getElementById("spec-season");
const specPoints = document.getElementById("spec-points");
const specWins = document.getElementById("spec-wins");
const carouselDots = document.getElementById("carousel-dots");

// Estado da aplicação
let activeSeason = "2024";
let activeTeam = "Ferrari";
let seasonEntries = [];
let seasonTeams = [];
let activeTeamEntries = [];
let currentIndex = 0;
let isLoading = false;
let latestSeasonRequestId = 0;
let latestMediaRequestId = 0;

const seasonCache = new Map();
const driverImageCache = new Map();
const carImageCache = new Map();

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getTeamColor(constructorId) {
  return TEAM_COLORS[constructorId] || "#e10600";
}

function getF1CarSvg(teamColor) {
  return `
    <svg viewBox="0 0 420 160" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustração de carro de Fórmula 1">
      <ellipse cx="210" cy="132" rx="178" ry="9" fill="rgba(0,0,0,0.52)"/>
      <!-- Asa traseira -->
      <path d="M36 62 L58 62 L62 104 L42 104 Z" fill="#1e293b" stroke="rgba(255,255,255,0.22)" stroke-width="1.5"/>
      <!-- Capô do motor / barbatana -->
      <path d="M58 92 L134 68 L174 66 L196 84 L318 96 L364 106 L360 116 L60 116 Z" fill="${teamColor}" stroke="rgba(255,255,255,0.25)" stroke-width="1.8"/>
      <!-- Halo e cockpit -->
      <path d="M188 84 C198 68 232 68 244 88" stroke="#0f172a" stroke-width="6" stroke-linecap="round"/>
      <circle cx="206" cy="78" r="9" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>
      <!-- Asa dianteira -->
      <path d="M342 108 L390 112 L386 120 L336 118 Z" fill="#1e293b" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
      <!-- Pneus -->
      <circle cx="104" cy="112" r="24" fill="#0f172a" stroke="#334155" stroke-width="4"/>
      <circle cx="104" cy="112" r="11" fill="#64748b"/>
      <circle cx="312" cy="112" r="22" fill="#0f172a" stroke="#334155" stroke-width="4"/>
      <circle cx="312" cy="112" r="10" fill="#64748b"/>
    </svg>
  `;
}

function getDriverHelmetSvg(teamColor) {
  return `
    <svg viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ilustração de capacete de piloto de Fórmula 1">
      <ellipse cx="110" cy="176" rx="68" ry="8" fill="rgba(0,0,0,0.45)"/>
      <path d="M56 116 C56 66 86 42 122 42 C156 42 174 68 174 104 C174 134 152 152 118 152 L66 152 C59 152 56 138 56 116 Z" fill="${teamColor}" stroke="rgba(255,255,255,0.3)" stroke-width="2.5"/>
      <path d="M116 74 L172 80 L170 108 L114 104 C106 104 104 74 116 74 Z" fill="#0f172a" stroke="#94a3b8" stroke-width="2"/>
      <path d="M62 124 L112 124" stroke="rgba(255,255,255,0.45)" stroke-width="4" stroke-linecap="round"/>
    </svg>
  `;
}

function setFeedback(message, type = "", externalLink = null) {
  searchFeedback.className = "search-feedback";
  if (type) searchFeedback.classList.add(type);
  searchFeedback.textContent = message;

  if (externalLink) {
    const link = document.createElement("a");
    link.className = "external-search-link";
    link.href = externalLink.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = externalLink.label;
    searchFeedback.appendChild(link);
  }
}

function populateYearDatalist() {
  yearsDatalist.innerHTML = "";
  const currentYear = new Date().getFullYear();
  const maxYear = Math.min(currentYear, 2026);
  const fragment = document.createDocumentFragment();
  for (let year = maxYear; year >= 1950; year -= 1) {
    const option = document.createElement("option");
    option.value = String(year);
    fragment.appendChild(option);
  }
  yearsDatalist.appendChild(fragment);
}

function populateTeamDatalist(teams) {
  teamsDatalist.innerHTML = "";
  const fragment = document.createDocumentFragment();
  for (const team of teams) {
    const option = document.createElement("option");
    option.value = team.name;
    fragment.appendChild(option);
  }
  teamsDatalist.appendChild(fragment);
}

function populateDriverDatalist(entries) {
  driversDatalist.innerHTML = "";
  const seen = new Set();
  const fragment = document.createDocumentFragment();
  for (const entry of entries) {
    if (seen.has(entry.driverId)) continue;
    seen.add(entry.driverId);
    const option = document.createElement("option");
    option.value = entry.fullName;
    fragment.appendChild(option);
  }
  driversDatalist.appendChild(fragment);
}
