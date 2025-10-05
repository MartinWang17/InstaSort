function getAllReelsByHref() {
    const reels = document.querySelectorAll<HTMLAnchorElement>('a[href*="/reel/"]');
    console.log("[InstaSort] Found reels:", reels.length, reels);
    return reels;
  }

// Minimal helper: pair each reel's tile (anchor's parent) with its views text
function logTileViewPairsOnce() {
  const anchors = Array.from(getAllReelsByHref());
  const pairs = anchors.map(a => {
    const tile = (a.parentElement as HTMLElement) ?? a;
    const span =
      a.querySelector('div._aajy span[class*="html-span"]') ||
      tile.querySelector('div._aajy span[class*="html-span"]');
    const text = span?.textContent?.trim() || '';
    // Checkpoint: clickable tile + its view text
    console.log('tile:', tile, 'views:', text);
    return { tile, viewsText: text };
  });
  console.log('[InstaSort] pairs total:', pairs.length);
  return pairs;
}

function parseViews(viewsText: string): number {
    // Remove commas and spaces
    const clean = viewsText.replace(/,/g, '').trim().toLowerCase();
  
    // Match the number and optional suffix (k or m)
    const match = clean.match(/^([\d.]+)\s*([km]?)$/);
    if (!match) return NaN;
  
    let num = parseFloat(match[1]);
    const suffix = match[2];
  
    if (suffix === 'k') num *= 1_000;
    if (suffix === 'm') num *= 1_000_000;
  
    return num;
  }

  // checkpoint testing to ensure parseViews works
  function logTileViewPairsWithNumbers() {
    const pairs = logTileViewPairsOnce();
    const withNumbers = pairs.map(p => ({
      tile: p.tile,
      viewsText: p.viewsText,
      viewsNumber: parseViews(p.viewsText)
    }));
  
    console.log("[InstaSort] numeric pairs:", withNumbers);
    return withNumbers;
  }
  
  // Expose for manual testing:
  (window as any).InstaSort_logTileViewPairsWithNumbers = logTileViewPairsWithNumbers;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'LOG_REEL_ROWS') {
        const count = logTileViewPairsOnce();
        sendResponse({ ok: true, rows: count });
        // no async work here, so we don't need to return true
    }
});