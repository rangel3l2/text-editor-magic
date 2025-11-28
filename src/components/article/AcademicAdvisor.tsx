import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Loader2, Info, BookOpen, GraduationCap, ChevronDown, ChevronUp, Minimize2, Maximize2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useAISettings } from '@/hooks/useAISettings';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AcademicAdvisorProps {
  currentSection?: string;
  articleContent?: any;
  hasContent?: boolean;
}

const AcademicAdvisor = ({ currentSection, articleContent, hasContent = false }: AcademicAdvisorProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMethodology, setShowMethodology] = useState(!hasContent);
  const [isCollapsed, setIsCollapsed] = useState(hasContent);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { aiEnabled, isLoading: isLoadingSettings } = useAISettings();

  // Mantém a ordem dos hooks consistente em todas as renderizações
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Don't render if AI is disabled
  if (isLoadingSettings) {
    return null;
  }

  if (!aiEnabled) {
    return null;
  }


  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('academic-advisor', {
        body: {
          messages: [...messages, userMessage],
          currentSection,
          articleContent
        }
      });

      if (error) throw error;

      if (data?.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (error: any) {
      console.error('Error calling academic advisor:', error);
      toast({
        title: "Erro na orientação",
        description: error.message || "Não foi possível obter orientação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getContextualGreeting = () => {
    const sectionGuidance: Record<string, string> = {
      'Título': 'Vamos trabalhar no título do seu artigo! Um bom título deve ser claro, objetivo e refletir exatamente o tema da sua pesquisa. Deve ter entre 10 e 15 palavras. Me conte: qual é o tema principal que você quer pesquisar?',
      'Autores': 'Agora vamos identificar os autores do artigo. Quem são os autores deste trabalho? Liste nome completo e afiliação institucional de cada um.',
      'Resumo': 'Vamos construir seu Resumo! Ele deve ter entre 150-250 palavras e seguir a estrutura: (1) Contextualização breve, (2) Objetivo, (3) Metodologia, (4) Principais resultados. Comece me contando: qual é o objetivo principal da sua pesquisa?',
      'Abstract': 'O Abstract é a versão em inglês do seu Resumo, mantendo a mesma estrutura e conteúdo. Você já tem o resumo em português pronto para traduzirmos?',
      'Introdução': 'Vamos estruturar sua Introdução! Ela deve apresentar: (1) Contextualização do tema, (2) Problema de pesquisa, (3) Objetivos (geral e específicos), (4) Justificativa. Para começar, me diga: por que você escolheu esse tema? O que te motivou?',
      'Metodologia': 'Hora de planejar sua Metodologia! Precisamos definir: (1) Tipo de pesquisa (qualitativa, quantitativa ou mista), (2) Instrumentos de coleta de dados, (3) Forma de análise. Vamos começar: que tipo de dados você precisa coletar para responder sua pergunta de pesquisa?',
      'Resultados e Discussão': 'Vamos trabalhar em Resultados e Discussão! Primeiro, apresente os dados coletados de forma objetiva. Depois, interprete-os: O que seus dados revelaram? Isso confirma ou contradiz o que os autores da sua Fundamentação Teórica disseram?',
      'Conclusão': 'Vamos elaborar sua Conclusão! Ela deve: (1) Retomar o objetivo, (2) Sintetizar os principais achados, (3) Indicar limitações, (4) Sugerir trabalhos futuros. Seu objetivo foi alcançado? O que você concluiu?',
      'Referências': 'As Referências seguem a ABNT NBR 6023. Você tem uma lista dos materiais que consultou? Me mostre algumas referências para orientarmos a formatação correta.'
    };

    if (currentSection && sectionGuidance[currentSection]) {
      return `Olá! Eu sou a Orienta.IA, sua Orientadora Virtual do IFMS. Vejo que você está trabalhando na seção "${currentSection}".\n\n${sectionGuidance[currentSection]}`;
    }

    return 'Olá! Eu sou a Orienta.IA, sua Orientadora Virtual do IFMS. Estou aqui para orientar você na escrita do seu artigo científico, seção por seção, seguindo as normas ABNT e do IFMS. Vamos começar pelo Título do seu artigo. Qual é o tema que você quer pesquisar?';
  };

  const startOrientation = () => {
    setShowMethodology(false);
    const initialMessage: Message = {
      role: 'assistant',
      content: getContextualGreeting()
    };
    setMessages([initialMessage]);
  };

  if (showMethodology) {
    return (
      <Card className="w-full mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <CardTitle>Orienta.IA - Assistente para Começar</CardTitle>
            </div>
          </div>
          <CardDescription>
            Para quem não sabe por onde começar ou está procrastinando
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription>
              <strong className="text-blue-900 dark:text-blue-100">🎯 Para quem é essa orientação?</strong>
              <p className="mt-2 text-blue-800 dark:text-blue-200">
                Esta IA é um <strong>assistente/psicólogo acadêmico</strong> especialmente desenvolvido para 
                ajudar estudantes que estão <strong>travados</strong>, <strong>procrastinando</strong> ou 
                <strong> sem saber por onde começar</strong> seu artigo científico.
              </p>
            </AlertDescription>
          </Alert>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Como funciona a orientação?</strong>
              <p className="mt-2">
                Utiliza a <strong>Teoria do Andaime (Scaffolding)</strong>, 
                uma metodologia pedagógica desenvolvida por teóricos como Vygotsky e Bruner.
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1 bg-red-50 border-red-300 text-red-700">⚠️</Badge>
              <div>
                <h4 className="font-semibold mb-1 text-red-900 dark:text-red-100">Eu NÃO escrevo por você</h4>
                <p className="text-sm text-muted-foreground">
                  Esta IA <strong>não fornece respostas prontas</strong> e <strong>não escreve seu trabalho</strong>. 
                  Ela oferece direção, estrutura e perguntas orientadoras para você construir seu próprio conhecimento.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">2</Badge>
              <div>
                <h4 className="font-semibold mb-1">Faço perguntas orientadoras</h4>
                <p className="text-sm text-muted-foreground">
                  Em vez de dar a resposta, a IA guia você com perguntas que estimulam 
                  sua reflexão e autonomia.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">3</Badge>
              <div>
                <h4 className="font-semibold mb-1">Forneço estrutura, não conteúdo</h4>
                <p className="text-sm text-muted-foreground">
                  A IA oferece o "esqueleto" do trabalho acadêmico e deixa você preencher 
                  com seu conteúdo original.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">4</Badge>
              <div>
                <h4 className="font-semibold mb-1">Baseada nas normas IFMS e ABNT</h4>
                <p className="text-sm text-muted-foreground">
                  Todas as orientações seguem os documentos normativos do IFMS e as normas ABNT, 
                  com explicações sobre cada regra aplicada.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-1">5</Badge>
              <div>
                <h4 className="font-semibold mb-1">Desenvolvo sua autonomia gradualmente</h4>
                <p className="text-sm text-muted-foreground">
                  À medida que você demonstra compreensão dos conceitos, a IA reduz o suporte, 
                  incentivando sua independência acadêmica.
                </p>
              </div>
            </div>
          </div>

          <Alert className="bg-primary/5 border-primary/20">
            <BookOpen className="h-4 w-4" />
            <AlertDescription>
              <strong>💬 Exemplo prático de como funciona:</strong>
              <p className="mt-2 text-sm">
                <strong>Você:</strong> "Faça minha introdução"
              </p>
              <p className="mt-2 text-sm">
                <strong>Orienta.IA:</strong>
                <em className="block mt-1 text-muted-foreground">
                  "Vamos construir sua Introdução juntos! A estrutura básica inclui: 
                  (1) Contextualização, (2) Problema de Pesquisa, (3) Objetivos e (4) Justificativa. 
                  Para começar, me diga: qual é o principal problema que seu trabalho pretende resolver? 
                  O que te motivou a escolher esse tema?"
                </em>
              </p>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button 
              onClick={startOrientation} 
              className="flex-1"
              size="lg"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Iniciar Orientação
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Card colapsado - mostra apenas um botão para expandir
  if (isCollapsed) {
    return (
      <Card className="w-full mb-6">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Orienta.IA - IFMS</CardTitle>
              {currentSection && (
                <Badge variant="secondary" className="text-xs">Seção: {currentSection}</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(false)}
              className="gap-2"
            >
              <Maximize2 className="h-4 w-4" />
              <span className="text-sm">Expandir</span>
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full flex flex-col mb-6", "h-[600px]")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Orienta.IA - IFMS</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {currentSection && (
              <Badge variant="secondary">Seção: {currentSection}</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="gap-2"
            >
              <Minimize2 className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Minimizar</span>
            </Button>
          </div>
        </div>
        <CardDescription>
          Assistente que orienta (não escreve por você) • Teoria do Andaime
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Digite sua dúvida ou descreva em que etapa você está..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-[60px] w-[60px] shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AcademicAdvisor;
