import React, { useState } from "react";

import { Button, ChipList } from "@progress/kendo-react-buttons";
import { Input } from "@progress/kendo-react-inputs";
import { Card } from "@progress/kendo-react-layout";

import { IPlayer } from "../../models/IPlayer";

import "./NewGame.css";

/**
 * Props for the NewGame setup screen.
 */
export interface INewGameProps {
  /** Returning players available to pick from the roster. */
  rosterPlayers: IPlayer[];

  /**
   * Creates (or reuses) a roster player by name and returns it with a stable
   * id. Called when the user types a brand-new name.
   */
  onCreatePlayer: (name: string) => Promise<IPlayer>;

  /**
   * Raised when the game starts.
   *
   * @param players - Chosen players (with stable ids) in seating order.
   * @param dealerIndex - Index (into players) of the round-1 dealer.
   */
  onStartGame: (players: IPlayer[], dealerIndex: number) => void;
}

/**
 * Player setup: pick returning players from a ChipList or add a new name, order
 * them to match table seating, and choose the first dealer.
 */
export const NewGame: React.FC<INewGameProps> = (props) => {

  // Players selected for THIS game, in seating order.
  const [seating, setSeating] = useState<IPlayer[]>([]);

  // Stable id of the round-1 dealer.
  const [dealerId, setDealerId] = useState<string | null>(null);

  const [nameInput, setNameInput] = useState<string>("");

  // Roster players not already seated become the available chips.
  const availablePlayers: IPlayer[] = props.rosterPlayers.filter(
    (rosterPlayer) => !seating.some((s) => s.id === rosterPlayer.id)
  );

  /**
   * Adds a player to the seating list and defaults them as dealer if first.
   */
  const addToSeating = (player: IPlayer): void => {
    setSeating((previous) => {
      if (previous.some((p) => p.id === player.id)) {
        return previous;
      }
      return [...previous, player];
    });

    setDealerId((current) => current ?? player.id);
  };

  /**
   * Handles selecting a returning player chip. The ChipList is used as a picker:
   * selecting a chip adds that player and the selection is cleared.
   */
  const handleChipSelect = (event: { value: unknown }): void => {
    // Kendo ChipList onChange returns the selected chip value(s). We treat any
    // selected value as an "add" and immediately clear selection.
    const selectedIds: string[] = Array.isArray(event.value)
      ? (event.value as string[])
      : event.value
        ? [event.value as string]
        : [];

    selectedIds.forEach((id) => {
      const player = availablePlayers.find((p) => p.id === id);
      if (player) {
        addToSeating(player);
      }
    });
  };

  /**
   * Adds a brand-new player by name (persists to the roster, then seats them).
   */
  const addNewName = async (): Promise<void> => {
    const trimmed: string = nameInput.trim();
    if (!trimmed) {
      return;
    }

    const player: IPlayer = await props.onCreatePlayer(trimmed);
    addToSeating(player);
    setNameInput("");
  };

  /**
   * Removes a player from seating; if they were the dealer, reassign to the
   * first remaining player (or null).
   */
  const removeFromSeating = (id: string): void => {
    setSeating((previous) => {
      const remaining = previous.filter((p) => p.id !== id);
      if (dealerId === id) {
        setDealerId(remaining.length > 0 ? remaining[0].id : null);
      }
      return remaining;
    });
  };

  /** Moves a seated player one place earlier. */
  const moveUp = (index: number): void => {
    if (index <= 0) {
      return;
    }
    setSeating((previous) => {
      const next = [...previous];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  /** Moves a seated player one place later. */
  const moveDown = (index: number): void => {
    setSeating((previous) => {
      if (index >= previous.length - 1) {
        return previous;
      }
      const next = [...previous];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  /** Starts the game with the seated players and the chosen dealer index. */
  const startGame = (): void => {
    const dealerIndex: number = Math.max(
      0,
      seating.findIndex((p) => p.id === dealerId)
    );
    props.onStartGame(seating, dealerIndex);
  };

  const canStart: boolean = seating.length >= 2;

  return (
    <Card className="new-game-card">
      <div className="new-game-content">

        <h2>New Game</h2>

        {/* Returning players */}
        <div className="roster-section">
          <h3>Returning players</h3>

          {availablePlayers.length === 0 ? (
            <p className="hint-text">
              No saved players yet. Add players below.
            </p>
          ) : (
            <ChipList
              selection="single"
              onChange={handleChipSelect}
              data={availablePlayers.map((player) => ({
                text: player.name,
                value: player.id
              }))}
            />
          )}
        </div>

        {/* New player entry */}
        <div className="player-entry-row">
          <Input
            value={nameInput}
            placeholder="New player name"
            onChange={(event) => setNameInput(String(event.value ?? ""))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void addNewName();
              }
            }}
          />
          <Button themeColor="primary" onClick={() => void addNewName()}>
            Add
          </Button>
        </div>

        {/* Seating order */}
        <div className="players-section">
          <h3>Players (seating order)</h3>

          {seating.length === 0 && <p className="hint-text">No players added yet.</p>}

          {seating.map((player, index) => {
            const isDealer: boolean = player.id === dealerId;

            return (
              <div
                key={player.id}
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
                    disabled={index === seating.length - 1}
                    onClick={() => moveDown(index)}
                    aria-label="Move down"
                  >
                    ↓
                  </Button>
                  <Button
                    size="small"
                    fillMode={isDealer ? "solid" : "outline"}
                    themeColor={isDealer ? "primary" : "base"}
                    onClick={() => setDealerId(player.id)}
                  >
                    Dealer
                  </Button>
                  <Button
                    size="small"
                    fillMode="outline"
                    themeColor="error"
                    onClick={() => removeFromSeating(player.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Button themeColor="success" disabled={!canStart} onClick={startGame}>
          Start Game
        </Button>

        {!canStart && <p className="hint-text">Add at least 2 players.</p>}

      </div>
    </Card>
  );
};