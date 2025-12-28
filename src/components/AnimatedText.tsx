"use client";



import React from "react";

import { useTextAnimations, TextAnimationType } from "@/hooks/useTextAnimations";
import { useScrollContainer } from "@/contexts/ScrollContainerContext";

interface AnimatedTextProps {

  children: React.ReactNode;

  animation: TextAnimationType;

  className?: string;

  as?: "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

  trigger?: string;

  startTrigger?: string;

  endTrigger?: string;

  scroller?: HTMLElement | (() => HTMLElement | null);

}

export const AnimatedText: React.FC<AnimatedTextProps> = ({

  children,

  animation,

  className = "",

  as: Component = "div",

  trigger,

  startTrigger,

  endTrigger,

  scroller,

}) => {

  const { scrollContainer } = useScrollContainer();

  const elementRef = useTextAnimations({

    animationType: animation,

    trigger,

    startTrigger,

    endTrigger,

    scroller: scroller || scrollContainer || undefined,

  });

  return (

    <Component 

      ref={elementRef as any} 

      className={`${className}`}

    >

      {children}

    </Component>

  );

};

