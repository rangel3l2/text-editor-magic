import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Columns2, Columns3 } from 'lucide-react';

interface ColumnLayoutSelectorProps {
  columnLayout: '2' | '3';
  handleChange: (field: string, value: string) => void;
}

const ColumnLayoutSelector = ({ columnLayout, handleChange }: ColumnLayoutSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Layout de Colunas</CardTitle>
        <CardDescription>
          Escolha o número de colunas para organizar o conteúdo do banner
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Button
            variant={columnLayout === '2' ? 'default' : 'outline'}
            className="flex-1 h-20 flex flex-col gap-2"
            onClick={() => handleChange('columnLayout', '2')}
          >
            <Columns2 className="w-8 h-8" />
            <span className="text-sm font-medium">2 Colunas</span>
            <span className="text-xs text-muted-foreground">Padrão</span>
          </Button>
          
          <Button
            variant={columnLayout === '3' ? 'default' : 'outline'}
            className="flex-1 h-20 flex flex-col gap-2"
            onClick={() => handleChange('columnLayout', '3')}
          >
            <Columns3 className="w-8 h-8" />
            <span className="text-sm font-medium">3 Colunas</span>
            <span className="text-xs text-muted-foreground">Mais compacto</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ColumnLayoutSelector;
