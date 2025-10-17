import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUserManagement from "../admin/AdminUserManagement";
import AcademicWorkTypeManagement from "../admin/AcademicWorkTypeManagement";
import SystemLogsViewer from "../admin/SystemLogsViewer";
import { useQueryClient } from "@tanstack/react-query";

interface AdminSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdminSettingsDialog = ({ isOpen, onOpenChange }: AdminSettingsDialogProps) => {
  const queryClient = useQueryClient();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Invalidate the academicWorkTypes query when the dialog closes
      queryClient.invalidateQueries({ queryKey: ["academicWorkTypes"] });
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Configurações do Sistema</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="work-types" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="work-types">Tipos de Trabalho</TabsTrigger>
            <TabsTrigger value="users">Gerenciar Administradores</TabsTrigger>
            <TabsTrigger value="logs">Logs do Sistema</TabsTrigger>
          </TabsList>
          <TabsContent value="work-types" className="mt-4">
            <AcademicWorkTypeManagement />
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            <AdminUserManagement />
          </TabsContent>
          <TabsContent value="logs" className="mt-4">
            <SystemLogsViewer />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSettingsDialog;