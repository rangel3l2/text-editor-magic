import { Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from "docx";
import { processHtmlContent } from './contentProcessor';
import { processBase64Image } from './imageProcessor';

export const createSectionWithTitle = async (title: string, content: string): Promise<Paragraph[]> => {
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
                      AlignmentType.LEFT,
          })
        );
      } else if (element.type === 'image' && element.src) {
        try {
          console.log('Processing image:', element.src.substring(0, 50) + '...');
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
                  type: 'png'
                })
              ],
              spacing: { before: 120, after: 120 },
              alignment: AlignmentType.CENTER,
            })
          );
          console.log('Image processed successfully');
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