function logReelRows() {
    // Try current class variant first, then a known alternative; merge results
    const primary = Array.from(document.querySelectorAll('div._ac7v.x1ty0z65.xzboxd6')) as Element[];
    const fallback = Array.from(document.querySelectorAll('div._ac7v.x1ty9z65.xzboxd6')) as Element[];
    const seen = new Set<Element>();
    const merged: Element[] = [];
    for (const el of [...primary, ...fallback]) {
        if (!seen.has(el)) { seen.add(el); merged.push(el); }
    }
    console.log("[InstaSort] Found rows:", merged.length, merged);
    return merged.length;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'LOG_REEL_ROWS') {
        const count = logReelRows();
        sendResponse({ ok: true, rows: count });
        // no async work here, so we don't need to return true
    }
});