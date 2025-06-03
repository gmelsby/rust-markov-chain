import { useContext } from 'react';
import HiddenTokenContext from '../Context/HiddenTokenContext';
import ToggleBox from './ToggleBox';

function ToggleTokens() {

  const {
    hideParentheses,
    setHideParentheses,
    hideSquareBrackets,
    setHideSquareBrackets,
    hideDoubleQuotes,
    setHideDoubleQuotes,
    hideSingleQuotes,
    setHideSingleQuotes,
    hideUnderscores,
    setHideUnderscores,
    hideStartEnd,
    setHideStartEnd,
  } = useContext(HiddenTokenContext);

  return (
    <div className='flex flex-col items-center m-3'>
      <h3 className='font-semibold text-lg my-3'>Toggle Special Token Display in Output</h3>
      <ToggleBox label='Hide Parentheses' isChecked={hideParentheses} setIsChecked={setHideParentheses} />
      <ToggleBox label='Hide Square Brackets' isChecked={hideSquareBrackets} setIsChecked={setHideSquareBrackets} />
      <ToggleBox label='Hide Double Quotes' isChecked={hideDoubleQuotes} setIsChecked={setHideDoubleQuotes} />
      <ToggleBox label='Hide Single Quotes' isChecked={hideSingleQuotes} setIsChecked={setHideSingleQuotes} />
      <ToggleBox label='Hide Underscores' isChecked={hideUnderscores} setIsChecked={setHideUnderscores} />
      <ToggleBox label='Hide Start/End Token' isChecked={hideStartEnd} setIsChecked={setHideStartEnd} />
    </div>
  );
}

export default ToggleTokens;