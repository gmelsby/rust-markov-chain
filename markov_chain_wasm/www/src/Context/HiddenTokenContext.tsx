import { createContext } from 'react';

const HiddenTokenContext = createContext<{
  hideParentheses: boolean,
  setHideParentheses: React.Dispatch<React.SetStateAction<boolean>>,
  hideSquareBrackets: boolean,
  setHideSquareBrackets: React.Dispatch<React.SetStateAction<boolean>>,
  hideSingleQuotes: boolean,
  setHideSingleQuotes: React.Dispatch<React.SetStateAction<boolean>>,
  hideDoubleQuotes: boolean,
  setHideDoubleQuotes: React.Dispatch<React.SetStateAction<boolean>>,
  hideUnderscores: boolean,
  setHideUnderscores: React.Dispatch<React.SetStateAction<boolean>>
}>({
  hideParentheses: false,
  setHideParentheses: () => { },
  hideSquareBrackets: false,
  setHideSquareBrackets: () => { },
  hideSingleQuotes: false,
  setHideSingleQuotes: () => { },
  hideDoubleQuotes: false,
  setHideDoubleQuotes: () => { },
  hideUnderscores: false,
  setHideUnderscores: () => { },
});

export default HiddenTokenContext;