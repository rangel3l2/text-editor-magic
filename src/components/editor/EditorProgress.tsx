import { Progress } from "@/components/ui/progress";

interface EditorProgressProps {
  progress: number;
  currentLines: number;
  maxLines: number;
  minLines: number;
}

const EditorProgress = ({ progress, currentLines, maxLines, minLines }: EditorProgressProps) => {
  return (
    <div className="space-y-1">
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between items-center text-xs">
        <span className={`${currentLines < minLines ? 'text-red-500' : 'text-gray-500'}`}>
          Mínimo: {minLines} linhas
        </span>
        <span className={`${progress >= 100 ? 'text-red-500' : 'text-gray-500'}`}>
          {currentLines} de {maxLines} linhas ({Math.round(progress)}%)
        </span>
      </div>
    </div>
  );
};

export default EditorProgress;