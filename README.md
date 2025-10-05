# InstaSort

A Chrome extension that sorts Instagram posts by views, likes, comments, or date using TypeScript and Manifest V3.

## Features

- ✅ Sort Instagram posts by Views, Likes, Comments, or Oldest First
- ✅ Choose number of items to sort (25/50/100/All)
- ✅ Clean, Instagram-inspired UI
- ✅ TypeScript with strict type checking
- ✅ Manifest V3 compliant
- ✅ Vite bundling for optimal performance

## Project Structure

```
InstaSort/
├─ manifest.json          # Chrome extension manifest (MV3)
├─ tsconfig.json          # TypeScript configuration
├─ vite.config.ts         # Vite bundler configuration
├─ package.json           # NPM package configuration
├─ public/
│   └─ popup.html         # Extension popup UI
└─ src/
    ├─ content.ts         # Content script for Instagram DOM manipulation
    └─ popup.ts           # Popup logic and messaging
```

## Installation & Usage

### Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

3. **Load in Chrome:**
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked" and select the `dist/` folder

### Using the Extension

1. Navigate to Instagram (https://www.instagram.com)
2. Scroll to load some posts
3. Click the InstaSort extension icon in your browser toolbar
4. Select your sorting preferences:
   - **Number of items:** 25, 50, 100, or All
   - **Sort by:** Views, Likes, Comments, or Oldest First
5. Click "Sort Posts"

The posts on the page will be reordered according to your selection!

## Development Scripts

- `npm run build` - Build the extension for production
- `npm run dev` - Build and watch for changes during development
- `npm run type-check` - Run TypeScript type checking

## Technical Details

### Content Script
- Finds Instagram posts using multiple CSS selectors
- Extracts engagement metrics (likes, comments, views) from DOM
- Handles Instagram's dynamic structure and number formatting (K, M, B suffixes)
- Reorders DOM elements while preserving page structure

### Popup
- Clean, responsive UI matching Instagram's design language
- Sends messages to content script using Chrome Extension API
- Provides user feedback during sorting operations

### Build System
- **Vite** for fast, modern bundling
- **TypeScript** for type safety and better development experience
- **Multiple entry points** for popup and content scripts
- **Manifest V3** for modern Chrome extension standards

## Browser Support

- Chrome 88+ (Manifest V3 support)
- Other Chromium-based browsers with MV3 support

## Notes

- Instagram frequently updates their DOM structure, so selectors may need updates
- The extension only sorts currently loaded posts (not all posts from a profile)
- Works best on feed pages, profile pages, and hashtag pages
- Engagement data visibility depends on Instagram's privacy settings

## License

MIT License - feel free to modify and distribute!