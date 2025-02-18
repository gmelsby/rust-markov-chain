import { useEffect, useMemo, useState } from 'react';

function ProgressBar({ stepCount, currentStep, message, active }: { stepCount: number, currentStep: number, message?: string, active?: boolean }) {
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
    setProgress((4 * breakpoints[currentStep] + breakpoints[currentStep + 1]) / 5);


    let interval: number | undefined = undefined;
    if (active) {
      interval = setInterval(() => {
        setProgress(p => (p + breakpoints[currentStep + 1]) / 2);
      }, 500);
    }

    return () => {
      clearInterval(interval);
    }
  }, [breakpoints, currentStep, active]);

  // Formats progress so it can be used to update style
  const roundedProgressPercent = useMemo(() => {
    return `${progress}%`;
  }, [progress])

  return (
    <div className={`transition-all ease-in-out ${active ? 'opacity-100' : 'opacity-0'}`}>
      <div className='w-full bg-neutral-900 rounded-full h-3'>
        <div className='bg-blue-700 h-3 rounded-full transition-all duration-100 animate-pulse' style={{ width: roundedProgressPercent }} />
      </div>
      {message !== undefined && <p>{message}</p>}
    </div>
  )
}

export default ProgressBar;