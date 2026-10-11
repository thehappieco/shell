# The brand files

`source/` holds the official brand files the shell draws from, copied byte for byte from the owner's brand kit (`Company Documents/The Happie Co/logos`, generator 2.1.0, whose own audit passed; brand manual `manual_da_marca.pdf`, Quicksand approved on 2026-10-05). Copied on 2026-10-09; the products' `nome` and `logo_texto` files on 2026-10-10, and `happie__simbolo__colorido_margem_arredondada.svg` on 2026-10-11, from the same kit release.

| File | From the kit | SHA-256 |
|---|---|---|
| `happie__animado__colorido.svg` | `animacoes/happie/` | `1e2796dc127ff6c8d5ede8af81e691ce6bbd1665591ab0f0c987fddf868b4b8b` |
| `wappie__animado__colorido.svg` | `animacoes/wappie/` | `3daf32f6873bfe76ef0da491e2264aaebcd405f356789eec1dd23dcfa14be975` |
| `mailie__animado__colorido.svg` | `animacoes/mailie/` | `402568f5308012683f97a96ad317c6fede3df64bb832e51acc310758bef9aa24` |
| `vaultie__animado__colorido.svg` | `animacoes/vaultie/` | `da15fa63fac6522eb952d774a153a807bc921e287a27daf9b9a05f72943ce4c9` |
| `authie__animado__colorido.svg` | `animacoes/authie/` | `956c4320b62cbeac4a4ba22b4e27293da72aef3ec707b90313a142f5d11788f2` |
| `sophie__animado__colorido.svg` | `animacoes/sophie/` | `bfd0bf2a55348c8deaacc1a197723207ec7b1674407bd05b32987efb8fa7f59d` |
| `nova__animado__colorido.svg` | `animacoes/nova/` | `0ea8d80eab956760ebf7ddc5d83f408427dc683f2836ebf662bdbba6bd0f13fd` |
| `happie__texto_horizontal__colorido_sem_fundo.svg` | `arquivos/happie/texto_horizontal/` | `78db2b042d33f001b76e9779f37103c05872e36cdcf86c1c994da7e7e54540db` |
| `happie__logo_texto_horizontal__colorido_vazado_sem_fundo.svg` | `arquivos/happie/logo_texto_horizontal/` | `9ace70dc34528a703960756fb29bbca126841dc33de3e2d19820fafd7476e779` |
| `happie__logo_texto_tres_linhas__colorido_vazado_sem_fundo.svg` | `arquivos/happie/logo_texto_tres_linhas/` | `f0a00b9fdd0b42d0d3533dc2fe03358ec26bdf11eac8a2bdd6b5f9db238c95fb` |
| `happie__simbolo__branco_margem_arredondada.svg` | `arquivos/happie/simbolo/` | `96819ed51b66666f18d2fb4ec5eddc8a0a5170ad4ed473d8bb38642077942faf` |
| `happie__simbolo__colorido_margem_arredondada.svg` | `arquivos/happie/simbolo/` | `b7a29c9b6c67729a0798510ff7215b603380a7ac819e40c6a28f78ad35ab4f58` |
| `wappie__nome__colorido_sem_fundo.svg` | `arquivos/wappie/nome/` | `8d81466030fe93a4479f98e5dddf23f5b71d7ad2e5c702a3430fb2868a1e3b2b` |
| `mailie__nome__colorido_sem_fundo.svg` | `arquivos/mailie/nome/` | `392c39d96ebc52eec78751b1d4e7f32411262d10ed6ed1fb2442c24fc44e9d1c` |
| `vaultie__nome__colorido_sem_fundo.svg` | `arquivos/vaultie/nome/` | `e32dde68dabb179ea7442e830a19b9d293636c9f3e13fdebd7d0207490221867` |
| `authie__nome__colorido_sem_fundo.svg` | `arquivos/authie/nome/` | `a57d74825f83101d7ff0b790b1ab190480e8377d89573d80335048e120d71b22` |
| `sophie__nome__colorido_sem_fundo.svg` | `arquivos/sophie/nome/` | `fb9bd46b7701778184150581cc5b81ca7b4ab6d68b32dde8027f84436ea73504` |
| `nova__nome__colorido_sem_fundo.svg` | `arquivos/nova/nome/` | `f49e84ebadb6cebdc60b4442679386db45fcb35c6869de745efc8c91f46a22dd` |
| `wappie__logo_texto__colorido_vazado_sem_fundo.svg` | `arquivos/wappie/logo_texto/` | `4336ea1cda4f2e4ba2114c7bf7128a1ac20b016e5ea22014d5a1e98b7c2829db` |
| `mailie__logo_texto__colorido_vazado_sem_fundo.svg` | `arquivos/mailie/logo_texto/` | `46c0e481cf493991324979c77254b43b08d07a0763efc09df441b7ca1727e1a9` |
| `vaultie__logo_texto__colorido_vazado_sem_fundo.svg` | `arquivos/vaultie/logo_texto/` | `f46ab2caf86c208b94984b902910010f21abadfa01320ad3d1b37a2725ea336b` |
| `authie__logo_texto__colorido_vazado_sem_fundo.svg` | `arquivos/authie/logo_texto/` | `4d1953f7b88753ccae693afd29c4ebc3d138f24771a9af53b4e55fbba0da9f6e` |
| `sophie__logo_texto__colorido_vazado_sem_fundo.svg` | `arquivos/sophie/logo_texto/` | `f4e57875a7b0537f8ed7a03c5e660879269e3f49408305c75a813d951589b4c0` |
| `nova__logo_texto__colorido_vazado_sem_fundo.svg` | `arquivos/nova/logo_texto/` | `be8a64ef9bc20e401d865e76edc017746ffe85514ec2598a69864280272545b0` |

