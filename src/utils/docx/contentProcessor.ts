import { AlignmentType } from "docx";
import { ProcessedElement } from './types';

export const processHtmlContent = (content: string): ProcessedElement[] => {
  if (!content) return [{ type: 'text', content: '' }];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const elements = Array.from(doc.body.childNodes);
  const result: ProcessedElement[] = [];

  const processNode = (node: Node) => {
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
        const figcaption = element.querySelector('figcaption');
        if (img) {
          const src = img.getAttribute('src');
          if (src) {
            result.push({ 
              type: 'image', 
              content: '', 
              src,
              caption: figcaption?.textContent?.trim() || ''
            });
          }
        }
      } else if (element.tagName === 'IMG') {
        const src = element.getAttribute('src');
        if (src) {
          result.push({ type: 'image', content: '', src });
        }
      } else if (element.tagName === 'BR') {
        result.push({ type: 'linebreak', content: '' });
      } else {
        // Recursively process child nodes
        element.childNodes.forEach(child => processNode(child));
      }
    }
  };

  elements.forEach(node => processNode(node));
  return result.length > 0 ? result : [{ type: 'text', content: '' }];
};