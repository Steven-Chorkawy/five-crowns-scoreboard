import React from "react";

import { Button } from "@progress/kendo-react-buttons";
import { Card } from "@progress/kendo-react-layout";

import { IGame } from "../../models/IGame";
import { GameService } from "../../services/GameService";

import "./Standings.css";

/**
 * Props for the Standings (game complete) screen.
 */
export interface IStandingsProps {
  /** The completed game to summarize. */
  game: IGame;

  /** Raised when the user chooses to start a brand new game. */
  onNewGame: () => void;
}

/**
 * Final results screen shown once all 11 rounds are complete. Players are
 * listed from best (lowest total) to worst, and the leader is highlighted
 * as the winner.
 */
export const Standings: React.FC<IStandingsProps> = (props) => {

  // Sorted ascending: the lowest total is the winner in Five Crowns.
  const standings = GameService.getStandings(props.game);

  return (
    <div className="standings-screen">
      <Card className="standings-card">
        <div className="standings-card-content">

          <h2>Final Standings</h2>

          <ol className="standings-list">
            {standings.map((entry, index: number) => (
              <li
                key={entry.player.id}
                className={index === 0 ? "standings-winner" : ""}
              >
                <span className="standings-position">{index + 1}</span>
                <span className="standings-name">{entry.player.name}</span>
                <strong className="standings-total">{entry.total}</strong>
              </li>
            ))}
          </ol>

          <Button themeColor="primary" onClick={props.onNewGame}>
            New Game
          </Button>

        </div>
      </Card>
    </div>
  );
};