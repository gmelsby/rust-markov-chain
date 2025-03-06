import { ReactNode } from 'react';
import ReactDOM from 'react-dom';
import Button from './Button';

function Modal({ open, onClose, closeOnClickOut, title, children }:
  {
    open: boolean,
    onClose: () => void,
    children: ReactNode,
    closeOnClickOut?: boolean
    title: ReactNode,
  }) {
  if (!open) {
    return null;
  }

  return ReactDOM.createPortal(
    <div onClick={closeOnClickOut ? onClose : () => { }} className="flex justify-center items-center top-0 fixed z-40 h-[100vh] w-[100vw] bg-neutral-950/80">
      <div className='min-w-[95vw] sm:min-w-sm'>
        <div onClick={(e) => { e.stopPropagation() }} className="bg-neutral-800 rounded-2xl border-neutral-600/50 border-2 
        m-5 max-h-[95svh]
        flex flex-col">
          <div className='flex flex-row justify-between items-center border-b-2 border-neutral-400/50 mx-2 py-3'>
            <h2 className='text-xl ml-2 font-semibold'>{title ? title : ''}</h2>
            <Button onClick={onClose} size='sm' use="remove" transparent>x</Button>
          </div>
          {children}
        </div>
      </div>
    </div>
    , document.body);
}

export default Modal;