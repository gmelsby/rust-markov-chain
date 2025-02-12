import Button from './Button';

function SelectedChainDisplay({ chain, loadedChainList, changeWeight, removeChain }:
  {
    chain:
    {
      name: string,
      weight: number,
      source: 'user' | 'server',
    },
    changeWeight: (newWeight: number) => void;
    loadedChainList: string[],
    removeChain: () => void;
  }) {

  return (
    <div className="rounded-2xl m-1 xl:m-2 p-2 border-2 border-neutral-500">
      <Button size="sm" use="remove" onClick={() => removeChain()}>-</Button>
      <h3 className="text-center font-bold mt-2">{chain.name}</h3>
      {chain.source === 'user' && <h3 className="text-center font-light text-xs mt-.05">(User-Generated)</h3>}
      <input
        className='accent-blue-700 hover:cursor-pointer mx-auto block my-2'
        type="range"
        min="0.1"
        max="5"
        step="0.1"
        value={chain.weight}
        onChange={e => changeWeight(Number(e.target.value))}
      />
      <div>
        <h3 className="text-center my-2">Weight: <span className="font-bold">{chain.weight}</span></h3>
      </div>
      <div>
        {loadedChainList.includes(`${chain.name}-${chain.source}`) ? '✅' : null}
      </div>
    </div >
  );
}

export default SelectedChainDisplay;
