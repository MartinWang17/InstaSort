// Response type from the content script
interface SortResponse {
  success: boolean;
  message: string;
  postsFound?: number;
  postsSorted?: number;
}

// Grab the UI elements we still use. We keep only one button and a status area.
const sortButton = document.getElementById('sortButton') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

// Function to show status message
function showStatus(message: string, isError: boolean = false) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${isError ? 'error' : 'success'}`;
  statusDiv.style.display = 'block';
  
  // Hide status after 3 seconds
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

// Send a single message to the content script instructing it to sort by views
async function sendSortByViews(): Promise<SortResponse> {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }
    
    // Check if we're on Instagram
    if (!tab.url?.includes('instagram.com')) {
      throw new Error('Please navigate to Instagram first');
    }
    
    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'sortByViews' });
    
    return response as SortResponse;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Handle button click: disable, send message, show status, re-enable
sortButton.addEventListener('click', async () => {
  // Disable button during processing
  sortButton.disabled = true;
  sortButton.textContent = 'Sorting by views...';
  
  try {
    const response = await sendSortByViews();
    console.log('Received response:', response);
    
    if (response.success) {
      const postsInfo = response.postsSorted ? 
        ` (${response.postsSorted} posts sorted)` : '';
      const foundInfo = response.postsFound ? ` from ${response.postsFound}` : '';
      showStatus(`${response.message}${postsInfo}${foundInfo}`, false);
    } else {
      showStatus(response.message, true);
      console.error('Sort failed:', response);
    }
  } catch (error) {
    showStatus('Failed to sort posts', true);
    console.error('Sort error:', error);
  } finally {
    // Re-enable button
    sortButton.disabled = false;
    sortButton.textContent = 'Sort by Views';
  }
});

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  console.log('InstaSort popup ready - single action: Sort by Views');
  // If the HTML still contains previous controls, hide them for simplicity
  const oldSelectors = ['#itemCount', '#sortMetric', '#debugButton'];
  for (const sel of oldSelectors) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) el.style.display = 'none';
  }
  // Ensure the button label matches the new behavior
  sortButton.textContent = 'Sort by Views';
});
