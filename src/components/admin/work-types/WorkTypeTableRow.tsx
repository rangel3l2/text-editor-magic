import { TableCell, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

interface WorkType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface WorkTypeTableRowProps {
  type: WorkType;
  onToggleStatus: (id: string, currentStatus: boolean) => Promise<void>;
  isUpdating: boolean;
}

export const WorkTypeTableRow = ({
  type,
  onToggleStatus,
  isUpdating,
}: WorkTypeTableRowProps) => {
  return (
    <TableRow>
      <TableCell>{type.name}</TableCell>
      <TableCell>{type.description}</TableCell>
      <TableCell>{type.is_active ? "Ativo" : "Inativo"}</TableCell>
      <TableCell>
        <Switch
          checked={type.is_active}
          onCheckedChange={() => onToggleStatus(type.id, type.is_active || false)}
          disabled={isUpdating}
        />
      </TableCell>
    </TableRow>
  );
};