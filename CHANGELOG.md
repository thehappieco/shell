# Changelog of @thehappieco/shell

Published to `github.com/thehappieco/shell` by `scripts/shell-package.sh`, which copies this file and refuses a version it does not name.

## 1.4.0 (2026-10-19)

Moving between the console and an app without the menu reloading (design `docs/design/2026-10-12/shell-1.4-instant-moves.md`, decision 0047; contract 1.5, 2.4, 3.2 and 3.3). Additive: a host that passes none of the new props draws exactly as with 1.3.0.

- **The kept answer.** `ThcShell` takes `initial` (`ShellData | null`): the last answer of `GET /v1/shell` the host showed, which it keeps itself. While `result` is `null` the shell draws it as it draws data (mode `kept`, `data-shell="kept"`), so a new page has its menu and header in its first frame and only the content area waits; the fresh `result` replaces it in place, under the same brand, and a refusal draws what 1.3.0 draws. It is drawn only when its `console_origin` is the host's `consoleOrigin` and, when `subject` is given, its `sub` is `subject`; a host that passes a `fallback` (an app) gets it drawn only with such a `subject`, that is once its own session is known for the same person. An app passes its fresh `result` only once its own session is known, together with its `subject`: before that the shell cannot tell another person's console from the app's person. It speaks the host's `locale`, and the header's controls show the host's `theme` and `locale`: an app sets its language and theme from the kept answer before passing it.
- **Read-only.** `readOnly` draws the kept answer read-only (the console, until its fresh answer arrives): every link keeps its `href`, but a click follows nothing and shows no loading mark; the workspace selector says `aria-disabled="true"` and does not open; the root has `data-read-only="true"`, and the side column, the drawer's panel and the tabs row `aria-busy="true"`. The theme and the language keep working. A host's own `menu-footer` is the host's to disable.
- **"Sair"'s hook.** `beforeSignOut` runs, synchronously, when the person follows the shell's own "Sair" (not a host's footer, and not while read-only), before the browser follows it: an app erases its kept answer there.
- **New exports**, which touch no storage: `KEPT_SHELL_KEY` (`thehappie-shell.last`, the one key on the console and every app), `MAX_KEPT_TEXT`, `keptText(data)` (the JSON of `parseShell`'s checked copy, or `null`: keep nothing) and `readKept(text, consoleOrigin)` (back through `parseShell` with the host's console origin, or `null`; it never throws); and, for a page the browser prerenders, `isPrerendering`, `whenActivated(fn)` (at once on a shown page, else once at `prerenderingchange`, in order) and `activated()`, with the type `ActivationDocument`.
- **The shell still stores nothing.** The host reads, writes and erases the kept answer (decision 0047's rules: contract 1.5): an app keeps it for its own session's person, erases it at its own sign-out, at "Sair" (`beforeSignOut`), when its session has ended or is another account's than the kept answer's (as soon as the session answers, whichever of the two answers first), and at a console 401 or another account's answer. On a page the browser prerenders it writes nothing of what it read before the person arrived (it asks again then, and keeps that answer), and erases through `whenActivated`.
- **Prerendering is the host's** (contract 2.4): an app's `/console/*` documents name speculation rules for the console's pages by the `Speculation-Rules` header (a JSON file served as `application/speculationrules+json`), opt in with `Supports-Loading-Mode: credentialed-prerender` only when the request's `Referer` origin is the console's, are `Cache-Control: no-store`, and keep every boot side effect behind `whenActivated`, asking again for their session and `GET /v1/shell` when the person arrives.
- Update an app's own tests: the guard that no storage write carries the sub, the name or a workspace allows exactly `KEPT_SHELL_KEY`, written by `keptText`.

## 1.3.0 (2026-10-11)

- **No breadcrumb.** The header draws the `h1` alone; the `h1` and the menu's current link say where the person is. The words `breadcrumb` ("Você está em") are gone from `SHELL_TEXT`; nothing else changes for a host.
- **The title draws no focus ring.** It still takes focus by script at each page (`tabindex="-1"`, for screen readers); no `:focus` or `:focus-visible` outline is drawn on it. A host's own page titles that take scripted focus should do the same (the console's and id.'s do).
- **An app's tabs scroll sideways.** One row that scrolls when it overflows (touch, trackpad, Tab), and only the row: no scrollbar, an edge fade where the browser supports scroll-driven animations, and the current tab scrolled into view when the shell is drawn and when it changes.
- **Under 900 px, an account button.** The header's theme toggle, language menu and "Aparência e idioma" are drawn at 900 px and wider only. Below, the person's avatar at the right is a button that opens a panel: the profile (to Minha conta), the workspace shown (to every workspace, or "Escolher espaço"), then "Tema" and "Idioma" for a host that passes both `changeTheme` and `changeLocale`, or "Aparência e idioma" for any other. Escape, a click outside, focus leaving, a link or another page close it. Without data it shows nothing of the console's person: the theme and the language alone for a host with both handlers, else no button. The header's `data-test="shell-head-profile"` link is gone: the button is `shell-account-button`, its panel `shell-account-panel`. At 900 px and wider nothing changes.
- **A loading mark while the browser follows a link.** When the person follows one of the shell's links that the browser navigates (not one the host routes, a new tab, a modified click or a prevented one), the content area shows a spinner and "Carregando…" (a `role="status"` region; the page stays mounted, hidden, with `aria-busy="true"`) until the document goes; the menu and the header stay. A page restored from the back/forward cache drops it. The shell adds two window listeners for it, the click's end and `pageshow`, both removed on unmount. An app whose screen can refuse to leave (`beforeunload`) keeps the mark until the next navigation.
- `ThcLanguageMenu` gains `variant="list"`: the three languages at once as a radio group (one tab stop, the arrow keys ask for the next), the account panel's. Additive.
- "Todos os espaços" in the workspace selector has `aria-current="page"` on the workspaces' page.
- New words in `SHELL_TEXT`: `loading` ("Carregando…", "Loading…", "Cargando…").
- Update an app's own tests that read `shell-crumb` or `shell-head-profile`.

## 1.2.0 (2026-10-11)

- While the shell's data loads (`result` is `null`), the side column draws the brand alone: no fallback link, no workspace selector, group, profile or foot (the host's `menu-footer` included), in the column and in the drawer. The column then fills once when the data arrives, under the same brand element, so its symbol does not play again, instead of drawing the app's own links and swapping them for the console's half a second later. The header is unchanged: the fallback's mark and name, the screen's title or the host's `title`, and `Console / {app}`.
- Keep passing `fallback` from the first frame: it is still drawn, as before, when the result is `signed-out`, `unavailable` or another account's.
- Without a `fallback` (the console's own pages of an app), the loading header draws the product of the kit that the place's app id names, as its symbol and written name from the kit alone, in the console's tone until the data names the app's color.
- The model's `MenuModel` gains `loading` (internal: `menu.ts` is not exported). No prop, slot or export changes.

## 1.1.1 (2026-10-11)

- The fixture `answer.json` (the golden `/v1/shell` answer) now has Wappie in the shell: `in_shell: true`, its four screens at `/console/{numbers|integrations|mcp|installations}?workspace={workspace}`. The code is unchanged.

## 1.1.0 (2026-10-11)

- Exports the brand's components so an app can draw them on its own pages, outside the shell (a sign-in card, its own header and menu), as id. and the console do: `ThcMark` (a brand's symbol, replaying on hover), `ThcName` (a product's written name as the kit's contours), `ThcProductLockup` (a product's logo_texto: symbol, name and "by the happie co."), `ThcLockup` and `ThcLettering` (the company's), with `BRAND_IDS`, `PRODUCT_BRAND_IDS`, their types and `appBrand(id)`. Each component carries its own styles. Additive: nothing else changes.

## 1.0.0 (2026-10-11)

- First public release of the shell of contract version 1: look version 2, the kit's symbols and lettering with the hover replay, the theme toggle and the flag language menu, and the tab icon helper.
