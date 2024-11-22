import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';

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

export const generateDocx = async (content: BannerContent): Promise<Blob> => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: content.title.replace(/<[^>]*>/g, ''),
              bold: true,
              size: 32
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: content.authors.replace(/<[^>]*>/g, ''),
              size: 24
            })
          ]
        }),
        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Introdução", bold: true, size: 24 }),
                        new TextRun({ text: "\n" + content.introduction.replace(/<[^>]*>/g, '') })
                      ]
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "\nObjetivos", bold: true, size: 24 }),
                        new TextRun({ text: "\n" + content.objectives.replace(/<[^>]*>/g, '') })
                      ]
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "\nMetodologia", bold: true, size: 24 }),
                        new TextRun({ text: "\n" + content.methodology.replace(/<[^>]*>/g, '') })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  width: {
                    size: 50,
                    type: WidthType.PERCENTAGE,
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Resultados", bold: true, size: 24 }),
                        new TextRun({ text: "\n" + content.results.replace(/<[^>]*>/g, '') })
                      ]
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "\nConclusão", bold: true, size: 24 }),
                        new TextRun({ text: "\n" + content.conclusion.replace(/<[^>]*>/g, '') })
                      ]
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "\nReferências", bold: true, size: 24 }),
                        new TextRun({ text: "\n" + content.references.replace(/<[^>]*>/g, '') })
                      ]
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: "\nAgradecimentos", bold: true, size: 24 }),
                        new TextRun({ text: "\n" + content.acknowledgments.replace(/<[^>]*>/g, '') })
                      ]
                    })
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