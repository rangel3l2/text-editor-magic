class UploadAdapter {
  private loader: any;

  constructor(loader: any) {
    this.loader = loader;
  }

  upload(): Promise<{ default: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      this.loader.file.then((file: File) => {
        reader.addEventListener('load', () => {
          resolve({ default: reader.result as string });
        });
        
        reader.addEventListener('error', err => {
          reject(err);
        });
        
        reader.readAsDataURL(file);
      });
    });
  }

  abort(): void {
    // Abort upload implementation
  }
}

export function uploadAdapterPlugin(editor: any) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    return new UploadAdapter(loader);
  };
}