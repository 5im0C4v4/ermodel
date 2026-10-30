import { MarkdownView, Notice, Plugin } from 'obsidian';
import { createJderBlock, registerJderIntegration } from './jder';

export default class ERModelPlugin extends Plugin {
	async onload() {
		registerJderIntegration(this);

		this.addCommand({
			id: 'create-jder-preview-block',
			name: 'Create jder preview block',
			editorCallback: (editor) => {
				void createJderBlock(this, editor);
			},
		});

		this.addRibbonIcon('image-plus', 'Create jder preview block', () => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view) {
				new Notice('Open a Markdown note to insert a jder preview block.');
				return;
			}
			void createJderBlock(this, view.editor);
		});
	}
}
