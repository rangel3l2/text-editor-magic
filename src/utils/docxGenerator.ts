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
    .replace(/<img[^>]*>/g, '') // Remove image tags
    .replace(/<[^>]*>/g, '') // Remove other HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .trim();

  return { text: textContent, images };
};

const fetchImageAsBuffer = async (url: string): Promise<Buffer> => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const createSectionWithTitle = (title: string, content: string): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  
  // Add section title
  paragraphs.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 120 },
      style: "heading",
    })
  );

  // Add section content
  if (content) {
    const { text, images } = cleanHtmlContent(content);
    paragraphs.push(
      new Paragraph({
        children: [new TextRun(text)],
        spacing: { after: 200 },
      })
    );
  }

  return paragraphs;
};

export const generateDocx = async (content: BannerContent): Promise<Blob> => {
  const sections = [];

  // Title
  sections.push(
    new Paragraph({
      text: cleanHtmlContent(content.title).text,
      style: "title",
      alignment: AlignmentType.CENTER,
    })
  );

  // Authors
  sections.push(
    new Paragraph({
      text: cleanHtmlContent(content.authors).text,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Add each section with its title
  sections.push(...createSectionWithTitle("1. Introdução", content.introduction));
  sections.push(...createSectionWithTitle("2. Objetivos", content.objectives));
  sections.push(...createSectionWithTitle("3. Metodologia", content.methodology));
  sections.push(...createSectionWithTitle("4. Resultados e Discussão", content.results));
  sections.push(...createSectionWithTitle("5. Conclusão", content.conclusion));
  sections.push(...createSectionWithTitle("6. Referências", content.references));
  
  if (content.acknowledgments) {
    sections.push(...createSectionWithTitle("7. Agradecimentos", content.acknowledgments));
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