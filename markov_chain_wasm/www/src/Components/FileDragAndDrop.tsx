import Button from "./Button";
import { MdUploadFile, MdWarning } from "react-icons/md";
import { IconContext } from "react-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { WasmMarkovChain, JsLoadMode } from "markov_chain_wasm";
import TextInput from "./TextInput";
import ProgressBar from "./ProgressBar";

function FileDragAndDrop({
  back,
  exit,
  chainVersion,
  pushUserChain,
}: {
  back: () => void;
  exit: () => void;
  chainVersion: string;
  pushUserChain: (name: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chainName, setChainName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loadMode, setLoadMode] = useState<
    "PreserveAllNewlines" | "PreserveDoubleNewlines"
  >("PreserveDoubleNewlines");
  const [creating, setCreating] = useState(false);
  const [creationStep, setCreationStep] = useState<number>(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) {
      onFileSelect(dropped[0]);
    }
  };

  const handleInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      onFileSelect(e.target.files[0]);
      // Reset file select
      e.target.value = "";
    }
  };

  // Updates chain name when file changes
  useEffect(() => {
    if (file !== null) setChainName(file.name.replace(/\.txt$/, ""));
    else setChainName("");
  }, [file]);

  // Handle file submission
  const onFileSelect = (f: File) => {
    setFile(f);
  };

  // Handles creation of chain
  const createChain = useCallback(async () => {
    if (!file || chainName === "") {
      return;
    }
    setCreating(true);
    setCreationStep(1);

    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);

      setCreationStep(2);

      const jsLoadMode =
        loadMode === "PreserveAllNewlines"
          ? JsLoadMode.PreserveAllNewlines
          : JsLoadMode.PreserveDoubleNewlines;

      const lengthTwoChain = new WasmMarkovChain(2);
      lengthTwoChain.create_from_file(uint8Array, jsLoadMode);
      lengthTwoChain.find_paragraph_start();
      await lengthTwoChain.write_chain_to_indexedb(
        `chains/${chainVersion}`,
        "2",
        chainName,
      );

      setCreationStep(3);

      const lengthThreeChain = new WasmMarkovChain(3);
      lengthThreeChain.create_from_file(uint8Array, jsLoadMode);
      await lengthThreeChain.write_chain_to_indexedb(
        `chains/${chainVersion}`,
        "3",
        chainName,
      );
      setCreationStep(4);

      pushUserChain(chainName);
      exit();
    };

    reader.readAsArrayBuffer(file);
  }, [chainName, chainVersion, exit, file, loadMode, pushUserChain]);

  return (
    <>
      <div className="mt-2 ml-2">
        <Button
          size="sm"
          use="remove"
          onClick={file ? () => setFile(null) : back}
        >
          Back
        </Button>
      </div>
      {file ? (
        creating ? (
          <div className="flex flex-col justify-evenly items-center m-2">
            <h3 className="m-2 text-center font-medium">
              Creating {chainName}...
            </h3>
            <div className="w-50 m-2">
              <ProgressBar
                stepCount={4}
                currentStep={creationStep}
                active={true}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col flex-grow justify-evenly items-center m-2">
              {!file.name.endsWith(".txt") && (
                <div className="bg-red-500/50 px-3 rounded-2xl font-medium mx-2 flex flex-row items-center justify-center">
                  <MdWarning />
                  <h3 className="ml-2">File extension is not .txt</h3>
                </div>
              )}
              <TextInput value={chainName} setValue={setChainName} />
              <select
                className="h-8 m-2 text-sm font-medium items-center justify-center rounded-md bg-neutral-950 px-4 text-neutral-50 hover:bg-blue-950 cursor-pointer"
                value={loadMode}
                onChange={(e) =>
                  setLoadMode(
                    e.target.value as
                      | "PreserveAllNewlines"
                      | "PreserveDoubleNewlines",
                  )
                }
              >
                <option value="PreserveDoubleNewlines">
                  Ignore single '\n' (default)
                </option>
                <option value="PreserveAllNewlines">Include single '\n'</option>
              </select>
              <div className="m-2">
                <Button size="sm" onClick={createChain}>
                  Generate chain
                </Button>
              </div>
            </div>
          </>
        )
      ) : (
        <>
          <div
            className={`border-2 text-center border-neutral-500 border-dotted rounded-2xl flex-grow cursor-pointer flex flex-col justify-evenly items-center m-2 p-2 ${dragging ? "bg-blue-950" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleInputClick}
          >
            <h3 className="m-2">Drag and drop a .txt file here</h3>
            <div className="my-2">
              <IconContext.Provider value={{ size: "40" }}>
                <MdUploadFile />
              </IconContext.Provider>
            </div>
            <h3 className="m-2">Or click to select from file browser</h3>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelectChange}
            className="hidden"
          />
        </>
      )}
    </>
  );
}

export default FileDragAndDrop;
