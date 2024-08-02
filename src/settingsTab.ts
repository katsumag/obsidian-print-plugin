import {App, PluginSettingTab, Setting, TextComponent} from "obsidian";
import ObsidianPrintPlugin from "./main";

export class ObsidianPrintPluginSettingTab extends PluginSettingTab {

	plugin: ObsidianPrintPlugin;

	constructor(app: App, plugin: ObsidianPrintPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Example Setting")
			.setDesc("Example Description")
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.exampleSetting)
				.onChange(async (value) => {
					this.plugin.settings.exampleSetting = value;
					await this.plugin.saveSettings();
				}));
	}


}
