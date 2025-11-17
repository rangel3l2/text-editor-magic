class UploadAdapter {
  private loader: any;
  private controller: AbortController;
  private customHandler?: (file: File) => void;

  constructor(loader: any, customHandler?: (file: File) => void) {
    this.loader = loader;
    this.controller = new AbortController();
    this.customHandler = customHandler;
  }

  upload(): Promise<{ default: string }> {
    return new Promise((resolve, reject) => {
      try {
        this.loader.file.then((file: File) => {
          // Se houver handler customizado, usa ele e não insere no editor
          if (this.customHandler) {
            this.customHandler(file);
            reject('Image will be handled by custom handler');
            return;
          }

          const reader = new FileReader();
          
          reader.onload = () => {
            resolve({ default: reader.result as string });
          };
          
          reader.onerror = () => {
            reject('Error reading file');
          };
          
          reader.onabort = () => {
            reject('File reading aborted');
          };

          reader.readAsDataURL(file);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  abort(): void {
    if (this.controller.signal.aborted) return;
    this.controller.abort();
  }
}

export function uploadAdapterPlugin(editor: any) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    const customHandler = editor.config.get('customImageUploadHandler');
    return new UploadAdapter(loader, customHandler);
  };
}