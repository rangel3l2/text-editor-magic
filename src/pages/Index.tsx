import TextEditor from "@/components/TextEditor";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Rich Text Editor</h1>
        <p className="text-gray-600 mt-2">Create and edit your documents with ease</p>
      </div>
      <TextEditor />
    </div>
  );
};

export default Index;