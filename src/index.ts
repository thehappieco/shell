// The shell shared by the console and the apps (decision 0033, shell
// contract 3): the component, its data and the addresses it draws, the
// theme and language controls its header draws, which a host may draw on
// its own pages too, and the company's tab icon that follows the theme (for
// id. and the console; an app keeps its own).
//
// It imports vue and its own files only: never vue-router, the protocol
// crypto, the kit or a host's code (web/test/shell/static.spec.ts). The
// look is tokens.css, which a host imports itself, once, beside its own
// stylesheet.

export { default as ThcShell } from './Shell.vue'
export { default as ThcFlag } from './controls/ThcFlag.vue'
export { default as ThcLanguageMenu } from './controls/ThcLanguageMenu.vue'
export { default as ThcThemeToggle } from './controls/ThcThemeToggle.vue'
export { nextTheme, prefersDark } from './controls/cycle.js'
export { LOCALE_NAMES } from './controls/locales.js'
export { applyFavicon, FAVICON_DARK, FAVICON_LIGHT } from './favicon.js'
export { localText, SHELL_TEXT, type ShellKey, shellText } from './i18n.js'
export { type FetchLike, loadShell, parseShell, SHELL_PATH } from './load.js'
export {
  APP_AI_TAB,
  APP_OVERVIEW_TAB,
  checkReturnPath,
  consoleURL,
  fillPath,
  hopPath,
  isShellId,
  isWebOrigin,
  isWorkspaceId,
  MAX_RETURN_PATH,
  readShellQuery,
  roleAllows,
  screenURL,
  signInURL,
  signOutURL,
  visibleScreens,
  WORKSPACE_PLACEHOLDER,
} from './paths.js'
export { applyTheme, isTheme } from './theme.js'
export {
  APP_COLORS,
  type AppColor,
  LOCALES,
  type Locale,
  type LocalText,
  ROLES,
  type Role,
  type ShellApp,
  type ShellData,
  type ShellFallback,
  type ShellFallbackScreen,
  type ShellMenu,
  type ShellPlace,
  type ShellResult,
  type ShellScreen,
  type ShellSection,
  type ShellWorkspace,
  THEMES,
  type Theme,
} from './types.js'
