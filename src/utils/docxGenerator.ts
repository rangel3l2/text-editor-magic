import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, SectionType, IStylesOptions } from "docx";

interface BannerContent {
  title: string;
  authors: string;
  introduction: string;
  objectives: string;
  methodology: string;
  results: string;
  conclusion: string;
  references: string;
  acknowledgments: string;
}

const styles: IStylesOptions = {
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

const cleanHtmlContent = (content: string): string => {
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .trim();
};

export const generateDocx = async (content: BannerContent): Promise<Blob> => {
  const doc = new Document({
    styles,
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
          column: {
            space: 708,
            count: 2,
          },
        },
        children: [
          new Paragraph({
            style: "title",
            children: [new TextRun(cleanHtmlContent(content.title))],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun(cleanHtmlContent(content.authors))],
            spacing: { after: 480 },
          }),
          new Paragraph({
            style: "heading",
            children: [new TextRun("1. INTRODUÇÃO")],
          }),
          new Paragraph({
            children: [new TextRun(cleanHtmlContent(content.introduction))],
          }),
          new Paragraph({
            style: "heading",
            children: [new TextRun("2. OBJETIVOS")],
          }),
          new Paragraph({
            children: [new TextRun(cleanHtmlContent(content.objectives))],
          }),
          new Paragraph({
            style: "heading",
            children: [new TextRun("3. METODOLOGIA")],
          }),
          new Paragraph({
            children: [new TextRun(cleanHtmlContent(content.methodology))],
          }),
          new Paragraph({
            style: "heading",
            children: [new TextRun("4. RESULTADOS E DISCUSSÃO")],
          }),
          new Paragraph({
            children: [new TextRun(cleanHtmlContent(content.results))],
          }),
          new Paragraph({
            style: "heading",
            children: [new TextRun("5. CONCLUSÃO")],
          }),
          new Paragraph({
            children: [new TextRun(cleanHtmlContent(content.conclusion))],
          }),
          new Paragraph({
            style: "heading",
            children: [new TextRun("REFERÊNCIAS")],
          }),
          new Paragraph({
            children: [new TextRun(cleanHtmlContent(content.references))],
          }),
        ].concat(
          content.acknowledgments
            ? [
                new Paragraph({
                  style: "heading",
                  children: [new TextRun("AGRADECIMENTOS")],
                }),
                new Paragraph({
                  children: [new TextRun(cleanHtmlContent(content.acknowledgments))],
                }),
              ]
            : []
        ),
      },
    ],
  });

  return await Packer.toBlob(doc);
};