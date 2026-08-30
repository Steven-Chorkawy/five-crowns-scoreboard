import React, { useState } from "react";

import { Button } from "@progress/kendo-react-buttons";
import { Input } from "@progress/kendo-react-inputs";
import { Card } from "@progress/kendo-react-layout";

import "./NewGame.css";

/**
 * Props for the NewGame setup screen.
 */
export interface INewGameProps {
  /**
   * Raised when the game starts.
   *
   * @param playerNames - Names in final seating order.
   * @param dealerIndex - Index (into playerNames) of the round-1 dealer.
   */
  onStartGame: (playerNames: string[], dealerIndex: number) => void;
}

/**
 * A player being drafted during setup. Uses a temporary id so reordering and
 * dealer selection stay correct even if two players share a name.
 */
interface IDraftPlayer {
  tempId: string;
  name: string;
}

/**
 * Player setup: add names, reorder to match table seating, and pick the first
 * dealer. Requires at least two players to start.
 */
export const NewGame: React.FC<INewGameProps> = (props) => {

  const [players, setPlayers] = useState<IDraftPlayer[]>([]);
  const [playerName, setPlayerName] = useState<string>("");
  const [dealerTempId, setDealerTempId] = useState<string | null>(null);

  /**
   * Adds a trimmed, non-empty name. The first player added becomes the default
   * dealer (changeable).
   */
  const addPlayer = (): void => {
    const trimmedName: string = playerName.trim();

    if (!trimmedName) {
      return;
    }

    const newPlayer: IDraftPlayer = {
      tempId: crypto.randomUUID(),
      name: trimmedName
    };

    setPlayers((previous) => [...previous, newPlayer]);

    // Default the dealer to the first player added.
    setDealerTempId((current) => current ?? newPlayer.tempId);

    setPlayerName("");
  };

  /**
   * Removes a player. If the removed player was the dealer, the dealer resets
   * to the first remaining player (or null if none remain).
   */
  const removePlayer = (tempId: string): void => {
    setPlayers((previous) => {
      const remaining = previous.filter((p) => p.tempId !== tempId);

      if (dealerTempId === tempId) {
        setDealerTempId(remaining.length > 0 ? remaining[0].tempId : null);
      }

      return remaining;
    });
  };

  /**
   * Swaps a player with the one above it (moves them earlier in seating order).
   */
  const moveUp = (index: number): void => {
    if (index <= 0) {
      return;
    }

    setPlayers((previous) => {
      const next = [...previous];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  /**
   * Swaps a player with the one below it (moves them later in seating order).
   */
  const moveDown = (index: number): void => {
    setPlayers((previous) => {
      if (index >= previous.length - 1) {
        return previous;
      }

      const next = [...previous];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  /**
   * Marks a player as the round-1 dealer.
   */
  const setDealer = (tempId: string): void => {
    setDealerTempId(tempId);
  };

  /**
   * Starts the game, passing names in order and the dealer's index.
   */
  const startGame = (): void => {
    const names: string[] = players.map((p) => p.name);

    // Resolve dealer temp id to an index; default to 0 if somehow unset.
    const dealerIndex: number = Math.max(
      0,
      players.findIndex((p) => p.tempId === dealerTempId)
    );

    props.onStartGame(names, dealerIndex);
  };

  const canStart: boolean = players.length >= 2;

  return (
    <Card className="new-game-card">
      <div className="new-game-content">

        <h2>New Game</h2>

        <div className="player-entry-row">
          <Input
            value={playerName}
            placeholder="Player Name"
            onChange={(event) => setPlayerName(String(event.value ?? ""))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                addPlayer();
              }
            }}
          />
          <Button themeColor="primary" onClick={addPlayer}>
            Add Player
          </Button>
        </div>

        <div className="players-section">
          <h3>Players (seating order)</h3>

          {players.length === 0 && <p>No players added yet.</p>}

          {players.map((player, index) => {
            const isDealer: boolean = player.tempId === dealerTempId;

            return (
              <div
                key={player.tempId}
                className={`draft-player-row ${isDealer ? "is-dealer" : ""}`}
              >
                <span className="draft-seat">{index + 1}</span>

                <span className="draft-name">{player.name}</span>

                {isDealer && <span className="dealer-badge">Dealer</span>}

                <div className="draft-actions">
                  <Button
                    size="small"
                    fillMode="outline"
                    disabled={index === 0}
                    onClick={() => moveUp(index)}
                    aria-label="Move up"
                  >
                    ↑
                  </Button>

                  <Button
                    size="small"
                    fillMode="outline"
                    disabled={index === players.length - 1}
                    onClick={() => moveDown(index)}
                    aria-label="Move down"
                  >
                    ↓
                  </Button>

                  <Button
                    size="small"
                    fillMode={isDealer ? "solid" : "outline"}
                    themeColor={isDealer ? "primary" : "base"}
                    onClick={() => setDealer(player.tempId)}
                  >
                    Dealer
                  </Button>

                  <Button
                    size="small"
                    fillMode="outline"
                    themeColor="error"
                    onClick={() => removePlayer(player.tempId)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          themeColor="success"
          disabled={!canStart}
          onClick={startGame}
        >
          Start Game
        </Button>

        {!canStart && <p className="hint-text">Add at least 2 players.</p>}

      </div>
    </Card>
  );
};