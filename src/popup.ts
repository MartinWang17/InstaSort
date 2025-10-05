
async function sendLogReelRows() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.includes('instagram.com')) {
    console.error('[InstaSort] Open instagram.com in the active tab, then click again.');
    alert('Open instagram.com in the active tab, then click again.');
    return;
  }
  try {
    // Send the agreed message type used by the content script listener
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'LOG_REEL_ROWS' });
    console.log('[InstaSort] Response from content script:', response);
  } catch (err) {
    console.error('[InstaSort] No content script connection. Refresh the Instagram tab and try again.', err);
    alert('Please refresh the Instagram tab and click the button again.');
  }
}

// Attach click handler only if the button exists (avoids null errors in TS)
document.getElementById('sortBtn')?.addEventListener('click', () => {
  // Ask the content script to log and return the number of reel rows
  sendLogReelRows().catch(err => console.error('[InstaSort] Failed:', err));
});