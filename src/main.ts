import {App, FileSystemAdapter, Plugin} from "obsidian";
import {ObsidianPrintPluginSettingTab} from "./settingsTab";
import {DEFAULT_SETTINGS, ObsidianPrintPluginSettings} from "./settings";
import printJS from "print-js";

export default class ObsidianPrintPlugin extends Plugin {

	settings: ObsidianPrintPluginSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new ObsidianPrintPluginSettingTab(this.app, this));

		this.addCommand({
			id: 'print',
			name: 'print',
			callback: () => {
				// Set to light theme for printing
				document.body.removeClass("theme-dark")
				document.body.addClass("theme-light")

				document.getElementsByClassName("cm-content")[0].id = "print-content";

				printJS({
					printable: 'print-content',
					type: 'html',
					//css: ["app://obsidian.md/app.css"],
					//style: document.getElementsByTagName("head")[0].getElementsByTagName("style")[1].innerHTML,
					scanStyles: true,
					targetStyles: ['*'],
					documentTitle: this.app.workspace.getActiveFile()?.name
				})

				document.body.addClass("theme-dark")

			}
		})
	}

	onunload() {
		super.onunload();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	getVaultAbsolutePath(app: App) {
		let adapter = app.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			return adapter.getBasePath();
		}
		return null;
	}

}
