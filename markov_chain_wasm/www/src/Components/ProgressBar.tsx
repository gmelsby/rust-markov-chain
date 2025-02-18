import { useMemo } from 'react';

function ProgressBar({ progress, message }: { progress: number, message?: string }) {
  const roundedProgressPercent = useMemo(() => {
    return `${Math.round(progress)}%`;
  }, [progress])
  return (
    <div>
      <div className='w-full bg-neutral-900 rounded-full h-3'>
        <div className='bg-blue-700 h-3 rounded-full transition-all ease-in-out duration-500 animate-pulse' style={{ width: roundedProgressPercent }} />
      </div>
      {message !== undefined && <p>{message}</p>}
    </div>
  )
}

export default ProgressBar;