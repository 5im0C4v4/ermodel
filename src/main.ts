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

		const ribbonButton = this.addRibbonIcon(
			'image-plus',
			'Create jder preview block',
			() => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view) {
					new Notice(
						'Open a Markdown note to insert a jder preview block.',
					);
					return;
				}
				void createJderBlock(this, view.editor);
			},
		);
		ribbonButton.empty();
		const icon = ribbonButton.createSvg('svg');
		icon.setAttribute('viewBox', '0 0 24 24');
		icon.setAttribute('aria-hidden', 'true');
		icon.classList.add('ermodel-ribbon-icon');
		const drawing = icon.createSvg('path');
		drawing.setAttribute(
			'd',
			'M8 2.5h8v4H8z M12 8v6.5m-2-4 2-2 2 2M5 15h14M5 15v3m14-3v3M1 18h8v5H1zM15 18h8v5h-8zM20 2v5m-2.5-2.5h5',
		);
		icon.append(drawing);
		ribbonButton.append(icon);
	}
}
