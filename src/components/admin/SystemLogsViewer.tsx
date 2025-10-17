import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SystemLogsViewer = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["systemLogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching logs:", error);
        throw error;
      }

      // Fetch profile emails separately
      const logsWithEmails = await Promise.all(
        (data || []).map(async (log) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", log.performed_by)
            .maybeSingle();
          
          return {
            ...log,
            performed_by_user: profile ? { email: profile.email } : { email: "Unknown" }
          };
        })
      );
      
      return logsWithEmails;
    },
  });

  if (isLoading) {
    return <div>Carregando logs do sistema...</div>;
  }

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[60vh] w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead>Realizado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.entity_type}</TableCell>
                <TableCell>
                  {log.details ? JSON.stringify(log.details, null, 2) : "N/A"}
                </TableCell>
                <TableCell>
                  {log.performed_by_user?.email || "Usuário não encontrado"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default SystemLogsViewer;