import { type BskyStorage, SupportedLangs } from "./common";

let isOpen = false;

window.addEventListener("message", (event) => {
	if (event.data?.type === "palette-open-state") {
		isOpen = event.data.open;
		return true;
	}
});

const _focus = HTMLElement.prototype.focus;
HTMLElement.prototype.focus = function (...args) {
	if (isOpen) {
		console.log("focus prevented");
		return;
	}
	console.log("focus", this);
	_focus.apply(this, args);
};

const detectLang = (storage: BskyStorage) => {
	const appLang = storage.languagePrefs?.appLanguage ?? "en";
	return (SupportedLangs as Readonly<string[]>).includes(appLang)
		? (appLang as (typeof SupportedLangs)[number])
		: "en";
};
const handleStorageChange = (e: StorageEvent) => {
	if (e.key !== "BSKY_STORAGE") return;
	const newStorage = JSON.parse(e.newValue ?? "{}") as BskyStorage;
	postMessage({ type: "bsky-lang", lang: detectLang(newStorage) });
};
window.addEventListener("storage", handleStorageChange);

const data = JSON.parse(localStorage.getItem("BSKY_STORAGE") ?? "{}") as BskyStorage;
postMessage({ type: "bsky-lang", lang: detectLang(data) });
