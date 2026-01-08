import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Quote, BookOpen, Check, Copy, Lightbulb, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface DirectCitationButtonProps {
  onInsertCitation: (formattedHtml: string) => void;
  disabled?: boolean;
}

const DirectCitationButton = ({ onInsertCitation, disabled }: DirectCitationButtonProps) => {
  const [open, setOpen] = useState(false);
  const [citationText, setCitationText] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [page, setPage] = useState("");
  const [copied, setCopied] = useState(false);


  const lineCount = citationText.split("\n").filter((line) => line.trim().length > 0).length;
  const wordCount = citationText.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const isLongCitation = lineCount > 3 || wordCount > 40;

  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const generateFormattedHtml = () => {
    if (!citationText.trim() || !author.trim() || !year.trim()) return "";

    const authorFormatted = author.toUpperCase().trim();
    const yearFormatted = year.trim();
    const pageFormatted = page.trim();

    const pageRef = pageFormatted ? `, p. ${escapeHtml(pageFormatted)}` : "";
    const reference = `(${escapeHtml(authorFormatted)}, ${escapeHtml(yearFormatted)}${pageRef})`;

    const safeCitationText = escapeHtml(citationText.trim()).replace(/\n+/g, "<br/>");

    // Citação longa: usa div.citacao-longa (4cm recuo, fonte 10pt, espaço simples)
    if (isLongCitation) {
      return `<div class="citacao-longa">${safeCitationText} ${reference}</div>`;
    }

    // Citação curta: inline (o LaTeX tratará como texto normal)
    return `<span>“${safeCitationText}” ${reference}</span>`;
  };


  const handleInsert = () => {
    const html = generateFormattedHtml();
    if (!html) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o texto da citação, autor e ano.",
        variant: "destructive"
      });
      return;
    }

    onInsertCitation(html);
    
    toast({
      title: isLongCitation ? "✅ Citação longa inserida!" : "✅ Citação curta inserida!",
      description: isLongCitation 
        ? "A citação será formatada com recuo 4cm, fonte 10pt e espaço simples no PDF."
        : "A citação foi inserida com aspas no texto.",
    });

    // Limpar campos
    setCitationText("");
    setAuthor("");
    setYear("");
    setPage("");
    setOpen(false);
  };

  const handleCopy = async () => {
    const html = generateFormattedHtml();
    if (html) {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const previewHtml = generateFormattedHtml();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled}
          className="gap-2 text-xs"
        >
          <Quote className="h-3.5 w-3.5" />
          Inserir Citação Direta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Inserir Citação Direta (ABNT/IFMS)
          </DialogTitle>
          <DialogDescription>
            Cole o texto da citação e preencha a referência. O sistema detecta automaticamente se é curta ou longa.
          </DialogDescription>
        </DialogHeader>

        {/* Dicas Educativas - Teoria do Andaime */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="tips">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center gap-2 text-primary">
                <Lightbulb className="h-4 w-4" />
                Aprenda: Quando usar citação direta?
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                <p className="font-medium text-foreground">📚 Citação Direta Curta (até 3 linhas):</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Fica <strong>dentro do parágrafo</strong> com aspas duplas</li>
                  <li>Mantém fonte normal (12pt) e espaçamento 1,5</li>
                  <li>Exemplo: Segundo o autor, "a educação é fundamental" (SILVA, 2020, p. 45).</li>
                </ul>
              </div>
              
              <div className="bg-primary/5 p-3 rounded-lg space-y-2 border border-primary/20">
                <p className="font-medium text-foreground">📐 Citação Direta Longa (+3 linhas):</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Recuo de 4cm</strong> da margem esquerda</li>
                  <li>Fonte tamanho <strong>10pt</strong> (menor que o texto)</li>
                  <li>Espaçamento <strong>simples</strong> entre linhas</li>
                  <li><strong>SEM aspas</strong> (o recuo já indica citação)</li>
                  <li>SEM recuo de primeira linha</li>
                </ul>
              </div>

              <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-xs">
                  <strong>Dica:</strong> Se sua citação tiver mais de 40 palavras ou ocupar mais de 3 linhas, 
                  o sistema aplicará automaticamente a formatação de citação longa.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Formulário */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="citationText">Texto da Citação *</Label>
            <Textarea
              id="citationText"
              placeholder="Cole aqui o texto exato que deseja citar..."
              value={citationText}
              onChange={(e) => setCitationText(e.target.value)}
              rows={5}
              className="resize-y"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{wordCount} palavras • {lineCount} linhas</span>
              <span className={isLongCitation ? "text-primary font-medium" : ""}>
                {isLongCitation ? "📐 Citação LONGA" : "📝 Citação curta"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="author">Autor (sobrenome) *</Label>
              <Input
                id="author"
                placeholder="SILVA"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Ano *</Label>
              <Input
                id="year"
                placeholder="2020"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page">Página</Label>
              <Input
                id="page"
                placeholder="45"
                value={page}
                onChange={(e) => setPage(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {previewHtml && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">Prévia no texto:</Label>
            <div className={`border rounded-lg p-4 bg-muted/30 ${isLongCitation ? 'citacao-longa-preview' : ''}`}>
              {isLongCitation ? (
                <div 
                  className="text-[10pt] leading-tight pl-8 border-l-2 border-primary/30"
                  style={{ fontFamily: 'Times New Roman, serif' }}
                >
                  {citationText.trim()} ({author.toUpperCase()}, {year}{page ? `, p. ${page}` : ""})
                </div>
              ) : (
                <p className="text-sm" style={{ fontFamily: 'Times New Roman, serif' }}>
                  "{citationText.trim()}" ({author.toUpperCase()}, {year}{page ? `, p. ${page}` : ""})
                </p>
              )}
            </div>
            {isLongCitation && (
              <p className="text-xs text-muted-foreground">
                ℹ️ No PDF final: recuo 4cm, fonte 10pt, espaço simples, sem aspas.
              </p>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleCopy} disabled={!previewHtml}>
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? "Copiado!" : "Copiar"}
          </Button>
          <Button onClick={handleInsert} disabled={!previewHtml}>
            <Quote className="h-4 w-4 mr-2" />
            Inserir Citação
          </Button>
        </div>

        {/* Dica de transferência */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="transfer">
            <AccordionTrigger className="text-xs text-muted-foreground">
              🧠 Como fazer sozinho(a) no Word?
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground space-y-2">
              <p><strong>Para citação longa no Word:</strong></p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Selecione o texto da citação</li>
                <li>Vá em Parágrafo → Recuo Esquerdo: 4cm</li>
                <li>Mude a fonte para 10pt</li>
                <li>Altere o espaçamento para Simples</li>
                <li>Remova as aspas (se houver)</li>
                <li>Adicione (SOBRENOME, ano, p. XX) no final</li>
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  );
};

export default DirectCitationButton;
