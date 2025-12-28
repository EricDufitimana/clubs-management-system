"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ScrollContainerContextType {
  scrollContainer: HTMLElement | null;
  setScrollContainer: (element: HTMLElement | null) => void;
}

const ScrollContainerContext = createContext<ScrollContainerContextType>({
  scrollContainer: null,
  setScrollContainer: () => {},
});

export const ScrollContainerProvider: React.FC<{ 
  children: ReactNode;
}> = ({ children }) => {
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);

  return (
    <ScrollContainerContext.Provider value={{ scrollContainer, setScrollContainer }}>
      {children}
    </ScrollContainerContext.Provider>
  );
};

export const useScrollContainer = () => useContext(ScrollContainerContext);

