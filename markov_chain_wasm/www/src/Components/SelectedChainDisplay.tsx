import Button from './Button';

function SelectedChainDisplay({ chain, loadedChainList, changeWeight, removeChain }:
  {
    chain:
    {
      name: string,
      weight: number,
    },
    changeWeight: (newWeight: number) => void;
    loadedChainList: string[],
    removeChain: () => void;
  }) {

  return (
    <div className="rounded-2xl m-2 p-2 border-2 border-neutral-500">
      <Button size="sm" use="remove" onClick={() => removeChain()}>-</Button>
      <h3>{chain.name}</h3>
      <input
        type="range"
        min="0.1"
        max="5"
        step="0.1"
        value={chain.weight}
        onChange={e => changeWeight(Number(e.target.value))}
      />
      {chain.weight}
      {loadedChainList.includes(chain.name) ? '✅' : null}
    </div>
  );
}

export default SelectedChainDisplay;
