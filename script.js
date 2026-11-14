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

function renderTeamPills() {
  teamPillsContainer.innerHTML = "";
  const fragment = document.createDocumentFragment();

  const topTeams = seasonTeams.slice(0, 8);
  for (const team of topTeams) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill-btn";
    if (normalizeText(team.name) === normalizeText(activeTeam)) {
      btn.classList.add("active");
    }
    btn.dataset.team = team.name;
    btn.textContent = team.name;
    fragment.appendChild(btn);
  }

  teamPillsContainer.appendChild(fragment);
}

function renderYearPills() {
  yearPillsContainer.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const year of ICONIC_YEARS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill-btn";
    if (year === activeSeason) {
      btn.classList.add("active");
    }
    btn.dataset.year = year;
    btn.textContent = year;
    fragment.appendChild(btn);
  }

  yearPillsContainer.appendChild(fragment);
}

function renderCarouselDots() {
  carouselDots.innerHTML = "";
  const total = activeTeamEntries.length;
  if (total <= 1) return;

  const maxDots = 12;
  let start = 0;
  let end = total;
  if (total > maxDots) {
    const half = Math.floor(maxDots / 2);
    start = Math.max(0, currentIndex - half);
    end = start + maxDots;
    if (end > total) {
      end = total;
      start = end - maxDots;
    }
  }

  const fragment = document.createDocumentFragment();
  for (let idx = start; idx < end; idx += 1) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `dot-btn${idx === currentIndex ? " active" : ""}`;
    dot.dataset.index = String(idx);
    dot.setAttribute(
      "aria-label",
      `Ver ${activeTeamEntries[idx].fullName} (${activeTeamEntries[idx].teamName})`
    );
    fragment.appendChild(dot);
  }
  carouselDots.appendChild(fragment);
}

function setVisualFallback(container, svgHtml, label = "") {
  container.innerHTML = svgHtml;
  if (label) {
    const badge = document.createElement("span");
    badge.className = "photo-badge";
    badge.textContent = label;
    container.appendChild(badge);
  }
}

function setVisualPhoto(container, url, altText, variantClass, sourceLabel, fallbackSvg) {
  const img = document.createElement("img");
  img.className = `media-photo ${variantClass}`;
  img.src = url;
  img.alt = altText;
  img.loading = "eager";

  img.addEventListener("error", () => {
    setVisualFallback(container, fallbackSvg, "Ilustração");
  });

  const badge = document.createElement("span");
  badge.className = "photo-badge";
  badge.textContent = sourceLabel;

  container.innerHTML = "";
  container.appendChild(img);
  container.appendChild(badge);
}

function extractWikiTitle(wikiUrl) {
  if (!wikiUrl) return "";
  try {
    const parsed = new URL(wikiUrl);
    const parts = parsed.pathname.split("/wiki/");
    return parts[1] ? decodeURIComponent(parts[1]) : "";
  } catch {
    return "";
  }
}

async function fetchWikiPageImageByTitle(wikiTitle) {
  if (!wikiTitle) return null;
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}` +
    `&prop=pageimages&pithumbsize=700&format=json&origin=*`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const pages = Object.values(data?.query?.pages || {});
  const src = pages[0]?.thumbnail?.source || "";
  if (!src || src.toLowerCase().includes(".svg")) return null;

  return { url: src, source: "Wikipedia" };
}

async function fetchWikiSearchImage(query, matchTokens = []) {
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5` +
    `&prop=pageimages&pithumbsize=900&format=json&origin=*`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const pages = Object.values(data?.query?.pages || {}).sort(
    (a, b) => (a.index ?? 999) - (b.index ?? 999)
  );

  const valid = pages.filter((p) => {
    const src = p.thumbnail?.source || "";
    return src && !src.toLowerCase().includes(".svg");
  });

  const normTokens = matchTokens.map(normalizeText).filter(Boolean);
  const best =
    valid.find((p) => {
      const title = normalizeText(p.title);
      return normTokens.every((tok) => title.includes(tok));
    }) || valid[0];

  if (!best) return null;
  return {
    url: best.thumbnail.source,
    title: best.title,
    source: "Wikipedia",
  };
}

