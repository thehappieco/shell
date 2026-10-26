# @thehappieco/shell

The shell that `console.thehappie.co` and every The Happie Co app draw around their pages: the side menu (the workspace selector, the workspace's sections, the apps, and the account's own pages), the header (the title, the theme toggle, the language menu, and the person's avatar with its menu and "Sair") and the look (`tokens.css`). An app draws it around its settings screens on its own origin; moving between the console and an app is a plain navigation, so keys, sessions and data stay where they are.

- **Install** the release tarball, pinned by its integrity, as the kit is: `npm install https://github.com/thehappieco/shell/releases/download/v1.6.1/thehappieco-shell-1.6.1.tgz`.
- **Use:** import `tokens.css` once, then `ThcShell`, `loadShell` and the path helpers from the package; the brand's `ThcMark`, `ThcName`, `ThcProductLockup`, `ThcLockup` and `ThcLettering` draw the symbols and lettering on an app's own pages too. The data comes from `GET https://console.thehappie.co/v1/shell`, read with the console session (credentials, no header of its own).
- **Rules it keeps:** Vue only; no browser storage, timer, frame, `postMessage` or `window.open`; text interpolated, never parsed as HTML; no style attribute, so a page with `style-src 'self'` needs nothing more.
- **Fixtures** (`fixtures/`): the golden `/v1/shell` answer and the return-path cases each app's tests run.

The full contract (the data, the routes, the props and the tests each side must have) is shared with each app's team. The names, symbols and lettering are The Happie Co OÜ's trademarks (NOTICE).
