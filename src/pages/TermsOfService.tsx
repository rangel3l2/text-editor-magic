import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Termos de Serviço do AIcademic
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Última atualização: 23 de novembro de 2024
          </p>

          <p>
            Bem-vindo ao AIcademic! Estes Termos de Serviço descrevem as regras e condições
            para o uso do aplicativo. Ao acessar ou utilizar o AIcademic, você concorda com
            os termos abaixo. Caso não concorde, não utilize o aplicativo.
          </p>

          <div>
            <h2 className="text-xl font-semibold mb-2">1. Aceitação dos Termos</h2>
            <p>
              Ao utilizar o AIcademic, você concorda em cumprir estes Termos de Serviço.
              A utilização do aplicativo implica que você leu, compreendeu e aceita todas
              as condições estabelecidas.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">2. Descrição do Serviço</h2>
            <p>
              O AIcademic é uma plataforma de orientação virtual projetada para auxiliar
              na redação de trabalhos científicos. Ele oferece recursos para estruturar TCCs,
              verificar coerência, coesão e erros ortográficos, além de fornecer sugestões
              baseadas em inteligência artificial.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">3. Uso Permitido</h2>
            <p>
              O uso do AIcademic é limitado às finalidades acadêmicas e pessoais. O usuário concorda em:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                Não utilizar o aplicativo para criar ou disseminar conteúdo ilegal,
                ofensivo, discriminatório ou que viole direitos de terceiros.
              </li>
              <li>
                Não tentar acessar áreas restritas, modificar ou descompilar o código
                do aplicativo.
              </li>
              <li>
                Não utilizar o aplicativo para fins comerciais sem autorização prévia.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">4. Privacidade e Dados do Usuário</h2>
            <p>
              O AIcademic não armazena informações do usuário em servidores externos.
              Todos os dados gerados e salvos são armazenados localmente no dispositivo
              do usuário. Para mais detalhes, consulte nossa{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">5. Isenção de Garantias</h2>
            <p>
              O AIcademic é fornecido "no estado em que se encontra", sem qualquer
              garantia explícita ou implícita. Não garantimos que:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>
                O serviço será ininterrupto, livre de erros ou atenderá a todas as
                expectativas do usuário.
              </li>
              <li>
                O conteúdo gerado estará livre de inconsistências ou erros acadêmicos.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">6. Limitação de Responsabilidade</h2>
            <p>
              Em nenhuma hipótese, o AIcademic ou seus desenvolvedores serão responsáveis
              por quaisquer danos diretos, indiretos, incidentais ou consequenciais
              decorrentes do uso ou incapacidade de uso do aplicativo.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">7. Alterações no Serviço</h2>
            <p>
              Reservamo-nos o direito de modificar, suspender ou descontinuar o AIcademic
              a qualquer momento, com ou sem aviso prévio.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">8. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo, código, design e funcionalidades do AIcademic são protegidos
              por leis de direitos autorais e outros direitos aplicáveis. É proibido copiar,
              distribuir, modificar ou utilizar qualquer parte do aplicativo sem autorização
              prévia.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">9. Atualizações nos Termos de Serviço</h2>
            <p>
              Estes Termos de Serviço podem ser alterados a qualquer momento. Caso isso
              ocorra, notificaremos os usuários sobre mudanças significativas. A continuidade
              do uso do AIcademic após tais alterações implica a aceitação dos novos termos.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">10. Contato</h2>
            <p>
              Se você tiver dúvidas, sugestões ou reclamações relacionadas a estes Termos
              de Serviço, entre em contato conosco:{" "}
              <a
                href="mailto:rangel.silva@estudante.ifms.edu.br"
                className="text-primary hover:underline"
              >
                rangel.silva@estudante.ifms.edu.br
              </a>
            </p>
          </div>

          <p className="text-center font-semibold mt-8">
            Obrigado por usar o AIcademic!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfService;