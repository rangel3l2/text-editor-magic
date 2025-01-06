import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorkTypeTableRow } from "./WorkTypeTableRow";
import { useWorkTypeStatus } from "./useWorkTypeStatus";

interface WorkType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface WorkTypesTableProps {
  workTypes: WorkType[];
}

export const WorkTypesTable = ({ workTypes }: WorkTypesTableProps) => {
  const { updating, toggleWorkTypeStatus } = useWorkTypeStatus(workTypes);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {workTypes?.map((type) => (
          <WorkTypeTableRow
            key={type.id}
            type={type}
            onToggleStatus={toggleWorkTypeStatus}
            isUpdating={updating}
          />
        ))}
      </TableBody>
    </Table>
  );
};