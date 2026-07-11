import fs from "fs";

const MATCHES_FILE = "./matches.json";
const DELAY_MS = 100;

const POINTS_WIN = 3;
const POINTS_DRAW = 1;
const POINTS_LOSS = 0;

function loadMatches() {
    return JSON.parse(fs.readFileSync(MATCHES_FILE, "utf8"));
}

function saveMatches(matches) {
    fs.writeFileSync(MATCHES_FILE, JSON.stringify(matches, null, 4), "utf8");
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getMatchFormat(match) {
    if (match.phase === "gruppe") {
        return { type: "fixed", totalSets: 2 };
    }
    if (match.phase === "viertelfinale") {
        return { type: "bestOf", requiredWins: 2 };
    }
    return { type: "bestOf", requiredWins: 3 };
}

function randomSetScore(player1WinsSet) {
    const loserPoints = Math.floor(Math.random() * 10); // 0–9
    return player1WinsSet
        ? { player1: 11, player2: loserPoints }
        : { player1: loserPoints, player2: 11 };
}

function generateRandomResult(match) {
    const format = getMatchFormat(match);
    const sets = [];

    let player1Sets = 0;
    let player2Sets = 0;

    if (format.type === "fixed") {
        for (let i = 0; i < format.totalSets; i++) {
            const player1WinsSet = Math.random() < 0.5;
            sets.push(randomSetScore(player1WinsSet));

            if (player1WinsSet) {
                player1Sets++;
            } else {
                player2Sets++;
            }
        }
    } else {
        while (player1Sets < format.requiredWins && player2Sets < format.requiredWins) {
            const player1WinsSet = Math.random() < 0.5;
            sets.push(randomSetScore(player1WinsSet));

            if (player1WinsSet) {
                player1Sets++;
            } else {
                player2Sets++;
            }
        }
    }

    const winnerId =
        player1Sets === player2Sets
            ? null
            : player1Sets > player2Sets
                ? match.player1Id
                : match.player2Id;

    return {
        winnerId,
        player1Sets,
        player2Sets,
        sets
    };
}

function resetTournament(matches) {
    for (const match of matches) {
        match.status = "geplant";
        match.result = null;

        if (match.phase !== "gruppe") {
            match.player1Id = null;
            match.player2Id = null;
        }
    }

    fillLiveMatches(matches);
}

function fillLiveMatches(matches) {
    const currentLiveMatches = matches.filter(match => match.status === "live");

    const hasSingleTablePhase = matches.some(match =>
        match.id >= 45 &&
        (match.status === "live" || match.status === "gespielt")
    );

    const maxLiveMatches = hasSingleTablePhase ? 1 : 2;
    const missingLiveSlots = maxLiveMatches - currentLiveMatches.length;

    if (missingLiveSlots <= 0) return;

    const nextPlannedMatches = matches
        .filter(match =>
            match.status === "geplant" &&
            match.player1Id &&
            match.player2Id
        )
        .sort((a, b) => a.id - b.id)
        .slice(0, missingLiveSlots);

    for (const match of nextPlannedMatches) {
        match.status = "live";
    }
}

function calculateStandings(matches, group) {
    const groupMatches = matches.filter(match =>
        match.phase === "gruppe" &&
        match.group === group &&
        match.status === "gespielt" &&
        match.result
    );

    const playerIds = [
        ...new Set(
            groupMatches.flatMap(match => [match.player1Id, match.player2Id])
        )
    ];

    const standings = playerIds.map(playerId => ({
        playerId,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        setsWon: 0,
        setsLost: 0,
        setDifference: 0,
        pointsWon: 0,
        pointsLost: 0,
        pointDifference: 0
    }));

    function getStanding(playerId) {
        return standings.find(player => player.playerId === playerId);
    }

    for (const match of groupMatches) {
        const p1 = getStanding(match.player1Id);
        const p2 = getStanding(match.player2Id);
        const r = match.result;

        p1.setsWon += r.player1Sets;
        p1.setsLost += r.player2Sets;
        p2.setsWon += r.player2Sets;
        p2.setsLost += r.player1Sets;

        if (r.player1Sets === r.player2Sets) {
            p1.draws++;
            p2.draws++;
            p1.points += POINTS_DRAW;
            p2.points += POINTS_DRAW;
        } else if (r.player1Sets > r.player2Sets) {
            p1.wins++;
            p2.losses++;
            p1.points += POINTS_WIN;
            p2.points += POINTS_LOSS;
        } else {
            p2.wins++;
            p1.losses++;
            p2.points += POINTS_WIN;
            p1.points += POINTS_LOSS;
        }

        for (const set of r.sets) {
            p1.pointsWon += set.player1;
            p1.pointsLost += set.player2;
            p2.pointsWon += set.player2;
            p2.pointsLost += set.player1;
        }
    }

    for (const player of standings) {
        player.setDifference = player.setsWon - player.setsLost;
        player.pointDifference = player.pointsWon - player.pointsLost;
    }

    return sortStandingsWithTieBreaker(standings, groupMatches);
}

function sortStandingsWithTieBreaker(standings, groupMatches) {
    const pointGroups = {};

    for (const player of standings) {
        if (!pointGroups[player.points]) {
            pointGroups[player.points] = [];
        }
        pointGroups[player.points].push(player);
    }

    return Object.values(pointGroups)
        .sort((a, b) => b[0].points - a[0].points)
        .flatMap(tiedPlayers => sortTieGroup(tiedPlayers, groupMatches));
}

function sortTieGroup(tiedPlayers, groupMatches) {
    if (tiedPlayers.length === 1) {
        return tiedPlayers;
    }

    const tiedIds = tiedPlayers.map(player => player.playerId);

    const directMatches = groupMatches.filter(match =>
        tiedIds.includes(match.player1Id) &&
        tiedIds.includes(match.player2Id)
    );

    const miniTable = tiedPlayers.map(player => ({
        ...player,
        h2hPoints: 0,
        h2hSetsWon: 0,
        h2hSetsLost: 0,
        h2hSetDifference: 0,
        h2hPointsWon: 0,
        h2hPointsLost: 0,
        h2hPointDifference: 0,
    }));

    for (const match of directMatches) {
        const p1 = miniTable.find(player => player.playerId === match.player1Id);
        const p2 = miniTable.find(player => player.playerId === match.player2Id);

        if (!p1 || !p2 || !match.result) continue;

        const r = match.result;

        if (r.player1Sets === r.player2Sets) {
            p1.h2hPoints += POINTS_DRAW;
            p2.h2hPoints += POINTS_DRAW;
        } else if (r.player1Sets > r.player2Sets) {
            p1.h2hPoints += POINTS_WIN;
        } else {
            p2.h2hPoints += POINTS_WIN;
        }

        p1.h2hSetsWon += r.player1Sets;
        p1.h2hSetsLost += r.player2Sets;
        p2.h2hSetsWon += r.player2Sets;
        p2.h2hSetsLost += r.player1Sets;

        for (const set of r.sets) {
            p1.h2hPointsWon += set.player1;
            p1.h2hPointsLost += set.player2;
            p2.h2hPointsWon += set.player2;
            p2.h2hPointsLost += set.player1;
        }
    }

    for (const player of miniTable) {
        player.h2hSetDifference = player.h2hSetsWon - player.h2hSetsLost;
        player.h2hPointDifference = player.h2hPointsWon - player.h2hPointsLost;
    }

    return miniTable.sort((a, b) =>
        b.h2hPoints - a.h2hPoints ||
        b.h2hSetDifference - a.h2hSetDifference ||
        b.h2hPointDifference - a.h2hPointDifference ||
        b.setDifference - a.setDifference
    );
}
function getWinner(match) {
    return match?.result?.winnerId ?? null;
}

function setMatchPlayers(matches, matchId, player1Id, player2Id) {
    const match = matches.find(match => match.id === matchId);
    if (!match) return;

    if (player1Id) match.player1Id = player1Id;
    if (player2Id) match.player2Id = player2Id;
}

function updateKnockout(matches) {
    const allGroupFinished = matches
        .filter(match => match.phase === "gruppe")
        .every(match => match.status === "gespielt");

    if (allGroupFinished) {
        const A = calculateStandings(matches, "A");
        const B = calculateStandings(matches, "B");
        const C = calculateStandings(matches, "C");
        const D = calculateStandings(matches, "D");

        setMatchPlayers(matches, 41, A[0]?.playerId, B[1]?.playerId);
        setMatchPlayers(matches, 42, C[0]?.playerId, D[1]?.playerId);
        setMatchPlayers(matches, 43, B[0]?.playerId, A[1]?.playerId);
        setMatchPlayers(matches, 44, D[0]?.playerId, C[1]?.playerId);
    }

    setMatchPlayers(
        matches,
        45,
        getWinner(matches.find(match => match.id === 41)),
        getWinner(matches.find(match => match.id === 42))
    );

    setMatchPlayers(
        matches,
        46,
        getWinner(matches.find(match => match.id === 43)),
        getWinner(matches.find(match => match.id === 44))
    );

    setMatchPlayers(
        matches,
        47,
        getWinner(matches.find(match => match.id === 45)),
        getWinner(matches.find(match => match.id === 46))
    );
}

async function simulateTournament() {
    const matches = loadMatches();

    resetTournament(matches);
    saveMatches(matches);

    console.log("Turnier-Simulation gestartet.");

    while (true) {
        const liveMatch = matches
            .filter(match => match.status === "live")
            .sort((a, b) => a.id - b.id)[0];

        if (!liveMatch) {
            console.log("Keine Live-Spiele mehr vorhanden.");
            break;
        }

        const result = generateRandomResult(liveMatch);

        liveMatch.status = "gespielt";
        liveMatch.result = result;

        const scoreLabel = result.winnerId
            ? `${liveMatch.player1Id} ${result.player1Sets}:${result.player2Sets} ${liveMatch.player2Id}`
            : `${liveMatch.player1Id} ${result.player1Sets}:${result.player2Sets} ${liveMatch.player2Id} — Unentschieden`;

        console.log(`Spiel ${liveMatch.id}: ${scoreLabel}`);

        updateKnockout(matches);
        fillLiveMatches(matches);
        saveMatches(matches);

        if (matches.find(match => match.id === 47)?.status === "gespielt") {
            console.log("Turnier beendet.");
            break;
        }

        await sleep(DELAY_MS);
    }

    saveMatches(matches);
}

simulateTournament();