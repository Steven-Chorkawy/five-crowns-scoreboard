import { JSX, useEffect, useState } from "react";

import { Button } from "@progress/kendo-react-buttons";

import "./App.css";

import { NewGame } from "./components/NewGame/NewGame";
import { RoundScreen } from "./components/RoundScreen/RoundScreen";
import { Standings } from "./components/Standings/Standings";
import { History } from "./components/History/History";
import { GameDetail } from "./components/GameDetail/GameDetail";
import { Players } from "./components/Players/Players";
import { PlayerStats } from "./components/PlayerStats/PlayerStats";

import { IPlayerStats } from "./models/IPlayerStats";
import { IPlayer } from "./models/IPlayer";
import { IGame } from "./models/IGame";
import { IScore } from "./models/IScore";

import { GameService } from "./services/GameService";
import { CompositeProvider } from "./services/CompositeProvider";
import { LocalPlayerRepository } from "./services/LocalPlayerRepository";
import { PlayerService } from "./services/PlayerService";
import { SessionState } from "./state/SessionState";

// The app now talks to the composite (local + Firestore) provider.
const storageProvider = new CompositeProvider();

// Roster + player stats. Reuses the existing composite games store for stats.
const playerRepository = new LocalPlayerRepository();
const playerService = new PlayerService(playerRepository, storageProvider);

/** The screen the user is currently looking at. */
type AppView =
  | "setup"
  | "playing"
  | "complete"
  | "history"
  | "detail"
  | "players"
  | "playerStats";

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
  const [detailGame, setDetailGame] = useState<IGame | null>(null);
  const [rosterPlayers, setRosterPlayers] = useState<IPlayer[]>([]);
  // Roster shown on the Players list screen.
  const [statsRoster, setStatsRoster] = useState<IPlayer[]>([]);
  // Currently selected player's computed stats and best game.
  const [selectedStats, setSelectedStats] = useState<IPlayerStats | null>(null);
  const [selectedBestGame, setSelectedBestGame] = useState<IGame | null>(null);
  // Simple loading flag for the async stats fetch.
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

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
   * Loads the roster whenever we return to the setup screen so newly created
   * players appear as chips.
   */
  useEffect((): void => {
    if (view !== "setup") {
      return;
    }

    const load = async (): Promise<void> => {
      setRosterPlayers(await playerService.getAllPlayers());
    };

    void load();
  }, [view]);

  /**
 * Starts a new game from the chosen players (already carrying stable roster
 * ids) in seating order, with the chosen dealer.
 */
  const handleStartGame = (players: IPlayer[], dealerIndex: number): void => {
    const game: IGame = GameService.createGame(players, dealerIndex);

    SessionState.setActiveGameId(game.id);
    setActiveGame(game);
    setView("playing");

    void persist(game);
  };

  /**
   * Applies a round (scores + who went out first), persisting after each round.
   */
  const handleSaveRound = (
    scores: IScore[],
    wentOutPlayerId: string | null
  ): void => {
    if (!activeGame) {
      return;
    }

    const updatedGame: IGame = GameService.addRoundScores(
      activeGame,
      scores,
      wentOutPlayerId
    );

    setActiveGame(updatedGame);

    if (updatedGame.completed) {
      setView("complete");
    }

    void persist(updatedGame);
  };

  /**
  * Applies a correction to an already-played round (replace, do not advance),
  * then persists.
  */
  const handleUpdateRound = (
    roundNumber: number,
    scores: IScore[],
    wentOutPlayerId: string | null
  ): void => {
    if (!activeGame) {
      return;
    }

    const updatedGame: IGame = GameService.updateRoundScores(
      activeGame,
      roundNumber,
      scores,
      wentOutPlayerId
    );

    setActiveGame(updatedGame);
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
   * Opens the read-only detail/chart view for a game from History. Does not
   * touch the active game or the session pointer.
   */
  const handleViewDetails = (id: string): void => {
    const load = async (): Promise<void> => {
      const game: IGame | null = await storageProvider.loadGame(id);

      if (game) {
        setDetailGame(game);
        setView("detail");
      }
    };

    void load();
  };

  /**
   * Returns from the detail view back to the History list.
   */
  const handleBackToHistory = (): void => {
    setDetailGame(null);
    handleShowHistory();
  };

  /**
 * Opens the Players list, loading the current roster.
 */
  const handleShowPlayers = (): void => {
    const load = async (): Promise<void> => {
      setStatsRoster(await playerService.getAllPlayers());
      setView("players");
    };

    void load();
  };

  /**
   * Opens a player's stats screen, fetching their stats and best game.
   */
  const handleSelectPlayer = (id: string): void => {
    const load = async (): Promise<void> => {
      setStatsLoading(true);
      setView("playerStats");

      const [stats, bestGame] = await Promise.all([
        playerService.getPlayerStats(id),
        playerService.getPlayerBestGame(id)
      ]);

      setSelectedStats(stats);
      setSelectedBestGame(bestGame);
      setStatsLoading(false);
    };

    void load();
  };

  /**
   * Returns from stats to the players list.
   */
  const handleBackToPlayers = (): void => {
    setSelectedStats(null);
    setSelectedBestGame(null);
    handleShowPlayers();
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

        <Button fillMode="flat" onClick={handleShowPlayers}>
          Players
        </Button>

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
            onViewDetails={handleViewDetails}
          />
        )}

        {view === "detail" && detailGame && (
          <GameDetail game={detailGame} onBack={handleBackToHistory} />
        )}

        {view === "complete" && activeGame && (
          <Standings game={activeGame} onNewGame={handleNewGame} />
        )}

        {view === "playing" && activeGame && (
          <RoundScreen
            game={activeGame}
            onSaveRound={handleSaveRound}
            onUpdateRound={handleUpdateRound}
          />
        )}

        {view === "setup" && (
          <NewGame
            rosterPlayers={rosterPlayers}
            onCreatePlayer={(name: string) => playerService.addPlayer(name)}
            onStartGame={handleStartGame}
          />
        )}

        {view === "players" && (
          <Players
            players={statsRoster}
            onSelect={handleSelectPlayer}
            onBack={handleNewGame}
          />
        )}

        {view === "playerStats" && (
          statsLoading || !selectedStats ? (
            <p className="loading-line">Loading stats…</p>
          ) : (
            <PlayerStats
              stats={selectedStats}
              bestGame={selectedBestGame}
              onBack={handleBackToPlayers}
            />
          )
        )}
      </main>
    </div>
  );
}

export default App;