import {App, Editor, FileSystemAdapter, MarkdownFileInfo, MarkdownView, Plugin} from "obsidian";
import {ObsidianPrintPluginSettingTab} from "./settingsTab";
import {DEFAULT_SETTINGS, ObsidianPrintPluginSettings} from "./settings";
import printJS from "print-js";
import * as stream from "node:stream";
import * as fs from "node:fs";
import {base} from "w3c-keyname";


// MarkdownViews have an undocumented printToPdf function, declare it here, so we can use it
interface PrintableMarkdownView extends MarkdownView {
	printToPdf: Function
}

export default class ObsidianPrintPlugin extends Plugin {

	settings: ObsidianPrintPluginSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new ObsidianPrintPluginSettingTab(this.app, this));

		this.addCommand({
			id: 'print',
			name: 'print',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				// Listen to the PDF export completion message
				this.registerDomEvent(window, "afterprint", (evt: Event) => {
					this.printSavedPDF()
				}, {
					once: true
				});

				(view as PrintableMarkdownView).printToPdf()
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

	printSavedPDF() {

		let notices = document.getElementsByClassName("notice-container")[0].getElementsByClassName("notice")
		let noticeString = Array.from(notices).map(notice => notice.textContent).filter(text => {
			if (! text) { return false }
			return text.startsWith("PDF Saved to ")
		}).first()

		if (! noticeString) {
			console.error("Could not capture PDF saved notice")
			return
		}

		let pdfPath = noticeString.substring(13)
		let base64EncodedPDF = fs.readFileSync(pdfPath).toString("base64")

		printJS({
			printable: base64EncodedPDF,
			type: 'pdf',
			base64: true,
			showModal: true
		})

		this.registerDomEvent(window, "afterprint", (evt: Event) => {
			fs.unlinkSync(pdfPath)
		}, {
			once: true
		})
	}

}
