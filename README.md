# Winnow

Winnow is a private, on-device Chrome extension for making fast live chat easier to read. It filters spam and toxic messages on sites you choose, without sending chat content anywhere.

## Install as an unpacked extension

1. Install dependencies with `npm install`.
2. Build the extension with `npm run build`.
3. Open `chrome://extensions`, turn on Developer mode, and choose **Load unpacked**.
4. Select the generated `dist` folder.

Winnow starts dormant on every site. Use its toolbar popup to enable filtering for the current site. The content script is injected only for origins you enable (including nested chat iframes such as YouTube Live).

## Development

Run `npm test` for unit tests or `npm run build` to create a loadable extension. The extension is completely client-side, makes no network requests, and stores its settings in Chrome storage.
