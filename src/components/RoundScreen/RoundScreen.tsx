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
  game: IGame;

  /**
   * Raised when the round is saved.
   *
   * @param scores - One score per player.
   * @param wentOutPlayerId - Player who went out first, or null.
   */
  onSaveRound: (scores: IScore[], wentOutPlayerId: string | null) => void;
}

/**
 * Score entry for the current round, showing the dealer and letting the user
 * mark who went out first.
 */
export const RoundScreen: React.FC<IRoundScreenProps> = (props) => {

  const [roundScores, setRoundScores] =
    useState<Record<string, number>>({});

  const [wentOutPlayerId, setWentOutPlayerId] =
    useState<string | null>(null);

  /**
   * Reset per-player values and the went-out selection whenever the round
   * changes.
   */
  useEffect((): void => {
    const startingScores: Record<string, number> = {};

    props.game.players.forEach((player: IPlayer): void => {
      startingScores[player.id] = 0;
    });

    setRoundScores(startingScores);
    setWentOutPlayerId(null);
  }, [props.game.currentRound, props.game.players]);

  /**
   * Updates a single player's entry value (computed key so each player maps to
   * their own id).
   */
  const updateScore = (playerId: string, score: number): void => {
    setRoundScores((previous) => ({
      ...previous,
      [playerId]: score
    }));
  };

  /**
   * Toggles which player went out first. Selecting a player also sets their
   * score to 0 for convenience (going out scores zero); it stays editable.
   * Clicking the already-selected player clears the selection.
   */
  const markWentOut = (playerId: string): void => {
    setWentOutPlayerId((current) => {
      if (current === playerId) {
        return null;
      }

      updateScore(playerId, 0);
      return playerId;
    });
  };

  /**
   * Builds scores + went-out result and raises onSaveRound.
   */
  const saveRound = (): void => {
    const scores: IScore[] = props.game.players.map(
      (player: IPlayer): IScore => ({
        playerId: player.id,
        roundNumber: props.game.currentRound,
        score: roundScores[player.id] ?? 0
      })
    );

    props.onSaveRound(scores, wentOutPlayerId);
  };

  const wildCard: string = GameService.getWildCard(props.game.currentRound);
  const isFinalRound: boolean = GameService.isLastRound(props.game.currentRound);
  const dealer: IPlayer | null =
    GameService.getDealer(props.game, props.game.currentRound);

  return (
    <div className="round-screen">
      <Card className="round-card">
        <div className="round-card-content">

          <h2>Round {props.game.currentRound} of {GameService.TOTAL_ROUNDS}</h2>
          <h3>Wild Card: {wildCard}</h3>

          {dealer && (
            <p className="dealer-line">
              Dealer: <strong>{dealer.name}</strong>
            </p>
          )}

          <div className="score-entry-section">
            {props.game.players.map((player: IPlayer) => {
              const isWentOut: boolean = wentOutPlayerId === player.id;

              return (
                <div
                  key={player.id}
                  className={`score-row ${isWentOut ? "went-out" : ""}`}
                >
                  <span className="player-name">{player.name}</span>

                  <div className="score-row-controls">
                    <Button
                      size="small"
                      fillMode={isWentOut ? "solid" : "outline"}
                      themeColor={isWentOut ? "success" : "base"}
                      onClick={() => markWentOut(player.id)}
                      title="Mark this player as going out first"
                    >
                      Went out
                    </Button>

                    <NumericTextBox
                      width="120px"
                      min={0}
                      max={500}
                      value={roundScores[player.id] ?? 0}
                      onChange={(event: NumericTextBoxChangeEvent): void => {
                        updateScore(player.id, Number(event.value ?? 0));
                      }}
                    />
                  </div>
                </div>
              );
            })}
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