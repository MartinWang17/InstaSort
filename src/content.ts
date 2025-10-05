function getAllReelsByHref() {
    const reels = document.querySelectorAll<HTMLAnchorElement>('a[href*="/reel/"]');
    console.log("[InstaSort] Found reels:", reels.length, reels);
    return reels;
  }

// Minimal helper: pair each reel's tile (anchor's parent) with its views text
function tileViewPairsOnce() {
  const anchors = Array.from(getAllReelsByHref());
  const pairs = anchors.map(a => {
    const tile = ((a.parentElement?.parentElement) as HTMLElement) ?? (a.parentElement as HTMLElement) ?? a;
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
  function tileViewPairsWithNumbers() {
    const pairs = tileViewPairsOnce();
    const withNumbers = pairs.map(p => ({
      tile: p.tile,
      viewsText: p.viewsText,
      viewsNumber: parseViews(p.viewsText)
    }));
  
    console.log("[InstaSort] numeric pairs:", withNumbers);
    return withNumbers;
  }
  
  // Expose for manual testing:
  (window as any).InstaSort_tileViewPairsWithNumbers = tileViewPairsWithNumbers;

// Step 3: reorder tiles visually by views (desc)
function reorderReelsByViewsDesc() {
  const pairs = tileViewPairsWithNumbers();
  if (!pairs.length) {
    console.warn('[InstaSort] No tiles found to reorder.');
    return { moved: 0 };
  }

  const parent = pairs[0].tile?.parentElement as HTMLElement | null;
  if (!parent) {
    console.warn('[InstaSort] Could not locate a common parent container.');
    return { moved: 0 };
  }

  const sorted = pairs.slice().sort((a, b) => {
    const va = Number.isFinite(a.viewsNumber) ? a.viewsNumber : -1;
    const vb = Number.isFinite(b.viewsNumber) ? b.viewsNumber : -1;
    return vb - va;
  });

  const frag = document.createDocumentFragment();
  sorted.forEach(p => frag.appendChild(p.tile));
  parent.appendChild(frag);

  console.log('[InstaSort] Reordered tiles by views (desc). Moved:', sorted.length);
  console.log('[InstaSort] Top 5 after sort:', sorted.slice(0, 5).map(x => x.viewsNumber));
  return { moved: sorted.length };
}

// Expose for manual checkpoint
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).InstaSort_reorderReelsByViewsDesc = reorderReelsByViewsDesc;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'LOG_REEL_ROWS') {
        const count = redistributeTilesIntoRowsDesc();
        sendResponse({ ok: true, rows: count });
        // no async work here, so we don't need to return true
    }
});

// Grid checkpoint helpers (prepare for distributing tiles into rows)
const ROW_SEL = 'div._ac7v.x1ty0z65.xzboxd6, div._ac7v.x1ty9z65.xzboxd6';

function getReelRows(): HTMLElement[] {
  const rows = Array.from(document.querySelectorAll<HTMLElement>(ROW_SEL));
  console.log('[InstaSort] reel rows found:', rows.length, rows);
  return rows;
}

function detectTilesPerRow(row: HTMLElement): number {
  const children = Array.from(row.children);
  const count = children.filter(el => el.querySelector('a[href*="/reel/"]')).length;
  console.log('[InstaSort] tiles in first row:', count, children);
  return count;
}

function InstaSort_checkpoint_detectGrid() {
  const rows = getReelRows();
  console.log('[InstaSort] total rows:', rows.length);
  const tilesPerRow = rows.length ? detectTilesPerRow(rows[0]) : 0;
  console.log('[InstaSort] detected tilesPerRow:', tilesPerRow);
  return { rows: rows.length, tilesPerRow };
}

// Expose globally for manual console use
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).InstaSort_checkpoint_detectGrid = InstaSort_checkpoint_detectGrid;

// ---- Step 3.2: redistribute sorted tiles into rows of N (default 4) ----
function redistributeTilesIntoRowsDesc(perRow = 4) {
  // 1) Get sorted tiles (desc by views)
  const pairs = tileViewPairsWithNumbers();
  if (!pairs.length) {
    console.warn('[InstaSort] No tiles to distribute.');
    return { rowsUsed: 0, tilesPlaced: 0 };
  }
  const sorted = pairs.slice().sort((a, b) => {
    const va = Number.isFinite(a.viewsNumber) ? a.viewsNumber : -1;
    const vb = Number.isFinite(b.viewsNumber) ? b.viewsNumber : -1;
    return vb - va; // desc
  });
  const tiles = sorted.map(p => p.tile);

  // 2) Get existing rows and the grid container
  const rows = getReelRows();
  if (!rows.length) {
    console.warn('[InstaSort] No row containers found.');
    return { rowsUsed: 0, tilesPlaced: 0 };
  }
  const gridParent = rows[0].parentElement as HTMLElement | null;
  if (!gridParent) {
    console.warn('[InstaSort] Missing grid parent.');
    return { rowsUsed: 0, tilesPlaced: 0 };
  }

  // 3) Ensure enough rows for groups of perRow (clone shallow rows if needed)
  const neededRows = Math.ceil(tiles.length / perRow);
  while (rows.length < neededRows) {
    const clone = rows[0].cloneNode(false) as HTMLElement; // shallow clone; no children
    gridParent.appendChild(clone);
    rows.push(clone);
  }

  // 4) Clear current children in each row
  rows.forEach(r => { while (r.firstChild) r.removeChild(r.firstChild); });

  // 5) Distribute tiles row-by-row
  let i = 0;
  for (let r = 0; r < rows.length && i < tiles.length; r++) {
    const frag = document.createDocumentFragment();
    for (let c = 0; c < perRow && i < tiles.length; c++, i++) {
      frag.appendChild(tiles[i]);
    }
    rows[r].appendChild(frag);
  }

  // 6) Checkpoint logs: how many per row after fill
  const counts = rows.map(r => Array.from(r.children).length);
  console.log(`[InstaSort] Distributed ${tiles.length} tiles across ${rows.length} rows @ ${perRow}/row`, counts);
  return { rowsUsed: rows.length, tilesPlaced: tiles.length, perRow, counts };
}

// Expose checkpoint for manual run
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).InstaSort_redistributeTilesIntoRowsDesc = redistributeTilesIntoRowsDesc;