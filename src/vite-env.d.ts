/// <reference types="vite/client" />

declare module '@ckeditor/ckeditor5-react' {
  import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
  import Event from '@ckeditor/ckeditor5-utils/src/eventinfo';
  import { EditorConfig } from '@ckeditor/ckeditor5-core/src/editor/editorconfig';
  
  const CKEditor: any;
  export { CKEditor };
}

declare module '@ckeditor/ckeditor5-build-classic' {
  const ClassicEditor: any;
  export default ClassicEditor;
}

declare module 'docx' {
  import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ImageRun } from 'docx';
  export { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ImageRun };
}