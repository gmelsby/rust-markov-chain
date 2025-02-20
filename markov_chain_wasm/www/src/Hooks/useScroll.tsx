import { useEffect, useState } from "react";

function useScroll() {
  const [lastKnownScrollY, setLastKnownScrollY] = useState(0);
  const [scrollLength, setScrollLength] = useState(0);
  // Set up event listener to determine if user has scrolled up or down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Eliminates case where iOS Safari "scrolls up" with spring behavior from beyond the document end
      if (
        lastKnownScrollY + window.innerHeight <=
        document.documentElement.scrollHeight
      ) {
        setScrollLength(currentScrollY - lastKnownScrollY);
      }
      setLastKnownScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastKnownScrollY]);

  return {
    scrollDirection: scrollLength >= 0 ? "down" : "up",
    lastKnownScrollY,
    scrollLength,
  };
}

export default useScroll;
