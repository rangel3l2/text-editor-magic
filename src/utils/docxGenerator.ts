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

const processBase64Image = async (base64String: string): Promise<Buffer> => {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
};

const processHtmlContent = (content: string) => {
  if (!content) return [{ type: 'text', content: '' }];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const elements = Array.from(doc.body.childNodes);
  const result: { type: string; content: string; src?: string; style?: any }[] = [];

  elements.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        result.push({ type: 'text', content: text });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      
      if (element.tagName === 'P') {
        const text = element.textContent?.trim();
        if (text) {
          result.push({ 
            type: 'paragraph', 
            content: text,
            style: {
              bold: element.style.fontWeight === 'bold' || element.querySelector('strong') !== null,
              italics: element.style.fontStyle === 'italic' || element.querySelector('em') !== null,
              alignment: element.style.textAlign || 'justify'
            }
          });
        }
      } else if (element.tagName === 'IMG') {
        const src = element.getAttribute('src');
        if (src) {
          result.push({ type: 'image', content: '', src });
        }
      } else if (element.tagName === 'BR') {
        result.push({ type: 'linebreak', content: '' });
      } else if (element.tagName === 'UL' || element.tagName === 'OL') {
        Array.from(element.children).forEach(li => {
          const listItem = li as HTMLElement;
          const text = listItem.textContent?.trim();
          if (text) {
            result.push({
              type: 'paragraph',
              content: `• ${text}`,
              style: {
                bold: listItem.style.fontWeight === 'bold' || listItem.querySelector('strong') !== null,
                italics: listItem.style.fontStyle === 'italic' || listItem.querySelector('em') !== null,
                alignment: 'left'
              }
            });
          }
        });
      }
    }
  });

  return result.length > 0 ? result : [{ type: 'text', content: '' }];
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
    const elements = processHtmlContent(content);
    
    for (const element of elements) {
      if (element.type === 'paragraph' || element.type === 'text') {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: element.content,
                bold: element.style?.bold || false,
                italics: element.style?.italics || false,
                size: 24,
              })
            ],
            spacing: { after: 200 },
            alignment: element.style?.alignment === 'center' ? AlignmentType.CENTER : 
                      element.style?.alignment === 'right' ? AlignmentType.RIGHT : 
                      AlignmentType.JUSTIFIED,
          })
        );
      } else if (element.type === 'image' && element.src) {
        try {
          const imageBuffer = await processBase64Image(element.src);
          paragraphs.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: 400,
                    height: 300,
                  },
                  type: 'png', // Add required type property
                  fallback: { // Add required fallback property
                    data: imageBuffer,
                    type: 'png',
                  }
                }),
              ],
              spacing: { before: 120, after: 120 },
              alignment: AlignmentType.CENTER,
            })
          );
        } catch (error) {
          console.error('Error processing image:', error);
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '[Error: Unable to process image]',
                  color: "FF0000",
                  italics: true,
                })
              ],
              spacing: { after: 200 },
              alignment: AlignmentType.CENTER,
            })
          );
        }
      } else if (element.type === 'linebreak') {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun('')],
            spacing: { after: 200 },
          })
        );
      }
    }
  }

  return paragraphs;
};

export const generateDocx = async (content: BannerContent): Promise<Blob> => {
  console.log('Generating DOCX with content:', content);
  const sections = [];

  sections.push(
    new Paragraph({
      text: processHtmlContent(content.title)[0]?.content || '',
      style: "title",
      alignment: AlignmentType.CENTER,
    })
  );

  sections.push(
    new Paragraph({
      text: processHtmlContent(content.authors)[0]?.content || '',
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
