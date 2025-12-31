import moji from "moji";
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import type { SupportedLangs } from "./common";
import { lang } from "./main";

type CommandItem = {
	name: { [k in (typeof SupportedLangs)[number]]: string };
	description?: string;
	type: "link";
	action: () => void;
};

const PaletteItem: CommandItem[] = [
	{ name: { en: "Home", ja: "ホーム" }, type: "link", action: () => move("/") },
	{ name: { en: "Explore", ja: "検索" }, type: "link", action: () => move("/search") },
	{
		name: { en: "Notifications", ja: "通知" },
		type: "link",
		action: () => move("/notifications"),
	},
	{ name: { en: "Chat", ja: "チャット" }, type: "link", action: () => move("/messages") },
	{ name: { en: "Feeds", ja: "フィード" }, type: "link", action: () => move("/feeds") },
	{ name: { en: "Lists", ja: "リスト" }, type: "link", action: () => move("/lists") },
	{ name: { en: "Saved", ja: "保存済み" }, type: "link", action: () => move("/saved") },
	{ name: { en: "Settings", ja: "設定" }, type: "link", action: () => move("/settings") },
	{
		name: { en: "App Passwords", ja: "アプリパスワード" },
		description: "Settings > Privacy and Security",
		type: "link",
		action: () => move("/settings/app-passwords"),
	},
	{
		name: { en: "Keyboard Shortcut", ja: "パレットを開くショートカットを編集" },
		description: "Customize the keyboard shortcut to open this palette",
		type: "link",
		action: () => void browser.runtime.sendMessage({ type: "edit-shortcut" }),
	},
];

/** マッチング関数（後でfuzzy検索に差し替え可能） */
function matchCommand(item: CommandItem, query: string): boolean {
	const q = query.trim().toLowerCase();
	if (q === "") return true;
	return (
		item.name.en.toLowerCase().includes(q) ||
		moji(item.name.ja).convert("KK", "HG").toString().includes(moji(q).convert("KK", "HG").toString())
	);
}

export function Palette({ closePalette }: { closePalette: () => void }) {
	const [activeIndex, setActiveIndex] = createSignal(0);

	const [query, setQuery] = createSignal("");
	const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
		setQuery(e.currentTarget.value);
		setActiveIndex(0);
	};

	const filteredItems = createMemo(() => PaletteItem.filter((item) => matchCommand(item, query())));

	let inputRef: HTMLInputElement | undefined;

	const handleKeyDown = (e: KeyboardEvent) => {
		const len = filteredItems().length;
		switch (e.key) {
			case "ArrowDown": {
				e.preventDefault();
				setActiveIndex((i) => (i + 1) % len);
				break;
			}
			case "ArrowUp": {
				e.preventDefault();
				setActiveIndex((i) => (i - 1 + len) % len);
				break;
			}
			case "Enter": {
				e.preventDefault();
				const selected = filteredItems()[activeIndex()];
				if (selected) {
					selected.action();
					closePalette();
				}
				break;
			}
			case "Escape": {
				e.preventDefault();
				closePalette();
				break;
			}
		}
	};

	onMount(() => {
		setTimeout(() => {
			inputRef?.focus();
		}, 100);
	});

	return (
		<>
			<div
				class="bg-black/50 fixed inset-0 flex z-50 justify-center items-center w-dvw h-dvh"
				on:click={closePalette}
			>
				<div
					class="bg-white rounded-md p-4 w-160 max-w-[90vw] fixed top-[15dvh]"
					on:click={(e) => {
						e.stopPropagation();
						inputRef?.focus();
					}}
				>
					<input
						ref={inputRef}
						type="text"
						class="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 outline-none focus:border-blue-500"
						placeholder="Search commands..."
						value={query()}
						on:input={handleInput}
						on:keydown={handleKeyDown}
					/>
					<div class="flex flex-col overflow-y-scroll max-h-60">
						<For each={filteredItems()}>
							{(item, i) => (
								<ItemView
									item={item}
									active={() => i() === activeIndex()}
									closePalette={closePalette}
								/>
							)}
						</For>
						{filteredItems().length === 0 && (
							<div class="px-3 py-2 text-gray-400 text-center">No commands found</div>
						)}
					</div>
				</div>
			</div>
			<HandleEsc closePalette={closePalette} />
		</>
	);
}
function ItemView({
	item,
	active,
	closePalette,
}: {
	item: CommandItem;
	active: () => boolean;
	closePalette: () => void;
}) {
	let ref: HTMLDivElement | undefined;
	createEffect(() => {
		if (active()) {
			ref?.scrollIntoView({ block: "nearest", behavior: "instant" });
		}
	});
	return (
		<div
			class={`px-3 py-2 cursor-pointer rounded-md ${active() ? "bg-blue-100 text-blue-900" : "hover:bg-gray-100"}`}
			on:click={() => {
				item.action();
				closePalette();
			}}
			ref={ref}
		>
			<div class="font-medium">{item.name[lang()]}</div>
			<Show when={item.description != null}>
				<div class="text-xs text-gray-500">{item.description}</div>
			</Show>
		</div>
	);
}

function HandleEsc({ closePalette }: { closePalette: () => void }) {
	const escListener = (e: KeyboardEvent) => {
		if (e.key === "Escape") {
			e.stopPropagation();
			closePalette();
		}
	};
	onMount(() => void window.addEventListener("keydown", escListener));
	onCleanup(() => void window.removeEventListener("keydown", escListener));
	return null;
}
function move(url: string) {
	const ev = new PopStateEvent("popstate");
	history.pushState(null, "", url);
	window.dispatchEvent(ev);
}
