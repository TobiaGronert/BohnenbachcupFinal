export async function loadMatches() {
    const response = await fetch("./matches.json?t=" + Date.now());

    if (!response.ok) {
        throw new Error("matches.json konnte nicht geladen werden.");
    }

    return await response.json();
}