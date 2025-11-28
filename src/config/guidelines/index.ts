import { ifmsGuidelines } from './ifms';
import { UniversityGuidelines } from './types';

// Mapa de todas as universidades/instituições disponíveis
export const availableGuidelines: Record<string, UniversityGuidelines> = {
  ifms: ifmsGuidelines,
  // Futuras universidades podem ser adicionadas aqui:
  // ufms: ufmsGuidelines,
  // unesp: unespGuidelines,
  // usp: uspGuidelines,
};

// Função helper para obter guidelines de uma universidade específica
export const getGuidelines = (universityId: string): UniversityGuidelines | null => {
  return availableGuidelines[universityId] || null;
};

// Lista de IDs de universidades disponíveis
export const getAvailableUniversityIds = (): string[] => {
  return Object.keys(availableGuidelines);
};

// Exporta tipos para uso em outros componentes
export * from './types';
