import { useState } from 'react';
import { Reference, ReferenceType } from '@/types/reference';
import { formatReferenceABNT, sortReferencesAlphabetically, normalizeAuthorName } from '@/services/referenceFormatter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Trash2, Edit2, BookOpen, FileText, Globe, GraduationCap, BookMarked, Gavel, HelpCircle, ArrowUpDown, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ReferencesManagerProps {
  references: Reference[];
  onReferencesChange: (references: Reference[]) => void;
  orphanCitations?: string[];
  uncitedReferences?: Reference[];
}

const referenceTypeLabels: Record<ReferenceType, { label: string; icon: React.ReactNode }> = {
  book: { label: 'Livro', icon: <BookOpen className="h-4 w-4" /> },
  article: { label: 'Artigo de Periódico', icon: <FileText className="h-4 w-4" /> },
  website: { label: 'Site/Documento Online', icon: <Globe className="h-4 w-4" /> },
  thesis: { label: 'Tese/Dissertação/TCC', icon: <GraduationCap className="h-4 w-4" /> },
  chapter: { label: 'Capítulo de Livro', icon: <BookMarked className="h-4 w-4" /> },
  legislation: { label: 'Legislação', icon: <Gavel className="h-4 w-4" /> },
  other: { label: 'Outro', icon: <HelpCircle className="h-4 w-4" /> },
};

const emptyReference: Omit<Reference, 'id' | 'formattedABNT'> = {
  type: 'book',
  authors: [''],
  title: '',
  year: '',
  publisher: '',
  location: '',
};

