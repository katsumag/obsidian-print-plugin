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

		let startTime = Date.now()

		new Promise((resolve) => {
			const intervalId = setInterval(() => {
				if (Date.now() - startTime >= 200) {
					clearInterval(intervalId)
					resolve(null)
				}

				if (!document.querySelector(".notice-container .notice")) { return }

				let notices = document.getElementsByClassName("notice-container")[0].getElementsByClassName("notice")
				let noticeString = Array.from(notices).map(notice => notice.textContent).filter(text => {
					if (!text) { return false }
					return text.startsWith("PDF Saved to ")
				}).first()

				if (!noticeString) { return }

				clearInterval(intervalId)
				resolve(noticeString)
			}, 100);
		}).then((pdfPathString: String | null) => {
			if (! pdfPathString) {
				console.error("Could not capture PDF saved notice")
				return
			}

			console.log(pdfPathString)

			let pdfPath = pdfPathString.substring(13)
			// let base64EncodedPDF = fs.readFileSync(pdfPath).toString("base64")
			let base64EncodedPDF = fs.readFileSync(pdfPath)
			let printablePDF = new Blob([base64EncodedPDF], { type: "application/pdf" })
			//console.log(base64EncodedPDF)

			printJS({
				printable: URL.createObjectURL(printablePDF),
				type: 'pdf',
				onError: (err) => console.log(err),
				onPrintDialogClose: () => console.log("Print dialog closed")
			})

			this.registerDomEvent(window, "afterprint", (evt: Event) => {
				fs.unlinkSync(pdfPath)
				console.log("FINISHED!")
			}, {
				once: true
			})
		});
	}

}
