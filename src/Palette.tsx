import moji from "moji";
import { createEffect, createMemo, createSignal, For, onMount, Show } from "solid-js";
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

	const clearQuery = () => {
		setQuery("");
		setActiveIndex(0);
		inputRef?.focus();
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

	const activeDescendant = () => (filteredItems().length > 0 ? `palette-option-${activeIndex()}` : undefined);

	return (
		<div
			class="bg-black/50 fixed inset-0 flex z-50 justify-center items-center w-dvw h-dvh"
			on:click={closePalette}
			role="dialog"
			aria-modal="true"
			aria-labelledby="palette-title"
		>
			<div
				class="bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 rounded-md p-4 w-160 max-w-[90vw] fixed top-[15dvh] shadow-lg"
				on:click={(e) => {
					e.stopPropagation();
					inputRef?.focus();
				}}
			>
				<h2 id="palette-title" class="sr-only">
					Command Palette
				</h2>
				<div class="relative mb-2">
					<input
						ref={inputRef}
						type="text"
						class="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 rounded-md outline-none focus:border-blue-500 dark:focus:border-blue-400 placeholder-gray-400 dark:placeholder-neutral-500"
						placeholder="Search commands..."
						value={query()}
						on:input={handleInput}
						on:keydown={handleKeyDown}
						role="combobox"
						aria-expanded="true"
						aria-controls="palette-listbox"
						aria-activedescendant={activeDescendant()}
						aria-autocomplete="list"
						aria-label="Search commands"
					/>
					<Show when={query()}>
						<button
							type="button"
							class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 w-5 h-5 flex items-center justify-center"
							on:click={clearQuery}
							aria-label="Clear search"
						>
							✕
						</button>
					</Show>
				</div>
				<div
					id="palette-listbox"
					role="listbox"
					aria-label="Commands"
					class="flex flex-col overflow-y-scroll max-h-60"
				>
					<For each={filteredItems()}>
						{(item, i) => (
							<ItemView
								item={item}
								index={i()}
								active={() => i() === activeIndex()}
								closePalette={closePalette}
							/>
						)}
					</For>
					<Show when={filteredItems().length === 0}>
						<div class="px-3 py-2 text-gray-400 dark:text-neutral-500 text-center">No commands found</div>
					</Show>
				</div>
			</div>
		</div>
	);
}

function ItemView({
	item,
	index,
	active,
	closePalette,
}: {
	item: CommandItem;
	index: number;
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
			id={`palette-option-${index}`}
			role="option"
			aria-selected={active()}
			tabIndex={-1}
			class={`px-3 py-2 cursor-pointer rounded-md ${
				active()
					? "bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100"
					: "hover:bg-gray-100 dark:hover:bg-neutral-800"
			}`}
			on:click={() => {
				item.action();
				closePalette();
			}}
			ref={ref}
		>
			<div class="font-medium">{item.name[lang()]}</div>
			<Show when={item.description != null}>
				<div class="text-xs text-gray-500 dark:text-neutral-400">{item.description}</div>
			</Show>
		</div>
	);
}

function move(url: string) {
	const ev = new PopStateEvent("popstate");
	history.pushState(null, "", url);
	window.dispatchEvent(ev);
}
