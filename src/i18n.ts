// The shell's own words, in pt-BR (the source), en and es: the chrome only.
// Section, app and screen titles come with the data, in all three languages,
// from the console's registry, so a new section or screen needs no release
// of this package (shell contract 1.2). The theme and language controls
// (controls/) take their words from here too, wherever a host draws them.
//
// Text only: every string is interpolated with {{ }}, never parsed as HTML.
//
// The brands are written as the brand manual writes them: the company is
// always "the happie co.", lowercase and with its dot, and an app's name
// (the data's, such as "wappie.") ends its sentence or is followed by a
// space, so no brand's dot is ever followed by more punctuation.

import type { Locale, LocalText } from './types.js'

const ptBR = {
  brand: 'Console',
  home: 'Início do console da the happie co.',
  skip: 'Pular para o conteúdo',
  nav: 'Navegação do console',
  menu: 'Menu',
  closeMenu: 'Fechar o menu',
  groupWorkspace: 'Espaço',
  groupAccount: 'Da conta',
  groupApps: 'Apps',
  workspaceLabel: 'Espaço de trabalho',
  switchWorkspace: 'Trocar de espaço de trabalho',
  allWorkspaces: 'Todos os espaços',
  chooseWorkspace: 'Escolher espaço',
  personal: 'Pessoal',
  team: 'Equipe',
  'role.owner': 'Proprietário',
  'role.admin': 'Administrador',
  'role.member': 'Membro',
  yourAccount: 'Sua conta',
  workspaces: 'Espaços de trabalho',
  overview: 'Visão geral',
  ai: 'IA',
  aiIn: 'IA no {app}',
  openApp: 'Abrir o {app}',
  screensOf: 'Telas do {app}',
  opensInApp: 'abre no app',
  newTab: '(abre em outra aba)',
  backToConsole: 'Voltar ao console',
  breadcrumb: 'Você está em',
  signedOut: 'Entre no console para ver seus espaços e os outros apps.',
  signIn: 'Entrar no console',
  unavailable: 'O console não respondeu.',
  otherAccount: 'O console está com outra conta.',
  openConsole: 'Ir ao console',
  signOut: 'Sair',
  appearance: 'Aparência e idioma',
  theme: 'Tema',
  'theme.system': 'Sistema',
  'theme.light': 'Claro',
  'theme.dark': 'Escuro',
  themeNow: 'Tema: {mode}. Mudar para {next}',
  language: 'Idioma',
}

export type ShellKey = keyof typeof ptBR
export type ShellMessages = Readonly<Record<ShellKey, string>>

const en: ShellMessages = {
  brand: 'Console',
  home: 'Console home of the happie co.',
  skip: 'Skip to content',
  nav: 'Console navigation',
  menu: 'Menu',
  closeMenu: 'Close the menu',
  groupWorkspace: 'Workspace',
  groupAccount: 'Your account',
  groupApps: 'Apps',
  workspaceLabel: 'Workspace',
  switchWorkspace: 'Switch workspace',
  allWorkspaces: 'All workspaces',
  chooseWorkspace: 'Choose a workspace',
  personal: 'Personal',
  team: 'Team',
  'role.owner': 'Owner',
  'role.admin': 'Admin',
  'role.member': 'Member',
  yourAccount: 'Your account',
  workspaces: 'Workspaces',
  overview: 'Overview',
  ai: 'AI',
  aiIn: 'AI in {app}',
  openApp: 'Open {app}',
  screensOf: 'Screens of {app}',
  opensInApp: 'opens in the app',
  newTab: '(opens in a new tab)',
  backToConsole: 'Back to the console',
  breadcrumb: 'You are in',
  signedOut: 'Sign in to the console to see your workspaces and the other apps.',
  signIn: 'Sign in to the console',
  unavailable: 'The console did not answer.',
  otherAccount: 'The console is signed in to another account.',
  openConsole: 'Go to the console',
  signOut: 'Sign out',
  appearance: 'Appearance and language',
  theme: 'Theme',
  'theme.system': 'System',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  themeNow: 'Theme: {mode}. Switch to {next}',
  language: 'Language',
}

const es: ShellMessages = {
  brand: 'Consola',
  home: 'Inicio de la consola de the happie co.',
  skip: 'Saltar al contenido',
  nav: 'Navegación de la consola',
  menu: 'Menú',
  closeMenu: 'Cerrar el menú',
  groupWorkspace: 'Espacio',
  groupAccount: 'De la cuenta',
  groupApps: 'Apps',
  workspaceLabel: 'Espacio de trabajo',
  switchWorkspace: 'Cambiar de espacio de trabajo',
  allWorkspaces: 'Todos los espacios',
  chooseWorkspace: 'Elegir un espacio',
  personal: 'Personal',
  team: 'Equipo',
  'role.owner': 'Propietario',
  'role.admin': 'Administrador',
  'role.member': 'Miembro',
  yourAccount: 'Tu cuenta',
  workspaces: 'Espacios de trabajo',
  overview: 'Resumen',
  ai: 'IA',
  aiIn: 'IA en {app}',
  openApp: 'Abrir {app}',
  screensOf: 'Pantallas de {app}',
  opensInApp: 'se abre en la app',
  newTab: '(se abre en otra pestaña)',
  backToConsole: 'Volver a la consola',
  breadcrumb: 'Estás en',
  signedOut: 'Inicia sesión en la consola para ver tus espacios y las otras apps.',
  signIn: 'Iniciar sesión en la consola',
  unavailable: 'La consola no respondió.',
  otherAccount: 'La consola tiene otra cuenta abierta.',
  openConsole: 'Ir a la consola',
  signOut: 'Cerrar sesión',
  appearance: 'Apariencia e idioma',
  theme: 'Tema',
  'theme.system': 'Sistema',
  'theme.light': 'Claro',
  'theme.dark': 'Oscuro',
  themeNow: 'Tema: {mode}. Cambiar a {next}',
  language: 'Idioma',
}

export const SHELL_TEXT: Readonly<Record<Locale, ShellMessages>> = Object.freeze({ 'pt-BR': ptBR, en, es })

/** shellText is one of the shell's words in locale, with {name} placeholders filled as text. */
export function shellText(locale: Locale, key: ShellKey, params?: Readonly<Record<string, string>>): string {
  const s = SHELL_TEXT[locale][key]
  if (params === undefined) return s
  return s.replace(/\{([a-zA-Z]+)\}/g, (whole, name: string) => params[name] ?? whole)
}

/** localText is a registry title in locale. */
export function localText(t: LocalText, locale: Locale): string {
  return t[locale]
}
