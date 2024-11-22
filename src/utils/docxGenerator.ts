import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ImageRun } from 'docx';

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

const extractImages = async (htmlContent: string): Promise<ImageRun[]> => {
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  const images: ImageRun[] = [];
  let match;
  
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    try {
      const imageUrl = match[1];
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      images.push(
        new ImageRun({
          data: Buffer.from(arrayBuffer),
          transformation: {
            width: 400,
            height: 300
          },
          type: 'png'
        })
      );
    } catch (error) {
      console.error('Error loading image:', error);
    }
  }
  
  return images;
};

const cleanHtmlContent = (content: string): string => {
  return content
    .replace(/<img[^>]+>/g, '') // Remove img tags
    .replace(/<[^>]*>/g, '') // Remove other HTML tags
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

const createSectionContent = async (content: string) => {
  const cleanContent = cleanHtmlContent(content);
  if (!cleanContent) return [];

  const paragraphs = [];
  
  // Add text content
  paragraphs.push(
    new Paragraph({
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: cleanContent,
          size: 24,
          font: 'Times New Roman'
        })
      ]
    })
  );

  // Add images if any
  const images = await extractImages(content);
  for (const image of images) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 200, after: 200 },
        children: [image]
      })
    );
  }

  return paragraphs;
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
                    ...(await createSectionContent(content.introduction)),
                    createSectionTitle("OBJETIVOS"),
                    ...(await createSectionContent(content.objectives)),
                    createSectionTitle("METODOLOGIA"),
                    ...(await createSectionContent(content.methodology)),
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
                    ...(await createSectionContent(content.results)),
                    createSectionTitle("CONCLUSÃO"),
                    ...(await createSectionContent(content.conclusion)),
                    createSectionTitle("REFERÊNCIAS"),
                    ...(await createSectionContent(content.references)),
                    ...(content.acknowledgments.trim() ? [
                      createSectionTitle("AGRADECIMENTOS"),
                      ...(await createSectionContent(content.acknowledgments))
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
