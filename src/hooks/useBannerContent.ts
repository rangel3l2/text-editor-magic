
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const useBannerContent = (bannerId: string, isValidated: boolean) => {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const isFetching = useRef(false);
  const hasLoaded = useRef(false);
  const fetchAttempted = useRef(false);

  const loadBannerContent = async () => {
    if (isFetching.current || hasLoaded.current || fetchAttempted.current) return;
    isFetching.current = true;
    try {
      const { data, error } = await supabase
        .from("work_in_progress")
        .select("content")
        .eq("id", bannerId)
        .eq("user_id", "your_user_id");
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("No content found");
      setContent(data[0].content);
      setError(null);
      hasLoaded.current = true;
    } catch (err) {
      console.error("Error loading banner content:", err);
      setError(err);
      fetchAttempted.current = true;
    } finally {
      isFetching.current = false;
    }
  };

  useEffect(() => {
    if (isValidated && bannerId && !hasLoaded.current && !fetchAttempted.current) {
      loadBannerContent();
    }
  }, [isValidated, bannerId]);
  
  return { content, error };
};

export default useBannerContent;
