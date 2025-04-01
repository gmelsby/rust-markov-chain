import { useState } from 'react';
import ChainContext from './ChainContext';

const ChainContextProvider = ({ chainVersion, children }: { chainVersion: string, children: React.ReactNode }) => {
  const [lastUpdated, setLastUpdated] = useState(0);

  return (
    <ChainContext.Provider value={{ lastUpdated, setLastUpdated, chainVersion }}>
      {children}
    </ChainContext.Provider>
  )
};

export default ChainContextProvider;