export const validateTitle = async (titleHTML: string) => {
  // Replace with your actual validation logic or API call if needed.
  return {
    isValid: true,
    wordCount: titleHTML.replace(/<\/?[^>]+(>|$)/g, "").split(/\s+/).filter(Boolean).length,
    spellingErrors: [],
    coherenceIssues: [],
    suggestions: [],
  };
};
