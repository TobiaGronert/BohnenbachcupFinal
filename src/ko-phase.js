import { getQuarterFinals, getSemiFinals, getFinal } from "./knockouts.js";
// ⚠️ Pfad an deinen tatsächlichen Dateinamen anpassen

function playerName(playerId) {
    if (!playerId) return null;
    return String(playerId); // ⚠️ durch deine echte Namensauflösung ersetzen
}

function renderSetsRow(sets, playerKey) {
    if (!sets || !sets.length) return "";

    const opponentKey = playerKey === "player1" ? "player2" : "player1";
    const boxes = sets.map(set => {
        const mine = set[playerKey];
        const theirs = set[opponentKey];
        const won = mine > theirs;
        return `<span class="bracket-match__set${won ? " won" : ""}">${mine}</span>`;
    }).join("");

    return `<div class="bracket-match__sets">${boxes}</div>`;
}

function renderMatch(match) {
    const el = document.createElement("div");
    el.className = "bracket-match";

    const name1 = playerName(match?.player1Id) ?? "TBD";
    const name2 = playerName(match?.player2Id) ?? "TBD";

    const played = match?.status === "gespielt" && !!match?.result;
    const sets = match?.result?.sets;
    const p1Sets = match?.result?.player1Sets;
    const p2Sets = match?.result?.player2Sets;
    const p1Wins = played && p1Sets > p2Sets;
    const p2Wins = played && p2Sets > p1Sets;

    el.innerHTML = `
        <div class="bracket-match__player${p1Wins ? " winner" : ""}${!match?.player1Id ? " bracket-match__tbd" : ""}">
            <div class="bracket-match__player-top">
                <span class="bracket-match__name">${name1}</span>
                <span class="bracket-match__score">${played ? p1Sets : ""}</span>
            </div>
            ${played ? renderSetsRow(sets, "player1") : ""}
        </div>
        <div class="bracket-match__player${p2Wins ? " winner" : ""}${!match?.player2Id ? " bracket-match__tbd" : ""}">
            <div class="bracket-match__player-top">
                <span class="bracket-match__name">${name2}</span>
                <span class="bracket-match__score">${played ? p2Sets : ""}</span>
            </div>
            ${played ? renderSetsRow(sets, "player2") : ""}
        </div>
    `;
    return el;
}

function funnelConnector(flip = false) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", `bracket-connector${flip ? " bracket-connector--flip" : ""}`);
    svg.setAttribute("viewBox", "0 0 100 30");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.innerHTML = `
        <path d="M25,0 L25,14 L75,14 L75,0" />
        <path d="M50,14 L50,30" />
    `;
    return svg;
}

function straightConnector() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "bracket-connector");
    svg.setAttribute("viewBox", "0 0 100 30");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.innerHTML = `<path d="M50,0 L50,30" />`;
    return svg;
}

function renderPairTier(matches) {
    const tier = document.createElement("div");
    tier.className = "bracket-tier bracket-tier--pair";
    matches.forEach(m => tier.appendChild(renderMatch(m)));
    return tier;
}

function renderSingleTier(match) {
    const tier = document.createElement("div");
    tier.className = "bracket-tier bracket-tier--single";
    tier.appendChild(renderMatch(match));
    return tier;
}

function appendLabeled(container, label, node) {
    const labelEl = document.createElement("p");
    labelEl.className = "bracket-tier-label";
    labelEl.textContent = label;
    container.appendChild(labelEl);
    container.appendChild(node);
}

async function renderBracket() {
    const container = document.getElementById("bracket");
    if (!container) return;

    container.classList.add("bracket-diamond");
    container.innerHTML = "";

    const quarterFinals = getQuarterFinals();
    const semiFinals = getSemiFinals();
    const final = getFinal();

    const qfTop = quarterFinals
        .filter(m => Number(m.id) === 41 || Number(m.id) === 42)
        .sort((a, b) => Number(a.id) - Number(b.id));
    const qfBottom = quarterFinals
        .filter(m => Number(m.id) === 43 || Number(m.id) === 44)
        .sort((a, b) => Number(a.id) - Number(b.id));
    const sfTop = semiFinals.find(m => Number(m.id) === 45);
    const sfBottom = semiFinals.find(m => Number(m.id) === 46);

    appendLabeled(container, "Viertelfinale", renderPairTier(qfTop));
    container.appendChild(funnelConnector());
    appendLabeled(container, "Halbfinale", renderSingleTier(sfTop));
    container.appendChild(straightConnector());

    const finalWrap = document.createElement("div");
    finalWrap.className = "bracket-final-wrap";
    const finalLabel = document.createElement("p");
    finalLabel.className = "bracket-final-label";
    finalLabel.textContent = "Finale";
    const finalTier = document.createElement("div");
    finalTier.className = "bracket-tier bracket-tier--single bracket-tier--final";
    finalTier.appendChild(renderMatch(final));
    finalWrap.append(finalLabel, finalTier);
    container.appendChild(finalWrap);

    container.appendChild(straightConnector());
    appendLabeled(container, "Halbfinale", renderSingleTier(sfBottom));
    container.appendChild(funnelConnector(true));
    appendLabeled(container, "Viertelfinale", renderPairTier(qfBottom));
}

renderBracket();