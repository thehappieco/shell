# Changelog of @thehappieco/shell

Published to `github.com/thehappieco/shell` by `scripts/shell-package.sh`, which copies this file and refuses a version it does not name.

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
