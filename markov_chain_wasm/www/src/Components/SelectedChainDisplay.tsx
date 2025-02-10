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
    <div className="rounded-2xl border-2 border-neutral-500">
      <Button onClick={() => removeChain()}>-</Button>
      {chain.name}
      <input
        type="range"
        min="0.1"
        max="10"
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
