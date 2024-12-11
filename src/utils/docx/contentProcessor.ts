import { ProcessedElement } from './types';
import { AlignmentType } from 'docx';
import { isValidBase64Image } from './imageProcessor';

export const processHtmlContent = (content: string): ProcessedElement[] => {
  if (!content) return [{ type: 'text', content: '' }];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const elements = Array.from(doc.body.childNodes);
  const result: ProcessedElement[] = [];

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
              alignment: (element.style.textAlign || 'left') as typeof AlignmentType[keyof typeof AlignmentType]
            }
          });
        }
      } else if (element.tagName === 'FIGURE' && element.classList.contains('image')) {
        const img = element.querySelector('img');
        if (img) {
          const src = img.getAttribute('src');
          if (src) {
            result.push({ type: 'image', content: '', src });
          }
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
                alignment: 'left' as typeof AlignmentType[keyof typeof AlignmentType]
              }
            });
          }
        });
      }
    }
  });

  return result.length > 0 ? result : [{ type: 'text', content: '' }];
};