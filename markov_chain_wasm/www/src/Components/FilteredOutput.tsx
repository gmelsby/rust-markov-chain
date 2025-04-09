import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import HiddenTokenContext from '../Context/HiddenTokenContext';

function FilteredOutput({ output }: { output: { str: string }[] }) {


  const {
    hideParentheses,
    hideSquareBrackets,
    hideDoubleQuotes,
    hideSingleQuotes,
    hideUnderscores,
    hideStartEnd,
  } = useContext(HiddenTokenContext);

  // Creates a list of token strings to filter out of output
  const filterList = useMemo(
    () => {
      const parentheses = hideParentheses ? ['(', ')'] : [];
      const squareBrackets = hideSquareBrackets ? ['[', ']'] : [];
      const doubleQuotes = hideDoubleQuotes ? ['"', '“', '”'] : [];
      const singleQuotes = hideSingleQuotes ? ['\'', '’', '`', '‘'] : [];
      const underscores = hideUnderscores ? ['_'] : [];
      const startEnd = hideStartEnd ? ['*start/end*'] : [];
      return [
        ...parentheses,
        ...squareBrackets,
        ...doubleQuotes,
        ...singleQuotes,
        ...underscores,
        ...startEnd,
      ]
    },
    [hideParentheses, hideSquareBrackets, hideDoubleQuotes, hideSingleQuotes, hideUnderscores, hideStartEnd]
  );

  // Function for transforming token into filtered token
  const applyFilterListToToken = useCallback((tk: string) => {
    if (!filterList.includes(tk.trim())) {
      return tk;
    } else if (tk.length == 2) {
      return ' ';
    } else {
      return '';
    }
  }, [filterList]);

  const [cache, setCache] = useState('');
  const [cacheTokenLength, setCacheTokenLength] = useState(0);
  const cacheInterval = 10;

  const cacheBreakpoint = Math.floor(output.length / cacheInterval) * cacheInterval;

  // Causes a recomputation of cache when the list of filtered tokens changes
  useEffect(() => {
    setCache('');
    setCacheTokenLength(0);
  }, [filterList]);

  const recache = useCallback((cacheTkLen: number, newCacheTkLen: number) => {
    if (cacheTkLen > newCacheTkLen) {
      setCache(output.slice(0, newCacheTkLen).map(o => applyFilterListToToken(o.str)).join(''));
    } else if (cacheTkLen < newCacheTkLen) {
      setCache(c =>
        [c, output.slice(cacheTkLen, newCacheTkLen).map(o => applyFilterListToToken(o.str)).join('')].join('')
      );
    }
    setCacheTokenLength(newCacheTkLen);
  }, [applyFilterListToToken, output]);

  // Re-caches when necessary 
  if (cacheBreakpoint !== cacheTokenLength) {
    recache(cacheTokenLength, cacheBreakpoint);
  }

  return (
    <p>{[cache, output.slice(cacheTokenLength).map(o => applyFilterListToToken(o.str)).join('')].join('')}</p>
  );
}

export default FilteredOutput;