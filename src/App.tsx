import { JSX, useEffect, useState } from "react";

import { Button } from "@progress/kendo-react-buttons";

import "./App.css";

import { NewGame } from "./components/NewGame/NewGame";
import { RoundScreen } from "./components/RoundScreen/RoundScreen";
import { Standings } from "./components/Standings/Standings";
import { History } from "./components/History/History";

import { IPlayer } from "./models/IPlayer";
import { IGame } from "./models/IGame";
import { IScore } from "./models/IScore";

import { GameService } from "./services/GameService";
import { LocalStorageProvider } from "./services/LocalStorageProvider";
import { SessionState } from "./state/SessionState";

// Created once at module scope rather than on every render.
const storageProvider = new LocalStorageProvider();

/** The screen the user is currently looking at. */
type AppView = "setup" | "playing" | "complete" | "history";

/**
 * Root component and lightweight router.
 *
 * On first load it rehydrates any game the user had open (via the device-local
 * active-game pointer) so a refresh - or reopening the app on an iPhone - never
 * loses an in-progress game.
 */
function App(): JSX.Element {

  const [view, setView] = useState<AppView>("setup");
  const [activeGame, setActiveGame] = useState<IGame | null>(null);
  const [historyGames, setHistoryGames] = useState<IGame[]>([]);

  /**
   * On mount, attempt to resume whatever game was open on this device.
   * Runs once because the dependency array is empty.
   */
  useEffect((): void => {
    const activeId: string | null = SessionState.getActiveGameId();

    if (!activeId) {
      return;
    }

    const savedGame: IGame | null = storageProvider.loadGame(activeId);

    if (savedGame) {
      setActiveGame(savedGame);
      setView(savedGame.completed ? "complete" : "playing");
    }
    else {
      // The pointer referenced a game that no longer exists; clear it.
      SessionState.clearActiveGameId();
    }
  }, []);

  /**
   * Creates players and a new game, persists it, marks it active, and starts play.
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
    SessionState.setActiveGameId(game.id);

    setActiveGame(game);
    setView("playing");
  };

  /**
   * Applies a completed round and persists after every round so progress is
   * never lost. Moves to the standings screen once the game completes.
   */
  const handleSaveRound = (scores: IScore[]): void => {
    if (!activeGame) {
      return;
    }

    const updatedGame: IGame = GameService.addRoundScores(activeGame, scores);

    storageProvider.saveGame(updatedGame);
    setActiveGame(updatedGame);

    if (updatedGame.completed) {
      setView("complete");
    }
  };

  /**
   * Clears the active game and returns to the New Game screen.
   */
  const handleNewGame = (): void => {
    SessionState.clearActiveGameId();
    setActiveGame(null);
    setView("setup");
  };

  /**
   * Loads all saved games and shows the History screen.
   */
  const handleShowHistory = (): void => {
    setHistoryGames(storageProvider.getGames());
    setView("history");
  };

  /**
   * Resumes (or views) a specific saved game from history.
   */
  const handleResumeGame = (id: string): void => {
    const savedGame: IGame | null = storageProvider.loadGame(id);

    if (!savedGame) {
      return;
    }

    SessionState.setActiveGameId(id);
    setActiveGame(savedGame);
    setView(savedGame.completed ? "complete" : "playing");
  };

  /**
   * Permanently deletes a saved game and refreshes the history list. If the
   * deleted game was the active one, the active pointer is cleared too.
   */
  const handleDeleteGame = (id: string): void => {
    storageProvider.deleteGame(id);

    if (activeGame && activeGame.id === id) {
      SessionState.clearActiveGameId();
      setActiveGame(null);
    }

    setHistoryGames(storageProvider.getGames());
  };

  /**
   * Renders the persistent top navigation bar.
   */
  const renderHeader = (): JSX.Element => {
    return (
      <header className="app-header">
        <span className="app-header-title">Five Crowns</span>

        {view === "history" ? (
          <Button fillMode="flat" onClick={handleNewGame}>
            New Game
          </Button>
        ) : (
          <Button fillMode="flat" onClick={handleShowHistory}>
            History
          </Button>
        )}
      </header>
    );
  };

  return (
    <div className="app-container">
      {renderHeader()}

      <main className="app-main">
        {view === "history" && (
          <History
            games={historyGames}
            onResume={handleResumeGame}
            onDelete={handleDeleteGame}
            onBack={handleNewGame}
          />
        )}

        {view === "complete" && activeGame && (
          <Standings game={activeGame} onNewGame={handleNewGame} />
        )}

        {view === "playing" && activeGame && (
          <RoundScreen game={activeGame} onSaveRound={handleSaveRound} />
        )}

        {view === "setup" && (
          <NewGame onStartGame={handleStartGame} />
        )}
      </main>
    </div>
  );
}

export default App;