import { loadMatches } from "./dataLoader.js";
const matches =  await loadMatches();
import { calculateAllStandings } from "./standings.js";

function getMatchById(matchesList, id) {
    return matchesList.find(match => match.id === id);
}

export function getWinner(match) {
    if (!match || !match.result) {
        return null;
    }

    if (match.status !== "gespielt") {
        return null;
    }

    if (match.result.player1Sets > match.result.player2Sets) {
        return match.player1Id;
    }

    if (match.result.player2Sets > match.result.player1Sets) {
        return match.player2Id;
    }

    return null;
}

export function areAllGroupMatchesFinished(matchesList = matches) {
    const groupMatches = matchesList.filter(match => match.phase === "gruppe");

    return groupMatches.every(match =>
        match.status === "gespielt" &&
        match.result !== null
    );
}

export function updateKnockoutMatches(matchesList = matches) {
    const updatedMatches = matchesList.map(match => ({ ...match }));

    if (areAllGroupMatchesFinished(updatedMatches)) {
        const standings = calculateAllStandings();

        const a1 = standings.A[0]?.playerId;
        const a2 = standings.A[1]?.playerId;
        const b1 = standings.B[0]?.playerId;
        const b2 = standings.B[1]?.playerId;
        const c1 = standings.C[0]?.playerId;
        const c2 = standings.C[1]?.playerId;
        const d1 = standings.D[0]?.playerId;
        const d2 = standings.D[1]?.playerId;

        setPlayers(updatedMatches, 41, a1, b2);
        setPlayers(updatedMatches, 42, c1, d2);
        setPlayers(updatedMatches, 43, b1, a2);
        setPlayers(updatedMatches, 44, d1, c2);
    }

    const quarterFinal1 = getMatchById(updatedMatches, 41);
    const quarterFinal2 = getMatchById(updatedMatches, 42);
    const quarterFinal3 = getMatchById(updatedMatches, 43);
    const quarterFinal4 = getMatchById(updatedMatches, 44);

    const qf1Winner = getWinner(quarterFinal1);
    const qf2Winner = getWinner(quarterFinal2);
    const qf3Winner = getWinner(quarterFinal3);
    const qf4Winner = getWinner(quarterFinal4);

    setPlayers(updatedMatches, 45, qf1Winner, qf2Winner);
    setPlayers(updatedMatches, 46, qf3Winner, qf4Winner);

    const semiFinal1 = getMatchById(updatedMatches, 45);
    const semiFinal2 = getMatchById(updatedMatches, 46);

    const sf1Winner = getWinner(semiFinal1);
    const sf2Winner = getWinner(semiFinal2);

    setPlayers(updatedMatches, 47, sf1Winner, sf2Winner);

    return updatedMatches;
}

function setPlayers(matchesList, matchId, player1Id, player2Id) {
    const match = getMatchById(matchesList, matchId);

    if (!match) {
        return;
    }

    if (player1Id) {
        match.player1Id = player1Id;
    }

    if (player2Id) {
        match.player2Id = player2Id;
    }
}

export function getKnockoutMatches(matchesList = matches) {
    return updateKnockoutMatches(matchesList).filter(match =>
        match.phase === "viertelfinale" ||
        match.phase === "halbfinale" ||
        match.phase === "finale"
    );
}

export function getQuarterFinals(matchesList = matches) {
    return updateKnockoutMatches(matchesList).filter(match =>
        match.phase === "viertelfinale"
    );
}

export function getSemiFinals(matchesList = matches) {
    return updateKnockoutMatches(matchesList).filter(match =>
        match.phase === "halbfinale"
    );
}

export function getFinal(matchesList = matches) {
    return updateKnockoutMatches(matchesList).find(match =>
        match.phase === "finale"
    );
}

export function printKnockoutMatches(matchesList = matches) {
    const knockoutMatches = getKnockoutMatches(matchesList);

    console.table(
        knockoutMatches.map(match => ({
            id: match.id,
            phase: match.phase,
            player1: match.player1Id ?? "-",
            player2: match.player2Id ?? "-",
            table: match.table,
            time: match.time,
            status: match.status,
            result: match.result
                ? `${match.result.player1Sets}:${match.result.player2Sets}`
                : "-"
        }))
    );
}