import { useContext, useState } from 'react';
import { IconContext } from 'react-icons';
import { MdSettings } from 'react-icons/md';
import Modal from './Modal';
import useChains from '../Hooks/useChains';
import ChainContext from '../Context/ChainContext';
import DeleteChains from './DeleteChains';

function Settings() {
  const [open, setOpen] = useState(false);

  const { chainVersion, lastUpdated } = useContext(ChainContext);

  useChains("user", chainVersion, lastUpdated);

  return (
    <>
      <IconContext.Provider value={{ size: "25" }}>
        <button className="cursor-pointer" onClick={() => setOpen(true)}><MdSettings /></button>
      </IconContext.Provider>
      <Modal open={open} title='Settings' closeOnClickOut onClose={() => setOpen(false)}>
        <div className='flex flex-col justify-around items-center grow overflow-auto'>
          <DeleteChains />
        </div>
      </Modal >
    </>
  );

}

export default Settings;