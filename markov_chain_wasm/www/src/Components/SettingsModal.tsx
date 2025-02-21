import { IconContext } from 'react-icons';
import { MdSettings } from 'react-icons/md';

function SettingsModal() {
  return (
    <>
      <IconContext.Provider value={{ size: "25" }}>
        <MdSettings />
      </IconContext.Provider>
    </>
  );

}

export default SettingsModal;