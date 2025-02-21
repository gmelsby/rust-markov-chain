import { useEffect, useRef, useState } from "react";

function Button({
  onClick,
  onLongPress,
  longPressOptions,
  children,
  disabled,
  size,
  use,
  active,
  selected,
  buttonRef,
  transparent,
}: {
  onClick: () => void;
  onLongPress?: () => void;
  longPressOptions?: {
    repeat?: boolean;
    longPressMs?: number;
    repeatMs?: number;
  };
  children: React.ReactNode;
  disabled?: boolean;
  size?: "sm";
  use?: "remove";
  active?: boolean;
  selected?: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement>;
  transparent?: boolean;
}) {
  const longPressTimeout = useRef<number | null>(null);
  const longPressRepeatTimeout = useRef<number | null>(null);
  const onLongPressRef = useRef(onLongPress);
  const [isPress, setIsPress] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);

  // Clears out timeouts when component unmounts or is disabled
  useEffect(() => {
    return () => {
      setIsPress(false);
      setIsLongPress(false);
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
      }
      if (longPressRepeatTimeout.current) {
        clearTimeout(longPressRepeatTimeout.current);
      }
    };
  }, [disabled]);

  // Keeps onLongPress that is used in event handlers current
  useEffect(() => {
    onLongPressRef.current = onLongPress;
  }, [onLongPress]);

  const handleMouseDown = () => {
    setIsPress(true);
    if (onLongPressRef.current) {
      longPressTimeout.current = setTimeout(() => {
        setIsLongPress(true);

        if (!longPressOptions?.repeat && onLongPressRef.current) {
          onLongPressRef.current();
        } else {
          // Repeat if repeat is true in longPressOptions
          const repeater = () => {
            if (onLongPressRef.current) {
              onLongPressRef.current();
            }
            longPressRepeatTimeout.current = setTimeout(
              repeater,
              longPressOptions?.repeatMs || 100,
            );
          };

          repeater();
        }
      }, longPressOptions?.longPressMs || 500);
    }
  };

  const handleMouseUp = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
    if (longPressRepeatTimeout.current) {
      clearTimeout(longPressRepeatTimeout.current);
    }
    // Perform click action if pressed but not a long press
    if (isPress && !isLongPress) {
      onClick();
    }
    setIsLongPress(false);
    setIsPress(false);
  };

  const handleMouseLeave = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
    if (longPressRepeatTimeout.current) {
      clearTimeout(longPressRepeatTimeout.current);
    }
    setIsLongPress(false);
    setIsPress(false);
  };

  return (
    <button
      className={`${disabled ? "cursor-not-allowed opacity-50 " : `${use === "remove" ? "hover:bg-red-900" : "hover:bg-blue-950"} cursor-pointer transition active:scale-95 `}
        ${size === "sm" ? "h-8 px-4 " : "h-12 px-6 "}
        ${onLongPress && isPress ? "transition scale-95" : ""}
        items-center justify-center rounded-md font-medium
      outline-blue-600
      ${active ? "not-motion-safe:bg-blue-950 text-neutral-500" : "text-neutral-50"}
      ${selected ? "outline-2 " : ""}
      ${transparent ? 'bg-neutral-950/50' : 'bg-neutral-950'}
} `}
      onMouseDown={disabled || !onLongPress ? undefined : handleMouseDown}
      onMouseUp={disabled || !onLongPress ? undefined : handleMouseUp}
      onMouseLeave={disabled || !onLongPress ? undefined : handleMouseLeave}
      onClick={disabled || onLongPress ? undefined : onClick}
      ref={buttonRef}
    >
      <div className={`${active ? "motion-safe:animate-pulse" : ""}`}>
        {children}
      </div>
    </button>
  );
}

export default Button;
