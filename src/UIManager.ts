export class UIManager {
    private _importButton: HTMLButtonElement;
    private _fileInput: HTMLInputElement;
    private _extendButton: HTMLButtonElement;

    private _onImportCallback: ((file: File) => void) | null = null;
    private _onExtendCallback: (() => void) | null = null;

    constructor() {
        this._importButton = document.getElementById('importButton') as HTMLButtonElement;

        this._fileInput = document.getElementById('fileInput') as HTMLInputElement;

        this._extendButton = document.getElementById('extendButton') as HTMLButtonElement;
        this._extendButton.disabled = true;

        this.setupEventListeners();
    }

    // Instead of button events dirently impacting data, it now uses callbacks
    private setupEventListeners(): void {
        this._importButton.addEventListener('click', () => {
            this._fileInput.click();
        });

        this._fileInput.addEventListener('change', (event) => {
            const files = (event.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                if (this._onImportCallback) {
                    this._onImportCallback(files[0]);
                }
            }
        });

        this._extendButton.addEventListener('click', () => {
            if (this._onExtendCallback && !this._extendButton.disabled) {
                this._onExtendCallback();
            }
        });
    }

    public onImportButtonClick(callback: (file: File) => void): void {
        this._onImportCallback = callback;
    }

    public onExtendButtonClick(callback: () => void): void {
        this._onExtendCallback = callback;
    }

    // Update button state when selection changes
    public updateExtendButtonState(isDisabled: boolean): void {
        this._extendButton.disabled = isDisabled;
    }
}