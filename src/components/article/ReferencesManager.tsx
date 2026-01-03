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
import { Plus, Trash2, Edit2, BookOpen, FileText, Globe, GraduationCap, BookMarked, Gavel, HelpCircle, ArrowUpDown, AlertCircle, Check, Lightbulb } from 'lucide-react';
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
  /** Todo o conteúdo textual do artigo para validar citações */
  allTextContent?: string;
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
  allTextContent = '',
}: ReferencesManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReference, setEditingReference] = useState<Reference | null>(null);
  const [formData, setFormData] = useState<Omit<Reference, 'id' | 'formattedABNT'>>(emptyReference);
  const [authorsText, setAuthorsText] = useState('');
  const [citationError, setCitationError] = useState<string | null>(null);

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
    setCitationError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingReference(null);
    setFormData(emptyReference);
    setAuthorsText('');
    setCitationError(null);
  };

  // Limpa erro de citação quando o usuário altera autor ou ano
  const handleAuthorsTextChange = (value: string) => {
    setAuthorsText(value);
    if (citationError) setCitationError(null);
  };

  const handleYearChange = (value: string) => {
    setFormData({ ...formData, year: value });
    if (citationError) setCitationError(null);
  };

  // Verifica se o autor/ano está citado no texto
  const checkIfCitedInText = (authors: string[], year: string): boolean => {
    if (!allTextContent || allTextContent.trim().length === 0) {
      // Se não há conteúdo textual, permite adicionar (usuário pode estar começando)
      return true;
    }
    
    const textLower = allTextContent.toLowerCase();
    const textUpper = allTextContent.toUpperCase();
    
    // Extrai sobrenomes
    const surnames = authors.map(a => {
      const parts = a.split(',');
      return parts[0].trim();
    });
    
    // Verifica padrão parentético: (SOBRENOME, ANO)
    for (const surname of surnames) {
      const surnameUpper = surname.toUpperCase();
      const surnameLower = surname.toLowerCase();
      const surnameCapitalized = surname.charAt(0).toUpperCase() + surname.slice(1).toLowerCase();
      
      // Padrões de citação ABNT
      const patterns = [
        `(${surnameUpper}, ${year})`,
        `(${surnameUpper},${year})`,
        `(${surnameUpper} ${year})`,
        `${surnameCapitalized} (${year})`,
        `${surnameCapitalized}(${year})`,
        // Com et al.
        `(${surnameUpper} et al., ${year})`,
        `${surnameCapitalized} et al. (${year})`,
        // Com página
        new RegExp(`\\(${surnameUpper}[^)]*,?\\s*${year}[^)]*\\)`, 'i'),
      ];
      
      for (const pattern of patterns) {
        if (pattern instanceof RegExp) {
          if (pattern.test(allTextContent)) return true;
        } else {
          if (allTextContent.includes(pattern)) return true;
        }
      }
    }
    
    return false;
  };

  const handleSaveReference = () => {
    setCitationError(null);
    
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

    // ⚠️ VALIDAÇÃO PEDAGÓGICA: Verifica se a referência foi citada no texto
    // Só aplica para novas referências (não edições)
    if (!editingReference) {
      const isCited = checkIfCitedInText(authors, formData.year);
      
      if (!isCited) {
        const mainSurname = authors[0].split(',')[0].trim();
        setCitationError(
          `A referência "${mainSurname} (${formData.year})" ainda não foi citada em nenhuma seção do seu artigo. ` +
          `Primeiro, vá até uma seção textual (Introdução, Fundamentação Teórica, Metodologia, etc.) e cite este autor usando o formato ABNT. ` +
          `Depois, retorne aqui para adicionar a referência completa.`
        );
        return;
      }
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

  // Dicas educativas baseadas na Teoria do Andaime para cada tipo de referência
  const scaffoldingTips: Record<ReferenceType, { rule: string; structure: string; example: string }> = {
    book: {
      rule: 'Livros seguem: AUTOR. Título em negrito. Edição. Cidade: Editora, Ano.',
      structure: 'SOBRENOME, Nome. Título: subtítulo. X. ed. Cidade: Editora, XXXX.',
      example: 'SILVA, João. Metodologia científica. 2. ed. São Paulo: Atlas, 2020.',
    },
    article: {
      rule: 'Artigos de periódicos incluem nome da revista em negrito, volume e páginas.',
      structure: 'AUTOR. Título do artigo. Nome do Periódico, local, v. X, n. X, p. XX-XX, ano.',
      example: 'SANTOS, Maria. Educação inclusiva. Revista Brasileira de Educação, Brasília, v. 25, n. 2, p. 15-30, 2023.',
    },
    website: {
      rule: 'Sites precisam da URL completa e data de acesso entre parênteses.',
      structure: 'AUTOR. Título. Ano. Disponível em: URL. Acesso em: dia mês. ano.',
      example: 'BRASIL. Lei de Diretrizes e Bases. 1996. Disponível em: http://www.planalto.gov.br. Acesso em: 10 jan. 2024.',
    },
    thesis: {
      rule: 'Teses indicam o tipo de trabalho, instituição e cidade.',
      structure: 'AUTOR. Título. Ano. Tipo de trabalho – Instituição, Cidade, Ano.',
      example: 'OLIVEIRA, Ana. Aprendizagem significativa. 2022. Dissertação (Mestrado em Educação) – UFMS, Campo Grande, 2022.',
    },
    chapter: {
      rule: 'Capítulos usam "In:" para indicar que fazem parte de um livro maior.',
      structure: 'AUTOR. Título do capítulo. In: ORGANIZADOR. Título do livro. Cidade: Editora, ano. p. XX-XX.',
      example: 'FREIRE, Paulo. Pedagogia da esperança. In: GADOTTI, M. (Org.). Educação e poder. São Paulo: Cortez, 1989. p. 50-75.',
    },
    legislation: {
      rule: 'Legislações começam pela jurisdição e incluem dados de publicação oficial.',
      structure: 'JURISDIÇÃO. Tipo de legislação e número, de data. Descrição. Publicação.',
      example: 'BRASIL. Lei nº 9.394, de 20 de dezembro de 1996. Estabelece as diretrizes da educação nacional. Diário Oficial da União, Brasília, DF, 1996.',
    },
    other: {
      rule: 'Outros tipos devem seguir o padrão mais próximo e incluir todas as informações de identificação.',
      structure: 'AUTOR. Título. Informações complementares. Local: Editora/Instituição, ano.',
      example: 'INSTITUTO BRASILEIRO DE GEOGRAFIA E ESTATÍSTICA. Censo 2020. Rio de Janeiro: IBGE, 2021.',
    },
  };

  const currentTip = scaffoldingTips[formData.type];

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
              Aprenda a formatar referências ABNT enquanto adiciona suas fontes
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
                    Preencha os campos e aprenda a estrutura ABNT. A formatação é automática!
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

                  {/* Dica educativa do andaime para o tipo selecionado */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        📚 Aprenda: {referenceTypeLabels[formData.type].label}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {currentTip.rule}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400">🧠 Estrutura para memorizar:</p>
                      <p className="text-xs font-mono bg-white dark:bg-blue-950 p-2 rounded text-blue-800 dark:text-blue-200">
                        {currentTip.structure}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-blue-600 dark:text-blue-400">✅ Exemplo prático:</p>
                      <p className="text-xs italic bg-white dark:bg-blue-950 p-2 rounded text-blue-800 dark:text-blue-200">
                        {currentTip.example}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="authors">
                      Autor(es) * <span className="text-muted-foreground text-xs">(um por linha)</span>
                    </Label>
                    <Textarea
                      id="authors"
                      value={authorsText}
                      onChange={e => handleAuthorsTextChange(e.target.value)}
                      placeholder="João da Silva&#10;Maria Santos&#10;ou&#10;SILVA, João&#10;SANTOS, Maria"
                      rows={3}
                    />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>💡 <span className="font-medium">Dica:</span> Na ABNT, o sobrenome vem primeiro, em MAIÚSCULO.</p>
                      <p>Exemplo: "João da Silva" → <span className="font-mono bg-muted px-1 rounded">SILVA, João da</span></p>
                      <p className="text-green-600 dark:text-green-400">✓ Não se preocupe, convertemos automaticamente para você!</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Título da obra"
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 <span className="font-medium">Dica:</span> Na ABNT, títulos de livros ficam em <strong>negrito</strong>. Títulos de artigos não.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">Ano de Publicação *</Label>
                    <Input
                      id="year"
                      value={formData.year}
                      onChange={e => handleYearChange(e.target.value)}
                      placeholder="2024"
                      maxLength={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Se não souber o ano, use <span className="font-mono bg-muted px-1 rounded">[s.d.]</span> (sem data)
                    </p>
                  </div>

                  {renderFieldsByType()}

                  {/* Preview da referência formatada com explicação */}
                  {previewReference() && (
                    <div className="mt-4 space-y-3">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <Label className="text-sm font-medium text-green-800 dark:text-green-200">
                            Sua referência formatada (ABNT):
                          </Label>
                        </div>
                        <p 
                          className="text-sm p-3 bg-white dark:bg-green-950 rounded"
                          dangerouslySetInnerHTML={{ __html: previewReference() }}
                        />
                      </div>
                      
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <p className="font-medium text-yellow-800 dark:text-yellow-200">
                              🎓 Para fazer sozinho(a) da próxima vez:
                            </p>
                            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                              Compare a estrutura acima com o que você preencheu. 
                              Observe como cada campo aparece na referência final: 
                              autor em maiúsculo, título em destaque, elementos separados por pontos.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alerta de erro: citação não encontrada */}
                  {citationError && (
                    <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>⚠️ Citação não encontrada no texto</AlertTitle>
                      <AlertDescription className="space-y-3">
                        <p>{citationError}</p>
                        <Separator />
                        <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded border border-red-200 dark:border-red-800">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                            📚 Como citar no texto (ABNT):
                          </p>
                          <div className="space-y-2 text-xs">
                            <div className="p-2 bg-white dark:bg-red-900/30 rounded">
                              <p className="font-medium text-red-700 dark:text-red-300">Citação Indireta (paráfrase):</p>
                              <p className="font-mono mt-1">"Segundo Silva (2023), a educação..."</p>
                              <p className="font-mono mt-1">"A educação é fundamental (SILVA, 2023)."</p>
                            </div>
                            <div className="p-2 bg-white dark:bg-red-900/30 rounded">
                              <p className="font-medium text-red-700 dark:text-red-300">Citação Direta Curta (até 3 linhas):</p>
                              <p className="font-mono mt-1">"Educação é a base" (SILVA, 2023, p. 45).</p>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-red-600 dark:text-red-400 italic">
                            Vá até uma seção textual, cite o autor, e depois retorne para adicionar a referência.
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveReference} disabled={!!citationError}>
                    {editingReference ? 'Salvar Alterações' : 'Adicionar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dica geral sobre referências */}
        {references.length === 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <GraduationCap className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm space-y-2">
                <p className="font-medium text-blue-800 dark:text-blue-200">📚 Antes de começar, entenda as regras ABNT:</p>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Toda citação no texto DEVE ter uma referência correspondente</li>
                  <li>Toda referência DEVE ser citada pelo menos uma vez no trabalho</li>
                  <li>Referências são organizadas em ordem alfabética pelo sobrenome</li>
                  <li>Diferentes tipos de fonte (livro, artigo, site) têm formatos diferentes</li>
                </ul>
                <p className="text-blue-600 dark:text-blue-400 italic">
                  Esta ferramenta vai te ensinar enquanto você adiciona suas referências!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Alertas de validação com orientação educativa */}
        {orphanCitations.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>🔍 Citações sem referência encontradas</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>As seguintes citações não possuem referência correspondente: <strong>{orphanCitations.join(', ')}</strong></p>
              <p className="text-sm">
                💡 <span className="font-medium">Lembre-se:</span> Na ABNT, você só pode citar autores que estão na lista de referências. 
                Adicione a referência completa para cada citação.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {uncitedReferences.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>📖 Referências não citadas no texto</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{uncitedReferences.length} referência(s) ainda não foram citadas no texto.</p>
              <p className="text-sm">
                💡 <span className="font-medium">Regra ABNT:</span> Toda referência deve aparecer citada pelo menos uma vez no seu trabalho. 
                Use o botão "Inserir Citação" nas seções de texto para citar essas fontes.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de referências */}
        {references.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma referência adicionada ainda.</p>
            <p className="text-sm">Clique em "Adicionar Referência" para começar a aprender!</p>
          </div>
        ) : (
          <>
            {/* Estatísticas e dica */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="secondary">{references.length} referência(s)</Badge>
                {uncitedReferences.length > 0 && (
                  <span className="text-yellow-600">
                    {uncitedReferences.length} não citada(s)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Referências ordenadas por sobrenome (A→Z), como exige a ABNT
              </p>
            </div>

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
                          
                          {/* Dica educativa sobre como citar esta referência */}
                          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                            <p className="font-medium text-green-800 dark:text-green-200 mb-1">
                              🎓 Para citar esta fonte no texto:
                            </p>
                            <p className="text-green-700 dark:text-green-300 font-mono">
                              Citação indireta: ({ref.authors[0]?.split(',')[0]?.toUpperCase()}, {ref.year})
                            </p>
                            <p className="text-green-700 dark:text-green-300 font-mono">
                              Citação narrativa: {ref.authors[0]?.split(',')[0]} ({ref.year})
                            </p>
                          </div>
                          
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
