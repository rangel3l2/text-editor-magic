import { Document, Packer, Paragraph, TextRun, ImageRun } from "docx";

const addImageToDoc = async (doc: Document, imageUrl: string) => {
  if (!imageUrl) return;

  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();

    doc.addSection({
      children: [
        new Paragraph({
          children: [
            new ImageRun({
              data: arrayBuffer,
              transformation: {
                width: 200,
                height: 150
              }
            })
          ],
        }),
      ],
    });
  } catch (error) {
    console.error("Error adding image to document:", error);
  }
};

export const generateDocument = async (
  title: string,
  content: string,
  imageUrl?: string
) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: title,
              bold: true,
              size: 32,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: content,
              size: 24,
            }),
          ],
        }),
      ],
    }],
  });

  if (imageUrl) {
    await addImageToDoc(doc, imageUrl);
  }

  return await Packer.toBlob(doc);
};
