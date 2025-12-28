import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { render } from "solid-js/web";
import "./style.css";

if (typeof browser === "undefined") {
	// @ts-expect-error Chrome does not support the browser namespace yet.
	globalThis.browser = chrome;
}

const PaletteItem = [
	{ name: "home", path: "/", description: "move to '/'" },
	{ name: "search", path: "/search", description: "move to '/search'" },
	{ name: "feeds", path: "/feeds", description: "move to '/feeds'" },
] satisfies { name: string; path: string; description: string }[];

const [open, setOpen] = createSignal(false);

const escListener = (e: KeyboardEvent) => e.key === "Escape" && void setOpen(false);
function HandleEsc() {
	onMount(() => void window.addEventListener("keydown", escListener));
	onCleanup(() => void window.removeEventListener("keydown", escListener));
	return null;
}

function Palette() {
	return (
		<Show when={open()}>
			<div
				class="bg-black/50 fixed inset-0 flex justify-center items-center w-dvw h-dvh"
				on:click={() => setOpen(false)}
			>
				<div class="bg-white p-10 flex flex-col gap-4" on:click={(e) => e.stopPropagation()}>
					<For each={PaletteItem}>
						{({ name, path, description },i) => (
							<div>
								<button type="button" on:click={() => move(path)}>
									{name}
								</button>
							</div>
						)}
					</For>
				</div>
			</div>
			<HandleEsc />
		</Show>
	);
}
const root = document.createElement("div");
document.body.append(root);
render(() => <Palette />, root);

browser.runtime.onMessage.addListener((msg) => {
	if (msg.type === "open-palette") setOpen(true);
});

function move(url: string) {
	const ev = new PopStateEvent("popstate");
	history.pushState(null, "", url);
	window.dispatchEvent(ev);
}
