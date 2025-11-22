import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import RichTextEditor from '../RichTextEditor';
import editorConfig from '@/config/editorConfig';
import CommentsPanel from './sharing/CommentsPanel';
import { WorkComment } from '@/hooks/useWorkSharing';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SectionWithCommentsProps {
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  sectionName: string;
  maxLines?: number;
  minLines?: number;
  placeholder: string;
  comments: WorkComment[];
  currentUserId: string;
  canEdit: boolean;
  canComment: boolean;
  onAddComment: (sectionName: string, text: string) => Promise<void>;
  onUpdateComment: (commentId: string, text: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
}

const SectionWithComments = ({
  title,
  description,
  value,
  onChange,
  sectionName,
  maxLines = 10,
  minLines = 5,
  placeholder,
  comments,
  currentUserId,
  canEdit,
  canComment,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: SectionWithCommentsProps) => {
  const [showComments, setShowComments] = useState(false);
  const sectionCommentCount = comments.filter((c) => c.section_name === sectionName).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            {sectionCommentCount > 0 && <span>{sectionCommentCount}</span>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit ? (
          <RichTextEditor
            value={value}
            onChange={onChange}
            maxLines={maxLines}
            minLines={minLines}
            config={editorConfig}
            placeholder={placeholder}
            sectionName={sectionName}
          />
        ) : (
          <div 
            className="min-h-[100px] p-4 bg-muted/30 rounded border"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        )}
        
        {showComments && (
          <CommentsPanel
            comments={comments}
            sectionName={sectionName}
            currentUserId={currentUserId}
            canComment={canComment}
            onAddComment={onAddComment}
            onUpdateComment={onUpdateComment}
            onDeleteComment={onDeleteComment}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default SectionWithComments;