- `web/scripts/brand-marks.mjs` reads them and writes `marks.ts` (every symbol's parts, the shared frame, the company's lettering "the happie co.", its horizontal and three-line lockups' layouts, each brand's written name, each product's name as the kit's contours (`NAMES`, from the `nome` files), the endorsement "by the happie co." (`ENDORSEMENT`, the same in every `logo_texto` file) and each product's `logo_texto` layout (`PRODUCT_LOCKUP`)) and `marks.css` (the kit's choreography, renamed into `thc-shell-bm-*`). `--check` fails when either is stale; the tests run it.
- Of a product's `logo_texto` file only the layout and the endorsement are read: its symbol is the `animado` file's (one drawing, which `ThcMark` plays), and its name is the `nome` file's, which the generator checks is the same contours at the same baseline.
- The written names follow the manual: lowercase, with a final dot, `ø` kept in `nøva.`: `the happie co.`, `wappie.`, `mailie.`, `vaultie.`, `authie.`, `sophie.`, `nøva.`. The legal name, The Happie Co OÜ, does not change.
- The tab icons of id. and the console follow the site's pattern (2026-10-11): the company's symbol on its rounded card, the outline on white for a light page and white on indigo for a dark one, following the page's theme, a choice made by hand included (`web/shared/shell/favicon.ts`). Each host's `public/` holds the same four files:
  - `favicon-light.svg`: `happie__simbolo__colorido_margem_arredondada.svg` without its `<title>` and `<desc>`, and `favicon-dark.svg`: `happie__simbolo__branco_margem_arredondada.svg` the same way. `brand-marks.mjs` writes both, and `--check` holds them to the sources.
  - `favicon-32.png`, for browsers without SVG icons: the kit's `arquivos/happie/simbolo/happie__simbolo__colorido_margem_arredondada.png` (2048 px, SHA-256 `9ce9f113241f5e6488cecb4498b8b89b696934143387a6a8512f4599eeb72100`), resized with `sips -z 32 32 <kit png> --out favicon-32.png` (macOS 26).
  - `apple-touch-icon.png`, the home screen's: the kit's `arquivos/happie/simbolo/happie__simbolo__branco_fundo_marca.png` (2048 px, the indigo card to its edges, SHA-256 `b002254a5a0cbc7897d5698c2fe5fa9cda52b7c4ae01b08ab556cc48e3b22ba8`), resized with `sips -z 180 180 <kit png> --out apple-touch-icon.png`. Not the rounded card: iOS fills a home-screen icon's transparent corners with black, so it must be opaque, as the site's is.
  - `web/test/shell/favicon.spec.ts` checks the PNGs' sizes, that the touch icon is opaque, and that both hosts serve the same bytes. A new kit release: resize again, and update both hashes here.
- A new kit release: copy the changed files, update this table, run the script, and look at the shell in both themes.
