function Button({ onClick, children, disabled, size }:
  {
    onClick: () => void,
    children: React.ReactNode,
    disabled?: boolean,
    size?: string,
  }) {
  return (
    <button
      className={`${disabled ? 'cursor-not-allowed opacity-50 ' : 'hover:bg-blue-950 cursor-pointer transition active:scale-95 '}
        ${size === 'sm' ? 'h-8 px-4 ' : 'h-12 px-6 '}
        items-center justify-center rounded-md bg-neutral-950 font-medium text-neutral-50  
      }`}
      onClick={disabled ? () => { } : onClick}
    >
      {children}
    </button>
  );
}

export default Button;