async function fetchCommonsSearchImage(searchTerms) {
  for (const term of searchTerms) {
    const url =
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
      `&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=6` +
      `&prop=imageinfo&iiprop=url|mime&iiurlwidth=900&format=json&origin=*`;
    const response = await fetch(url);
    if (!response.ok) continue;

    const data = await response.json();
    const pages = Object.values(data?.query?.pages || {}).sort(
      (a, b) => (a.index ?? 999) - (b.index ?? 999)
    );

    for (const page of pages) {
      const info = page.imageinfo?.[0];
      const mime = info?.mime || "";
      const imageUrl = info?.thumburl || info?.url;
      if (
        imageUrl &&
        (mime === "image/jpeg" || mime === "image/png" || mime === "image/webp")
      ) {
        return {
          url: imageUrl,
          title: page.title?.replace(/^File:/i, "") || "",
          source: "Wikimedia Commons",
        };
      }
    }
  }
  return null;
}

async function getDriverPhoto(entry) {
  const key = entry.driverId || normalizeText(entry.fullName);
  if (driverImageCache.has(key)) return driverImageCache.get(key);

  let result = null;
  try {
    const wikiTitle = extractWikiTitle(entry.driverUrl);
    result = await fetchWikiPageImageByTitle(wikiTitle);
    if (!result) {
      result = await fetchWikiSearchImage(
        `${entry.fullName} Formula One driver`,
        [entry.familyName]
      );
    }
    if (!result) {
      result = await fetchCommonsSearchImage([
        `${entry.fullName} Formula One`,
        entry.fullName,
      ]);
    }
  } catch (error) {
    console.warn("Erro ao buscar foto do piloto:", error);
  }

  driverImageCache.set(key, result);
  return result;
}

async function getTeamCarPhoto(entry) {
  const key = `${entry.constructorId}|${entry.season}`;
  if (carImageCache.has(key)) return carImageCache.get(key);

  let result = null;
  try {
    // 1. Busca foto no Wikimedia Commons do carro daquela scuderia naquele ano
    result = await fetchCommonsSearchImage([
      `${entry.season} ${entry.teamName} Formula One`,
      `${entry.teamName} ${entry.season} F1`,
    ]);

    // 2. Fallback: artigo do carro/scuderia na Wikipedia
    if (!result) {
      result = await fetchWikiSearchImage(
        `${entry.season} ${entry.teamName} Formula One car`,
        [entry.teamName]
      );
    }
    if (!result) {
      const teamTitle = extractWikiTitle(entry.teamUrl);
      result = await fetchWikiPageImageByTitle(teamTitle);
    }
  } catch (error) {
    console.warn("Erro ao buscar foto do carro:", error);
  }

  carImageCache.set(key, result);
  return result;
}

async function loadEntryMedia(entry) {
  const mediaRequestId = ++latestMediaRequestId;
  const fallbackCarSvg = getF1CarSvg(entry.teamColor);
  const fallbackDriverSvg = getDriverHelmetSvg(entry.teamColor);

  const driverKey = entry.driverId || normalizeText(entry.fullName);
  const carKey = `${entry.constructorId}|${entry.season}`;

  if (!driverImageCache.has(driverKey)) {
    setVisualFallback(driverVisual, fallbackDriverSvg, "Buscando foto...");
  }
  if (!carImageCache.has(carKey)) {
    setVisualFallback(carVisual, fallbackCarSvg, "Buscando carro...");
  }

  const [driverPhoto, carPhoto] = await Promise.all([
    getDriverPhoto(entry),
    getTeamCarPhoto(entry),
  ]);

  if (mediaRequestId !== latestMediaRequestId) return;

  if (driverPhoto) {
    setVisualPhoto(
      driverVisual,
      driverPhoto.url,
      `Foto do piloto ${entry.fullName}`,
      "media-photo--driver",
      `Foto • ${driverPhoto.source}`,
      fallbackDriverSvg
    );
  } else {
    setVisualFallback(driverVisual, fallbackDriverSvg, "Capacete");
  }

  if (carPhoto) {
    setVisualPhoto(
      carVisual,
      carPhoto.url,
      `Carro da ${entry.teamName} na temporada ${entry.season}`,
      "media-photo--car",
      `Carro ${entry.season} • ${carPhoto.source}`,
      fallbackCarSvg
    );
  } else {
    setVisualFallback(carVisual, fallbackCarSvg, `F1 ${entry.season}`);
  }
}

