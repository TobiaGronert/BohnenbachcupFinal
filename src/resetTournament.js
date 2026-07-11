import fs from "fs";

const MATCHES_FILE = "./matches.json";

function loadMatches() {
    return JSON.parse(fs.readFileSync(MATCHES_FILE, "utf8"));
}

function saveMatches(matches) {
    fs.writeFileSync(
        MATCHES_FILE,
        JSON.stringify(matches, null, 4),
        "utf8"
    );
}

function resetTournament() {
    const matches = loadMatches();

    const resetMatches = matches.map(match => ({
        ...match,
        status: match.id === 1 || match.id === 2 ? "live" : "geplant",
        result: null,
        player1Id: match.phase === "gruppe" ? match.player1Id : null,
        player2Id: match.phase === "gruppe" ? match.player2Id : null
    }));

    saveMatches(resetMatches);

    console.log("Turnier wurde zurückgesetzt.");
    console.log("Spiel 1 und 2 sind jetzt live.");
}

resetTournament();