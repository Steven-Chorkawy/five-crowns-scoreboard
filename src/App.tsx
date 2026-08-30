import { JSX, useState } from "react";

import "./App.css";

import { NewGame } from "./components/NewGame/NewGame";

import { IPlayer } from "./models/IPlayer";
import { IGame } from "./models/IGame";

import { GameService } from "./services/GameService";
import { LocalStorageProvider } from "./services/LocalStorageProvider";

function App(): JSX.Element {

  const storageProvider = new LocalStorageProvider();

  const [activeGame, setActiveGame] = useState<IGame | null>(null);

  const handleStartGame = (
    playerNames: string[]
  ): void => {

    const players: IPlayer[] = playerNames.map(
      (playerName: string): IPlayer => ({
        id: crypto.randomUUID(),
        name: playerName
      })
    );

    const game: IGame = GameService.createGame(players);

    storageProvider.saveGame(game);

    setActiveGame(game);
  };

  if (activeGame) {
    return (
      <div className="app-container">
        <h1>Game Created</h1>

        <p>
          Players: {activeGame.players.length}
        </p>

        <p>
          Round: {activeGame.currentRound}
        </p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <NewGame
        onStartGame={handleStartGame}
      />
    </div>
  );
}

export default App;