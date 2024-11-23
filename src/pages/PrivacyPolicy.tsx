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

          <p>
            Bem-vindo ao AIcademic. Valorizamos sua privacidade e queremos que você
            entenda como lidamos com seus dados. Esta Política de Privacidade
            descreve como coletamos, usamos e protegemos as informações dos
            usuários.
          </p>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              1. Informações que Coletamos
            </h2>
            <p>
              O AIcademic pode coletar informações fornecidas diretamente pelo
              usuário, como nome, e-mail e progresso do trabalho acadêmico.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">
              2. Como Usamos as Informações
            </h2>
            <p>
              As informações coletadas são utilizadas exclusivamente para fornecer
              funcionalidades da ferramenta, como análise de texto, sugestões e
              melhorias na redação.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">3. Proteção de Dados</h2>
            <p>
              Não armazenamos os dados do usuário em servidores externos. Todas as
              informações são salvas localmente no dispositivo do usuário.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">4. Contato</h2>
            <p>
              Para questões de privacidade, entre em contato conosco pelo e-mail:{" "}
              <a href="mailto:contato@aicademic.com" className="text-primary hover:underline">
                contato@aicademic.com
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">5. Atualizações</h2>
            <p>
              Esta política pode ser atualizada periodicamente. Notificaremos os
              usuários sobre mudanças relevantes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;