// Basic types used for the simplified "Sort by Views" flow
// - We only care about views and the element to move in the DOM
interface ViewPostData {
  // The DOM node that represents the post root we will reorder
  element: HTMLElement;
  // Parsed number of views for this post
  views: number;
  // Original discovery order (used as a stable tiebreaker)
  index: number;
}

// Response returned back to the popup after a sort attempt
interface SortResponse {
  success: boolean;
  message: string;
  postsFound?: number;
  postsSorted?: number;
}

// Utility function to extract a numeric value from human-readable counts like
// "12.3K", "1,234", "2.1M". Returns 0 for anything unparseable.
function extractNumber(text: string): number {
  if (!text) return 0;
  
  // Remove all non-numeric characters except dots, commas, and letters (for K, M, B)
  const cleaned = text.replace(/[^\d.,KMBkmb]/g, '');
  
  // Handle K, M, B suffixes
  const multiplier = cleaned.toLowerCase().includes('k') ? 1000 :
                    cleaned.toLowerCase().includes('m') ? 1000000 :
                    cleaned.toLowerCase().includes('b') ? 1000000000 : 1;
  
  // Extract the numeric part
  const numericPart = cleaned.replace(/[KMBkmb]/g, '').replace(/,/g, '');
  const number = parseFloat(numericPart) || 0;
  
  return number * multiplier;
}

// Locate likely post root elements on an Instagram page. We keep this
// intentionally simple: most feed items are inside an `article` element and
// many reels are large, clickable containers. We normalize to the closest
// `article` when available to avoid selecting nested children.
function findPostRoots(): HTMLElement[] {
  // Collect initial candidates using simple selectors that work across many
  // layouts while staying conservative to avoid non-post wrappers.
  const candidates = Array.from(
    document.querySelectorAll('article, div[role="button"][tabindex="0"]')
  );

  // Normalize each candidate to a stable root and remove duplicates.
  const roots: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();
  for (const node of candidates) {
    const element = node as HTMLElement;
    // Prefer the closest `article` as the canonical post root
    const root = (element.closest('article') as HTMLElement) || element;
    if (!seen.has(root)) {
      seen.add(root);
      roots.push(root);
    }
  }

  return roots;
}

// Extract the number of views from a post element. We intentionally only
// implement detection for views/plays to keep this focused.
function extractViewsForPost(element: HTMLElement): number {
  // Prefer explicit aria/text that mentions views/plays.
  const explicitNodes = element.querySelectorAll('[aria-label*="view" i], [aria-label*="play" i], [data-testid*="view" i]');
  for (const node of Array.from(explicitNodes)) {
    const text = (node as HTMLElement).getAttribute('aria-label') || node.textContent || '';
    if (!text) continue;
    if (/views?|plays?/i.test(text) && /\d/.test(text)) {
      const num = extractNumber(text);
      if (num > 0) return num;
    }
  }

  // Fallback: scan the post's text content for occurrences like "12.3K views" or "1.1M plays".
  const allText = element.textContent || '';
  const match = allText.match(/([\d.,KMBkmb]+)\s*(views?|plays?)/i);
  if (match && match[1]) {
    const num = extractNumber(match[0]);
    if (num > 0) return num;
  }

  // If we couldn't find a reliable views count, return 0 so the post is ignored.
  return 0;
}

// Produce a sorted list of posts by views and return the posts that share the
// most common parent container. This keeps reordering safe within that section
// of the page.
function getTopParentGroupSortedByViews(): { parent: Element; posts: ViewPostData[] } | null {
  // Discover post roots first
  const roots = findPostRoots();
  if (roots.length === 0) return null;

  // Build view data for each post and compute its parent
  const withViews: Array<{ data: ViewPostData; parent: Element | null }> = roots.map((el, index) => ({
    data: { element: el, views: extractViewsForPost(el), index },
    parent: el.parentElement
  }));

  // Filter to posts that have a non-zero view count and a parent to reorder in
  const eligible = withViews.filter(p => p.data.views > 0 && p.parent);
  if (eligible.length === 0) return null;

  // Group posts by parent and find the parent with the most posts
  const parentToPosts = new Map<Element, ViewPostData[]>();
  for (const { data, parent } of eligible) {
    if (!parent) continue;
    if (!parentToPosts.has(parent)) parentToPosts.set(parent, []);
    parentToPosts.get(parent)!.push(data);
  }

  let bestParent: Element | null = null;
  let bestGroup: ViewPostData[] = [];
  for (const [parent, group] of parentToPosts.entries()) {
    if (!bestParent || group.length > bestGroup.length) {
      bestParent = parent;
      bestGroup = group;
    }
  }

  if (!bestParent) return null;

  // Sort that group's posts by views (desc), then by original order for stability
  const sorted = [...bestGroup].sort((a, b) => {
    if (b.views !== a.views) return b.views - a.views;
    return a.index - b.index;
  });

  return { parent: bestParent, posts: sorted };
}

// Reorder the DOM for a single parent container using the provided order.
// This preserves other siblings and only moves the targeted post elements.
function reorderWithinParent(parent: Element, orderedPosts: ViewPostData[]): number {
  if (orderedPosts.length === 0) return 0;

  // Identify the current children and where the first post originally appears
  const children = Array.from(parent.children);
  const postElements = orderedPosts.map(p => p.element);

  // Find the earliest index among the posts within this parent
  let insertIndex = children.length;
  for (let i = 0; i < children.length; i++) {
    if (postElements.includes(children[i] as HTMLElement)) {
      insertIndex = i;
      break;
    }
  }

  // Remove all posts from the DOM (only if they are inside this parent)
  for (const p of orderedPosts) {
    if (p.element.parentElement === parent) {
      p.element.remove();
    }
  }

  // Compute the node before which we will insert (the child at insertIndex)
  const beforeNode = parent.children[insertIndex] || null;

  // Insert posts in the desired order (most views first)
  for (const p of orderedPosts) {
    parent.insertBefore(p.element, beforeNode);
  }

  return orderedPosts.length;
}

// Main action: sort visible posts by views and reorder the DOM.
async function sortByViews(): Promise<SortResponse> {
  try {
    // Build the best group of posts that share a container and can be safely reordered
    const group = getTopParentGroupSortedByViews();
    if (!group) {
      return {
        success: false,
        message: 'No posts with detectable views found on this page.'
      };
    }

    // Reorder elements within that parent container
    const moved = reorderWithinParent(group.parent, group.posts);

    return {
      success: true,
      message: 'Sorted by views',
      postsFound: group.posts.length,
      postsSorted: moved
    };
  } catch (error) {
    console.error('Error sorting by views:', error);
    return {
      success: false,
      message: `Error sorting posts: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Listen for a single action from the popup: "sortByViews"
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'sortByViews') {
    sortByViews()
      .then(response => sendResponse(response))
      .catch(error => {
        sendResponse({
          success: false,
          message: `Failed to sort posts: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      });
    // Indicate async response
    return true;
  }
});

// Simple initialization log for debugging
console.log('InstaSort content script ready - click "Sort by Views" in the popup.');