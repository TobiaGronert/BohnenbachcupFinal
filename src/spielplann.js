import {
    getMatches,
    getPlayerName,
    formatResult
} from "./helpers.js";

function buildScheduleRow(match) {
    const row = document.createElement("div");
    row.className = "result-row";

    if (match.status === "live") {
        row.classList.add("is-live");
    }

    let right = `<span class="result-row__next"> ausstehend </span>`;

    if (match.status === "gespielt") {
        right = `<span class="result-row__score">${formatResult(match)}</span>`;
    } else if (match.status === "live") {
        right = `<span class="result-row__live"><span class="live-dot"></span>Live</span>`;
    }

    const meta = match.phase === "gruppe"
        ? `Gruppe ${match.group} ·  Spiel nr:  ${match.id ?? "–"} `
        : `${match.phase} · ${match.id ?? "–"}`;

    row.innerHTML = `
        <span>
            <span class="result-row__players">
               ${match.player1Id ? getPlayerName(match.player1Id) : "Noch offen"} – ${match.player2Id ? getPlayerName(match.player2Id) : "Noch offen"}
            </span>
            <span class="result-row__meta">${meta}</span>
        </span>
        ${right}
    `;

    return row;
}

function buildScheduleGroup(title, matches) {
    const wrapper = document.createElement("div");
    wrapper.className = "schedule-group block";

    const heading = document.createElement("p");
    heading.className = "eyebrow";
    heading.textContent = title;
    wrapper.appendChild(heading);

    const list = document.createElement("div");
    list.className = "results-list";

    matches.forEach(match => {
        list.appendChild(buildScheduleRow(match));
    });

    wrapper.appendChild(list);
    return wrapper;
}

function renderGroupPhase() {
    const container = document.getElementById("schedule-groupphase");
    if (!container) return;

    container.innerHTML = "";

    const matches = getMatches();
    const groupMatches = matches.filter(match => match.phase === "gruppe");

    for (let round = 1; round <= 5; round++) {
        const roundMatches = groupMatches.filter(match => match.round === round);

        if (roundMatches.length > 0) {
            container.appendChild(buildScheduleGroup(`Spieltag ${round}`, roundMatches));
        }
    }
}

function renderKnockout() {
    const container = document.getElementById("schedule-knockout");
    if (!container) return;

    container.innerHTML = "";

    const matches = getMatches();

    const phases = [
        ["viertelfinale", "Viertelfinale"],
        ["halbfinale", "Halbfinale"],
        ["finale", "Finale"]
    ];

    phases.forEach(([phase, label]) => {
        const phaseMatches = matches.filter(match => match.phase === phase);

        if (phaseMatches.length > 0) {
            container.appendChild(buildScheduleGroup(label, phaseMatches));
        }
    });
}

renderGroupPhase();
renderKnockout();

const firstLive = document.querySelector(".is-live");

if (firstLive) {
    firstLive.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}