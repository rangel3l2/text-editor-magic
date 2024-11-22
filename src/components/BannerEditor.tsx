import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import BannerHeaderSection from './banner/BannerHeaderSection';
import BannerContentSection from './banner/BannerContentSection';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';

const BannerEditor = () => {
  const [searchParams] = useSearchParams();
  const [documentType] = useState(searchParams.get('type') || 'banner');
  const [bannerContent, setBannerContent] = useState({
    title: '',
    authors: '',
    introduction: '',
    objectives: '',
    methodology: '',
    results: '',
    conclusion: '',
    references: '',
    acknowledgments: ''
  });
  
  const { toast } = useToast();
  
  const handleChange = (field: string, data: string) => {
    setBannerContent(prev => ({
      ...prev,
      [field]: data
    }));
    
    localStorage.setItem('bannerContent', JSON.stringify({
      ...bannerContent,
      [field]: data
    }));
    
    toast({
      title: "Conteúdo salvo",
      description: "Seu conteúdo foi salvo automaticamente",
      duration: 2000,
    });
  };

  const generateDocx = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            spacing: { after: 300 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: bannerContent.title.replace(/<[^>]*>/g, ''),
                bold: true,
                size: 32
              })
            ]
          }),
          // Authors
          new Paragraph({
            spacing: { after: 400 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: bannerContent.authors.replace(/<[^>]*>/g, ''),
                size: 24
              })
            ]
          }),
          // Main content in two columns using a table
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  // Left column
                  new TableCell({
                    width: {
                      size: 50,
                      type: WidthType.PERCENTAGE,
                    },
                    children: [
                      new Paragraph({
                        spacing: { before: 200, after: 200 },
                        children: [
                          new TextRun({ text: "Introdução", bold: true, size: 24 }),
                          new TextRun({ text: "\n\n" + bannerContent.introduction.replace(/<[^>]*>/g, '') })
                        ]
                      }),
                      new Paragraph({
                        spacing: { before: 200, after: 200 },
                        children: [
                          new TextRun({ text: "Objetivos", bold: true, size: 24 }),
                          new TextRun({ text: "\n\n" + bannerContent.objectives.replace(/<[^>]*>/g, '') })
                        ]
                      }),
                      new Paragraph({
                        spacing: { before: 200, after: 200 },
                        children: [
                          new TextRun({ text: "Metodologia", bold: true, size: 24 }),
                          new TextRun({ text: "\n\n" + bannerContent.methodology.replace(/<[^>]*>/g, '') })
                        ]
                      })
                    ]
                  }),
                  // Right column
                  new TableCell({
                    width: {
                      size: 50,
                      type: WidthType.PERCENTAGE,
                    },
                    children: [
                      new Paragraph({
                        spacing: { before: 200, after: 200 },
                        children: [
                          new TextRun({ text: "Resultados", bold: true, size: 24 }),
                          new TextRun({ text: "\n\n" + bannerContent.results.replace(/<[^>]*>/g, '') })
                        ]
                      }),
                      new Paragraph({
                        spacing: { before: 200, after: 200 },
                        children: [
                          new TextRun({ text: "Conclusão", bold: true, size: 24 }),
                          new TextRun({ text: "\n\n" + bannerContent.conclusion.replace(/<[^>]*>/g, '') })
                        ]
                      }),
                      new Paragraph({
                        spacing: { before: 200, after: 200 },
                        children: [
                          new TextRun({ text: "Referências", bold: true, size: 24 }),
                          new TextRun({ text: "\n\n" + bannerContent.references.replace(/<[^>]*>/g, '') })
                        ]
                      }),
                      new Paragraph({
                        spacing: { before: 200, after: 200 },
                        children: [
                          new TextRun({ text: "Agradecimentos", bold: true, size: 24 }),
                          new TextRun({ text: "\n\n" + bannerContent.acknowledgments.replace(/<[^>]*>/g, '') })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }]
    });

    // Generate and save the document
    Packer.toBlob(doc).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'banner-academico.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Documento gerado",
        description: "Seu banner acadêmico foi exportado com sucesso",
        duration: 3000,
      });
    });
  };

  if (documentType !== 'banner') {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Tipo de documento não suportado ainda</h2>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Banner Acadêmico</h2>
        <Button 
          onClick={generateDocx}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90"
        >
          <FileDown className="h-4 w-4" />
          Gerar DOCX
        </Button>
      </div>
      
      <Tabs defaultValue="header" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="header">Cabeçalho do Banner</TabsTrigger>
          <TabsTrigger value="content">Conteúdo do Banner</TabsTrigger>
        </TabsList>
        <TabsContent value="header">
          <BannerHeaderSection content={bannerContent} handleChange={handleChange} />
        </TabsContent>
        <TabsContent value="content">
          <BannerContentSection content={bannerContent} handleChange={handleChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BannerEditor;
