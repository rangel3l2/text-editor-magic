import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table as TableIcon, Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface TableCell {
  content: string;
  align: 'left' | 'center' | 'right';
}

interface BannerTable {
  id: string;
  title: string;
  rows: TableCell[][];
  zebraStripes: boolean;
  columnPosition: number | null;
}

interface BannerTableEditorProps {
  tables: BannerTable[];
  onTablesChange: (tables: BannerTable[]) => void;
}

const BannerTableEditor = ({ tables, onTablesChange }: BannerTableEditorProps) => {
  const [editingTable, setEditingTable] = useState<string | null>(null);

  const createNewTable = () => {
    const newTable: BannerTable = {
      id: `table-${Date.now()}`,
      title: `Tabela ${tables.length + 1} - Título da tabela`,
      rows: Array(3).fill(null).map(() => 
        Array(3).fill(null).map(() => ({ content: '', align: 'center' as const }))
      ),
      zebraStripes: true,
      columnPosition: null
    };

    onTablesChange([...tables, newTable]);
    setEditingTable(newTable.id);
  };

  const updateTable = (tableId: string, updates: Partial<BannerTable>) => {
    onTablesChange(
      tables.map(table => 
        table.id === tableId ? { ...table, ...updates } : table
      )
    );
  };

  const updateCell = (tableId: string, rowIndex: number, colIndex: number, content: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const newRows = [...table.rows];
    newRows[rowIndex][colIndex] = {
      ...newRows[rowIndex][colIndex],
      content
    };

    updateTable(tableId, { rows: newRows });
  };

  const addRow = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const colCount = table.rows[0]?.length || 3;
    const newRow = Array(colCount).fill(null).map(() => ({ content: '', align: 'center' as const }));
    
    updateTable(tableId, {
      rows: [...table.rows, newRow]
    });
  };

  const addColumn = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const newRows = table.rows.map(row => [
      ...row,
      { content: '', align: 'center' as const }
    ]);

    updateTable(tableId, { rows: newRows });
  };

  const deleteRow = (tableId: string, rowIndex: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || table.rows.length <= 1) return;

    const newRows = table.rows.filter((_, idx) => idx !== rowIndex);
    updateTable(tableId, { rows: newRows });
  };

  const deleteColumn = (tableId: string, colIndex: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || table.rows[0].length <= 1) return;

    const newRows = table.rows.map(row => 
      row.filter((_, idx) => idx !== colIndex)
    );

    updateTable(tableId, { rows: newRows });
  };

  const deleteTable = (tableId: string) => {
    if (confirm('Deseja realmente excluir esta tabela?')) {
      onTablesChange(tables.filter(t => t.id !== tableId));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Tabelas</CardTitle>
        <CardDescription>
          Adicione e edite tabelas para apresentar dados de forma organizada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button onClick={createNewTable} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Nova Tabela
        </Button>

        {tables.map((table, tableIdx) => (
          <Card key={table.id} className="border-2">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Título da Tabela</Label>
                  <Input
                    value={table.title}
                    onChange={(e) => updateTable(table.id, { title: e.target.value })}
                    className="font-semibold"
                    placeholder="Tabela X - Título"
                  />
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteTable(table.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={table.zebraStripes}
                    onCheckedChange={(checked) => updateTable(table.id, { zebraStripes: checked })}
                  />
                  <Label className="text-sm">Listras Zebradas</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-sm">Coluna:</Label>
                  <Select
                    value={table.columnPosition?.toString() || 'auto'}
                    onValueChange={(value) => 
                      updateTable(table.id, { 
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
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    {table.rows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={table.zebraStripes && rowIdx % 2 === 1 ? 'bg-muted/50' : ''}
                      >
                        {row.map((cell, colIdx) => (
                          <td
                            key={colIdx}
                            className="border border-border p-1"
                          >
                            <Input
                              value={cell.content}
                              onChange={(e) => updateCell(table.id, rowIdx, colIdx, e.target.value)}
                              className="border-0 text-center text-sm h-8"
                              placeholder="..."
                            />
                          </td>
                        ))}
                        <td className="p-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteRow(table.id, rowIdx)}
                            disabled={table.rows.length <= 1}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addRow(table.id)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Linha
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addColumn(table.id)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Coluna
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {tables.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <TableIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma tabela adicionada</p>
            <p className="text-sm mt-2">Clique em "Adicionar Nova Tabela" para começar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BannerTableEditor;
