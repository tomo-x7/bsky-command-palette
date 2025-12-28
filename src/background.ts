if (typeof browser === "undefined") {
	// @ts-expect-error Chrome does not support the browser namespace yet.
	globalThis.browser = chrome;
}

browser.commands.onCommand.addListener((c, tab) => {
	console.log(tab);
	if (tab.url?.startsWith("https://bsky.app/") === false) return;
	if (c === "open-palette") browser.tabs.sendMessage(tab.id!, { type: "open-palette" });
});
