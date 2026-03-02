# Spacer — Spacing & Contrast Inspector

A browser extension to inspect spacing between elements and check color contrast accessibility on any page.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or your preferred package manager

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd spacer-extension
```

2. Install dependencies:

```bash
npm install
```

## Development

### Chrome/Edge

1. Start the development server:

```bash
npm run dev
```

2. Open your browser and navigate to:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`

3. Enable "Developer mode" (toggle in the top right)

4. Click "Load unpacked" and select the `.output/chrome-mv3` folder from your project directory

5. The extension will now appear in your browser. Any changes you make to the code will automatically reload the extension.

### Firefox

1. Start the development server for Firefox:

```bash
npm run dev:firefox
```

2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`

3. Click "Load Temporary Add-on"

4. Navigate to the `.output/firefox-mv2` folder and select the `manifest.json` file

5. The extension will now be loaded. Changes will automatically reload the extension.

## Building for Production

### Chrome/Edge

Build the extension:

```bash
npm run build
```

Create a distributable ZIP file:

```bash
npm run zip
```

The built extension will be in `.output/chrome-mv3` and the ZIP file in `.output/chrome-mv3.zip`

### Firefox

Build the extension:

```bash
npm run build:firefox
```

Create a distributable ZIP file:

```bash
npm run zip:firefox
```

The built extension will be in `.output/firefox-mv2` and the ZIP file in `.output/firefox-mv2.zip`

## Usage

1. Click the extension icon in your browser toolbar
2. Use the popup interface to inspect spacing and contrast on the current page

## Tech Stack

- [WXT](https://wxt.dev/) - Browser extension framework
- React 19
- TypeScript
- Manifest V3 (Chrome/Edge) / V2 (Firefox)
