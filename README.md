# @thehappieco/shell

The shell that `console.thehappie.co` and every The Happie Co app draw around their pages: the side menu (the workspace selector, the workspace's sections, the account's features, the apps, the profile), the header (breadcrumb, title, the theme toggle and the language menu) and the look (`tokens.css`). An app draws it around its settings screens on its own origin; moving between the console and an app is a plain navigation, so keys, sessions and data stay where they are.

- **Install** the release tarball, pinned by its integrity, as the kit is: `npm install https://github.com/thehappieco/shell/releases/download/v1.0.0/thehappieco-shell-1.0.0.tgz`.
- **Use:** import `tokens.css` once, then `ThcShell`, `loadShell` and the path helpers from the package. The data comes from `GET https://console.thehappie.co/v1/shell`, read with the console session (credentials, no header of its own).
- **Rules it keeps:** Vue only; no browser storage, timer, frame, `postMessage` or `window.open`; text interpolated, never parsed as HTML; no style attribute, so a page with `style-src 'self'` needs nothing more.
- **Fixtures** (`fixtures/`): the golden `/v1/shell` answer and the return-path cases each app's tests run.

The full contract (the data, the routes, the props and the tests each side must have) is shared with each app's team. The names, symbols and lettering are The Happie Co OÜ's trademarks (NOTICE).
