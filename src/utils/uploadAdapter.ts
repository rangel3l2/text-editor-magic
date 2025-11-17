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

  // Se há um customHandler, intercepta o comando de upload quando o editor estiver pronto
  const customHandler = editor.config.get('customImageUploadHandler');
  if (customHandler) {
    editor.on('ready', () => {
      try {
        const uploadImageCommand = editor.commands.get('uploadImage');
        if (uploadImageCommand) {
          uploadImageCommand.on('execute', (evt: any) => {
            evt.stop();
            
            // Criar input de arquivo customizado
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e: any) => {
              const file = e.target.files?.[0];
              if (file) {
                customHandler(file);
              }
            };
            input.click();
          }, { priority: 'high' });
        }
      } catch (error) {
        console.error('Error setting up custom image handler:', error);
      }
    });
  }
}