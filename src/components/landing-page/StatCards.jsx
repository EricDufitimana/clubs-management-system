'use client';

import Image from 'next/image';

export default function StatCards({ hasImage, imageUrl, bigText, subText, imageClass}) {
  return (
    <div className="bg-mui-secondary-lighter p-4 w-80 h-[250px] rounded-md flex flex-col items-center">
      {/* Fixed height container for image/bigText - takes up available space */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        {hasImage && imageUrl ? (
          <div className="flex justify-center">
            <Image src={imageUrl} alt={bigText || ''} width={200} height={200} className={imageClass}/>
          </div>
        ) : (
          <h3 className="text-center text-[120px] fond-light text-mui-info-dark">{bigText}</h3>
        )}
      </div>
      {/* Subtext always at bottom - fixed position */}
      <div className="text-center mt-auto pb-4">
        <p className='text-mui-info-dark font-light text-medium'>{subText}</p>
      </div>
    </div>
  );
}