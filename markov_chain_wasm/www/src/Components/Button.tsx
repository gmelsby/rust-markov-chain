import { useRef, useState } from 'react';

function Button({ onClick, onLongPress, longPressMs, children, disabled, size }:
  {
    onClick: () => void,
    onLongPress?: () => void,
    longPressMs?: number,
    children: React.ReactNode,
    disabled?: boolean,
    size?: string,
  }) {

  const longPressTimeout = useRef<number | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  const handleMouseDown = () => {
    if (onLongPress) {
      longPressTimeout.current = setTimeout(() => {
        onLongPress();
        setIsLongPress(true);
      }, longPressMs || 500);
    }
  }

  const handleMouseUp = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
    if (!isLongPress) {
      onClick();
    }
    setIsLongPress(false);
  }

  const handleMouseLeave = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
  }

  return (
    <button
      className={`${disabled ? 'cursor-not-allowed opacity-50 ' : 'hover:bg-blue-950 cursor-pointer transition active:scale-95 '}
        ${size === 'sm' ? 'h-8 px-4 ' : 'h-12 px-6 '}
        items-center justify-center rounded-md bg-neutral-950 font-medium text-neutral-50  
      }`}
      onMouseDown={disabled || !onLongPress ? undefined : handleMouseDown}
      onMouseUp={disabled || !onLongPress ? undefined : handleMouseUp}
      onMouseLeave={disabled || !onLongPress ? undefined : handleMouseLeave}
      onClick={disabled || onLongPress ? undefined : onClick}
    >
      {children}
    </button>
  );
}

export default Button;