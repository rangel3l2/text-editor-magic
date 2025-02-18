import { useState, useEffect, useRef } from "react";

const YourComponent = ({ initialData }) => {
  const [institutionName, setInstitutionName] = useState(initialData.institutionName || "");
  const [workTitle, setWorkTitle] = useState(initialData.workTitle || "");
  const [students, setStudents] = useState(initialData.students || "");
  const [teachers, setTeachers] = useState(initialData.teachers || "");
  const [introduction, setIntroduction] = useState(initialData.introduction || "");
  const [objectives, setObjectives] = useState(initialData.objectives || "");
  const [methodology, setMethodology] = useState(initialData.methodology || "");
  const [results, setResults] = useState(initialData.results || "");
  const [conclusion, setConclusion] = useState(initialData.conclusion || "");
  const [references, setReferences] = useState(initialData.references || "");
  const [acknowledgements, setAcknowledgements] = useState(initialData.acknowledgements || "");

  const timers = useRef({});

  const handleValidation = (field, value) => {
    console.log(`Validating ${field}: ${value}`);
    // Adicione aqui a lógica de validação
  };

  const handleChange = (field, value) => {
    switch (field) {
      case "institutionName":
        setInstitutionName(value);
        break;
      case "workTitle":
        setWorkTitle(value);
        break;
      case "students":
        setStudents(value);
        break;
      case "teachers":
        setTeachers(value);
        break;
      case "introduction":
        setIntroduction(value);
        break;
      case "objectives":
        setObjectives(value);
        break;
      case "methodology":
        setMethodology(value);
        break;
      case "results":
        setResults(value);
        break;
      case "conclusion":
        setConclusion(value);
        break;
      case "references":
        setReferences(value);
        break;
      case "acknowledgements":
        setAcknowledgements(value);
        break;
      default:
        break;
    }

    if (timers.current[field]) {
      clearTimeout(timers.current[field]);
    }

    timers.current[field] = setTimeout(() => {
      handleValidation(field, value);
    }, 5000);
  };

  const handleBlur = (field, value) => {
    handleValidation(field, value);
  };

  return (
    <div>
      <div>
        <label>Nome da Instituição</label>
        <textarea
          value={institutionName}
          onChange={(e) => handleChange("institutionName", e.target.value)}
          onBlur={(e) => handleBlur("institutionName", e.target.value)}
          placeholder="Digite o nome completo da instituição (2-3 linhas)"
        />
      </div>
      <div>
        <label>Título do Trabalho</label>
        <textarea
          value={workTitle}
          onChange={(e) => handleChange("workTitle", e.target.value)}
          onBlur={(e) => handleBlur("workTitle", e.target.value)}
          placeholder="Deve ser breve, claro e atrativo, indicando o tema principal do trabalho. (2-3 linhas)"
        />
      </div>
      <div>
        <label>Discentes</label>
        <textarea
          value={students}
          onChange={(e) => handleChange("students", e.target.value)}
          onBlur={(e) => handleBlur("students", e.target.value)}
          placeholder="Liste os nomes dos alunos autores do trabalho. (1-2 linhas)"
        />
      </div>
      <div>
        <label>Docentes</label>
        <textarea
          value={teachers}
          onChange={(e) => handleChange("teachers", e.target.value)}
          onBlur={(e) => handleBlur("teachers", e.target.value)}
          placeholder="Liste os nomes dos professores orientadores, incluindo titulação. (1-2 linhas)"
        />
      </div>
      <div>
        <label>Introdução</label>
        <textarea
          value={introduction}
          onChange={(e) => handleChange("introduction", e.target.value)}
          onBlur={(e) => handleBlur("introduction", e.target.value)}
          placeholder="Apresente uma visão geral do tema, incluindo problematização e objetivos gerais. (7-10 linhas)"
        />
      </div>
      <div>
        <label>Objetivos</label>
        <textarea
          value={objectives}
          onChange={(e) => handleChange("objectives", e.target.value)}
          onBlur={(e) => handleBlur("objectives", e.target.value)}
          placeholder="Informe os objetivos gerais e específicos do trabalho. (3-4 linhas)"
        />
      </div>
      <div>
        <label>Metodologia</label>
        <textarea
          value={methodology}
          onChange={(e) => handleChange("methodology", e.target.value)}
          onBlur={(e) => handleBlur("methodology", e.target.value)}
          placeholder="Explique o método utilizado, destacando as etapas principais. (6-8 linhas)"
        />
      </div>
      <div>
        <label>Resultados e Discussão</label>
        <textarea
          value={results}
          onChange={(e) => handleChange("results", e.target.value)}
          onBlur={(e) => handleBlur("results", e.target.value)}
          placeholder="Apresente os principais resultados e compare com a literatura. (5-7 linhas)"
        />
      </div>
      <div>
        <label>Conclusão</label>
        <textarea
          value={conclusion}
          onChange={(e) => handleChange("conclusion", e.target.value)}
          onBlur={(e) => handleBlur("conclusion", e.target.value)}
          placeholder="Resuma as principais descobertas e contribuições do trabalho. (4-6 linhas)"
        />
      </div>
      <div>
        <label>Referências</label>
        <textarea
          value={references}
          onChange={(e) => handleChange("references", e.target.value)}
          onBlur={(e) => handleBlur("references", e.target.value)}
          placeholder="Liste 2-3 referências mais relevantes, seguindo as normas ABNT. (2-3 linhas)"
        />
      </div>
      <div>
        <label>Agradecimentos (opcional)</label>
        <textarea
          value={acknowledgements}
          onChange={(e) => handleChange("acknowledgements", e.target.value)}
          onBlur={(e) => handleBlur("acknowledgements", e.target.value)}
          placeholder="Agradecimentos (opcional)"
        />
      </div>
    </div>
  );
};

export default YourComponent;
