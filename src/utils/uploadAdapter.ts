class UploadAdapter {
  private loader: any;
  private abortController: AbortController;

  constructor(loader: any) {
    this.loader = loader;
    this.abortController = new AbortController();
  }

  upload(): Promise<{ default: string }> {
    return this.loader.file.then((file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.addEventListener('load', () => {
          resolve({ default: reader.result as string });
        });
        
        reader.addEventListener('error', () => {
          reject(new Error('Error reading file'));
        });
        
        reader.addEventListener('abort', () => {
          reject(new Error('File reading aborted'));
        });

        try {
          reader.readAsDataURL(file);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  abort(): void {
    if (this.abortController.signal.aborted) {
      return;
    }
    this.abortController.abort();
  }
}

export function uploadAdapterPlugin(editor: any) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    return new UploadAdapter(loader);
  };
}