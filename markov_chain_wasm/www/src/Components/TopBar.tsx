import Info from './Info';
import Settings from './Settings';

function TopBar({
  scrollDirection,
  lastKnownScrollY,
}: {
  scrollDirection: "up" | "down";
  lastKnownScrollY: number;
}) {
  const isAtTop = lastKnownScrollY <= 15;
  return (
    <div
      className={`sticky top-0 w-full h-12 z-30 bg-neutral-900
        transition-transform duration-300
        ${scrollDirection === "down" && !isAtTop ? "-translate-y-12" : "translate-y-0"}`}
    >
      <div className="flex flex-row items-center justify-between h-full">
        <div
          className={`mx-3 lg:mx-4 flex flex-col sm:flex-row items-start sm:items-center ${isAtTop ? "" : "cursor-pointer"}`}
          onClick={
            isAtTop
              ? () => { }
              : () => window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
          }
        >
          <h1 className="text-lg font-bold mr-4">YAMChA</h1>
          <h2 className='text-xs sm:text-base font-bold text-neutral-400 whitespace-nowrap'>Yet Another Markov Chain Application</h2>

        </div>
        <div className="flex mx-3 lg:mx-4 gap-3">
          <Info />
          <Settings />
        </div>
      </div>
    </div >
  );
}

export default TopBar;
