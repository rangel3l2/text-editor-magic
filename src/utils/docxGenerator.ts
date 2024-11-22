import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';

const cleanHtmlContent = (content: string): string => {
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim();
};

const createSectionTitle = (text: string) => {
  return new Paragraph({
    spacing: { before: 400, after: 200 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 24,
        font: 'Times New Roman'
      })
    ]
  });
};

const createSectionContent = (content: string) => {
  const cleanContent = cleanHtmlContent(content);
  if (!cleanContent) return [];

  return [
    new Paragraph({
      spacing: { before: 200, after: 400 },
      children: [
        new TextRun({
          text: cleanContent,
          size: 24,
          font: 'Times New Roman'
        })
      ]
    })
  ];
};

export const generateDocx = async (content: BannerContent) => {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440
          }
        }
      },
      children: [
        // Title - ABNT style
        new Paragraph({
          spacing: { after: 300 },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: cleanHtmlContent(content.title),
              bold: true,
              size: 32,
              font: 'Times New Roman'
            })
          ]
        }),
        // Authors - ABNT style
        new Paragraph({
          spacing: { after: 400 },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: cleanHtmlContent(content.authors),
              size: 24,
              font: 'Times New Roman'
            })
          ]
        }),
        // Main content in two columns using a table
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
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
                  children: [
                    createSectionTitle("INTRODUÇÃO"),
                    ...createSectionContent(content.introduction),
                    createSectionTitle("OBJETIVOS"),
                    ...createSectionContent(content.objectives),
                    createSectionTitle("METODOLOGIA"),
                    ...createSectionContent(content.methodology),
                  ]
                }),
                // Right column
                new TableCell({
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                  children: [
                    createSectionTitle("RESULTADOS"),
                    ...createSectionContent(content.results),
                    createSectionTitle("CONCLUSÃO"),
                    ...createSectionContent(content.conclusion),
                    createSectionTitle("REFERÊNCIAS"),
                    ...createSectionContent(content.references),
                    ...(content.acknowledgments.trim() ? [
                      createSectionTitle("AGRADECIMENTOS"),
                      ...createSectionContent(content.acknowledgments)
                    ] : [])
                  ]
                })
              ]
            })
          ]
        })
      ]
    }]
  });

  return Packer.toBlob(doc);
};

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