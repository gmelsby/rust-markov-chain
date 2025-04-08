import { useState } from 'react';
import HiddenTokenContext from './HiddenTokenContext';

const HiddenTokenContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [hideParentheses, setHideParentheses] = useState(false);
  const [hideSquareBrackets, setHideSquareBrackets] = useState(false);
  const [hideSingleQuotes, setHideSingleQuotes] = useState(false);
  const [hideDoubleQuotes, setHideDoubleQuotes] = useState(false);
  const [hideUnderscores, setHideUnderscores] = useState(false);
  const [hideStartEnd, setHideStartEnd] = useState(false);

  return (
    <HiddenTokenContext.Provider value={{
      ...{
        hideParentheses,
        setHideParentheses,
        hideSquareBrackets,
        setHideSquareBrackets,
        hideSingleQuotes,
        setHideSingleQuotes,
        hideDoubleQuotes,
        setHideDoubleQuotes,
        hideUnderscores,
        setHideUnderscores,
        hideStartEnd,
        setHideStartEnd,
      }
    }}>
      {children}
    </HiddenTokenContext.Provider >
  )
};

export default HiddenTokenContextProvider;