function getAllReelsByHref() {
    const reels = document.querySelectorAll<HTMLAnchorElement>('a[href*="/reel/"]');
    console.log("[InstaSort] Found reels:", reels.length, reels);
    return reels;
  }

// Collect the text value from the first span whose class starts with
// "html-span" under a nearby container that includes a div._aajy.
// Returns an array of { href, value } for each reel link found.
function collectReelValuesFromAajyHtmlSpan(): Array<{ href: string; value: string | null }> {
  // Start from the discovered reel anchors
  const reelAnchors = Array.from(getAllReelsByHref());

  const results: Array<{ href: string; value: string | null }> = [];

  for (const anchor of reelAnchors) {
    let current: HTMLElement | null = anchor as HTMLElement;
    let aajyContainer: HTMLElement | null = null;

    // Walk up the DOM until we find an ancestor that contains div._aajy
    while (current && current !== document.body) {
      const found = current.querySelector('div._aajy') as HTMLElement | null;
      if (found) { aajyContainer = found; break; }
      current = current.parentElement as HTMLElement | null;
    }

    // Within that container, look for the span whose class starts with/contains "html-span"
    let value: string | null = null;
    if (aajyContainer) {
      const span = aajyContainer.querySelector(
        'span[class^="html-span"], span[class*="html-span"]'
      ) as HTMLSpanElement | null;
      value = span?.textContent?.trim() ?? null;
    }

    results.push({ href: anchor.href, value });
  }

  console.log('[InstaSort] html-span values:', results);
  return results;
}

// Expose a tiny debug hook so you can run it from DevTools:
// In the Instagram tab console, call: window.InstaSort_logReelSpanValues()
// This prints and returns the collected values.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).InstaSort_logReelSpanValues = collectReelValuesFromAajyHtmlSpan;


chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'LOG_REEL_ROWS') {
        const count = collectReelValuesFromAajyHtmlSpan();
        sendResponse({ ok: true, rows: count });
        // no async work here, so we don't need to return true
    }
});