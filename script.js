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
