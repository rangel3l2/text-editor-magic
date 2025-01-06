import { supabase } from "@/integrations/supabase/client";

export const updateWorkTypeStatus = async (id: string, currentStatus: boolean) => {
  const { data: workType, error } = await supabase
    .from("academic_work_types")
    .update({ is_active: !currentStatus })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating work type:", error);
    throw error;
  }

  console.log("Work type updated:", workType);
  return workType;
};