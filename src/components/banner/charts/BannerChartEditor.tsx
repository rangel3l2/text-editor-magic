import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, PieChart, LineChart, Plus, Trash2, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ChartData {
  label: string;
  value: number;
}

interface BannerChart {
  id: string;
  type: 'bar' | 'pie' | 'line' | 'imported';
  title: string;
  data: ChartData[];
  imageUrl?: string;
  columnPosition: number | null;
}

interface BannerChartEditorProps {
  charts: BannerChart[];
  onChartsChange: (charts: BannerChart[]) => void;
}

const BannerChartEditor = ({ charts, onChartsChange }: BannerChartEditorProps) => {
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');

  const createNewChart = (type: 'bar' | 'pie' | 'line' | 'imported') => {
    const newChart: BannerChart = {
      id: `chart-${Date.now()}`,
      type,
      title: `Gráfico ${charts.length + 1} - Título do gráfico`,
      data: type !== 'imported' ? [
        { label: 'Item 1', value: 10 },
        { label: 'Item 2', value: 20 },
        { label: 'Item 3', value: 15 }
      ] : [],
      columnPosition: null
    };

    onChartsChange([...charts, newChart]);
  };

  const updateChart = (chartId: string, updates: Partial<BannerChart>) => {
    onChartsChange(
      charts.map(chart => 
        chart.id === chartId ? { ...chart, ...updates } : chart
      )
    );
  };

  const updateDataPoint = (chartId: string, index: number, field: 'label' | 'value', value: string | number) => {
    const chart = charts.find(c => c.id === chartId);
    if (!chart) return;

    const newData = [...chart.data];
    newData[index] = {
      ...newData[index],
      [field]: field === 'value' ? parseFloat(value as string) || 0 : value
    };

    updateChart(chartId, { data: newData });
  };

  const addDataPoint = (chartId: string) => {
    const chart = charts.find(c => c.id === chartId);
    if (!chart) return;

    updateChart(chartId, {
      data: [...chart.data, { label: `Item ${chart.data.length + 1}`, value: 0 }]
    });
  };

  const removeDataPoint = (chartId: string, index: number) => {
    const chart = charts.find(c => c.id === chartId);
    if (!chart || chart.data.length <= 2) return;

    updateChart(chartId, {
      data: chart.data.filter((_, idx) => idx !== index)
    });
  };

  const deleteChart = (chartId: string) => {
    if (confirm('Deseja realmente excluir este gráfico?')) {
      onChartsChange(charts.filter(c => c.id !== chartId));
    }
  };

  const handleImportImage = async (chartId: string, file: File) => {
    // Simulate upload - in real implementation, upload to storage
    const reader = new FileReader();
    reader.onload = (e) => {
      updateChart(chartId, {
        imageUrl: e.target?.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar': return <BarChart3 className="w-4 h-4" />;
      case 'pie': return <PieChart className="w-4 h-4" />;
      case 'line': return <LineChart className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Gráficos</CardTitle>
        <CardDescription>
          Importe gráficos existentes ou crie novos diretamente no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="import">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Importar Gráfico</TabsTrigger>
            <TabsTrigger value="create">Criar Gráfico</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Importe gráficos nos formatos PNG, JPG ou SVG
            </div>
            <Button 
              onClick={() => createNewChart('imported')}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar Gráfico
            </Button>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => createNewChart('bar')}
                className="flex flex-col h-20"
              >
                <BarChart3 className="w-6 h-6 mb-1" />
                <span className="text-xs">Barras</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => createNewChart('pie')}
                className="flex flex-col h-20"
              >
                <PieChart className="w-6 h-6 mb-1" />
                <span className="text-xs">Pizza</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => createNewChart('line')}
                className="flex flex-col h-20"
              >
                <LineChart className="w-6 h-6 mb-1" />
                <span className="text-xs">Linha</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Chart List */}
        {charts.map((chart, idx) => (
          <Card key={chart.id} className="border-2">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getChartIcon(chart.type)}
                    <Label>Título do Gráfico</Label>
                  </div>
                  <Input
                    value={chart.title}
                    onChange={(e) => updateChart(chart.id, { title: e.target.value })}
                    className="font-semibold"
                    placeholder="Gráfico X - Título"
                  />
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteChart(chart.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Label className="text-sm">Coluna:</Label>
                <Select
                  value={chart.columnPosition?.toString() || 'auto'}
                  onValueChange={(value) => 
                    updateChart(chart.id, { 
                      columnPosition: value === 'auto' ? null : parseInt(value) 
                    })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático</SelectItem>
                    <SelectItem value="1">Coluna 1</SelectItem>
                    <SelectItem value="2">Coluna 2</SelectItem>
                    <SelectItem value="3">Coluna 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              {chart.type === 'imported' ? (
                <div className="space-y-4">
                  {chart.imageUrl ? (
                    <div className="relative">
                      <img 
                        src={chart.imageUrl} 
                        alt={chart.title}
                        className="w-full rounded border"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleImportImage(chart.id, file);
                          };
                          input.click();
                        }}
                      >
                        Trocar
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <Button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleImportImage(chart.id, file);
                          };
                          input.click();
                        }}
                      >
                        Selecionar Imagem
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {chart.data.map((point, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={point.label}
                          onChange={(e) => updateDataPoint(chart.id, idx, 'label', e.target.value)}
                          placeholder="Rótulo"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          value={point.value}
                          onChange={(e) => updateDataPoint(chart.id, idx, 'value', e.target.value)}
                          placeholder="Valor"
                          className="w-24"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDataPoint(chart.id, idx)}
                          disabled={chart.data.length <= 2}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addDataPoint(chart.id)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Ponto
                  </Button>

                  <div className="text-xs text-muted-foreground text-center pt-2">
                    Preview básico • Será renderizado com estilo científico no banner
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {charts.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum gráfico adicionado</p>
            <p className="text-sm mt-2">Importe ou crie gráficos para visualizar dados</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BannerChartEditor;
