import { useEffect, useMemo, useState } from 'react';

function ProgressBar({ stepCount, currentStep, message }: { stepCount: number, currentStep: number, message?: string }) {
  const [progress, setProgress] = useState(0);

  // Makes an array of all percentage states the bar could be in
  const breakpoints = useMemo(() => {
    const result = [];
    const step = 100 / stepCount;
    for (let i = 0; i < stepCount; i += 1) {
      result.push(step * i)
    }
    result.push(100);
    return result;
  }, [stepCount]);


  useEffect(() => {
    setProgress(breakpoints[currentStep]);

    const interval = setInterval(() => {
      setProgress(p => (p + breakpoints[currentStep + 1]) / 2);
    }, 500);

    return () => {
      clearInterval(interval);
    }

  }, [breakpoints, currentStep]);

  // Formats progress so it can be used to update style
  const roundedProgressPercent = useMemo(() => {
    return `${progress}%`;
  }, [progress])

  return (
    <div>
      <div className='w-full bg-neutral-900 rounded-full h-3'>
        <div className='bg-blue-700 h-3 rounded-full transition-all ease-in-out duration-75 animate-pulse' style={{ width: roundedProgressPercent }} />
      </div>
      {message !== undefined && <p>{message}</p>}
    </div>
  )
}

export default ProgressBar;