function Button({ onClick, children, disabled }:
  {
    onClick: () => void,
    children: React.ReactNode,
    disabled?: boolean,
  }) {
  return (
    <button
      className={`${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-blue-700/20 cursor-pointer transition active:scale-95'}
        h-12 items-center justify-center rounded-md bg-neutral-950 px-6 font-medium text-neutral-50  
      }`}
      onClick={disabled ? () => { } : onClick}
    >
      {children}
    </button>
  );
}

export default Button;