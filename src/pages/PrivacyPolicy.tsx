import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Política de Privacidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString()}
          </p>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              1. Introdução
            </h2>
            <p>
              Esta Política de Privacidade descreve como o AIcademic ("nós", "nosso" ou "nos") 
              coleta, usa e protege suas informações pessoais, em conformidade com a 
              Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              2. Dados Pessoais Coletados
            </h2>
            <p>Coletamos os seguintes tipos de informações:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Informações de conta (nome, e-mail)</li>
              <li>Dados de uso do serviço</li>
              <li>Informações técnicas (cookies, endereço IP)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              3. Base Legal para Processamento
            </h2>
            <p>
              Processamos seus dados pessoais com base nas seguintes condições legais 
              previstas na LGPD:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Consentimento do titular</li>
              <li>Cumprimento de obrigação legal</li>
              <li>Execução de contrato</li>
              <li>Legítimo interesse</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              4. Seus Direitos
            </h2>
            <p>
              Conforme a LGPD, você tem os seguintes direitos:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Confirmação da existência de tratamento</li>
              <li>Acesso aos dados</li>
              <li>Correção de dados incompletos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade dos dados</li>
              <li>Eliminação dos dados pessoais</li>
              <li>Revogação do consentimento</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              5. Cookies e Tecnologias Similares
            </h2>
            <p>
              Utilizamos cookies e tecnologias similares para melhorar sua experiência.
              Você pode controlar o uso de cookies através das configurações do seu navegador
              ou através do nosso banner de consentimento de cookies.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              6. Compartilhamento de Dados
            </h2>
            <p>
              Não compartilhamos seus dados pessoais com terceiros, exceto quando
              necessário para a prestação dos serviços ou quando exigido por lei.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              7. Segurança dos Dados
            </h2>
            <p>
              Implementamos medidas técnicas e organizacionais apropriadas para
              proteger seus dados pessoais contra acesso não autorizado, alteração,
              divulgação ou destruição.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              8. Contato
            </h2>
            <p>
              Para exercer seus direitos ou esclarecer dúvidas sobre esta Política
              de Privacidade, entre em contato com nosso Encarregado de Proteção de
              Dados (DPO) através do e-mail:{" "}
              <a
                href="mailto:dpo@aicademic.com.br"
                className="text-primary hover:underline"
              >
                dpo@aicademic.com.br
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;