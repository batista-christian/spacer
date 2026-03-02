export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;
    try {
      await browser.tabs.sendMessage(tab.id, { type: "TOGGLE_TOOLBAR" });
    } catch {
      // Content script not injected yet — ignore
    }
  });
});
