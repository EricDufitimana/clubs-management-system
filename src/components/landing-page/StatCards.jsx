'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { useSpring, animated } from "@react-spring/web";
import { useInView } from "react-intersection-observer";
import { useScrollContainer } from "@/contexts/ScrollContainerContext";

function Number({ n, suffix = '' }) {
  const { scrollContainer } = useScrollContainer();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
    root: scrollContainer || null,
    rootMargin: '0px',
  });

  const { number } = useSpring({
    from: { number: 0 },
    to: { number: inView ? n : 0 },
    delay: 400,
    config: { mass: 1, tension: 20, friction: 10 },
  });

  return (
    <animated.div ref={ref} className={"inline"}>
      {number.to((num) => Math.floor(num).toString() + suffix)}
    </animated.div>
  );
}

export default function StatCards({ hasImage, imageUrl, bigText, subText, imageClass, useAnimation = false }) {
  // Extract number and suffix from bigText (e.g., "3x" -> 3 and "x", "90%" -> 90 and "%")
  const parseBigText = (text) => {
    if (!text) return { number: null, suffix: '' };
    const match = text.match(/^(\d+)(.*)$/);
    if (match) {
      return { number: parseInt(match[1], 10), suffix: match[2] };
    }
    return { number: null, suffix: text };
  };

  const { number, suffix } = parseBigText(bigText);

  return (
    <div className="bg-mui-secondary-lighter p-4 w-80 h-[250px] rounded-md flex flex-col items-center">
      {/* Fixed height container for image/bigText - takes up available space */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        {hasImage && imageUrl ? (
          <div className="flex justify-center">
            <Image src={imageUrl} alt={bigText || ''} width={200} height={200} className={imageClass}/>
          </div>
        ) : (
          <h3 className="text-center text-[120px] fond-light text-mui-info-dark">
            {useAnimation && number !== null ? (
              <Number n={number} suffix={suffix} />
            ) : (
              bigText
            )}
          </h3>
        )}
      </div>
      {/* Subtext always at bottom - fixed position */}
      <div className="text-center mt-auto pb-4">
        <p className='text-mui-info-dark font-light text-medium'>{subText}</p>
      </div>
    </div>
  );
}