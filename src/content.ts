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

// Expose for manual testing: window.InstaSort_logTileViewPairsOnce()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).InstaSort_logTileViewPairsOnce = logTileViewPairsOnce;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'LOG_REEL_ROWS') {
        const count = logTileViewPairsOnce();
        sendResponse({ ok: true, rows: count });
        // no async work here, so we don't need to return true
    }
});