import { useState } from 'react';
import { IconContext } from 'react-icons';
import { MdSettings } from 'react-icons/md';
import Modal from './Modal';

function Settings() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconContext.Provider value={{ size: "25" }}>
        <button className="cursor-pointer" onClick={() => setOpen(true)}><MdSettings /></button>
      </IconContext.Provider>
      <Modal open={open} title='Settings' closeOnClickOut onClose={() => setOpen(false)}>
        <div className='flex flex-col justify-center items-center grow'>Settings</div>
      </Modal >
    </>
  );

}

export default Settings;