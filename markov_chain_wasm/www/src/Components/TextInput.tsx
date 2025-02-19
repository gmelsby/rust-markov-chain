import { useCallback, useEffect, useRef, useState } from "react";
import { MdCheckCircleOutline, MdEdit } from "react-icons/md";

function TextInput({
  value,
  setValue,
}: {
  value: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [editing, setEditing] = useState(false);
  const editBox = useRef<HTMLInputElement>(null);
  const [initialValue, setInitialValue] = useState<string | null>(null);

  // Stores the initial value of value for resetting to
  useEffect(() => {
    if (!initialValue) {
      setInitialValue(value);
    }
  }, [value, initialValue]);

  const endEditing = useCallback(() => {
    const input = editBox.current;
    if (input) input.removeEventListener("focusout", endEditing);
    setEditing(false);
    if (initialValue) {
      setValue((v) => (v.length ? v : initialValue));
    }
  }, [initialValue, setValue]);

  useEffect(() => {
    const input = editBox.current;
    if (!input) {
      return;
    }

    // when 'done' is clicked on iOS keyboard or click outside text box is made
    if (editing) {
      input.focus();
      input.addEventListener("focusout", endEditing);
    }
    return () => {
      if (editing) input.removeEventListener("focusout", endEditing);
    };
  }, [editing, endEditing]);

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      endEditing();
    }
  };

  return (
    <div className="flex flex-row px-4 break-all">
      {editing ? (
        <>
          <input
            onKeyDown={handleEnter}
            ref={editBox}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          ></input>
          <div className="cursor-pointer ml-2 flex flex-col justify-center items-center">
            <MdCheckCircleOutline />
          </div>
        </>
      ) : (
        <>
          <h3 className="font-semibold">{value}</h3>
          <div className="cursor-pointer ml-2" onClick={() => setEditing(true)}>
            <MdEdit />
          </div>
        </>
      )}
    </div>
  );
}

export default TextInput;
