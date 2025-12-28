"use client";
import { useState, useEffect } from "react";
import { TextGenerateEffect } from "./text-generate-effect";
import { FlipWords } from "./flip-words";
import { cn } from "@/lib/utils";

type TextWithFlipProps = {
  /**
   * The text content. Use [FLIP] as a placeholder where flip words should appear.
   * Example: "Paper attendance is the problem. We're [FLIP] the solution"
   */
  text: string;
  /**
   * Array of words to flip through
   */
  flipWords: string[];
  /**
   * Delay before starting the animation (in seconds)
   */
  delay?: number;
  /**
   * Duration for TextGenerateEffect animation
   */
  duration?: number;
  /**
   * Duration for FlipWords animation (in milliseconds)
   */
  flipDuration?: number;
  /**
   * Filter/blur effect for TextGenerateEffect
   */
  filter?: boolean;
  /**
   * Additional className for the container
   */
  className?: string;
  /**
   * Additional className for FlipWords component
   */
  flipClassName?: string;
};

export const TextWithFlip = ({
  text,
  flipWords,
  delay = 0,
  duration = 0.5,
  flipDuration = 3000,
  filter = true,
  className,
  flipClassName,
}: TextWithFlipProps) => {
  const [showFlipWords, setShowFlipWords] = useState(false);
  
  // Split text by [FLIP] marker
  const parts = text.split("[FLIP]");
  
  // Calculate cumulative word count and timing for delay calculation
  let cumulativeWords = 0;
  let flipWordsDelay = delay;

  // Calculate when flip words should appear
  parts.forEach((part, index) => {
    if (index < parts.length - 1) {
      const partWords = part.trim().split(/\s+/).filter(Boolean).length;
      // Calculate when flip words should appear: after previous text generates + stagger + duration
      flipWordsDelay = index === 0 
        ? delay + (partWords * 0.2) + duration
        : flipWordsDelay + (partWords * 0.2) + duration;
    }
  });

  // Show flip words after calculated delay
  useEffect(() => {
    if (flipWordsDelay > 0) {
      const timer = setTimeout(() => {
        setShowFlipWords(true);
      }, flipWordsDelay * 1000);
      return () => clearTimeout(timer);
    } else {
      setShowFlipWords(true);
    }
  }, [flipWordsDelay]);

  return (
    <span className={cn("inline-block", className)}>
      {parts.map((part, index) => {
        const partWords = part.trim().split(/\s+/).filter(Boolean).length;
        const partDelay = index === 0 ? delay : delay + (cumulativeWords * 0.2);
        
        if (index > 0) {
          cumulativeWords += partWords;
        } else {
          cumulativeWords = partWords;
        }

        return (
          <span key={index}>
            {index === 0 && parts[0].trim() === "" && showFlipWords && (
              <FlipWords
                words={flipWords}
                duration={flipDuration}
                className={flipClassName}
              />
            )}
            {part.trim() && (
              <TextGenerateEffect
                words={part.trim()}
                delay={partDelay}
                duration={duration}
                filter={filter}
              />
            )}
            {index < parts.length - 1 && index > 0 && showFlipWords && (
              <FlipWords
                words={flipWords}
                duration={flipDuration}
                className={flipClassName}
              />
            )}
          </span>
        );
      })}
    </span>
  );
};
