export interface GuidelineSection {
  title: string;
  items: string[];
}

export interface GuidelineTab {
  formatting: GuidelineSection[];
  structure: {
    article?: GuidelineSection[];
    banner?: GuidelineSection[];
    monography?: GuidelineSection[];
    thesis?: GuidelineSection[];
  };
  references: {
    examples: Array<{
      type: string;
      format: string;
      example: string;
    }>;
    tips: string[];
  };
}

export interface UniversityGuidelines {
  id: string;
  name: string;
  shortName: string;
  description: string;
  guidelines: GuidelineTab;
  pageLimits?: {
    article?: { min: number; max: number; description: string };
    banner?: { description: string };
    monography?: { min: number; max: number; description: string };
    thesis?: { min: number; max: number; description: string };
  };
}
