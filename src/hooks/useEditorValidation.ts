import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/gemini";

const useEditorValidation = (content) => {
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);
  const isValidating = useRef(false);
  const lastValidatedContent = useRef(null);

  const validateContent = async (content) => {
    if (isValidating.current || content === lastValidatedContent.current) return;
    isValidating.current = true;
    lastValidatedContent.current = content;
    try {
      const { data, error } = await supabase.functions.invoke("validate-content", {
        body: JSON.stringify({ content }),
      });
      if (error) throw error;
      setValidationResult(data);
    } catch (error) {
      console.error("Error validating content:", error);
      setError(error);
    } finally {
      isValidating.current = false;
    }
  };

  useEffect(() => {
    if (content) {
      validateContent(content);
    }
  }, [content]);

  return { validationResult, error };
};

export default useEditorValidation;
