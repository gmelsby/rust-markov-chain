import Button from './Button';
import { MdUploadFile } from 'react-icons/md';
import { IconContext } from 'react-icons';
import { useRef, useState } from 'react';
import { WasmMarkovChain } from 'markov_chain_wasm';

function FileDragAndDrop({ exit }: { exit: () => void }) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const onFileSelect = (file: File) => {
    console.log(`file dropped: ${file.name}`);

    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);

      const lengthTwoChain = new WasmMarkovChain(2);
      lengthTwoChain.create_from_file(uint8Array);
      lengthTwoChain.find_paragraph_start();
      console.log(`${lengthTwoChain.peek_next_tokens(5).map(tk => tk.get_str())}`)

      const lengthThreeChain = new WasmMarkovChain(3);
      lengthThreeChain.create_from_file(uint8Array);
      console.log('read from file');

    }

    reader.readAsArrayBuffer(file);
  }

  return (
    <div
      className={`border-2 border-neutral-500 border-dotted m-1.5 xl:m-2 p-2 rounded-2xl min-h-45 min-w-45 ${dragging ? 'bg-blue-950' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Button size="sm" use="remove" onClick={exit}>Back</Button>
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
  );
}

export default FileDragAndDrop;