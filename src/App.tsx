import { JSX } from "react/jsx-runtime";
import "./App.css";

import { NewGame } from "./components/NewGame/NewGame";

function App(): JSX.Element {

  const handleStartGame = (
    playerNames: string[]
  ): void => {

    console.clear();

    console.log(
      "Starting game with players:",
      playerNames
    );
  };

  return (
    <div className="app-container">
      <NewGame
        onStartGame={handleStartGame}
      />
    </div>
  );
}

export default App;