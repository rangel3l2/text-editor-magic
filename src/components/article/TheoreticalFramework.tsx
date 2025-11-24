
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { TheoreticalTopic } from "@/hooks/useArticleContent";
import RichTextEditor from "@/components/RichTextEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface TheoreticalFrameworkProps {
  topics: TheoreticalTopic[];
  onAddTopic: () => void;
  onUpdateTopic: (topicId: string, field: 'title' | 'content', value: string) => void;
  onRemoveTopic: (topicId: string) => void;
}

const TheoreticalFramework = ({
  topics,
  onAddTopic,
  onUpdateTopic,
  onRemoveTopic,
}: TheoreticalFrameworkProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-muted-foreground">
          Referencial Teórico/Fundamentação Teórica
        </h3>
        <Button 
          onClick={onAddTopic}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Tópico
        </Button>
      </div>

      <div className="space-y-4">
        {topics.map((topic, index) => (
          <Card key={topic.id} id={`article-theoretical-${index}`} className="scroll-mt-20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {topic.order}. {topic.title || "Novo Tópico"}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveTopic(topic.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder="Título do tópico..."
                  value={topic.title}
                  onChange={(e) => onUpdateTopic(topic.id, 'title', e.target.value)}
                  className="mb-2"
                />
                <RichTextEditor
                  value={topic.content}
                  onChange={(value) => onUpdateTopic(topic.id, 'content', value)}
                  maxLines={50}
                  minLines={10}
                  sectionName={`tópico ${topic.order}`}
                  placeholder="Digite o conteúdo do tópico..."
                />
              </div>
            </CardContent>
            <Separator />
          </Card>
        ))}

        {topics.length === 0 && (
          <div className="text-center text-muted-foreground p-4">
            Clique em "Adicionar Tópico" para começar seu referencial teórico.
          </div>
        )}
      </div>
    </div>
  );
};

export default TheoreticalFramework;
