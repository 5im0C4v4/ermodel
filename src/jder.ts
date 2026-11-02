import { spawn } from 'child_process';
import {
	App,
	Editor,
	FileSystemAdapter,
	MarkdownPostProcessorContext,
	Modal,
	Notice,
	Plugin,
	TextComponent,
} from 'obsidian';

const JDER_ROOT = 'ERModel';
const JDER_JAR = `${JDER_ROOT}/JDER.jar`;
const DIAGRAMS_FOLDER = `${JDER_ROOT}/json`;
const PREVIEWS_FOLDER = `${JDER_ROOT}/png`;

export function registerJderIntegration(plugin: Plugin): void {
	plugin.registerMarkdownCodeBlockProcessor(
		'jder',
		(source, element, context) =>
			renderJderBlock(plugin, source, element, context),
	);
}

export async function createJderBlock(
	plugin: Plugin,
	editor: Editor,
): Promise<void> {
	try {
		await ensureJderFolders(plugin.app);
		new JderBlockModal(plugin.app, (name) => {
			editor.replaceSelection(
				`\n\`\`\`jder\nfile: ${name}.json\n\`\`\`\n`,
			);
		}).open();
	} catch (error) {
		new Notice(`Could not prepare the ERModel folders: ${errorMessage(error)}`);
	}
}

async function ensureJderFolders(app: App): Promise<void> {
	for (const folder of [JDER_ROOT, DIAGRAMS_FOLDER, PREVIEWS_FOLDER]) {
		if (!(await app.vault.adapter.exists(folder))) {
			await app.vault.adapter.mkdir(folder);
		}
	}
}

async function renderJderBlock(
	plugin: Plugin,
	source: string,
	element: HTMLElement,
	_context: MarkdownPostProcessorContext,
): Promise<void> {
	element.empty();
	const match = source.trim().match(/^file:\s*(.+)$/im);
	const filename = match?.[1]?.trim();
	if (!filename || !/^[\p{L}\p{N}][\p{L}\p{N} _-]*\.json$/iu.test(filename)) {
		element.createEl('p', {
			cls: 'ermodel-notice',
			text: 'Use a Jder block with one file name, for example: file: customer.json',
		});
		return;
	}

	const diagramPath = `${DIAGRAMS_FOLDER}/${filename}`;
	const previewName = filename.replace(/\.json$/i, '.png');
	const previewPath = `${PREVIEWS_FOLDER}/${previewName}`;
	const preview = element.createDiv({ cls: 'ermodel-preview' });
	const imageContainer = preview.createDiv({ cls: 'ermodel-preview-image' });
	const actions = preview.createDiv({ cls: 'ermodel-preview-actions' });

	const refreshButton = actions.createEl('button', {
		text: 'Refresh preview',
	});
	const launchButton = actions.createEl('button', {
		text: 'Launch diagram editor',
	});

	const renderImage = async (): Promise<void> => {
		imageContainer.empty();
		if (!(await plugin.app.vault.adapter.exists(previewPath))) {
			imageContainer.createEl('p', {
				cls: 'ermodel-notice',
				text: `PNG preview not found: ${previewPath}`,
			});
			return;
		}

		const image = imageContainer.createEl('img', {
			cls: 'ermodel-preview-image-file',
			attr: {
				alt: `JDER diagram preview for ${filename}`,
				src: `${plugin.app.vault.adapter.getResourcePath(previewPath)}?t=${Date.now()}`,
			},
		});
		image.onerror = () => {
			imageContainer.empty();
			imageContainer.createEl('p', {
				cls: 'ermodel-notice',
				text: `Could not display the PNG preview: ${previewPath}`,
			});
		};
	};

	refreshButton.addEventListener('click', () => {
		void renderImage().catch((error: unknown) => {
			imageContainer.setText(
				`Could not refresh the preview: ${errorMessage(error)}`,
			);
		});
	});
	launchButton.addEventListener('click', () => {
		void launchJder(plugin.app, diagramPath, previewPath);
	});

	await renderImage().catch((error: unknown) => {
		imageContainer.setText(
			`Could not load the preview: ${errorMessage(error)}`,
		);
	});
}

async function launchJder(
	app: App,
	diagramPath: string,
	previewPath: string,
): Promise<void> {
	try {
		if (!(await app.vault.adapter.exists(JDER_JAR))) {
			new Notice(`Place JDER.jar at ${JDER_JAR} in your vault.`);
			return;
		}
		if (!(app.vault.adapter instanceof FileSystemAdapter)) {
			new Notice('The diagram editor is only available in a desktop vault.');
			return;
		}

		const jarPath = app.vault.adapter.getFullPath(JDER_JAR);
		const diagramFullPath = app.vault.adapter.getFullPath(diagramPath);
		const previewFullPath = app.vault.adapter.getFullPath(previewPath);
		const jder = spawn(
			'java',
			[
				'-jar',
				jarPath,
				'--json',
				diagramFullPath,
				'--png',
				previewFullPath,
			],
			{
				detached: true,
				stdio: 'ignore',
				windowsHide: true,
			},
		);
		jder.once('error', (error: Error) => {
			new Notice(`Could not launch JDER: ${error.message}`);
		});
		jder.once('exit', (code) => {
			if (code !== null && code !== 0) {
				new Notice(`JDER exited with code ${code}.`);
			}
		});
		jder.unref();
		new Notice(
			`Launching JDER with ${diagramPath}. Save the JSON in JDER to keep the diagram file updated; the PNG preview exports automatically.`,
		);
	} catch (error) {
		new Notice(`Could not launch JDER: ${errorMessage(error)}`);
	}
}

class JderBlockModal extends Modal {
	private input!: TextComponent;

	constructor(
		app: App,
		private readonly onSubmit: (name: string) => void,
	) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText('Create jder preview block');
		this.contentEl.createEl('p', {
			text: 'Enter a diagram name. Save the jder file and PNG preview with this name.',
		});
		this.input = new TextComponent(this.contentEl);
		this.input.setPlaceholder('Customer');
		this.input.inputEl.focus();

		const submit = (): void => {
			const name = this.input.getValue().trim();
			if (!/^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u.test(name)) {
				new Notice('Use letters, numbers, spaces, hyphens, or underscores.');
				return;
			}
			this.onSubmit(name);
			this.close();
		};

		this.input.inputEl.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				submit();
			}
		});
		const submitButton = this.contentEl.createEl('button', {
			text: 'Insert block',
			cls: 'mod-cta',
		});
		submitButton.addClass('ermodel-modal-submit');
		submitButton.addEventListener('click', submit);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
