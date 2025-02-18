import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/gemini"; // Ensure this path is correct

const useBannerContent = (bannerId: string, isValidated: boolean) => {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const isFetching = useRef(false);
  const hasLoaded = useRef(false);

  const loadBannerContent = async () => {
    if (isFetching.current || hasLoaded.current) return; // guard against duplicate calls
    isFetching.current = true;
    try {
      const { data, error } = await supabase
        .from("work_in_progress")
        .select("content")
        .eq("id", bannerId)
        .eq("user_id", "your_user_id"); // replace "your_user_id" with the actual user id
      if (error) throw error;
      if (data.length === 0) throw new Error("No content found");
      setContent(data[0].content);
      hasLoaded.current = true; // mark as loaded to prevent repeated fetches
    } catch (error) {
      console.error("Error loading banner content:", error);
      setError(error);
    } finally {
      isFetching.current = false;
    }
  };

  useEffect(() => {
    if (isValidated && bannerId && !hasLoaded.current) {
      loadBannerContent();
    }
  }, [isValidated, bannerId]);
  
  return { content, error };
};

export default useBannerContent;
