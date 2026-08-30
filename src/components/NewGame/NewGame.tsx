import React, { useState } from "react";

import { Button } from "@progress/kendo-react-buttons";
import { Input } from "@progress/kendo-react-inputs";
import { Card } from "@progress/kendo-react-layout";

import "./NewGame.css";

export interface INewGameProps {
  onStartGame: (playerNames: string[]) => void;
}

export const NewGame: React.FC<INewGameProps> = (props) => {
  const [playerName, setPlayerName] = useState<string>("");
  const [players, setPlayers] = useState<string[]>([]);

  const addPlayer = (): void => {
    const trimmedName: string = playerName.trim();

    if (!trimmedName) {
      return;
    }

    setPlayers(previousPlayers => [
      ...previousPlayers,
      trimmedName
    ]);

    setPlayerName("");
  };

  const removePlayer = (index: number): void => {
    setPlayers(previousPlayers =>
      previousPlayers.filter((_, currentIndex) => currentIndex !== index)
    );
  };

  return (
    <Card className="new-game-card">
      <div className="new-game-content">

        <h2>New Game</h2>

        <div className="player-entry-row">
          <Input
            value={playerName}
            placeholder="Player Name"
            onChange={(event) => {
              setPlayerName(String(event.value ?? ""));
            }}
          />

          <Button
            themeColor="primary"
            onClick={addPlayer}
          >
            Add Player
          </Button>
        </div>

        <div className="players-section">
          <h3>Players</h3>

          {
            players.length === 0 && (
              <p>No players added yet.</p>
            )
          }

          {
            players.map((player, index) => (
              <div
                key={`${player}-${index}`}
                className="player-row"
              >
                <span>{player}</span>

                <Button
                  size="small"
                  fillMode="outline"
                  onClick={() => removePlayer(index)}
                >
                  Remove
                </Button>
              </div>
            ))
          }
        </div>

        <Button
          themeColor="success"
          disabled={players.length < 2}
          onClick={() => props.onStartGame(players)}
        >
          Start Game
        </Button>

      </div>
    </Card>
  );
};
