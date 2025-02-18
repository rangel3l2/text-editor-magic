import { useState, useEffect, useRef } from "react";
// ...existing imports...

const useWorkLoader = (workId: string) => {
  const [work, setWork] = useState(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (!workId || hasLoaded.current) return; // Prevent fetch after initial load
    const loadWork = async () => {
      console.log("Loading work", workId);
      // ...existing code to load work...
      // After a successful load:
      const loadedWorkData = {}; // Replace with actual loaded work data
      setWork(loadedWorkData);
      hasLoaded.current = true;
    };
    loadWork();
  }, [workId]);

  return work;
};

export default useWorkLoader;
