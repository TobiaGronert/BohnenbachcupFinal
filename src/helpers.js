import { players } from "./players.js";
import { loadMatches } from "./dataLoader.js";
const matches = await loadMatches();

import { calculateAllStandings, calculateStandings } from "./standings.js";
import {
    getKnockoutMatches,
    getQuarterFinals,
    getSemiFinals,
    getFinal
} from "./knockouts.js";


// ==========================
// Matches
// ==========================

export function getLiveMatches() {
    return matches.filter(match => match.status === "live");
}

export function getCurrentMatch() {
    return getLiveMatches()[0] ?? null;
}

export function getUpcomingMatches(limit = Infinity) {
    return matches
        .filter(match => match.status === "geplant")
        .slice(0, limit);
}

export function getNextMatch() {
    return getUpcomingMatches(1)[0] ?? null;
}

export function getFinishedMatches(limit = Infinity) {
    return matches
        .filter(match => match.status === "gespielt")
        .slice(-limit)
        .reverse();
}

export function getMatchesByGroup(group) {
    return matches.filter(match =>
        match.phase === "gruppe" &&
        match.group === group
    );
}

export function getMatches(){
    return matches
}

export function getFinishedMatchesByGroup(group) {
    return getMatchesByGroup(group).filter(match =>
        match.status === "gespielt"
    );
}

export function getUpcomingMatchesByGroup(group) {
    return getMatchesByGroup(group).filter(match =>
        match.status === "geplant"
    );
}


// ==========================
// Spieler
// ==========================

export function getPlayerById(id) {
    return players.find(player => player.id === id);
}


export function getPlayerName(id) {
    console.log("Gesuchte ID:", id);
    console.log("Alle Spieler:", players);

    const player = getPlayerById(id);
    console.log("Gefunden:", player);

    return player?.name ?? "Hi";
}

export function getPlayerGroup(id) {
    return getPlayerById(id)?.group ?? null;
}

export function getPlayerMatches(id) {
    return matches.filter(match =>
        match.player1Id === id ||
        match.player2Id === id
    );
}

export function getPlayerFinishedMatches(id) {
    return getPlayerMatches(id).filter(match =>
        match.status === "gespielt"
    );
}

export function getPlayerUpcomingMatches(id) {
    return getPlayerMatches(id).filter(match =>
        match.status === "geplant"
    );
}

export function getWinnerId() {
    const final = matches.find(match => match.phase === "finale");
    return final?.result?.winnerId ?? null;
}

// ==========================
// Tabellen
// ==========================

export function getStandings() {
    return calculateAllStandings();
}

export function getStanding(group) {
    return calculateStandings(group);
}

export function getGroupWinner(group) {
    return calculateStandings(group)[0] ?? null;
}

export function getGroupRunnerUp(group) {
    return calculateStandings(group)[1] ?? null;
}


// ==========================
// KO
// ==========================

export function getKnockout() {
    return getKnockoutMatches();
}

export {
    getQuarterFinals,
    getSemiFinals,
    getFinal
};


// ==========================
// Turnierstatus
// ==========================

export function isGroupStageFinished() {
    return matches
        .filter(match => match.phase === "gruppe")
        .every(match => match.status === "gespielt");
}

export function isKnockoutStarted() {
    return matches
        .filter(match => match.phase !== "gruppe")
        .some(match => match.status !== "geplant");
}

export function isTournamentFinished() {
    const final = matches.find(match => match.phase === "finale");

    return final?.status === "gespielt";
}

export function getTournamentPhase() {
    if (isTournamentFinished()) {
        return "beendet";
    }

    const final = matches.find(match => match.phase === "finale");
    if (final?.status === "live") {
        return "finale";
    }

    const semi = matches.some(match =>
        match.phase === "halbfinale" &&
        (match.status === "live" || match.status === "gespielt")
    );

    if (semi) {
        return "halbfinale";
    }

    const quarter = matches.some(match =>
        match.phase === "viertelfinale" &&
        (match.status === "live" || match.status === "gespielt")
    );

    if (quarter) {
        return "viertelfinale";
    }

    return "gruppenphase";
}


// ==========================
// Formatierung
// ==========================

export function formatResult(match) {
    if (!match.result) {
        return "-";
    }

    return `${match.result.player1Sets}:${match.result.player2Sets}`;
}

export function formatDetailedResult(match) {
    if (!match.result?.sets) {
        return "-";
    }

    return match.result.sets
        .map(set => `${set.player1}:${set.player2}`)
        .join(", ");
}