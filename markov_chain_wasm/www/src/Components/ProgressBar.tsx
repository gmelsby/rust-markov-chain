import { useEffect, useMemo, useState } from 'react';

function ProgressBar({ stepCount, currentStep, message }: { stepCount: number, currentStep: number, message?: string }) {
  const [progress, setProgress] = useState(0);

  const breakpoints = useMemo(() => {
    const result = [];
    const step = 100 / stepCount;
    for (let i = 1; i < stepCount; i += 1) {
      result.push(step * i)
    }
    result.push(100);
    return result;
  }, [stepCount]);

  const roundedProgressPercent = useMemo(() => {
    return `${Math.round(breakpoints[currentStep])}%`;
  }, [currentStep, breakpoints])

  return (
    <div>
      <div className='w-full bg-neutral-900 rounded-full h-3'>
        <div className='bg-blue-700 h-3 rounded-full transition-all ease-in-out duration-700 animate-pulse' style={{ width: roundedProgressPercent }} />
      </div>
      {message !== undefined && <p>{message}</p>}
    </div>
  )
}

export default ProgressBar;