if (typeof browser === "undefined") {
	// @ts-expect-error Chrome does not support the browser namespace yet.
	globalThis.browser = chrome;
}

browser.commands.onCommand.addListener((c, tab) => {
	if (tab.url?.startsWith("https://bsky.app/") === false) return;
	if (c === "open-palette") browser.tabs.sendMessage(tab.id!, { type: "open-palette" });
});

browser.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
	if (msg.type === "edit-shortcut") {
		await browser.commands.openShortcutSettings();
		sendResponse();
		return true;
	}
});

browser.action.onClicked.addListener((tab) => {
	if (tab.url?.startsWith("https://bsky.app/") === false) return;
	browser.tabs.sendMessage(tab.id!, { type: "open-palette" });
});

browser.runtime.onInstalled.addListener(()=>{
	browser.contextMenus.create({
		id: "open-palette",
		title: "Open Command Palette",documentUrlPatterns: ["https://bsky.app/*"]
	});
	browser.contextMenus.onClicked.addListener((info, tab)=>{
		if(info.menuItemId==="open-palette"&&tab?.id!=null){
			browser.tabs.sendMessage(tab.id, { type: "open-palette" });
		}
	});
})