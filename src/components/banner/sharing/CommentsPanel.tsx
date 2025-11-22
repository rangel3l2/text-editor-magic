import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { WorkComment } from '@/hooks/useWorkSharing';
import { MessageSquare, Edit2, Trash2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommentsPanelProps {
  comments: WorkComment[];
  sectionName: string;
  currentUserId: string;
  canComment: boolean;
  onAddComment: (sectionName: string, text: string) => Promise<void>;
  onUpdateComment: (commentId: string, text: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
}

const CommentsPanel = ({
  comments,
  sectionName,
  currentUserId,
  canComment,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: CommentsPanelProps) => {
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sectionComments = comments.filter((c) => c.section_name === sectionName);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(sectionName, newComment);
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editText.trim()) return;

    setIsSubmitting(true);
    try {
      await onUpdateComment(commentId, editText);
      setEditingId(null);
      setEditText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (comment: WorkComment) => {
    setEditingId(comment.id);
    setEditText(comment.comment_text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageSquare className="w-4 h-4" />
        <span>Comentários ({sectionComments.length})</span>
      </div>

      {/* Lista de comentários */}
      <div className="space-y-3">
        {sectionComments.map((comment) => (
          <div key={comment.id} className="bg-background p-3 rounded-lg border">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{comment.user_email}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(comment.created_at), "dd 'de' MMMM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
              {comment.user_id === currentUserId && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(comment)}
                    disabled={isSubmitting}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteComment(comment.id)}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {editingId === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[60px]"
                  disabled={isSubmitting}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleEdit(comment.id)} disabled={isSubmitting}>
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEdit}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
            )}
          </div>
        ))}
      </div>

      {/* Adicionar novo comentário */}
      {canComment && (
        <div className="space-y-2">
          <Textarea
            placeholder="Adicionar um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            disabled={isSubmitting}
          />
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Comentar
          </Button>
        </div>
      )}

      {!canComment && (
        <p className="text-sm text-muted-foreground text-center">
          Você não tem permissão para comentar nesta seção
        </p>
      )}
    </div>
  );
};

export default CommentsPanel;