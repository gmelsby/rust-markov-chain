import Button from './Button';
import { MdUploadFile } from 'react-icons/md';
import { IconContext } from 'react-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WasmMarkovChain, JsLoadMode } from 'markov_chain_wasm';
import TextInput from './TextInput';

function FileDragAndDrop({ exit, chainVersion }: { exit: () => void, chainVersion: string }) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chainName, setChainName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loadMode, setLoadMode] = useState<JsLoadMode>(JsLoadMode.PreserveDoubleNewlines);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) {
      onFileSelect(dropped[0]);
    }
  }

  const handleInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      onFileSelect(e.target.files[0]);
      // Reset file select
      e.target.value = '';
    }
  }

  // Updates chain name when file changes
  useEffect(() => {
    if (file !== null)
      setChainName(file.name.replace(/\.txt$/, ""));
    else
      setChainName("");
  }, [file]);

  // Handle file submission
  const onFileSelect = (f: File) => {
    setFile(f);
  }

  // Handles creation of chain
  const createChain = useCallback(() => {
    if (!file || chainName === "") {
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);

      const lengthTwoChain = new WasmMarkovChain(2);
      lengthTwoChain.create_from_file(uint8Array, loadMode);
      lengthTwoChain.find_paragraph_start();
      await lengthTwoChain.write_chain_to_indexedb(`chains/${chainVersion}`, '2', chainName);

      const lengthThreeChain = new WasmMarkovChain(3);
      lengthThreeChain.create_from_file(uint8Array, loadMode);
      await lengthThreeChain.write_chain_to_indexedb(`chains/${chainVersion}`, '3', chainName);

      exit();

    }

    reader.readAsArrayBuffer(file);
  }, [chainName, chainVersion, exit, file, loadMode]);

  return (
    <>
      <div className="mt-2 ml-2">
        <Button size="sm" use="remove" onClick={file ? () => setFile(null) : exit}>Back</Button>
      </div>
      {file ?
        <>
          <div className="flex flex-col justify-evenly items-center m-2">
            <TextInput value={chainName} setValue={setChainName} />
            <Button onClick={createChain}>Generate chain</Button>
          </div>
        </>
        :
        <>

          <div
            className={`border-2 border-neutral-500 border-dotted rounded-2xl flex-grow m-2 ${dragging ? 'bg-blue-950' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div onClick={handleInputClick} className="cursor-pointer flex flex-col justify-evenly items-center m-2">
              <h3>Drag and drop a .txt file here</h3>
              <div className="my-2">
                <IconContext.Provider value={{ size: '40' }}>
                  <MdUploadFile />
                </IconContext.Provider>
              </div>
              <h3>Or click to select from file browser</h3>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileSelectChange} className="hidden" />
          </div>
        </>
      }
    </>
  );
}

export default FileDragAndDrop;