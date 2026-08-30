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
   * Raised when the CURRENT (not-yet-played) round is saved. Appends scores and
   * advances the game.
   */
  onSaveRound: (scores: IScore[], wentOutPlayerId: string | null) => void;

  /**
   * Raised when an ALREADY-PLAYED round is corrected. Replaces that round's
   * scores without advancing the game.
   */
  onUpdateRound: (
    roundNumber: number,
    scores: IScore[],
    wentOutPlayerId: string | null
  ) => void;
}

/**
 * Score entry and correction screen.
 *
 * Tracks `viewedRound` separately from the game's `currentRound` so the user can
 * page back through played rounds to fix mistakes, then jump back to the current
 * round to continue play.
 */
export const RoundScreen: React.FC<IRoundScreenProps> = (props) => {

  // The round currently displayed. Starts at the game's current round.
  const [viewedRound, setViewedRound] = useState<number>(props.game.currentRound);

  const [roundScores, setRoundScores] =
    useState<Record<string, number>>({});

  const [wentOutPlayerId, setWentOutPlayerId] =
    useState<string | null>(null);

  /**
   * When the game's current round advances (a new round was played), follow it
   * so the user lands on the fresh round. Editing a past round does NOT change
   * currentRound, so this does not fire during edits.
   */
  useEffect((): void => {
    setViewedRound(props.game.currentRound);
  }, [props.game.currentRound]);

  /**
   * Seed the entry fields whenever the viewed round (or underlying scores)
   * changes: from existing scores when editing a played round, or zeros for the
   * current unplayed round.
   */
  useEffect((): void => {
    const existing: Record<string, number> =
      GameService.getRoundScores(props.game, viewedRound);

    const seeded: Record<string, number> = {};
    props.game.players.forEach((player: IPlayer): void => {
      seeded[player.id] = existing[player.id] ?? 0;
    });

    setRoundScores(seeded);
    setWentOutPlayerId(GameService.getWentOutForRound(props.game, viewedRound));
  }, [viewedRound, props.game.players, props.game.scores]);

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
   * Toggles which player went out first; selecting one sets their score to 0
   * (still editable). Clicking the selected player again clears it.
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
   * Builds the scores array for the viewed round.
   */
  const buildScores = (): IScore[] => {
    return props.game.players.map(
      (player: IPlayer): IScore => ({
        playerId: player.id,
        roundNumber: viewedRound,
        score: roundScores[player.id] ?? 0
      })
    );
  };

  // True when the viewed round already has scores (i.e. we are editing).
  const isEditing: boolean =
    GameService.hasRoundBeenScored(props.game, viewedRound);

  /**
   * Primary action. Editing a played round replaces it; the current unplayed
   * round is appended and advances the game.
   */
  const handlePrimary = (): void => {
    const scores: IScore[] = buildScores();

    if (isEditing) {
      props.onUpdateRound(viewedRound, scores, wentOutPlayerId);
    }
    else {
      props.onSaveRound(scores, wentOutPlayerId);
    }
  };

  const goPrev = (): void => {
    setViewedRound((round) => Math.max(1, round - 1));
  };

  const goNext = (): void => {
    setViewedRound((round) => Math.min(props.game.currentRound, round + 1));
  };

  const jumpToCurrent = (): void => {
    setViewedRound(props.game.currentRound);
  };

  const wildCard: string = GameService.getWildCard(viewedRound);
  const dealer: IPlayer | null = GameService.getDealer(props.game, viewedRound);

  const isViewingCurrent: boolean = viewedRound === props.game.currentRound;
  const isFinalCurrentRound: boolean =
    isViewingCurrent && GameService.isLastRound(viewedRound);

  const primaryLabel: string = isEditing
    ? "Update Round"
    : isFinalCurrentRound
      ? "Finish Game"
      : "Save Round";

  return (
    <div className="round-screen">
      <Card className="round-card">
        <div className="round-card-content">

          <div className="round-nav">
            <Button
              size="small"
              fillMode="outline"
              disabled={viewedRound <= 1}
              onClick={goPrev}
            >
              ← Prev
            </Button>

            <span className="round-nav-label">
              Round {viewedRound} of {GameService.TOTAL_ROUNDS}
              {isEditing && !isViewingCurrent && (
                <span className="editing-badge"> Editing</span>
              )}
            </span>

            <Button
              size="small"
              fillMode="outline"
              disabled={viewedRound >= props.game.currentRound}
              onClick={goNext}
            >
              Next →
            </Button>
          </div>

          {!isViewingCurrent && (
            <Button
              size="small"
              themeColor="info"
              fillMode="flat"
              className="jump-current-btn"
              onClick={jumpToCurrent}
            >
              Jump to current round (Round {props.game.currentRound})
            </Button>
          )}

          <h3 className="wild-line">Wild Card: {wildCard}</h3>

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

          <Button themeColor="primary" onClick={handlePrimary}>
            {primaryLabel}
          </Button>

        </div>
      </Card>
    </div>
  );
};