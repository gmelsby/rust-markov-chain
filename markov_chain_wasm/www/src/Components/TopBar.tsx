
function TopBar() {
  return (
    <div className={`sticky top-0 w-full h-12 z-20 bg-neutral-900`}>
      <div className='flex flex-row items-center justify-between h-full'>
        <div className='cursor-pointer mx-3 lg:mx-4' onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}>
          <h1 className='font-medium'>Markov Chain</h1>
        </div>
      </div>
    </div >
  );
}

export default TopBar;