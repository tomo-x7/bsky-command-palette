import { createEffect, createSignal, Show } from "solid-js";
import { render } from "solid-js/web";
import { Palette } from "./Palette";
import "./style.tailwind.css";
import { SupportedLangs } from "./common";

if (typeof browser === "undefined") {
	// @ts-expect-error Chrome does not support the browser namespace yet.
	globalThis.browser = chrome;
}

const [lang, setLang] = createSignal(SupportedLangs[0]);
window.addEventListener("message", (event) => {
	console.log(event);
	if (event.data?.type === "bsky-lang") {
		setLang(event.data.lang);
	}
});
export { lang };

const [open, setOpen] = createSignal(false);
const closePalette = () => setOpen(false);

createEffect(() => {
	window.postMessage({ type: "palette-open-state", open: open() });
});

const root = document.createElement("div");
document.body.append(root);
render(
	() => (
		<Show when={open()}>
			<Palette closePalette={closePalette} />
		</Show>
	),
	root,
);

browser.runtime.onMessage.addListener((msg) => {
	if (msg.type === "open-palette") setOpen(true);
});
