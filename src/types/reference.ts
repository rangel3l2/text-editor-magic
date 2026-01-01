export type ReferenceType = 'book' | 'article' | 'website' | 'thesis' | 'chapter' | 'legislation' | 'other';

export interface Reference {
  id: string;
  type: ReferenceType;
  authors: string[];              // ["SILVA, João", "SANTOS, Maria"]
  title: string;                  // Título da obra
  year: string;                   // "2023"
  publisher?: string;             // Editora
  location?: string;              // Cidade
  journal?: string;               // Nome da revista (para artigos)
  volume?: string;
  issue?: string;
  pages?: string;
  url?: string;
  accessDate?: string;            // Data de acesso (para sites)
  edition?: string;               // Edição
  organizer?: string;             // Organizador (para capítulos)
  bookTitle?: string;             // Título do livro (para capítulos)
  institution?: string;           // Instituição (para teses)
  thesisType?: string;            // Tipo de tese (Dissertação, Tese, TCC)
  formattedABNT: string;          // Referência formatada automaticamente
}

export type CitationType = 'indirect' | 'direct-short' | 'direct-long';

export type CitationFormat = 'parenthetical' | 'narrative'; // (SILVA, 2023) vs Silva (2023)

export interface Citation {
  referenceId: string;
  type: CitationType;
  format: CitationFormat;
  page?: string;                  // Página para citações diretas
  text?: string;                  // Texto da citação direta
}

// Helper type for structured references in ArticleContent
export interface StructuredReferences {
  references: Reference[];
}
