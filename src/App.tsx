import { JSX, useState } from "react";

import "./App.css";

import { NewGame } from "./components/NewGame/NewGame";
import { RoundScreen } from "./components/RoundScreen/RoundScreen";
import { Standings } from "./components/Standings/Standings";

import { IPlayer } from "./models/IPlayer";
import { IGame } from "./models/IGame";
import { IScore } from "./models/IScore";

import { GameService } from "./services/GameService";
import { LocalStorageProvider } from "./services/LocalStorageProvider";

// Created once at module scope rather than on every render (small improvement
// over Stage 4, which constructed a new provider inside the component body).
const storageProvider = new LocalStorageProvider();

/**
 * Root component. Acts as a very small router between three screens based on
 * the active game state:
 *   - no active game            -> NewGame
 *   - active game, in progress  -> RoundScreen
 *   - active game, completed    -> Standings
 */
function App(): JSX.Element {

  const [activeGame, setActiveGame] = useState<IGame | null>(null);

  /**
   * Creates players and a new game, persists it, then shows the round screen.
   */
  const handleStartGame = (playerNames: string[]): void => {
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

  /**
   * Applies a completed round, persists after every round so a refresh or an
   * accidental tab close never loses progress, then updates state.
   */
  const handleSaveRound = (scores: IScore[]): void => {
    if (!activeGame) {
      return;
    }

    const updatedGame: IGame = GameService.addRoundScores(activeGame, scores);

    storageProvider.saveGame(updatedGame);
    setActiveGame(updatedGame);
  };

  /**
   * Clears the active game and returns to the New Game screen.
   */
  const handleNewGame = (): void => {
    setActiveGame(null);
  };

  // Completed game -> final standings.
  if (activeGame && activeGame.completed) {
    return (
      <div className="app-container">
        <Standings game={activeGame} onNewGame={handleNewGame} />
      </div>
    );
  }

  // In-progress game -> round entry.
  if (activeGame) {
    return (
      <div className="app-container">
        <RoundScreen game={activeGame} onSaveRound={handleSaveRound} />
      </div>
    );
  }

  // No game yet -> new game setup.
  return (
    <div className="app-container">
      <NewGame onStartGame={handleStartGame} />
    </div>
  );
}

export default App;