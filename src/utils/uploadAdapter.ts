class UploadAdapter {
  private loader: any;
  private controller: AbortController;

  constructor(loader: any) {
    this.loader = loader;
    this.controller = new AbortController();
  }

  upload(): Promise<{ default: string }> {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.addEventListener('load', () => {
          resolve({ default: reader.result as string });
        });
        
        reader.addEventListener('error', err => {
          reject(err);
        });
        
        reader.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });
        
        this.loader.file.then((file: File) => {
          reader.readAsDataURL(file);
        }).catch((error: Error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  abort(): void {
    if (this.controller) {
      this.controller.abort();
    }
  }
}

export function uploadAdapterPlugin(editor: any) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    return new UploadAdapter(loader);
  };
}