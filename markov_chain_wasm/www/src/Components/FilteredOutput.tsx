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

  // Function for transforming list of tokens into string of filtered tokens
  const applyFilterListToTokenList = useCallback((tkList: { str: string }[]) => {
    return tkList.map(o => applyFilterListToToken(o.str)).join('');
  }, [applyFilterListToToken]);

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
      setCache(applyFilterListToTokenList(output.slice(0, newCacheTkLen)));
    } else if (cacheTkLen < newCacheTkLen) {
      setCache(c =>
        [c, applyFilterListToTokenList(output.slice(cacheTkLen, newCacheTkLen))].join('')
      );
    }
    setCacheTokenLength(newCacheTkLen);
  }, [applyFilterListToTokenList, output]);

  // Re-caches when necessary 
  if (cacheBreakpoint !== cacheTokenLength) {
    recache(cacheTokenLength, cacheBreakpoint);
  }

  return (
    <p>{[cache, applyFilterListToTokenList(output.slice(cacheTokenLength))].join('')}</p>
  );
}

export default FilteredOutput;