import { IStylesOptions, AlignmentType } from "docx";

export const documentStyles: IStylesOptions = {
  default: {
    document: {
      run: {
        font: "Times New Roman",
        size: 24,
      },
      paragraph: {
        spacing: {
          after: 120,
          line: 276,
        },
        alignment: AlignmentType.JUSTIFIED,
      },
    },
  },
  paragraphStyles: [
    {
      id: "title",
      name: "Title",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: {
        size: 32,
        bold: true,
      },
      paragraph: {
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
      },
    },
    {
      id: "heading",
      name: "Heading",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: {
        size: 28,
        bold: true,
      },
      paragraph: {
        spacing: { before: 240, after: 120 },
      },
    },
  ],
};