function renderEmptyState(teamName, season) {
  cardAccentBar.style.background = "#e10600";
  cardTeamBadge.textContent = teamName || "Scuderia";
  cardSeasonBadge.textContent = `Temporada ${season}`;
  cardNumberBadge.textContent = "#—";
  entryCounter.textContent = "0 / 0";
  setVisualFallback(driverVisual, getDriverHelmetSvg("#64748b"), "Sem foto");
  setVisualFallback(carVisual, getF1CarSvg("#64748b"), "Sem carro");
  carMediaTag.textContent = "Carro da Scuderia";

  driverTitle.textContent = "Nenhum registro encontrado";
  driverSubtitle.textContent = `Não encontramos pilotos para ${teamName || "essa busca"} em ${season}.`;
  driverPosition.textContent = "—";
  specTeam.textContent = teamName || "—";
  specSeason.textContent = season || "—";
  specPoints.textContent = "—";
  specWins.textContent = "—";
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  carouselDots.innerHTML = "";
}

function renderCurrentEntry({ syncInputs = false } = {}) {
  const entry = activeTeamEntries[currentIndex];
  if (!entry) {
    renderEmptyState(activeTeam, activeSeason);
    return;
  }

  f1Card.classList.add("is-switching");
  window.setTimeout(() => {
    f1Card.classList.remove("is-switching");
  }, 150);

  f1Card.style.setProperty("--team-color", entry.teamColor);
  cardAccentBar.style.background = entry.teamColor;
  cardTeamBadge.textContent = entry.teamName;
  cardSeasonBadge.textContent = `Temporada ${entry.season}`;
  cardNumberBadge.textContent = entry.number ? `#${entry.number}` : entry.code || "F1";
  entryCounter.textContent = `${currentIndex + 1} / ${activeTeamEntries.length} em ${entry.teamName}`;
  carMediaTag.textContent = `Carro • ${entry.teamName} (${entry.season})`;

  driverTitle.textContent = entry.fullName;
  driverSubtitle.textContent = `${entry.teamName} (${entry.teamNationality}) • Piloto ${entry.driverNationality}`;
  driverPosition.textContent = entry.position ? `${entry.position}º lugar` : "—";

  specTeam.textContent = entry.teamName;
  specSeason.textContent = entry.season;
  specPoints.textContent = `${entry.points} pts`;
  specWins.textContent = String(entry.wins);

  const hasMultiple = activeTeamEntries.length > 1;
  prevBtn.disabled = isLoading || !hasMultiple;
  nextBtn.disabled = isLoading || !hasMultiple;

  renderCarouselDots();
  renderTeamPills();
  renderYearPills();
  loadEntryMedia(entry);

  if (syncInputs) {
    teamInput.value = entry.teamName;
    driverInput.value = entry.fullName;
    yearInput.value = entry.season;
  }
}

