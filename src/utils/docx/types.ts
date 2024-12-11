import { AlignmentType } from "docx";

export interface BannerContent {
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

export interface ProcessedElement {
  type: 'text' | 'paragraph' | 'image' | 'linebreak';
  content: string;
  src?: string;
  caption?: string;
  style?: {
    bold?: boolean;
    italics?: boolean;
    alignment?: typeof AlignmentType[keyof typeof AlignmentType];
  };
}