import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import RichTextEditor from '../RichTextEditor';
import editorConfig from '@/config/editorConfig';
import { useBannerImages } from '@/hooks/useBannerImages';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface BannerContentSectionProps {
  content: {
    introduction: string;
    objectives: string;
    methodology: string;
    results: string;
    discussion: string;
    conclusion: string;
    references: string;
    acknowledgments: string;
  };
  handleChange: (field: string, data: string) => void;
  onImageUploadFromEditor?: (file: File) => void;
}

const BannerContentSection = ({ content, handleChange, onImageUploadFromEditor }: BannerContentSectionProps) => {
  const { id: workId } = useParams();
  const { user } = useAuth();
  const { images } = useBannerImages(workId, user?.id);
  const [editorInstances, setEditorInstances] = useState<Record<string, any>>({});
  const [pendingInsertion, setPendingInsertion] = useState<{ sectionId: string; type: 'figura' | 'grafico' | 'tabela'; placeholderId?: string } | null>(null);
  const [selectionPaths, setSelectionPaths] = useState<Record<string, number[]>>({});

  // Filter attachments by section
  const introAttachments = images.filter(img => img.section === 'introduction').sort((a, b) => a.display_order - b.display_order);
  const objectivesAttachments = images.filter(img => img.section === 'objectives').sort((a, b) => a.display_order - b.display_order);
  const methodologyAttachments = images.filter(img => img.section === 'methodology').sort((a, b) => a.display_order - b.display_order);
  const resultsAttachments = images.filter(img => img.section === 'results').sort((a, b) => a.display_order - b.display_order);
  const discussionAttachments = images.filter(img => img.section === 'discussion').sort((a, b) => a.display_order - b.display_order);
  const conclusionAttachments = images.filter(img => img.section === 'conclusion').sort((a, b) => a.display_order - b.display_order);

  const handleEditorReady = (sectionId: string, editor: any) => {
    setEditorInstances(prev => ({ ...prev, [sectionId]: editor }));
  };

  const handleRequestAttachmentInsertion = (sectionId: string, payload: { type: 'figura' | 'grafico' | 'tabela'; selectionPath: number[]; placeholderId?: string }) => {
    console.log('📍 BannerContentSection recebeu requisição:', { sectionId, type: payload.type, path: payload.selectionPath, placeholderId: payload.placeholderId });
    setPendingInsertion({ sectionId, type: payload.type, placeholderId: payload.placeholderId });
    setSelectionPaths(prev => ({ ...prev, [sectionId]: payload.selectionPath }));
    console.log('💾 Path salvo para seção:', sectionId, '→', payload.selectionPath);
    const event = new CustomEvent('openAttachmentsManager', { 
      detail: { type: payload.type, sectionId, placeholderId: payload.placeholderId } 
    });
    window.dispatchEvent(event);
    console.log('📤 Evento openAttachmentsManager disparado');
  };

  // Escutar evento de anexo selecionado
  useEffect(() => {
    const handleAttachmentSelected = (event: CustomEvent) => {
      console.log('📨 Evento attachmentSelected recebido:', event.detail);
      const { sectionId, attachmentId, attachmentType, placeholderId } = event.detail;
      insertAttachmentMarker(sectionId, attachmentId, attachmentType, placeholderId);
    };

    console.log('👂 Listener attachmentSelected registrado. Editores disponíveis:', Object.keys(editorInstances));
    window.addEventListener('attachmentSelected' as any, handleAttachmentSelected);
    return () => {
      console.log('🔇 Listener attachmentSelected removido');
      window.removeEventListener('attachmentSelected' as any, handleAttachmentSelected);
    };
  }, [editorInstances]);

  const insertAttachmentMarker = (sectionId: string, attachmentId: string, attachmentType: string, placeholderId?: string) => {
    console.log('🎯 Inserindo marcador de anexo:', { sectionId, attachmentId, attachmentType, placeholderId });
    const editor = editorInstances[sectionId];
    if (!editor) {
      console.error('❌ Editor não encontrado para seção:', sectionId, 'Editores disponíveis:', Object.keys(editorInstances));
      return;
    }

    const typeLabel = attachmentType === 'figura' ? 'Imagem' : attachmentType === 'grafico' ? 'Gráfico' : 'Tabela';
    const typeIcon = attachmentType === 'figura' ? '🖼️' : attachmentType === 'grafico' ? '📊' : '📋';
    const finalToken = `[[${attachmentType}:${attachmentId}]]`;

    // 1) Tenta substituir placeholder exato no HTML (garante a posição precisa onde o usuário clicou)
    if (placeholderId) {
      const ph = `[[placeholder:${placeholderId}]]`;
      const current = editor.getData();
      if (current.includes(ph)) {
        const replaced = current.replace(ph, `${typeIcon} ${typeLabel} ${finalToken}`);
        editor.setData(replaced);
        // Atualiza o estado externo para preservar o token no conteúdo
        try {
          handleChange(sectionId, replaced);
        } catch (e) {
          console.warn('Não foi possível propagar alteração para o estado externo:', e);
        }
        console.log('✅ Placeholder substituído com sucesso');
        setSelectionPaths(prev => ({ ...prev, [sectionId]: [] }));
        return;
      } else {
        console.warn('⚠️ Placeholder não encontrado no HTML. Fallback para path salvo.');
      }
    }

    // 2) Fallback: usa path salvo para inserir no modelo
    console.log('✏️ Iniciando mudança no modelo do editor (fallback)...');
    editor.model.change((writer: any) => {
      const root = editor.model.document.getRoot();
      const path = selectionPaths[sectionId];
      console.log('📍 Path recuperado para inserção:', path);
      if (path && path.length) {
        const position = writer.createPositionFromPath(root, path);
        writer.setSelection(position);
        console.log('✅ Cursor posicionado no path salvo');
      } else {
        console.log('⚠️ Path não encontrado ou vazio, inserindo na posição atual');
      }
      writer.insertText(`${typeIcon} ${typeLabel} ${finalToken}`, editor.model.document.selection);
      console.log('✅ Marcador (texto) inserido com sucesso!');
      // Sincroniza o conteúdo com o estado externo após a inserção
      try {
        const dataAfter = editor.getData();
        handleChange(sectionId, dataAfter);
      } catch (e) {
        console.warn('Falha ao sincronizar conteúdo após inserção via modelo:', e);
      }
    });

    // Limpa o caminho salvo após inserir
    setSelectionPaths(prev => ({ ...prev, [sectionId]: [] }));
    console.log('🧹 Path limpo para seção:', sectionId);
  }; 

  // Reordenação inline arrastando imagens no preview (antes/depois de outra imagem)
  useEffect(() => {
    const handler = (event: CustomEvent) => {
      const { sectionId: targetSection, sourceId, targetId } = event.detail || {};
      if (!targetSection || targetSection !== 'introduction' && targetSection !== 'objectives' && targetSection !== 'methodology' && targetSection !== 'results' && targetSection !== 'discussion' && targetSection !== 'conclusion' && targetSection !== 'references') return;

      const currentHtml = (content as any)[targetSection] as string;
      if (!currentHtml) return;

      // Localiza os tokens dos anexos
      const tokenFor = (id: string) => {
        const re = new RegExp(`\\[\\[(figura|grafico|tabela):${id}\\]\\]`, 'i');
        const match = currentHtml.match(re);
        return match ? match[0] : null;
      };

      const srcToken = tokenFor(sourceId);
      const tgtToken = tokenFor(targetId);
      if (!srcToken || !tgtToken) return;

      // Remove a primeira ocorrência do token de origem
      let updated = currentHtml.replace(srcToken, '');
      // Insere antes do token alvo
      updated = updated.replace(tgtToken, `${srcToken}${tgtToken}`);

      try {
        handleChange(targetSection, updated);
      } catch (e) {
        console.warn('Falha ao aplicar reordenação inline:', e);
      }
    };

    window.addEventListener('reorderAttachmentInline' as any, handler as any);
    return () => window.removeEventListener('reorderAttachmentInline' as any, handler as any);
  }, [content, handleChange]);
    <div className="space-y-6">
      <div className="bg-muted/30 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">📐 Estrutura do Banner Científico</h3>
        <p className="text-sm text-muted-foreground">
          Seu banner será organizado em 3 colunas profissionais:
        </p>
        <div className="grid grid-cols-3 gap-4 mt-3 text-xs">
          <div className="bg-background p-3 rounded border">
            <p className="font-semibold">Coluna 1</p>
            <p className="text-muted-foreground">Introdução • Objetivos • Referências</p>
          </div>
          <div className="bg-background p-3 rounded border">
            <p className="font-semibold">Coluna 2</p>
            <p className="text-muted-foreground">Metodologia • Resultados (início)</p>
          </div>
          <div className="bg-background p-3 rounded border">
            <p className="font-semibold">Coluna 3</p>
            <p className="text-muted-foreground">Resultados • Discussão • Conclusão • Agradecimentos</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Introdução</CardTitle>
          <CardDescription>
            Contextualize o tema e apresente a problemática. Seja objetivo e claro. (Recomendado: 10-20 linhas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.introduction}
            onChange={(data) => handleChange('introduction', data)}
            maxLines={30}
            minLines={5}
            config={editorConfig}
            placeholder="Ex: A problemática dos resíduos plásticos tem afetado significativamente os ecossistemas marinhos..."
            sectionName="Introdução"
            onEditorReady={(editor) => handleEditorReady('introduction', editor)}
            onRequestAttachmentInsertion={(payload) => handleRequestAttachmentInsertion('introduction', payload)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Objetivos</CardTitle>
          <CardDescription>
            Liste os objetivos gerais e específicos. Use tópicos claros e diretos. (Recomendado: 5-10 linhas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.objectives}
            onChange={(data) => handleChange('objectives', data)}
            maxLines={15}
            minLines={2}
            config={editorConfig}
            placeholder="Ex: • Objetivo Geral: Avaliar o impacto... • Objetivos Específicos: 1) Quantificar... 2) Analisar..."
            sectionName="Objetivos"
            onEditorReady={(editor) => handleEditorReady('objectives', editor)}
            onRequestAttachmentInsertion={(payload) => handleRequestAttachmentInsertion('objectives', payload)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metodologia / Materiais e Métodos</CardTitle>
          <CardDescription>
            Descreva os procedimentos, materiais e técnicas utilizadas. Seja específico. (Recomendado: 15-25 linhas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.methodology}
            onChange={(data) => handleChange('methodology', data)}
            maxLines={35}
            minLines={5}
            config={{
              ...editorConfig,
              toolbar: editorConfig.toolbar.filter((t: any) => t !== 'imageUpload')
            }}
            placeholder="Ex: O estudo foi conduzido em três etapas: 1) Coleta de amostras... 2) Análise laboratorial... 3) Tratamento estatístico..."
            sectionName="Metodologia"
            onCustomImageUpload={onImageUploadFromEditor}
            onEditorReady={(editor) => handleEditorReady('methodology', editor)}
            onRequestAttachmentInsertion={(payload) => handleRequestAttachmentInsertion('methodology', payload)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            Apresente os principais dados e resultados obtidos. Use gráficos e tabelas quando possível. (Recomendado: 15-25 linhas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.results}
            onChange={(data) => handleChange('results', data)}
            maxLines={35}
            minLines={5}
            config={{
              ...editorConfig,
              toolbar: editorConfig.toolbar.filter((t: any) => t !== 'imageUpload')
            }}
            placeholder="Ex: Os resultados demonstraram que... A Figura 1 ilustra... A Tabela 1 apresenta..."
            sectionName="Resultados"
            onEditorReady={(editor) => handleEditorReady('results', editor)}
            onRequestAttachmentInsertion={(payload) => handleRequestAttachmentInsertion('results', payload)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Discussão</CardTitle>
          <CardDescription>
            Compare seus resultados com a literatura e explique suas implicações. (Recomendado: 10-20 linhas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.discussion}
            onChange={(data) => handleChange('discussion', data)}
            maxLines={30}
            minLines={5}
            config={editorConfig}
            placeholder="Ex: Os resultados obtidos corroboram com os estudos de Silva et al. (2022), que também observaram..."
            sectionName="Discussão"
            onEditorReady={(editor) => handleEditorReady('discussion', editor)}
            onRequestAttachmentInsertion={(payload) => handleRequestAttachmentInsertion('discussion', payload)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conclusões</CardTitle>
          <CardDescription>
            Sintetize as principais descobertas e contribuições do trabalho. (Recomendado: 5-12 linhas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.conclusion}
            onChange={(data) => handleChange('conclusion', data)}
            maxLines={18}
            minLines={3}
            config={editorConfig}
            placeholder="Ex: Conclui-se que a metodologia proposta foi eficaz para... Os resultados sugerem que..."
            sectionName="Conclusão"
            onEditorReady={(editor) => handleEditorReady('conclusion', editor)}
            onRequestAttachmentInsertion={(payload) => handleRequestAttachmentInsertion('conclusion', payload)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Referências</CardTitle>
          <CardDescription>Liste 2-3 referências mais relevantes, seguindo as normas ABNT. (2-10 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.references}
            onChange={(data) => handleChange('references', data)}
            maxLines={10}
            minLines={2}
            config={editorConfig}
            placeholder="Liste as referências mais relevantes (ABNT)..."
            sectionName="Referências"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Agradecimentos (opcional)</CardTitle>
          <CardDescription>Mencione instituições ou pessoas que contribuíram para o trabalho. (máximo 4 linhas)</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={content.acknowledgments}
            onChange={(data) => handleChange('acknowledgments', data)}
            maxLines={4}
            minLines={0}
            config={editorConfig}
            placeholder="Agradeça às instituições e pessoas que contribuíram..."
            sectionName="Agradecimentos"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerContentSection;