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
  const [overflowing, setOverflowing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const horizontalScrollRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (horizontalScrollRef.current && overflowing) {
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

  // Check for overflow upon resizing and changes to child elements
  useEffect(() => {
    const checkOverflow = () => {
      if (horizontalScrollRef.current) {
        setOverflowing(horizontalScrollRef.current.scrollWidth > horizontalScrollRef.current.clientWidth);
      }
    };

    checkOverflow();

    // Event listener for resizing
    window.addEventListener('resize', checkOverflow);

    // MutationObserver for changes to child elements
    const observer = new MutationObserver(checkOverflow);
    if (horizontalScrollRef.current) {
      observer.observe(horizontalScrollRef.current, { childList: true })
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkOverflow);
    }
  }, []);

  // Set up event listeners for drag scroll
  useEffect(() => {
    const container = horizontalScrollRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('mouseleave', handleMouseUp);
    }
    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('mouseleave', handleMouseUp);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div ref={horizontalScrollRef} onMouseDown={handleMouseDown} className={`p-2 whitespace-nowrap space-x-1 overflow-x-auto hide-scrollbar ${dragging ? 'cursor-grabbing' : overflowing ? 'cursor-grab' : ''}`}>
      {
        buttonList.map(({ content, onClick, key }) =>
          <Button key={key} {...{ onClick }}>{content}</Button>
        )
      }
    </div>
  );
}

export default WordButtons;