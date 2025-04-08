function ToggleBox({ label, isChecked, setIsChecked }: { label: string, isChecked: boolean, setIsChecked: React.Dispatch<React.SetStateAction<boolean>> }) {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked)
  };
  return (
    <label className='inline-flex items-center cursor-pointer'>
      <input type='checkbox' checked={isChecked} onChange={handleCheckboxChange} />
      <span className='text-sm font-medium'>{label}</span>
    </label>
  );
}

export default ToggleBox;