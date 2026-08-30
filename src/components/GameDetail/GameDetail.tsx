import React from "react";

import { Button } from "@progress/kendo-react-buttons";
import { Card } from "@progress/kendo-react-layout";

import { IGame } from "../../models/IGame";
import { IPlayer } from "../../models/IPlayer";
import { GameService } from "../../services/GameService";

import "./GameDetail.css";
import { ScoreProgressChart } from "../ScoreProgressChart/ScoreProgressChart";

/**
 * Props for the read-only Game Detail screen.
 */
export interface IGameDetailProps {
  /** The game to review (completed or in-progress). */
  game: IGame;

  /** Raised to return to the History list. */
  onBack: () => void;
}

/**
 * Read-only review of a single game: header info, the score-progression chart,
 * and a round-by-round breakdown table. Does not enter play mode or modify the
 * game.
 */
export const GameDetail: React.FC<IGameDetailProps> = (props) => {

  const { game } = props;

  // Rounds that actually have scores (works for in-progress games too).
  const playedRounds: number = game.scores.reduce(
    (max, score) => (score.roundNumber > max ? score.roundNumber : max),
    0
  );

  const standings = GameService.getStandings(game);
  const leader = standings.length > 0 ? standings[0] : null;

  return (
    <div className="game-detail-screen">
      <Card className="game-detail-card">
        <div className="game-detail-content">

          <div className="game-detail-header">
            <h2>Game Details</h2>
            <Button fillMode="outline" onClick={props.onBack}>
              Back
            </Button>
          </div>

          <p className="game-detail-meta">
            {new Date(game.createdDate).toLocaleString()}
            {" · "}
            {game.completed
              ? `Completed · Winner: ${leader ? leader.player.name : "-"}`
              : `In progress · Round ${game.currentRound} of ${GameService.TOTAL_ROUNDS}`}
          </p>

          {/* Reused Stage 10 chart. Valid for in-progress games too. */}
          <ScoreProgressChart game={game} />

          {/* Round-by-round breakdown */}
          <h3 className="breakdown-title">Round-by-round</h3>

          {playedRounds === 0 ? (
            <p className="hint-text">No rounds have been scored yet.</p>
          ) : (
            <div className="breakdown-table-wrap">
              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>Rd</th>
                    <th>Wild</th>
                    <th>Dealer</th>
                    {game.players.map((player: IPlayer) => (
                      <th key={player.id}>{player.name}</th>
                    ))}
                    <th>Went out</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: playedRounds }, (_, i) => i + 1).map(
                    (round: number) => {
                      const roundScores = GameService.getRoundScores(game, round);
                      const dealer = GameService.getDealer(game, round);
                      const wentOutId = GameService.getWentOutForRound(game, round);
                      const wentOutPlayer = game.players.find(
                        (p) => p.id === wentOutId
                      );

                      return (
                        <tr key={round}>
                          <td>{round}</td>
                          <td>{GameService.getWildCard(round)}</td>
                          <td>{dealer ? dealer.name : "-"}</td>
                          {game.players.map((player: IPlayer) => (
                            <td key={player.id} className="num-cell">
                              {roundScores[player.id] ?? 0}
                            </td>
                          ))}
                          <td>{wentOutPlayer ? wentOutPlayer.name : "-"}</td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>Total</td>
                    {game.players.map((player: IPlayer) => (
                      <td key={player.id} className="num-cell total-cell">
                        {GameService.getPlayerTotal(game, player.id)}
                      </td>
                    ))}
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

        </div>
      </Card>
    </div>
  );
};