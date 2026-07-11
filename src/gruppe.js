import {
    getMatchesByGroup,
    getStanding,
    getPlayerName,
    formatResult
} from "./helpers.js";

const groupId = new URLSearchParams(window.location.search).get("id") ?? "A";

document.getElementById("group-title").textContent = `Gruppe ${groupId}`;

function formatRatio(won, lost) {
    if (lost === 0) {
        return won > 0 ? "∞" : "–";
    }
    return (won / lost).toFixed(2);
}

function formatSets(match) {
    if (!match.result?.sets?.length) return "";
    return match.result.sets
        .map(set => `${set.player1}:${set.player2}`)
        .join(", ");
}

function renderStandings() {
    const rows = getStanding(groupId);
    const tbody = document.getElementById("standings-body");
    tbody.innerHTML = "";

    rows.forEach((row, index) => {
        const tr = document.createElement("tr");
        tr.className = index < 2 ? "qualified" : "";
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${row.name}</td>
            <td>${row.points}</td>
            <td>${row.wins}-${row.draws}-${row.losses}</td>
            <td>${row.setsWon}:${row.setsLost}</td>
            <td>${formatRatio(row.setsWon, row.setsLost)}</td>
            <td>${row.pointsWon}:${row.pointsLost}</td>
            <td>${formatRatio(row.pointsWon, row.pointsLost)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function buildScheduleRow(match) {
    const row = document.createElement("div");
    row.className = "result-row";

    let right = `<span class="result-row__next">ausstehend</span>`;

    if (match.status === "gespielt") {
        right = `
            <span class="result-row__result">
                <span class="result-row__sets">${formatSets(match)}</span>
                <span class="result-row__score">${formatResult(match)}</span>
            </span>
        `;
    } else if (match.status === "live") {
        right = `<span class="result-row__live"><span class="live-dot"></span>Live</span>`;
    }

    row.innerHTML = `
        <span class="result-row__players">
            ${getPlayerName(match.player1Id)} – ${getPlayerName(match.player2Id)}
        </span>
        ${right}
    `;

    return row;
}

function renderSchedule() {
    const matches = getMatchesByGroup(groupId);
    const list = document.getElementById("schedule-list");
    list.innerHTML = "";

    if (matches.length === 0) {
        list.innerHTML = `<p class="empty-hint">Keine Spiele in dieser Gruppe.</p>`;
        return;
    }

    const container = document.createElement("div");
    container.className = "results-list";
    matches.forEach(match => container.appendChild(buildScheduleRow(match)));
    list.appendChild(container);
}

renderStandings();
renderSchedule();