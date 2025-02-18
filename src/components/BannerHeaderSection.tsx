import { useState, useEffect } from "react";
import useEditorValidation from "@/hooks/useEditorValidation";
import useBannerContent from "@/hooks/useBannerContent";

const BannerHeaderSection = ({ bannerId, isValidated }) => {
  const { content, error: loadError } = useBannerContent(bannerId, isValidated);
  const [title, setTitle] = useState(content || "");
  const { validationResult, error: validationError } = useEditorValidation(title);

  useEffect(() => {
    if (content) {
      setTitle(content);
    }
  }, [content]);

  useEffect(() => {
    if (validationResult) {
      console.log("Validation response:", validationResult);
    }
  }, [validationResult]);

  useEffect(() => {
    if (validationError) {
      console.error("Error validating content:", validationError);
    }
  }, [validationError]);

  return (
    <div>
      <label>Título</label>
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Digite o título do trabalho"
      />
      {loadError && <p className="error">Erro ao carregar o conteúdo: {loadError.message}</p>}
      {validationError && <p className="error">Erro ao validar o conteúdo: {validationError.message}</p>}
    </div>
  );
};

export default BannerHeaderSection;
