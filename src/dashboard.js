import {
    getLiveMatches,
    getUpcomingMatches,
    getFinishedMatches,
    getPlayerName,
    getStandings,
    getTournamentPhase,
    getWinnerId
} from "./helpers.js";

const liveSection = document.getElementById("live-section");
const upcomingSection = document.getElementById("upcoming-section");
const resultsSection = document.getElementById("results-section");
const groupsWrapper = document.getElementById("groups-section-wrapper");
const groupsSection = document.getElementById("groups-section");
const bracketSection = document.getElementById("bracket-section");

function buildLiveCard(match) {
    const card = document.createElement("div");
    card.className = "live-card";

    card.innerHTML = `
        <span class="live-dot"></span>
        <span class="live-card__players">
            <span>${getPlayerName(match.player1Id)}</span>
            <span class="vs">vs</span>
            <span>${getPlayerName(match.player2Id)}</span>
        </span>
    `;

    return card;
}

function renderLiveMatches() {
    const liveMatches = getLiveMatches();
    liveSection.innerHTML = "";

    if (liveMatches.length === 0) {
        const winnerId = getWinnerId();

        liveSection.innerHTML = winnerId
            ? `<p class="winner-banner">🏆 Sieger: <strong>${getPlayerName(winnerId)}</strong></p>`
            : `<p class="empty-hint">Gerade läuft kein Spiel.</p>`;

        return;
    }

    liveMatches.forEach(match => liveSection.appendChild(buildLiveCard(match)));
}

function renderUpcoming() {
    const upcoming = getUpcomingMatches(4);
    upcomingSection.innerHTML = "";

    if (upcoming.length === 0) {
        upcomingSection.innerHTML = `<p class="empty-hint">Keine weiteren Spiele geplant.</p>`;
        return;
    }

    const list = document.createElement("div");
    list.className = "results-list";

    upcoming.forEach(match => {
        const row = document.createElement("div");
        row.className = "result-row";
        row.innerHTML = `
            <span>
                <span class="result-row__players">
                    ${getPlayerName(match.player1Id)} – ${getPlayerName(match.player2Id)}
                </span>
                <span class="result-row__meta">${match.group ? `Gruppe ${match.group}` : match.phase}</span>
            </span>
            <span class="result-row__next">ausstehend</span>
        `;
        list.appendChild(row);
    });

    upcomingSection.appendChild(list);
}

function renderResults() {
    const results = getFinishedMatches(4);
    resultsSection.innerHTML = "";

    if (results.length === 0) {
        resultsSection.innerHTML = `<p class="empty-hint">Noch keine Ergebnisse.</p>`;
        return;
    }

    const list = document.createElement("div");
    list.className = "results-list";

    results.forEach(match => {
        const row = document.createElement("div");
        row.className = "result-row";
        row.innerHTML = `
            <span>
                <span class="result-row__players">
${match.player1Id ? getPlayerName(match.player1Id) : "Noch offen"} – ${match.player2Id ? getPlayerName(match.player2Id) : "Noch offen"}                </span>
                <span class="result-row__meta">${match.group ? `Gruppe ${match.group}` : match.phase}</span>
            </span>
            <span class="result-row__score">${match.result.player1Sets}:${match.result.player2Sets}</span>
        `;
        list.appendChild(row);
    });

    resultsSection.appendChild(list);
}

function renderGroupStandings() {
    const standings = getStandings();
    groupsSection.innerHTML = "";

    Object.entries(standings).forEach(([groupLabel, rows]) => {
        const card = document.createElement("a");
        card.className = "group-card";
        card.href = `gruppe.html?id=${groupLabel}`;

        const rowsHtml = rows
            .map((row, index) => `
                <tr class="${index < 2 ? "qualified" : ""}">
                    <td>${index + 1}</td>
                    <td>${row.name}</td>
                    <td>${row.wins}-${row.losses}</td>
                    <td>${row.setDifference > 0 ? "+" : ""}${row.setDifference}</td>
                </tr>
            `)
            .join("");

        card.innerHTML = `
            <div class="group-card__head">
                <span>Gruppe ${groupLabel}</span>
                <span class="chevron">›</span>
            </div>
            <table class="standings-table">
                <thead>
                    <tr><th>#</th><th>Spieler</th><th>S-N</th><th>Sätze</th></tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        `;

        groupsSection.appendChild(card);
    });
}

function renderBracketTeaser(phase) {
    bracketSection.innerHTML = `
        <p class="eyebrow">K.O.-Phase</p>
        <a href="ko-phase.html" class="bracket-teaser">
            <span>K.O.-Phase läuft — ${phase}</span>
            <span class="chevron">›</span>
        </a>
    `;
}

function renderGroupsOrBracket() {
    const phase = getTournamentPhase();

    if (phase === "gruppenphase") {
        groupsWrapper.classList.remove("hidden");
        bracketSection.classList.add("hidden");
        renderGroupStandings();
    } else {
        groupsWrapper.classList.add("hidden");
        bracketSection.classList.remove("hidden");
        renderBracketTeaser(phase);
    }
}

renderLiveMatches();
renderUpcoming();
renderResults();
renderGroupsOrBracket();