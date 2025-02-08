import Button from './Button';
import { useState, useEffect, useRef, useCallback } from 'react';

interface ButtonProps {
  content: string,
  onClick: () => void,
  key: string,
}

function WordButtons({ buttonList }:
  {
    buttonList: ButtonProps[],
  }) {
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const horizontalScrollRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (horizontalScrollRef.current) {
      setDragging(true);
      setStartX(e.pageX - horizontalScrollRef.current.offsetLeft);
      setScrollLeft(horizontalScrollRef.current.scrollLeft);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !horizontalScrollRef.current) {
      return;
    }
    e.preventDefault();
    const currentX = e.pageX - horizontalScrollRef.current.offsetLeft;
    const deltaX = currentX - startX;
    horizontalScrollRef.current.scrollLeft = scrollLeft - deltaX;
  }, [dragging, scrollLeft, startX]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, [setDragging]);

  // Set up event listeners for 
  useEffect(() => {
    const container = horizontalScrollRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div ref={horizontalScrollRef} onMouseDown={handleMouseDown} className="p-2 whitespace-nowrap space-x-1 overflow-x-auto hide-scrollbar cursor-grab">
      {
        buttonList.map(({ content, onClick, key }) =>
          <Button key={key} {...{ onClick }}>{content}</Button>
        )
      }
    </div>
  );
}

export default WordButtons;