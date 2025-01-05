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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SystemLogsViewer = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["systemLogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_logs")
        .select(`
          *,
          performed_by_user:profiles(email)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching logs:", error);
        throw error;
      }

      return data;
    },
  });

  if (isLoading) {
    return <div>Carregando logs do sistema...</div>;
  }

  return (
    <div className="space-y-4">
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
    </div>
  );
};

export default SystemLogsViewer;