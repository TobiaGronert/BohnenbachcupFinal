import { players } from "./players.js";
import { getMatches } from "./helpers.js";

const POINTS_WIN = 3;
const POINTS_DRAW = 1;
const POINTS_LOSS = 0;

export function calculateStandings(group) {
    const matches = getMatches();

    const groupPlayers = players.filter(player => player.group === group);

    const standings = groupPlayers.map(player => ({
        playerId: player.id,
        name: player.name,
        group: player.group,

        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,

        points: 0,

        setsWon: 0,
        setsLost: 0,
        setDifference: 0,

        pointsWon: 0,
        pointsLost: 0,
        pointDifference: 0,
    }));

    const groupMatches = matches.filter(match =>
        match.phase === "gruppe" &&
        match.group === group &&
        match.status === "gespielt" &&
        match.result
    );

    for (const match of groupMatches) {
        const player1 = standings.find(p => p.playerId === match.player1Id);
        const player2 = standings.find(p => p.playerId === match.player2Id);

        if (!player1 || !player2) continue;

        const r = match.result;

        player1.matchesPlayed++;
        player2.matchesPlayed++;

        player1.setsWon += r.player1Sets;
        player1.setsLost += r.player2Sets;

        player2.setsWon += r.player2Sets;
        player2.setsLost += r.player1Sets;

        if (r.player1Sets === r.player2Sets) {
            player1.draws++;
            player2.draws++;
            player1.points += POINTS_DRAW;
            player2.points += POINTS_DRAW;
        } else if (r.player1Sets > r.player2Sets) {
            player1.wins++;
            player2.losses++;
            player1.points += POINTS_WIN;
            player2.points += POINTS_LOSS;
        } else {
            player2.wins++;
            player1.losses++;
            player2.points += POINTS_WIN;
            player1.points += POINTS_LOSS;
        }

        for (const set of r.sets) {
            player1.pointsWon += set.player1;
            player1.pointsLost += set.player2;

            player2.pointsWon += set.player2;
            player2.pointsLost += set.player1;
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
        const player1 = miniTable.find(p => p.playerId === match.player1Id);
        const player2 = miniTable.find(p => p.playerId === match.player2Id);

        if (!player1 || !player2 || !match.result) continue;

        const r = match.result;

        if (r.player1Sets === r.player2Sets) {
            player1.h2hPoints += POINTS_DRAW;
            player2.h2hPoints += POINTS_DRAW;
        } else if (r.player1Sets > r.player2Sets) {
            player1.h2hPoints += POINTS_WIN;
        } else {
            player2.h2hPoints += POINTS_WIN;
        }

        player1.h2hSetsWon += r.player1Sets;
        player1.h2hSetsLost += r.player2Sets;

        player2.h2hSetsWon += r.player2Sets;
        player2.h2hSetsLost += r.player1Sets;

        for (const set of r.sets) {
            player1.h2hPointsWon += set.player1;
            player1.h2hPointsLost += set.player2;

            player2.h2hPointsWon += set.player2;
            player2.h2hPointsLost += set.player1;
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

export function calculateAllStandings() {
    return {
        A: calculateStandings("A"),
        B: calculateStandings("B"),
        C: calculateStandings("C"),
        D: calculateStandings("D"),
    };
}