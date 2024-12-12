import { supabase } from "@/integrations/supabase/client";

export const processLatex = async (latex: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('process-latex', {
      body: { latex }
    });

    if (error) throw error;
    return data.svg;
  } catch (error) {
    console.error('Error processing LaTeX:', error);
    throw error;
  }
}