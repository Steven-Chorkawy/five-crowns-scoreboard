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
import { CompositeProvider } from "./services/CompositeProvider";
import { SessionState } from "./state/SessionState";

// The app now talks to the composite (local + Firestore) provider.
const storageProvider = new CompositeProvider();

/** The screen the user is currently looking at. */
type AppView = "setup" | "playing" | "complete" | "history";

/** Status of the most recent cloud save, shown in the header. */
type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Root component and lightweight router. Persists optimistically: state updates
 * first so the UI is instant, then the save runs and reports a cloud status.
 */
function App(): JSX.Element {

  const [view, setView] = useState<AppView>("setup");
  const [activeGame, setActiveGame] = useState<IGame | null>(null);
  const [historyGames, setHistoryGames] = useState<IGame[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  /**
   * Persists a game and updates the save-status indicator. Local always
   * succeeds; a cloud failure shows "error" but the local copy is safe.
   */
  const persist = async (game: IGame): Promise<void> => {
    setSaveStatus("saving");

    try {
      await storageProvider.saveGame(game);
      setSaveStatus("saved");
    }
    catch (error) {
      console.warn("Cloud save failed; kept locally.", error);
      setSaveStatus("error");
    }
  };

  /**
   * On mount, resume whatever game was open on this device.
   */
  useEffect((): void => {
    const activeId: string | null = SessionState.getActiveGameId();

    if (!activeId) {
      return;
    }

    // useEffect cannot be async directly, so use an inner async function.
    const resume = async (): Promise<void> => {
      const savedGame: IGame | null = await storageProvider.loadGame(activeId);

      if (savedGame) {
        setActiveGame(savedGame);
        setView(savedGame.completed ? "complete" : "playing");
      }
      else {
        SessionState.clearActiveGameId();
      }
    };

    void resume();
  }, []);

  /**
   * Creates players and a new game, then starts play.
   */
  const handleStartGame = (playerNames: string[]): void => {
    const players: IPlayer[] = playerNames.map(
      (playerName: string): IPlayer => ({
        id: crypto.randomUUID(),
        name: playerName
      })
    );

    const game: IGame = GameService.createGame(players);

    SessionState.setActiveGameId(game.id);
    setActiveGame(game);
    setView("playing");

    void persist(game);
  };

  /**
   * Applies a round. UI updates first; the save (local + cloud) runs after.
   * On completion the save is the important one - the final scores.
   */
  const handleSaveRound = (scores: IScore[]): void => {
    if (!activeGame) {
      return;
    }

    const updatedGame: IGame = GameService.addRoundScores(activeGame, scores);

    setActiveGame(updatedGame);

    if (updatedGame.completed) {
      setView("complete");
    }

    void persist(updatedGame);
  };

  /**
   * Clears the active game and returns to the New Game screen.
   */
  const handleNewGame = (): void => {
    SessionState.clearActiveGameId();
    setActiveGame(null);
    setSaveStatus("idle");
    setView("setup");
  };

  /**
   * Loads all saved games (cloud-preferred) and shows the History screen.
   */
  const handleShowHistory = (): void => {
    const load = async (): Promise<void> => {
      const games: IGame[] = await storageProvider.getGames();
      setHistoryGames(games);
      setView("history");
    };

    void load();
  };

  /**
   * Resumes (or views) a specific saved game.
   */
  const handleResumeGame = (id: string): void => {
    const resume = async (): Promise<void> => {
      const savedGame: IGame | null = await storageProvider.loadGame(id);

      if (!savedGame) {
        return;
      }

      SessionState.setActiveGameId(id);
      setActiveGame(savedGame);
      setView(savedGame.completed ? "complete" : "playing");
    };

    void resume();
  };

  /**
   * Permanently deletes a saved game from both stores.
   */
  const handleDeleteGame = (id: string): void => {
    const remove = async (): Promise<void> => {
      await storageProvider.deleteGame(id);

      if (activeGame && activeGame.id === id) {
        SessionState.clearActiveGameId();
        setActiveGame(null);
      }

      const games: IGame[] = await storageProvider.getGames();
      setHistoryGames(games);
    };

    void remove();
  };

  /**
   * Maps the current save status to short header text.
   */
  const renderSaveStatus = (): string => {
    switch (saveStatus) {
      case "saving":
        return "Saving...";
      case "saved":
        return "Saved";
      case "error":
        return "Saved on device (offline)";
      default:
        return "";
    }
  };

  const renderHeader = (): JSX.Element => {
    return (
      <header className="app-header">
        <span className="app-header-title">Five Crowns</span>

        <span className="app-header-status">{renderSaveStatus()}</span>

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