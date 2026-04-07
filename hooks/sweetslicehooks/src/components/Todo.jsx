import React, { useRef, useState, useEffect } from "react";

const Todo = () => {
  const [task, setTask] = useState("");
  const inputElement = useRef(null);

  useEffect(() => {
    // Reserved for future side effects.
  }, []);

  return (
    <div>
      <h3>Todo List</h3>

      <input
        type="text"
        placeholder="Enter todo item"
        ref={inputElement}
        value={task}
        onChange={(e) => setTask(e.target.value)}
      />

      <input
        type="button"
        value="Clear"
        onClick={() => {
          setTask("");
          inputElement.current.focus();
        }}
      />
    </div>
  );
};

export default Todo;