import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminUserManagement from "../admin/AdminUserManagement";
import AcademicWorkTypeManagement from "../admin/AcademicWorkTypeManagement";

interface AdminSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdminSettingsDialog = ({ isOpen, onOpenChange }: AdminSettingsDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configurações do Sistema</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="work-types" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="work-types">Tipos de Trabalho</TabsTrigger>
            <TabsTrigger value="users">Gerenciar Administradores</TabsTrigger>
          </TabsList>
          <TabsContent value="work-types" className="mt-4">
            <AcademicWorkTypeManagement />
          </TabsContent>
          <TabsContent value="users" className="mt-4">
            <AdminUserManagement />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSettingsDialog;