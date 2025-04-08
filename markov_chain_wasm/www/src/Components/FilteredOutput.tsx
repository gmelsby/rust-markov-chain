import { useCallback, useContext, useMemo } from 'react';
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
      const startEnd = hideStartEnd ? ['\\*start/end*'] : [];
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

  return (
    <p>{output.map(o => applyFilterListToToken(o.str)).join('')}</p>
  );
}

export default FilteredOutput;