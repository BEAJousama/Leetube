import { useEffect } from "react";

const usePageMetadata = (pageName: string) => {
  useEffect(() => {
    document.title = `${pageName} - LeeTube`;
  }, [pageName]);
};

export default usePageMetadata;
