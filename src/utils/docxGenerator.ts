import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, convertInchesToTwip, ImageRun, HeadingLevel, Spacing } from 'docx';

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

const extractImagesFromHtml = async (html: string): Promise<ImageRun[]> => {
  const images: ImageRun[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const imgElements = doc.getElementsByTagName('img');

  for (const img of imgElements) {
    try {
      const response = await fetch(img.src);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      images.push(new ImageRun({
        data: arrayBuffer,
        transformation: {
          width: 200,
          height: 150
        }
      }));
    } catch (error) {
      console.error('Error loading image:', error);
    }
  }

  return images;
};

const createHeading = (text: string) => {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: {
      before: 400,
      after: 200,
      line: 360, // 1.5 line spacing (ABNT)
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 28,
        font: "Times New Roman", // ABNT font
      }),
    ],
  });
};

const createContent = async (text: string) => {
  const images = await extractImagesFromHtml(text);
  
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED, // ABNT requires justified text
    spacing: {
      before: 200,
      after: 200,
      line: 360, // 1.5 line spacing (ABNT)
    },
    children: [
      new TextRun({
        text: stripHtml(text),
        size: 24,
        font: "Times New Roman", // ABNT font
      }),
      ...images,
    ],
  });
};

export const generateDocx = async (content: BannerContent) => {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 24,
          },
        },
      },
    },
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
            line: 360, // 1.5 line spacing (ABNT)
          },
          children: [
            new TextRun({
              text: stripHtml(content.title),
              bold: true,
              size: 36,
              font: "Times New Roman",
            }),
          ],
        }),
        
        // Authors
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 200,
            after: 400,
            line: 360,
          },
          children: [
            new TextRun({
              text: stripHtml(content.authors),
              size: 24,
              font: "Times New Roman",
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
                    await createContent(content.introduction),
                    createHeading('Objetivos'),
                    await createContent(content.objectives),
                    createHeading('Metodologia'),
                    await createContent(content.methodology),
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
                    await createContent(content.results),
                    createHeading('Conclusão'),
                    await createContent(content.conclusion),
                    createHeading('Referências'),
                    await createContent(content.references),
                    ...(content.acknowledgments.trim() ? [
                      createHeading('Agradecimentos'),
                      await createContent(content.acknowledgments),
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