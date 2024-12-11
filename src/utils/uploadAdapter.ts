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
        this.loader.file.then((file: File) => {
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
    return new UploadAdapter(loader);
  };
}