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

export const generateDocx = async (content: BannerContent): Promise<Blob> => {
  const sections = [];

  for (const [key, value] of Object.entries(content)) {
    if (!value) continue;

    const { text, images } = cleanHtmlContent(value);
    const children: any[] = [];

    // Add text content
    if (text) {
      children.push(new TextRun(text));
    }

    // Add images
    for (const imageUrl of images) {
      try {
        const imageBuffer = await fetchImageAsBuffer(imageUrl);
        children.push(
          new ImageRun({
            data: imageBuffer,
            transformation: {
              width: 400,
              height: 300,
            },
          })
        );
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    sections.push(
      new Paragraph({
        children,
        spacing: { after: 200 },
      })
    );
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
