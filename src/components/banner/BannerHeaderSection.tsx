
import { useState, useCallback, useEffect } from 'react';
import LogoUpload from './header/LogoUpload';
import type { LogoConfig } from './header/LogoUpload';
import InstitutionInput from './header/InstitutionInput';
import ColumnLayoutSelector from './header/ColumnLayoutSelector';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import RichTextEditor from '../RichTextEditor';
import editorConfig from '@/config/editorConfig';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import TitleValidationFeedback from './TitleValidationFeedback';
import { cleanHtmlTags } from '@/utils/latexProcessor';

interface BannerHeaderSectionProps {
  content: {
    title: string;
    authors: string;
    authorEmail: string;
    institution: string;
    institutionLogo?: string;
    logoConfig?: LogoConfig;
    eventLogo?: string;
    advisors?: string;
    themeColor?: string;
    columnLayout?: '2' | '3';
  };
  handleChange: (field: string, data: any) => void;
}

const BannerHeaderSection = ({ content, handleChange }: BannerHeaderSectionProps) => {
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatTimeout, setFormatTimeout] = useState<NodeJS.Timeout | null>(null);
  const [titleValidation, setTitleValidation] = useState<any>(null);
  const [isValidatingTitle, setIsValidatingTitle] = useState(false);
  const [validationAttempts, setValidationAttempts] = useState(0);
  const [lastValidationError, setLastValidationError] = useState<string | null>(null);
  const { toast } = useToast();

  // Limpar feedback de validação quando o título muda significativamente
  useEffect(() => {
    if (titleValidation && content.title) {
      const titleText = content.title.replace(/<[^>]*>/g, '').trim();
      const prevTitleText = titleValidation.originalTitle?.replace(/<[^>]*>/g, '').trim() || '';
      
      // Se o título mudou significativamente (mais de 5 caracteres), limpar o feedback
      if (Math.abs(titleText.length - prevTitleText.length) > 5 || 
          !titleText.includes(prevTitleText.substring(0, 10))) {
        setTitleValidation(null);
        setLastValidationError(null);
        setValidationAttempts(0);
      }
    }
  }, [content.title, titleValidation]);

  const validateTitle = async (title: string) => {
    if (!title.trim()) return;
    
    setIsValidatingTitle(true);
    try {
      console.log('🔍 validateTitle - Título RAW recebido:', title);
      
      // Adicionar originalTitle ao estado para comparação posterior
      const cleanTitle = cleanHtmlTags(title);
      
      console.log('🧼 validateTitle - Título LIMPO:', cleanTitle);
      console.log('📊 validateTitle - Comprimento limpo:', cleanTitle.length);
      
      const { data, error } = await supabase.functions.invoke('validate-title', {
        body: { 
          title: cleanTitle,
          sectionName: "Título" 
        }
      });

      if (error) {
        console.error('Erro na validação:', error);
        
        // Incrementar contador de tentativas
        setValidationAttempts(prev => prev + 1);
        
        let errorMessage = "Não foi possível validar o título. Tente novamente mais tarde.";
        
        // Customizar mensagem com base no tipo de erro
        if (error.message?.includes('429') || error.message?.includes('limit')) {
          errorMessage = "Muitas requisições. Aguarde alguns minutos e tente novamente.";
        } else if (error.message?.includes('401') || error.message?.includes('authentication')) {
          errorMessage = "Erro de autenticação com o serviço de validação.";
        } else if (error.message?.includes('timeout') || error.message?.includes('504')) {
          errorMessage = "Tempo de resposta excedido. Tente novamente mais tarde.";
        } else if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
          errorMessage = "Erro de conexão com o serviço de validação. Verifique sua conexão com a internet.";
        }
        
        setLastValidationError(errorMessage);
        
        // Mostrar toast apenas na primeira ou segunda tentativa
        if (validationAttempts < 2) {
          toast({
            title: "Erro na validação",
            description: errorMessage,
            variant: "destructive",
            duration: 5000,
          });
        }
        
        throw new Error(errorMessage);
      }

      console.log('Resposta de validação:', data);
      
      // Adicionar o título original ao resultado para comparação posterior
      setTitleValidation({
        ...data,
        originalTitle: cleanTitle
      });
      
      // Resetar contadores de erro quando sucesso
      setValidationAttempts(0);
      setLastValidationError(null);

      if (data?.isValid === false) {
        toast({
          title: "Sugestões para o título",
          description: "Verifique as sugestões de melhoria abaixo do editor.",
          variant: "destructive",
          duration: 5000,
        });
      } else if (data?.isValid === true) {
        toast({
          title: "Título validado",
          description: "O título está adequado para o banner.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Erro ao validar título:', error);
      
      // Não sobrescrever o estado se já temos um erro específico
      if (!lastValidationError) {
        setTitleValidation({
          error: "Não foi possível validar o título. Tente novamente mais tarde.",
          isValid: false,
          overallFeedback: "Ocorreu um erro técnico durante a validação."
        });
      }
    } finally {
      setIsValidatingTitle(false);
    }
  };

  const handleTitleChange = (value: string) => {
    console.log('📝 Título RAW do editor:', value);
    handleChange('title', value);
    
    if (formatTimeout) {
      clearTimeout(formatTimeout);
    }
    
    const newTimeout = setTimeout(() => {
      const cleanValue = value.replace(/<[^>]*>/g, '').trim();
      console.log('🧹 Título após limpeza básica:', cleanValue);
      console.log('📏 Comprimento do título limpo:', cleanValue.length);
      
      if (cleanValue && cleanValue.length > 10) {
        console.log('✅ Enviando para validação:', value);
        validateTitle(value);
      } else {
        console.log('❌ Título muito curto, não validando');
      }
    }, 5000); // 5 segundos para garantir que o usuário terminou de digitar (padrão Teoria do Andaime)
    
    setFormatTimeout(newTimeout);
  };

  const formatAuthors = useCallback(async (authorsText: string, sectionName: string = "Autores") => {
    if (isFormatting) return;
    
    try {
      setIsFormatting(true);
      console.log(`Formatando ${sectionName}:`, authorsText);
      
      const { data, error } = await supabase.functions.invoke('format-authors', {
        body: { 
          authors: authorsText, 
          sectionName: sectionName 
        }
      });

      if (error) {
        console.error('Erro na função do Supabase:', error);
        throw new Error(`Falha ao formatar ${sectionName}: ${error.message}`);
      }

      if (!data?.formattedAuthors) {
        console.error('Formato de resposta inválido:', data);
        throw new Error('Resposta inválida do serviço de formatação');
      }

      console.log(`${sectionName} formatados:`, data.formattedAuthors);
      handleChange(sectionName === "Docentes" ? 'advisors' : 'authors', data.formattedAuthors);

      toast({
        title: "Nomes formatados",
        description: `Os nomes foram formatados de acordo com as normas ABNT`,
        duration: 3000,
      });
    } catch (error: any) {
      console.error(`Erro ao formatar ${sectionName}:`, error);
      toast({
        title: `Erro ao formatar nomes`,
        description: error.message || `Não foi possível formatar os nomes automaticamente`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsFormatting(false);
    }
  }, [handleChange, toast, isFormatting]);

  const handleAuthorsChange = useCallback((value: string) => {
    handleChange('authors', value);
    
    if (formatTimeout) {
      clearTimeout(formatTimeout);
    }
    
    const newTimeout = setTimeout(() => {
      if (value && value.replace(/<[^>]*>/g, '').trim()) {
        formatAuthors(value, "Discentes");
      }
    }, 5000); // 5 segundos para garantir que o usuário terminou de digitar
    
    setFormatTimeout(newTimeout);
  }, [handleChange, formatAuthors, formatTimeout]);

  const handleAdvisorsChange = useCallback((value: string) => {
    handleChange('advisors', value);
    
    if (formatTimeout) {
      clearTimeout(formatTimeout);
    }
    
    const newTimeout = setTimeout(() => {
      if (value && value.replace(/<[^>]*>/g, '').trim()) {
        formatAuthors(value, "Docentes");
      }
    }, 5000); // 5 segundos para garantir que o usuário terminou de digitar
    
    setFormatTimeout(newTimeout);
  }, [handleChange, formatAuthors, formatTimeout]);

  // Limpar timeouts ao desmontar
  useEffect(() => {
    return () => {
      if (formatTimeout) {
        clearTimeout(formatTimeout);
      }
    };
  }, [formatTimeout]);

  return (
    <div className="space-y-6">
      <LogoUpload 
        institutionLogo={content.institutionLogo}
        logoConfig={content.logoConfig}
        handleChange={handleChange}
      />
      
      <InstitutionInput 
        institution={content.institution}
        handleChange={handleChange}
      />

      <ColumnLayoutSelector
        columnLayout={content.columnLayout || '2'}
        handleChange={handleChange}
      />

      <Card>
        <CardHeader>
          <CardTitle>3. Título do Trabalho</CardTitle>
          <CardDescription>
            Deve ser breve, claro e atrativo, indicando o tema principal do trabalho. (2-3 linhas)
            O título será automaticamente validado quanto à clareza, objetividade e normas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RichTextEditor
            value={content.title}
            onChange={handleTitleChange}
            maxLines={3}
            minLines={2}
            config={editorConfig}
            placeholder="Digite um título breve e atrativo que indique o tema principal do trabalho..."
            sectionName="Título"
          />
          <TitleValidationFeedback 
            validationResult={titleValidation}
            isValidating={isValidatingTitle}
            errorMessage={lastValidationError}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Discentes</CardTitle>
          <CardDescription>Liste os nomes dos alunos autores do trabalho. Os nomes serão automaticamente formatados de acordo com as normas ABNT. (1-2 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.authors}
            onChange={handleAuthorsChange}
            maxLines={2}
            minLines={1}
            config={editorConfig}
            placeholder="Nome dos alunos autores do trabalho..."
            sectionName="Discentes"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Docentes</CardTitle>
          <CardDescription>Liste os nomes dos professores orientadores, incluindo titulação (Dr., Prof., etc). Os nomes serão automaticamente formatados de acordo com as normas ABNT. (1-2 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.advisors || ""}
            onChange={handleAdvisorsChange}
            maxLines={2}
            minLines={1}
            config={editorConfig}
            placeholder="Nome dos professores orientadores..."
            sectionName="Docentes"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerHeaderSection;
