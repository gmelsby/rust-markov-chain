import Button from './Button';
import { useState, useEffect, useRef, useCallback } from 'react';

interface ButtonProps {
  content: string,
  onClick: () => void,
  key: string,
}

function WordButtons({ buttonList, handleBackspace }:
  {
    buttonList: ButtonProps[],
    handleBackspace: () => void,
  }) {
  const [dragging, setDragging] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const horizontalScrollRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedButtonRef = useRef<HTMLButtonElement>(null);

  // Drag to scroll functions
  const handleMouseDown = (e: React.MouseEvent) => {
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
  }, []);

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

  // Keyboard control functions
  const handleMouseEnter = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    // Only do something if no modifiers are held
    if (e.metaKey || e.altKey || e.shiftKey || e.ctrlKey) {
      return;
    }

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (selectedIndex !== null && !e.repeat)
          buttonList[selectedIndex].onClick()
        else if (selectedIndex === null)
          setSelectedIndex(0);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setSelectedIndex(i =>
          i === null ? 0 : Math.max(0, i - 1)
        );
        break;
      case 'ArrowRight':
        e.preventDefault();
        setSelectedIndex(i =>
          i === null ? 0 : Math.min(buttonList.length - 1, i + 1)
        );
        break;
      case 'Backspace':
        e.preventDefault();
        handleBackspace();
        break;
      case 'Escape':
        setSelectedIndex(null);
        break;
    }
  }, [selectedIndex, buttonList, handleBackspace]);


  // Set up event listeners for keyboard controls
  useEffect(() => {
    const container = horizontalScrollRef.current;
    if (container) {
      window.addEventListener('mouseenter', handleMouseEnter);
      window.addEventListener('keydown', handleKeydown);
    }
    return () => {
      if (container) {
        container.removeEventListener('mouseenter', handleMouseEnter);
        window.removeEventListener('keydown', handleKeydown);
      }
    }
  }, [handleMouseEnter, handleKeydown]);

  // Clears keyboard control when a click occurs
  useEffect(() => {
    const clearIndex = () => {
      setSelectedIndex(null);
    };
    window.addEventListener('mousedown', clearIndex);

    return () => {
      window.removeEventListener('mousedown', clearIndex);
    }
  }, [])

  // Handle updating selectedIndex when number of Buttons changes
  useEffect(() => {
    setSelectedIndex(i => i === null ? null : Math.min(i, buttonList.length - 1))
  }, [buttonList.length])

  useEffect(() => {
    if (selectedButtonRef.current && selectedIndex) {
      selectedButtonRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center' })
    }
  }, [buttonList, selectedIndex])

  return (
    <div
      ref={horizontalScrollRef}
      onMouseDown={handleMouseDown}
      className={`p-2 whitespace-nowrap space-x-1 overflow-x-auto hide-scrollbar
      ${dragging ? 'cursor-grabbing' : overflowing ? 'cursor-grab' : ''}`}
    >
      {
        buttonList.map(({ content, onClick, key }, idx) =>
          <Button
            key={key}
            buttonRef={idx === selectedIndex ? selectedButtonRef : undefined} {...{ onClick }}
            selected={idx === selectedIndex}
            onLongPress={() => { }}
          >
            {content}
          </Button>
        )
      }
    </div>
  );
}

export default WordButtons;