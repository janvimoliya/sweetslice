import React from "react";
import Dashboard from "./components/Dashboard";
import Todo from "./components/Todo";
import TestMemo from "./components/TestMemo";
import { UserContext } from "./context/UserContext";


function App() {
  const user={
    name:"Janvi",
    city:"Rajkot"
  }
  return (
    <>
      Welcome {user.name}
      <hr/>
      <UserContext.Provider value={user}>
      <Todo/>
      </UserContext.Provider>
    </>
    
  );
}
export default App