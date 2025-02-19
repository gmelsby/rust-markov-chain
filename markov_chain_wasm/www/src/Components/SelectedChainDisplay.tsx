import { MdCheck, MdOutlineSync } from "react-icons/md";
import Button from "./Button";
import { IconContext } from "react-icons";

function SelectedChainDisplay({
  chain,
  loadedChainList,
  changeWeight,
  removeChain,
  loading,
}: {
  chain: {
    name: string;
    weight: number;
    source: "user" | "server";
  };
  changeWeight: (newWeight: number) => void;
  loadedChainList: string[];
  removeChain: () => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl sm:m-4 my-1.5 sm:mx-2 p-2 border-2 min-w-0 shrink grow lg:grow-0 lg:max-w-xs border-neutral-800/80 bg-neutral-800/60 flex flex-col justify-between">
      <div className="flex flex-row items-center justify-between">
        <div>
          <Button size="sm" use="remove" onClick={() => removeChain()}>
            -
          </Button>
        </div>
        <div className="mr-3">
          <IconContext.Provider value={{ size: "20" }}>
            {loadedChainList.includes(`${chain.name}-${chain.source}`) ? (
              <MdCheck />
            ) : loading ? (
              <MdOutlineSync className="animate-spin" />
            ) : null}
          </IconContext.Provider>
        </div>
      </div>
      <div className="">
        <h3 className="text-center font-bold mt-2 break-words">{chain.name}</h3>
        {chain.source === "user" && (
          <h3 className="text-center font-light text-xs mt-.05">
            (User-Generated)
          </h3>
        )}
      </div>
      <div>
        <input
          className="accent-blue-700 hover:cursor-pointer mx-auto block my-2"
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={chain.weight}
          onChange={(e) => changeWeight(Number(e.target.value))}
        />
        <h3 className="text-center my-2">
          Weight: <span className="font-bold">{chain.weight.toFixed(1)}</span>
        </h3>
      </div>
    </div>
  );
}

export default SelectedChainDisplay;
