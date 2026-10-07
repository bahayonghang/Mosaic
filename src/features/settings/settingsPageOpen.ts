/** True while the full-window settings page is mounted. Workspace listeners check this. */
export function settingsPageOpen(): boolean {
  return document.querySelector("[data-settings-page]") !== null;
}
