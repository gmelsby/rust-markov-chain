import { createContext } from 'react';


const ChainContext = createContext<
  {
    lastUpdated: number;
    setLastUpdated: React.Dispatch<React.SetStateAction<number>>;
    chainVersion: string;
  }>({
    lastUpdated: 0,
    setLastUpdated: () => { },
    chainVersion: '',
  });

export default ChainContext;
