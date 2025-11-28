import { UniversityGuidelines } from './types';

export const ifmsGuidelines: UniversityGuidelines = {
  id: 'ifms',
  name: 'Instituto Federal de Mato Grosso do Sul',
  shortName: 'IFMS',
  description: 'Normas de formatação baseadas no Manual de Normalização da Produção Acadêmica do IFMS',
  
  pageLimits: {
    article: {
      min: 15,
      max: 20,
      description: 'Elementos textuais (Introdução até Conclusão), sem contar referências, apêndices e anexos'
    },
    banner: {
      description: 'Deve seguir a NBR 15437:2006 ou o template específico do evento. Consulte o organizador do evento para mais detalhes.'
    }
  },

  guidelines: {
    formatting: [
      {
        title: '📄 Papel e Margens',
        items: [
          'Formato: A4 (21cm × 29,7cm)',
          'Margem superior: 3cm',
          'Margem inferior: 2cm',
          'Margem esquerda: 3cm',
          'Margem direita: 2cm'
        ]
      },
      {
        title: '🔤 Fonte e Tamanhos',
        items: [
          'Fonte: Times New Roman ou Arial',
          'Texto geral: Tamanho 12',
          'Citações longas (+3 linhas): Tamanho 10',
          'Notas de rodapé: Tamanho 10',
          'Paginação: Tamanho 10',
          'Legendas e fontes de ilustrações/tabelas: Tamanho 10'
        ]
      },
      {
        title: '📏 Espaçamento entre Linhas',
        items: [
          'Texto geral: 1,5 cm',
          'Citações longas: Espaçamento simples',
          'Notas de rodapé: Espaçamento simples',
          'Legendas: Espaçamento simples',
          'Lista de referências: Espaçamento simples'
        ]
      },
      {
        title: '📐 Alinhamento e Recuos',
        items: [
          'Texto geral: Justificado',
          'Recuo de parágrafo: 1,25cm (primeira linha)',
          'Referências (lista final): Alinhadas à esquerda',
          'Citações longas: Recuo de 4cm da margem esquerda'
        ]
      },
      {
        title: '📝 Citações Longas',
        items: [
          'Aplicadas a citações com mais de 3 linhas',
          'Recuo de 4cm da margem esquerda',
          'Fonte: Times New Roman ou Arial, tamanho 10',
          'Espaçamento simples',
          'Sem aspas',
          'Sem recuo de primeira linha'
        ]
      },
      {
        title: '🔢 Numeração de Páginas',
        items: [
          'Localização: Canto superior direito',
          'Fonte: Tamanho 10',
          'Páginas pré-textuais: Não numeradas (capa, resumo, abstract)',
          'Numeração inicia: A partir da Introdução (numeração arábica)',
          'A capa não conta na numeração'
        ]
      },
      {
        title: '🖼️ Ilustrações e Tabelas',
        items: [
          'Inserir o mais próximo possível do texto referenciado',
          'Identificação: Na parte superior (Tipo, número, título)',
          'Fonte: Na parte inferior (obrigatório, mesmo se for do próprio autor)',
          'Tabelas: Seguir normas IBGE (laterais abertas)',
          'Quadros: Laterais fechadas (diferente de tabelas)'
        ]
      }
    ],

    structure: {
      article: [
        {
          title: '📋 Elementos Pré-textuais',
          items: [
            'Título e Subtítulo (se houver)',
            'Autores e identificação (titulação, instituição, e-mail em nota de rodapé)',
            'Resumo: 100 a 250 palavras, parágrafo único, voz ativa, 3ª pessoa do singular',
            'Palavras-chave: Mínimo de 3 e máximo de 5 palavras',
            'Abstract: Tradução do resumo para língua estrangeira (Inglês ou Espanhol)',
            'Keywords: Tradução das palavras-chave'
          ]
        },
        {
          title: '📖 Elementos Textuais (Corpo do Trabalho)',
          items: [
            '1. Introdução: Apresentação do assunto, objetivos, justificativa e metodologia',
            '2. Desenvolvimento: Pode seguir estrutura IDC (Humanas) ou IRMRDC (Exatas/Tecnológicas)',
            '   • IDC: Introdução, Desenvolvimento, Conclusão',
            '   • IRMRDC: Introdução, Revisão, Materiais/Métodos, Resultados/Discussão, Conclusão',
            '3. Revisão de Literatura / Referencial Teórico (opcional, dependendo da área)',
            '4. Metodologia / Materiais e Métodos',
            '5. Resultados e Discussão',
            '6. Conclusão / Considerações Finais: Recapitulação sintética dos resultados'
          ]
        },
        {
          title: '📚 Elementos Pós-textuais',
          items: [
            'Referências: Obrigatório',
            'Apêndices: Opcional (material elaborado pelo próprio autor)',
            'Anexos: Opcional (material não elaborado pelo autor)',
            'Agradecimentos: Opcional'
          ]
        },
        {
          title: '📄 Limites de Páginas',
          items: [
            'Mínimo: 15 páginas de elementos textuais',
            'Máximo: 20 páginas de elementos textuais',
            'Contagem: Da Introdução até a Conclusão',
            'Não contam: Referências, apêndices e anexos'
          ]
        }
      ],
      banner: [
        {
          title: '🎯 Estrutura do Banner (Pôster Técnico e Científico)',
          items: [
            'Título: Centralizado, fonte grande e legível',
            'Autores e instituição: Logo abaixo do título',
            'Introdução: Contextualização breve do tema',
            'Objetivos: Claro e direto',
            'Metodologia: Resumida',
            'Resultados: Principais achados',
            'Conclusão: Síntese dos resultados',
            'Referências: Principais fontes utilizadas'
          ]
        },
        {
          title: '🎨 Layout e Design',
          items: [
            'Norma de referência: NBR 15437:2006',
            'Template: Observar modelo adotado pelo evento específico',
            'Formato: Geralmente A4 vertical ou horizontal, ou dimensões definidas pelo evento',
            'Layout: Pode ser em 2 ou 3 colunas',
            'Uso equilibrado: Imagens e texto bem distribuídos',
            'Fonte: Legível à distância (mínimo 20pt recomendado)',
            'Cores: Institucionais ou tema coerente com o trabalho'
          ]
        },
        {
          title: '⚠️ Observação Importante',
          items: [
            'O IFMS não estabelece uma regra fixa interna única para formatação visual do banner',
            'Deve-se consultar a NBR 15437:2006 como referência',
            'Priorize o template fornecido pelo evento onde o trabalho será apresentado',
            'Em caso de dúvida, consulte o organizador do evento'
          ]
        }
      ]
    },

    references: {
      examples: [
        {
          type: '📚 Livro',
          format: 'SOBRENOME, Nome. **Título da obra**: subtítulo. Edição. Local: Editora, ano.',
          example: 'GIL, Antonio Carlos. **Como elaborar projetos de pesquisa**. 6. ed. São Paulo: Atlas, 2017.'
        },
        {
          type: '📄 Artigo de Periódico',
          format: 'SOBRENOME, Nome. Título do artigo. **Título do periódico**, Local, v. X, n. Y, p. X-Y, mês ano.',
          example: 'SILVA, João. Metodologias ativas no ensino. **Revista Educação**, São Paulo, v. 15, n. 2, p. 45-60, jul. 2020.'
        },
        {
          type: '🌐 Documento Online',
          format: 'SOBRENOME, Nome. **Título**. Local, ano. Disponível em: <URL>. Acesso em: data.',
          example: 'BRASIL. **Lei nº 9.394**, de 20 de dezembro de 1996. Brasília, 1996. Disponível em: <http://www.planalto.gov.br>. Acesso em: 15 jan. 2024.'
        },
        {
          type: '📖 Capítulo de Livro',
          format: 'SOBRENOME, Nome. Título do capítulo. In: SOBRENOME, Nome (Org.). **Título do livro**. Local: Editora, ano. p. X-Y.',
          example: 'DEMO, Pedro. Metodologia científica. In: BARROS, Aidil (Org.). **Fundamentos de metodologia**. São Paulo: McGraw-Hill, 1986. p. 19-43.'
        }
      ],
      tips: [
        'Ordem alfabética por sobrenome do autor',
        'Alinhamento à esquerda (sem justificação)',
        'Espaçamento simples dentro de cada referência',
        'Uma linha em branco entre referências diferentes',
        'Título da obra em negrito (não o nome do autor ou editora)',
        'Sobrenomes em CAIXA ALTA, nomes em Caixa normal',
        'Seguir rigorosamente a ABNT NBR 6023:2018'
      ]
    }
  }
};
