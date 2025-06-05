function ToggleBox({ label, isChecked, setIsChecked }: { label: string, isChecked: boolean, setIsChecked: React.Dispatch<React.SetStateAction<boolean>> }) {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked)
  };
  return (
    // Credit to https://flowbite.com/docs/components/toggle/ for majority of toggle styling
    <label className='inline-flex items-center cursor-pointer m-1'>
      <input type='checkbox' checked={isChecked} value="" className="sr-only peer" onChange={handleCheckboxChange} />
      <div className="relative w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 
      dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full 
      rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] 
      after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border 
      after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600">
      </div>
      <span className='ms-3 text-sm font-medium'>{label}</span>
    </label>
  );
}

export default ToggleBox;