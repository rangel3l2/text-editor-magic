import { Document, Packer, Paragraph, TextRun, AlignmentType, SectionType } from "docx";
import { BannerContent } from './docx/types';
import { documentStyles } from './docx/styles';
import { createSectionWithTitle } from './docx/sectionBuilder';

export const generateDocx = async (content: BannerContent): Promise<Blob> => {
  console.log('Generating DOCX with content:', content);
  const sections = [];

  // Add title
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: content.title.replace(/<[^>]*>/g, ''),
          size: 32,
          bold: true,
        })
      ],
      style: "title",
      alignment: AlignmentType.CENTER,
    })
  );

  // Add authors
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: content.authors.replace(/<[^>]*>/g, ''),
          size: 24,
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Add content sections
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
    styles: documentStyles,
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