export const SupportedLangs = ["en", "ja"] as const;

export type BskyStorage = {
	languagePrefs?: {
		appLanguage?: string;
	};
};