export default function ReferencesManager({
  references,
  onReferencesChange,
  orphanCitations = [],
  uncitedReferences = [],
}: ReferencesManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReference, setEditingReference] = useState<Reference | null>(null);
  const [formData, setFormData] = useState<Omit<Reference, 'id' | 'formattedABNT'>>(emptyReference);
  const [authorsText, setAuthorsText] = useState('');

  const handleOpenDialog = (reference?: Reference) => {
    if (reference) {
      setEditingReference(reference);
      setFormData({
        type: reference.type,
        authors: reference.authors,
        title: reference.title,
        year: reference.year,
        publisher: reference.publisher,
        location: reference.location,
        journal: reference.journal,
        volume: reference.volume,
        issue: reference.issue,
        pages: reference.pages,
        url: reference.url,
        accessDate: reference.accessDate,
        edition: reference.edition,
        organizer: reference.organizer,
        bookTitle: reference.bookTitle,
        institution: reference.institution,
        thesisType: reference.thesisType,
      });
      setAuthorsText(reference.authors.join('\n'));
    } else {
      setEditingReference(null);
      setFormData(emptyReference);
      setAuthorsText('');
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingReference(null);
    setFormData(emptyReference);
    setAuthorsText('');
  };

  const handleSaveReference = () => {
    // Valida campos obrigatórios
    if (!formData.title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, informe o título da obra.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.year.trim()) {
      toast({
        title: 'Ano obrigatório',
        description: 'Por favor, informe o ano de publicação.',
        variant: 'destructive',
      });
      return;
    }

    // Processa autores
    const authors = authorsText
      .split('\n')
      .map(a => a.trim())
      .filter(a => a.length > 0)
      .map(a => normalizeAuthorName(a));

    if (authors.length === 0) {
      toast({
        title: 'Autor(es) obrigatório(s)',
        description: 'Por favor, informe pelo menos um autor.',
        variant: 'destructive',
      });
      return;
    }

    const referenceData: Reference = {
      id: editingReference?.id || crypto.randomUUID(),
      ...formData,
      authors,
      formattedABNT: '',
    };

    // Gera formatação ABNT
    referenceData.formattedABNT = formatReferenceABNT(referenceData);

    let newReferences: Reference[];
    if (editingReference) {
      newReferences = references.map(r => 
        r.id === editingReference.id ? referenceData : r
      );
    } else {
      newReferences = [...references, referenceData];
    }

    // Ordena alfabeticamente
    onReferencesChange(sortReferencesAlphabetically(newReferences));

    toast({
      title: editingReference ? 'Referência atualizada' : 'Referência adicionada',
      description: 'A lista de referências foi atualizada.',
    });

    handleCloseDialog();
  };

  const handleDeleteReference = (id: string) => {
    const newReferences = references.filter(r => r.id !== id);
    onReferencesChange(newReferences);
    
    toast({
      title: 'Referência removida',
      description: 'A referência foi removida da lista.',
    });
  };

  const handleSortReferences = () => {
    onReferencesChange(sortReferencesAlphabetically(references));
    toast({
      title: 'Referências ordenadas',
      description: 'As referências foram organizadas em ordem alfabética (ABNT).',
    });
  };

  const renderFieldsByType = () => {
    switch (formData.type) {
      case 'book':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Cidade</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publisher">Editora</Label>
                <Input
                  id="publisher"
                  value={formData.publisher || ''}
                  onChange={e => setFormData({ ...formData, publisher: e.target.value })}
                  placeholder="Atlas"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edition">Edição (se não for a primeira)</Label>
              <Input
                id="edition"
                value={formData.edition || ''}
                onChange={e => setFormData({ ...formData, edition: e.target.value })}
                placeholder="2"
              />
            </div>
          </>
        );

      case 'article':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="journal">Nome do Periódico *</Label>
              <Input
                id="journal"
                value={formData.journal || ''}
                onChange={e => setFormData({ ...formData, journal: e.target.value })}
                placeholder="Revista Brasileira de Educação"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="volume">Volume</Label>
                <Input
                  id="volume"
                  value={formData.volume || ''}
                  onChange={e => setFormData({ ...formData, volume: e.target.value })}
                  placeholder="25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue">Número</Label>
                <Input
                  id="issue"
                  value={formData.issue || ''}
                  onChange={e => setFormData({ ...formData, issue: e.target.value })}
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pages">Páginas</Label>
                <Input
                  id="pages"
                  value={formData.pages || ''}
                  onChange={e => setFormData({ ...formData, pages: e.target.value })}
                  placeholder="15-30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Local de publicação</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Rio de Janeiro"
              />
            </div>
          </>
        );

      case 'website':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                value={formData.url || ''}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://www.exemplo.com.br/artigo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessDate">Data de Acesso</Label>
              <Input
                id="accessDate"
                value={formData.accessDate || ''}
                onChange={e => setFormData({ ...formData, accessDate: e.target.value })}
                placeholder="10 jan. 2024"
              />
            </div>
          </>
        );

      case 'thesis':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="thesisType">Tipo de Trabalho</Label>
              <Select
                value={formData.thesisType || 'TCC'}
                onValueChange={value => setFormData({ ...formData, thesisType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TCC">Trabalho de Conclusão de Curso</SelectItem>
                  <SelectItem value="Dissertação">Dissertação de Mestrado</SelectItem>
                  <SelectItem value="Tese">Tese de Doutorado</SelectItem>
                  <SelectItem value="Monografia">Monografia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Instituição *</Label>
              <Input
                id="institution"
                value={formData.institution || ''}
                onChange={e => setFormData({ ...formData, institution: e.target.value })}
                placeholder="Universidade Federal de Mato Grosso do Sul"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Cidade</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Campo Grande"
              />
            </div>
          </>
        );

      case 'chapter':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="bookTitle">Título do Livro *</Label>
              <Input
                id="bookTitle"
                value={formData.bookTitle || ''}
                onChange={e => setFormData({ ...formData, bookTitle: e.target.value })}
                placeholder="Título do livro que contém o capítulo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizer">Organizador(es) do Livro</Label>
              <Input
                id="organizer"
                value={formData.organizer || ''}
                onChange={e => setFormData({ ...formData, organizer: e.target.value })}
                placeholder="SILVA, João (Org.)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Cidade</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publisher">Editora</Label>
                <Input
                  id="publisher"
                  value={formData.publisher || ''}
                  onChange={e => setFormData({ ...formData, publisher: e.target.value })}
                  placeholder="Atlas"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pages">Páginas do Capítulo</Label>
              <Input
                id="pages"
                value={formData.pages || ''}
                onChange={e => setFormData({ ...formData, pages: e.target.value })}
                placeholder="50-75"
              />
            </div>
          </>
        );

      case 'legislation':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="location">Local/Jurisdição</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Brasília, DF"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL (se disponível online)</Label>
              <Input
                id="url"
                value={formData.url || ''}
                onChange={e => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://www.planalto.gov.br/..."
              />
            </div>
            {formData.url && (
              <div className="space-y-2">
                <Label htmlFor="accessDate">Data de Acesso</Label>
                <Input
                  id="accessDate"
                  value={formData.accessDate || ''}
                  onChange={e => setFormData({ ...formData, accessDate: e.target.value })}
                  placeholder="10 jan. 2024"
                />
              </div>
            )}
          </>
        );

      default:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publisher">Editora/Publicador</Label>
              <Input
                id="publisher"
                value={formData.publisher || ''}
                onChange={e => setFormData({ ...formData, publisher: e.target.value })}
                placeholder="Editora"
              />
            </div>
          </div>
        );
    }
  };

  // Gera preview da referência
  const previewReference = (): string => {
    const authors = authorsText
      .split('\n')
      .map(a => a.trim())
      .filter(a => a.length > 0)
      .map(a => normalizeAuthorName(a));

    if (authors.length === 0 || !formData.title || !formData.year) {
      return '';
    }

    const tempRef: Reference = {
      id: 'preview',
      ...formData,
      authors,
      formattedABNT: '',
    };

    return formatReferenceABNT(tempRef);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Gerenciador de Referências
            </CardTitle>
            <CardDescription>
              Adicione suas referências e elas serão formatadas automaticamente no padrão ABNT
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {references.length > 1 && (
              <Button variant="outline" size="sm" onClick={handleSortReferences}>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Ordenar A-Z
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Referência
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingReference ? 'Editar Referência' : 'Nova Referência'}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os campos abaixo. A referência será formatada automaticamente no padrão ABNT.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Referência</Label>
                    <Select
                      value={formData.type}
                      onValueChange={value => setFormData({ ...formData, type: value as ReferenceType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(referenceTypeLabels).map(([key, { label, icon }]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              {icon}
                              {label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="authors">
                      Autor(es) * <span className="text-muted-foreground text-xs">(um por linha)</span>
                    </Label>
                    <Textarea
                      id="authors"
                      value={authorsText}
                      onChange={e => setAuthorsText(e.target.value)}
                      placeholder="João da Silva&#10;Maria Santos&#10;ou&#10;SILVA, João&#10;SANTOS, Maria"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Digite no formato "Nome Sobrenome" ou "SOBRENOME, Nome". A conversão para ABNT é automática.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Título da obra"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Ano de Publicação *</Label>
                    <Input
                      id="year"
                      value={formData.year}
                      onChange={e => setFormData({ ...formData, year: e.target.value })}
                      placeholder="2024"
                      maxLength={4}
                    />
                  </div>

                  {renderFieldsByType()}

                  {/* Preview da referência formatada */}
                  {previewReference() && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <Label className="text-sm font-medium">Prévia ABNT:</Label>
                      <p 
                        className="mt-2 text-sm"
                        dangerouslySetInnerHTML={{ __html: previewReference() }}
                      />
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveReference}>
                    {editingReference ? 'Salvar Alterações' : 'Adicionar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alertas de validação */}
        {orphanCitations.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Citações sem referência</AlertTitle>
            <AlertDescription>
              As seguintes citações não possuem referência correspondente: {orphanCitations.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {uncitedReferences.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Referências não citadas</AlertTitle>
            <AlertDescription>
              {uncitedReferences.length} referência(s) não foram citadas no texto. 
              Segundo a ABNT, toda referência deve ser citada no trabalho.
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de referências */}
        {references.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma referência adicionada ainda.</p>
            <p className="text-sm">Clique em "Adicionar Referência" para começar.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <Accordion type="single" collapsible className="space-y-2">
              {references.map((ref, index) => {
                const isUncited = uncitedReferences.some(r => r.id === ref.id);
                const typeInfo = referenceTypeLabels[ref.type];
                
                return (
                  <AccordionItem 
                    key={ref.id} 
                    value={ref.id}
                    className={cn(
                      "border rounded-lg px-4",
                      isUncited && "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10"
                    )}
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className="text-muted-foreground text-sm w-6">{index + 1}.</span>
                        <Badge variant="outline" className="shrink-0">
                          {typeInfo.icon}
                          <span className="ml-1">{typeInfo.label}</span>
                        </Badge>
                        <span 
                          className="text-sm line-clamp-1"
                          dangerouslySetInnerHTML={{ __html: ref.formattedABNT }}
                        />
                        {isUncited && (
                          <Badge variant="secondary" className="shrink-0 bg-yellow-100 text-yellow-700">
                            Não citada
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-9 pb-2 space-y-3">
                        <div 
                          className="text-sm p-3 bg-muted rounded"
                          dangerouslySetInnerHTML={{ __html: ref.formattedABNT }}
                        />
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenDialog(ref)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteReference(ref.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
