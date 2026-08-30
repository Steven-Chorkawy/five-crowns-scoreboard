import React, { useEffect, useState } from "react";

import { Button } from "@progress/kendo-react-buttons";
import { NumericTextBox } from "@progress/kendo-react-inputs";
import { NumericTextBoxChangeEvent } from "@progress/kendo-react-inputs";
import { Card } from "@progress/kendo-react-layout";

import { IGame } from "../../models/IGame";
import { IScore } from "../../models/IScore";
import { IPlayer } from "../../models/IPlayer";

import { GameService } from "../../services/GameService";

import "./RoundScreen.css";

/**
 * Props for the RoundScreen component.
 */
export interface IRoundScreenProps {
  /** The active, in-progress game. */
  game: IGame;

  /** Raised with one score per player when the round is saved. */
  onSaveRound: (scores: IScore[]) => void;
}

/**
 * Lets the user enter each player's score for the current round, shows running
 * totals, and saves the round. When the final round is reached the primary
 * button reads "Finish Game" instead of "Save Round".
 */
export const RoundScreen: React.FC<IRoundScreenProps> = (props) => {

  // Score being entered for each player this round, keyed by player id.
  const [roundScores, setRoundScores] =
    useState<Record<string, number>>({});

  /**
   * Reset the per-player entry values to 0 whenever the round changes so the
   * previous round's numbers do not carry over into the next round.
   */
  useEffect((): void => {
    const startingScores: Record<string, number> = {};

    props.game.players.forEach((player: IPlayer): void => {
      startingScores[player.id] = 0;
    });

    setRoundScores(startingScores);
  }, [props.game.currentRound, props.game.players]);

  /**
   * Updates the entry value for a single player.
   *
   * Uses a computed key ([playerId]) so each player's value is stored against
   * their own id. (The original bug used the shorthand `score`, which wrote
   * every player to a single key named "score".)
   */
  const updateScore = (playerId: string, score: number): void => {
    setRoundScores((previousScores) => ({
      ...previousScores,
      [playerId]: score
    }));
  };

  /**
   * Builds an IScore per player for the current round and raises onSaveRound.
   */
  const saveRound = (): void => {
    const scores: IScore[] = props.game.players.map(
      (player: IPlayer): IScore => ({
        playerId: player.id,
        roundNumber: props.game.currentRound,
        score: roundScores[player.id] ?? 0
      })
    );

    props.onSaveRound(scores);
  };

  const wildCard: string = GameService.getWildCard(props.game.currentRound);
  const isFinalRound: boolean = GameService.isLastRound(props.game.currentRound);

  return (
    <div className="round-screen">
      <Card className="round-card">
        <div className="round-card-content">

          <h2>Round {props.game.currentRound} of {GameService.TOTAL_ROUNDS}</h2>
          <h3>Wild Card: {wildCard}</h3>

          <div className="score-entry-section">
            {props.game.players.map((player: IPlayer) => (
              <div key={player.id} className="score-row">
                <span className="player-name">{player.name}</span>

                <NumericTextBox
                  width="150px"
                  min={0}
                  max={500}
                  value={roundScores[player.id] ?? 0}
                  onChange={(event: NumericTextBoxChangeEvent): void => {
                    updateScore(player.id, Number(event.value ?? 0));
                  }}
                />
              </div>
            ))}
          </div>

          <div className="totals-section">
            <h3>Totals</h3>

            {props.game.players.map((player: IPlayer) => (
              <div key={player.id} className="total-row">
                <span>{player.name}</span>
                <strong>
                  {GameService.getPlayerTotal(props.game, player.id)}
                </strong>
              </div>
            ))}
          </div>

          <Button themeColor="primary" onClick={saveRound}>
            {isFinalRound ? "Finish Game" : "Save Round"}
          </Button>

        </div>
      </Card>
    </div>
  );
};