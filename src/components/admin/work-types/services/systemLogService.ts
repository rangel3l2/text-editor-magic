import { supabase } from "@/integrations/supabase/client";

interface LogWorkTypeUpdateParams {
  workTypeId: string;
  workTypeName: string | undefined;
  oldValue: boolean;
  newValue: boolean;
  userId: string;
  userEmail: string;
}

export const logWorkTypeUpdate = async ({
  workTypeId,
  workTypeName,
  oldValue,
  newValue,
  userId,
  userEmail,
}: LogWorkTypeUpdateParams) => {
  console.log("Creating system log for work type:", workTypeName);

  const { data: logData, error: logError } = await supabase
    .from("system_logs")
    .insert([
      {
        action: "UPDATE",
        entity_type: "academic_work_types",
        entity_id: workTypeId,
        details: {
          field: "is_active",
          old_value: oldValue,
          new_value: newValue,
          work_type_name: workTypeName,
          modified_by: userEmail,
        },
        performed_by: userId,
      },
    ])
    .select()
    .single();

  if (logError) {
    console.error("Error creating system log:", logError);
    throw logError;
  }

  console.log("System log created successfully:", logData);
  return logData;
};