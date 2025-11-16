
export default function FeatureCard({ text, lucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center max-w-md">
      <div className="flex justify-center items-center w-24 h-24 bg-mui-primary-main rounded-md">
        {lucideIcon}
      </div>
      <h2 className="mt-auto text-center text-sm pt-2 font-medium text-grey-900 ">{text}</h2>
    </div>
  );
}
