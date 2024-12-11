import { Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from "docx";
import { processHtmlContent } from './contentProcessor';
import { processBase64Image } from './imageProcessor';

const MAX_IMAGE_WIDTH = 300; // ~7.5cm at 100dpi
const MAX_IMAGE_HEIGHT = 400; // ~10cm at 100dpi

const calculateAspectRatio = (width: number, height: number) => {
  if (width > MAX_IMAGE_WIDTH) {
    const ratio = MAX_IMAGE_WIDTH / width;
    return {
      width: MAX_IMAGE_WIDTH,
      height: Math.round(height * ratio)
    };
  }
  if (height > MAX_IMAGE_HEIGHT) {
    const ratio = MAX_IMAGE_HEIGHT / height;
    return {
      width: Math.round(width * ratio),
      height: MAX_IMAGE_HEIGHT
    };
  }
  return { width, height };
};

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
          
          if (!imageBuffer || imageBuffer.length === 0) {
            throw new Error('Invalid image data');
          }

          // Create an Image object to get dimensions
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = element.src;
          });

          // Calculate dimensions maintaining aspect ratio
          const dimensions = calculateAspectRatio(img.width, img.height);

          // Add spacing before image
          paragraphs.push(
            new Paragraph({
              children: [],
              spacing: { before: 240 },
            })
          );

          // Add the image with calculated dimensions
          paragraphs.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: {
                    width: dimensions.width,
                    height: dimensions.height,
                  },
                  type: 'png'
                })
              ],
              spacing: { before: 120, after: 120 },
              alignment: AlignmentType.CENTER,
            })
          );

          // Add caption if present
          if (element.caption) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: element.caption,
                    size: 20, // Smaller font size for captions
                    italics: true,
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 },
              })
            );
          }

          // Add spacing after image
          paragraphs.push(
            new Paragraph({
              children: [],
              spacing: { after: 240 },
            })
          );

          console.log('Image processed successfully');
        } catch (error) {
          console.error('Error processing image:', error);
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '[Erro ao processar imagem. Por favor, verifique se a imagem está no formato correto e tente novamente.]',
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