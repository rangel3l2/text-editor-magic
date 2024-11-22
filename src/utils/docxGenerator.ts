import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, convertInchesToTwip } from 'docx';

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

const stripHtml = (html: string) => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const createHeading = (text: string) => {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: {
      before: 400,
      after: 200,
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 28,
        color: '000000',
      }),
    ],
  });
};

const createContent = (text: string) => {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      before: 200,
      after: 200,
    },
    children: [
      new TextRun({
        text: stripHtml(text),
        size: 24,
      }),
    ],
  });
};

export const generateDocx = async (content: BannerContent) => {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
          },
        },
      },
      children: [
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 400,
            after: 400,
          },
          children: [
            new TextRun({
              text: stripHtml(content.title),
              bold: true,
              size: 36,
              color: '000000',
            }),
          ],
        }),
        
        // Authors
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 200,
            after: 400,
          },
          children: [
            new TextRun({
              text: stripHtml(content.authors),
              size: 24,
              color: '000000',
            }),
          ],
        }),

        // Two-column content using table
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                // Left column
                new TableCell({
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                  margins: {
                    right: 200,
                  },
                  children: [
                    createHeading('Introdução'),
                    createContent(content.introduction),
                    createHeading('Objetivos'),
                    createContent(content.objectives),
                    createHeading('Metodologia'),
                    createContent(content.methodology),
                  ],
                }),
                // Right column
                new TableCell({
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                  margins: {
                    left: 200,
                  },
                  children: [
                    createHeading('Resultados e Discussão'),
                    createContent(content.results),
                    createHeading('Conclusão'),
                    createContent(content.conclusion),
                    createHeading('Referências'),
                    createContent(content.references),
                    ...(content.acknowledgments ? [
                      createHeading('Agradecimentos'),
                      createContent(content.acknowledgments),
                    ] : []),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }],
  });

  return await Packer.toBlob(doc);
};