async function fetchSeasonData(season) {
  if (seasonCache.has(season)) {
    return seasonCache.get(season);
  }

  const response = await fetch(
    `${JOLPICA_BASE_URL}/${encodeURIComponent(season)}/driverstandings.json?limit=100`
  );
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ao buscar temporada ${season}.`);
  }

  const data = await response.json();
  const standings =
    data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];

  const entries = [];
  const teamsMap = new Map();

  for (const row of standings) {
    const driver = row.Driver || {};
    const constructors = row.Constructors || [];
    const fullName = `${driver.givenName || ""} ${driver.familyName || ""}`.trim();

    for (const ctor of constructors) {
      const teamColor = getTeamColor(ctor.constructorId);
      if (!teamsMap.has(ctor.constructorId)) {
        teamsMap.set(ctor.constructorId, {
          id: ctor.constructorId,
          name: ctor.name,
          nationality: ctor.nationality || "",
          url: ctor.url || "",
          color: teamColor,
        });
      }

      entries.push({
        season,
        driverId: driver.driverId,
        fullName,
        familyName: driver.familyName || "",
        driverNationality: driver.nationality || "",
        driverUrl: driver.url || "",
        number: driver.permanentNumber || "",
        code: driver.code || "",
        position: row.position || "",
        points: row.points ?? "0",
        wins: row.wins ?? "0",
        constructorId: ctor.constructorId,
        teamName: ctor.name,
        teamNationality: ctor.nationality || "",
        teamUrl: ctor.url || "",
        teamColor,
      });
    }
  }

  // Fallback caso uma temporada ainda não tenha standings consolidados (usa results)
  if (entries.length === 0) {
    const resFallback = await fetch(
      `${JOLPICA_BASE_URL}/${encodeURIComponent(season)}/results.json?limit=100`
    );
    if (resFallback.ok) {
      const fallbackData = await resFallback.json();
      const races = fallbackData?.MRData?.RaceTable?.Races || [];
      const seenPairs = new Set();

      for (const race of races) {
        for (const result of race.Results || []) {
          const driver = result.Driver || {};
          const ctor = result.Constructor || {};
          const pairKey = `${driver.driverId}|${ctor.constructorId}`;
          if (!driver.driverId || !ctor.constructorId || seenPairs.has(pairKey)) {
            continue;
          }
          seenPairs.add(pairKey);

          const teamColor = getTeamColor(ctor.constructorId);
          if (!teamsMap.has(ctor.constructorId)) {
            teamsMap.set(ctor.constructorId, {
              id: ctor.constructorId,
              name: ctor.name,
              nationality: ctor.nationality || "",
              url: ctor.url || "",
              color: teamColor,
            });
          }

          entries.push({
            season,
            driverId: driver.driverId,
            fullName: `${driver.givenName || ""} ${driver.familyName || ""}`.trim(),
            familyName: driver.familyName || "",
            driverNationality: driver.nationality || "",
            driverUrl: driver.url || "",
            number: result.number || driver.permanentNumber || "",
            code: driver.code || "",
            position: "",
            points: "0",
            wins: "0",
            constructorId: ctor.constructorId,
            teamName: ctor.name,
            teamNationality: ctor.nationality || "",
            teamUrl: ctor.url || "",
            teamColor,
          });
        }
      }
    }
  }

  const payload = {
    entries,
    teams: Array.from(teamsMap.values()),
  };
  seasonCache.set(season, payload);
  return payload;
}

function selectTeamInCurrentSeason(teamQuery, driverQuery = "", { syncInputs = true } = {}) {
  const normTeam = normalizeText(teamQuery);
  const normDriver = normalizeText(driverQuery);

  // 1. Se digitou apenas o piloto (sem scuderia), acha o piloto na temporada toda
  if (!normTeam && normDriver) {
    const matchedDriver =
      seasonEntries.find((e) => normalizeText(e.fullName) === normDriver) ||
      seasonEntries.find((e) => normalizeText(e.fullName).includes(normDriver));

    if (!matchedDriver) {
      return { found: false, reason: "driver_not_found" };
    }

    activeTeam = matchedDriver.teamName;
    activeTeamEntries = seasonEntries.filter(
      (e) => e.constructorId === matchedDriver.constructorId
    );
    currentIndex = activeTeamEntries.findIndex(
      (e) => e.driverId === matchedDriver.driverId
    );
    renderCurrentEntry({ syncInputs });
    return { found: true, entry: matchedDriver };
  }

  // 2. Procura a scuderia
  let matchedTeam =
    seasonTeams.find((t) => normalizeText(t.name) === normTeam) ||
    seasonTeams.find((t) => normalizeText(t.name).includes(normTeam));

  if (!matchedTeam && normTeam) {
    return { found: false, reason: "team_not_found" };
  }

  if (!matchedTeam) {
    matchedTeam = seasonTeams[0];
  }

  if (!matchedTeam) {
    activeTeam = teamQuery || "Scuderia";
    activeTeamEntries = [];
    currentIndex = 0;
    renderEmptyState(activeTeam, activeSeason);
    return { found: false, reason: "season_empty" };
  }

  activeTeam = matchedTeam.name;
  activeTeamEntries = seasonEntries.filter(
    (e) => e.constructorId === matchedTeam.id
  );
  populateDriverDatalist(activeTeamEntries);

  let targetIdx = 0;
  let driverMatched = true;

  if (normDriver) {
    const exactDriverIdx = activeTeamEntries.findIndex(
      (e) => normalizeText(e.fullName) === normDriver
    );
    const partialDriverIdx =
      exactDriverIdx !== -1
        ? exactDriverIdx
        : activeTeamEntries.findIndex((e) =>
            normalizeText(e.fullName).includes(normDriver)
          );

    if (partialDriverIdx !== -1) {
      targetIdx = partialDriverIdx;
    } else {
      driverMatched = false;
    }
  }

  currentIndex = targetIdx;
  renderCurrentEntry({ syncInputs });

  return {
    found: driverMatched,
    reason: driverMatched ? "" : "driver_not_in_team",
    entry: activeTeamEntries[currentIndex],
  };
}

async function loadSeasonAndSelect(
  season,
  { teamQuery = "", driverQuery = "", syncInputs = true, quiet = false } = {}
) {
  const requestId = ++latestSeasonRequestId;
  isLoading = true;
  prevBtn.disabled = true;
  nextBtn.disabled = true;

  if (!quiet) {
    setFeedback(`Carregando dados da temporada ${season} na API Jolpica F1...`);
  }

  try {
    const data = await fetchSeasonData(season);
    if (requestId !== latestSeasonRequestId) return;

    activeSeason = season;
    seasonEntries = data.entries;
    seasonTeams = data.teams;
    populateTeamDatalist(seasonTeams);
    populateDriverDatalist(seasonEntries);

    if (seasonEntries.length === 0) {
      activeTeam = teamQuery || "";
      activeTeamEntries = [];
      currentIndex = 0;
      renderEmptyState(activeTeam, activeSeason);
      renderTeamPills();
      renderYearPills();
      setFeedback(
        `A API não retornou registros para a temporada ${season}. Tente um ano entre 1950 e 2025.`,
        "is-error"
      );
      return;
    }

    const chosenTeam =
      teamQuery ||
      (seasonTeams.some((t) => normalizeText(t.name) === normalizeText(activeTeam))
        ? activeTeam
        : seasonTeams[0]?.name || "");

    const result = selectTeamInCurrentSeason(chosenTeam, driverQuery, {
      syncInputs,
    });

    if (result.found && result.entry) {
      if (driverQuery) {
        setFeedback(
          `Resultado encontrado: ${result.entry.fullName} • ${result.entry.teamName} (${result.entry.season}).`,
          "is-success"
        );
      } else if (!quiet) {
        setFeedback(
          `Temporada ${activeSeason}: exibindo pilotos e carro de ${result.entry.teamName}. Use as setas para navegar.`,
          "is-success"
        );
      }
    } else if (result.reason === "driver_not_found") {
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(
        `${driverQuery} ${season} Formula 1`
      )}`;
      setFeedback(
        `Piloto "${driverQuery}" não encontrado na temporada ${season}.`,
        "is-error",
        { url: googleUrl, label: "Pesquisar no Google" }
      );
    } else if (result.reason === "team_not_found") {
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(
        `${teamQuery} ${season} Formula 1`
      )}`;
      setFeedback(
        `Scuderia "${teamQuery}" não competiu na temporada ${season}.`,
        "is-error",
        { url: googleUrl, label: "Pesquisar no Google" }
      );
    } else if (result.reason === "driver_not_in_team") {
      setFeedback(
        `Piloto "${driverQuery}" não correu pela ${activeTeam} em ${season}. Exibindo os pilotos da equipe.`,
        "is-error"
      );
    }
  } catch (error) {
    if (requestId !== latestSeasonRequestId) return;
    console.error("Erro ao consultar API Jolpica F1:", error);
    renderEmptyState(teamQuery || activeTeam, season);
    setFeedback(
      "Não foi possível consultar a API de Fórmula 1 no momento. Verifique sua conexão.",
      "is-error"
    );
  } finally {
    if (requestId === latestSeasonRequestId) {
      isLoading = false;
      const hasMultiple = activeTeamEntries.length > 1;
      prevBtn.disabled = !hasMultiple;
      nextBtn.disabled = !hasMultiple;
    }
  }
}

function stepEntry(delta) {
  if (isLoading || activeTeamEntries.length <= 1) return;
  currentIndex =
    (currentIndex + delta + activeTeamEntries.length) % activeTeamEntries.length;
  renderCurrentEntry({ syncInputs: true });
  setFeedback("");
}

// Navegação pelas setas
prevBtn.addEventListener("click", () => stepEntry(-1));
nextBtn.addEventListener("click", () => stepEntry(1));

// Clique nos pontos indicadores
carouselDots.addEventListener("click", (event) => {
  const dot = event.target.closest(".dot-btn");
  if (!dot) return;
  currentIndex = Number(dot.dataset.index);
  renderCurrentEntry({ syncInputs: true });
  setFeedback("");
});

// Clique nas pílulas de scuderia
teamPillsContainer.addEventListener("click", (event) => {
  const pill = event.target.closest(".pill-btn");
  if (!pill || isLoading) return;
  const chosenTeam = pill.dataset.team;
  selectTeamInCurrentSeason(chosenTeam, "", { syncInputs: true });
  setFeedback(
    `Scuderia ${chosenTeam} (${activeSeason}) selecionada. Use as setas para alternar entre os pilotos.`
  );
});

// Clique nas pílulas de anos icônicos
yearPillsContainer.addEventListener("click", (event) => {
  const pill = event.target.closest(".pill-btn");
  if (!pill) return;
  const chosenYear = pill.dataset.year;
  yearInput.value = chosenYear;
  driverInput.value = "";
  loadSeasonAndSelect(chosenYear, {
    syncInputs: true,
  });
});

// Ao selecionar uma scuderia da lista, filtra os pilotos sugeridos para ela
teamInput.addEventListener("change", () => {
  const typedTeam = teamInput.value.trim();
  if (!typedTeam) {
    populateDriverDatalist(seasonEntries);
    return;
  }
  const matched = seasonTeams.find(
    (t) => normalizeText(t.name) === normalizeText(typedTeam)
  );
  if (matched) {
    selectTeamInCurrentSeason(matched.name, "", { syncInputs: false });
  }
});

// Botão principal: pesquisa direta por scuderia, piloto e temporada
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const rawTeam = teamInput.value.trim();
  const rawDriver = driverInput.value.trim();
  const rawYear = yearInput.value.trim() || activeSeason;

  const numericYear = Number(rawYear);
  if (!Number.isInteger(numericYear) || numericYear < 1950 || numericYear > 2026) {
    setFeedback(
      "Informe um ano válido entre 1950 e 2026.",
      "is-error"
    );
    yearInput.focus();
    return;
  }

  if (!rawTeam && !rawDriver) {
    await loadSeasonAndSelect(String(numericYear), { syncInputs: true });
    return;
  }

  if (String(numericYear) !== activeSeason || seasonEntries.length === 0) {
    await loadSeasonAndSelect(String(numericYear), {
      teamQuery: rawTeam,
      driverQuery: rawDriver,
      syncInputs: true,
    });
    return;
  }

  const result = selectTeamInCurrentSeason(rawTeam, rawDriver, {
    syncInputs: true,
  });

  if (result.found && result.entry) {
    setFeedback(
      `Resultado encontrado: ${result.entry.fullName} • ${result.entry.teamName} (${result.entry.season}).`,
      "is-success"
    );
  } else if (result.reason === "driver_not_found") {
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(
      `${rawDriver} ${rawYear} Formula 1`
    )}`;
    setFeedback(
      `Piloto "${rawDriver}" não encontrado na temporada ${rawYear}.`,
      "is-error",
      { url: googleUrl, label: "Pesquisar no Google" }
    );
  } else if (result.reason === "team_not_found") {
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(
      `${rawTeam} ${rawYear} Formula 1`
    )}`;
    setFeedback(
      `Scuderia "${rawTeam}" não encontrada na temporada ${rawYear}.`,
      "is-error",
      { url: googleUrl, label: "Pesquisar no Google" }
    );
  } else if (result.reason === "driver_not_in_team") {
    setFeedback(
      `Piloto "${rawDriver}" não correu pela ${activeTeam} em ${rawYear}. Exibindo os pilotos da equipe.`,
      "is-error"
    );
  }
});

// Atalho de teclado com setas quando fora dos inputs
document.addEventListener("keydown", (event) => {
  const activeTag = document.activeElement?.tagName;
  if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

  if (event.key === "ArrowLeft") {
    stepEntry(-1);
  } else if (event.key === "ArrowRight") {
    stepEntry(1);
  }
});

// Inicialização
populateYearDatalist();
renderYearPills();
loadSeasonAndSelect(activeSeason, {
  teamQuery: activeTeam,
  syncInputs: true,
});
