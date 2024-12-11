import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, SectionType, IStylesOptions, ImageRun } from "docx";

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

const cleanHtmlContent = (content: string): { text: string; images: string[] } => {
  const images: string[] = [];
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  let match;

  while ((match = imgRegex.exec(content)) !== null) {
    images.push(match[1]);
  }

  const textContent = content
    .replace(/<img[^>]*>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

  return { text: textContent, images };
};

const fetchImageAsBuffer = async (url: string): Promise<Buffer> => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const createSectionWithTitle = async (title: string, content: string): Promise<Paragraph[]> => {
  const paragraphs: Paragraph[] = [];
  
  paragraphs.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 120 },
      style: "heading",
    })
  );

  if (content) {
    const { text, images } = cleanHtmlContent(content);
    
    paragraphs.push(
      new Paragraph({
        children: [new TextRun(text)],
        spacing: { after: 200 },
        alignment: AlignmentType.JUSTIFIED,
      })
    );

    for (const imageUrl of images) {
      try {
        const imageBuffer = await fetchImageAsBuffer(imageUrl);
        paragraphs.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: {
                  width: 400,
                  height: 300,
                },
                floating: {
                  horizontalPosition: {
                    offset: 1014400,
                  },
                  verticalPosition: {
                    offset: 1014400,
                  },
                },
                type: 'png', // Adicionando o tipo da imagem
              }),
            ],
            spacing: { before: 120, after: 120 },
            alignment: AlignmentType.CENTER,
          })
        );
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }
  }

  return paragraphs;
};

export const generateDocx = async (content: BannerContent): Promise<Blob> => {
  const sections = [];

  sections.push(
    new Paragraph({
      text: cleanHtmlContent(content.title).text,
      style: "title",
      alignment: AlignmentType.CENTER,
    })
  );

  sections.push(
    new Paragraph({
      text: cleanHtmlContent(content.authors).text,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  sections.push(...await createSectionWithTitle("1. Introdução", content.introduction));
  sections.push(...await createSectionWithTitle("2. Objetivos", content.objectives));
  sections.push(...await createSectionWithTitle("3. Metodologia", content.methodology));
  sections.push(...await createSectionWithTitle("4. Resultados e Discussão", content.results));
  sections.push(...await createSectionWithTitle("5. Conclusão", content.conclusion));
  sections.push(...await createSectionWithTitle("6. Referências", content.references));
  
  if (content.acknowledgments) {
    sections.push(...await createSectionWithTitle("7. Agradecimentos", content.acknowledgments));
  }

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
        children: sections,
      },
    ],
  });

  return await Packer.toBlob(doc);
};