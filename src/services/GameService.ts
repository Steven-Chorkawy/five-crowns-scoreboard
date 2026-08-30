import { IGame } from "../models/IGame";
import { IPlayer } from "../models/IPlayer";
import { IScore } from "../models/IScore";

/**
 * Lightweight, display-ready summary of a game for the History screen.
 */
export interface IGameSummary {
  id: string;
  createdDate: string;
  playerNames: string[];
  completed: boolean;
  currentRound: number;
  winnerName: string | null;
  winnerTotal: number | null;
}

/**
 * One row of chart data: a round number plus each player's cumulative total
 * up to and including that round, keyed by player id.
 *
 * Example: { round: 3, totals: { "abc": 25, "def": 18 } }
 */
export interface IScoreProgressPoint {
  round: number;
  totals: Record<string, number>;
}

/**
 * Contains all Five Crowns business logic. Stateless: every method takes the
 * current game (or its parts) and returns new data. This keeps the React
 * components simple and the rules easy to test.
 */
export class GameService {

  /** Total number of rounds in a Five Crowns game. */
  public static readonly TOTAL_ROUNDS: number = 11;

  // ---------------------------------------------------------------------------
  // Game creation
  // ---------------------------------------------------------------------------

  /**
   * Creates a new, empty game.
   *
   * @param players - Players in seating order.
   * @param dealerStartIndex - Seating index of the round-1 dealer (default 0).
   * @returns A new game on round 1 with no scores.
   */
  public static createGame(
    players: IPlayer[],
    dealerStartIndex: number = 0
  ): IGame {
    return {
      id: crypto.randomUUID(),
      createdDate: new Date().toISOString(),
      players,
      scores: [],
      roundResults: [],
      dealerStartIndex,
      currentRound: 1,
      completed: false
    };
  }

  // ---------------------------------------------------------------------------
  // Round metadata
  // ---------------------------------------------------------------------------

  /**
   * Returns the wild-card rank for a given round, clamped to 1..11 so an
   * out-of-range round can never produce an undefined wild card.
   */
  public static getWildCard(round: number): string {
    const values: string[] = [
      "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"
    ];

    const clampedRound: number = Math.min(
      Math.max(round, 1),
      GameService.TOTAL_ROUNDS
    );

    return values[clampedRound - 1];
  }

  /**
   * Returns the dealer for a given round.
   *
   * Derived from the starting dealer plus one seat of rotation per round:
   * dealerIndex = (dealerStartIndex + round - 1) % playerCount.
   *
   * Defaults dealerStartIndex to 0 for older saves that lack it.
   *
   * @param game - The current game.
   * @param round - Round number (1-based).
   * @returns The dealer for that round, or null if there are no players.
   */
  public static getDealer(game: IGame, round: number): IPlayer | null {
    if (game.players.length === 0) {
      return null;
    }

    const startIndex: number = game.dealerStartIndex ?? 0;
    const dealerIndex: number =
      (startIndex + (round - 1)) % game.players.length;

    return game.players[dealerIndex];
  }

  /**
   * Indicates whether the supplied round is the final round.
   */
  public static isLastRound(round: number): boolean {
    return round >= GameService.TOTAL_ROUNDS;
  }

  // ---------------------------------------------------------------------------
  // Recording rounds (play + edit)
  // ---------------------------------------------------------------------------

  /**
   * Appends a round's scores plus its "went out first" result, and advances
   * (or completes) the game. Use this for PLAYING the current round.
   *
   * @param game - The current game.
   * @param scores - One score per player for the current round.
   * @param wentOutPlayerId - Id of the player who went out first, or null.
   * @returns A new game object with the round applied.
   */
  public static addRoundScores(
    game: IGame,
    scores: IScore[],
    wentOutPlayerId: string | null
  ): IGame {
    const wasLastRound: boolean = GameService.isLastRound(game.currentRound);
    const existingResults = game.roundResults ?? [];

    return {
      ...game,
      scores: [...game.scores, ...scores],
      roundResults: [
        ...existingResults,
        { roundNumber: game.currentRound, wentOutPlayerId }
      ],
      currentRound: wasLastRound ? game.currentRound : game.currentRound + 1,
      completed: wasLastRound ? true : game.completed
    };
  }

  /**
   * Replaces the scores and the "went out" result for a single round WITHOUT
   * advancing the game. Use this for CORRECTING an already-played round.
   *
   * Any existing scores/result for that round are removed and replaced, so this
   * cannot create duplicate rows for the same round.
   *
   * @param game - The current game.
   * @param roundNumber - Round being edited.
   * @param scores - Replacement scores (one per player) for that round.
   * @param wentOutPlayerId - Replacement "went out first" id, or null.
   * @returns A new game with the round corrected; currentRound and completed
   *          are unchanged.
   */
  public static updateRoundScores(
    game: IGame,
    roundNumber: number,
    scores: IScore[],
    wentOutPlayerId: string | null
  ): IGame {
    const otherScores = game.scores.filter(
      (score: IScore): boolean => score.roundNumber !== roundNumber
    );

    const otherResults = (game.roundResults ?? []).filter(
      (item): boolean => item.roundNumber !== roundNumber
    );

    return {
      ...game,
      scores: [...otherScores, ...scores],
      roundResults: [
        ...otherResults,
        { roundNumber, wentOutPlayerId }
      ]
      // currentRound and completed intentionally unchanged.
    };
  }

  // ---------------------------------------------------------------------------
  // Round queries (used by edit/navigation and detail views)
  // ---------------------------------------------------------------------------

  /**
   * Returns true if the given round already has any scores recorded. During
   * play, the only unscored round is the current, not-yet-played round.
   */
  public static hasRoundBeenScored(game: IGame, roundNumber: number): boolean {
    return game.scores.some(
      (score: IScore): boolean => score.roundNumber === roundNumber
    );
  }

  /**
   * Returns a player-id -> score map for the given round (only players who have
   * a recorded score for that round appear).
   */
  public static getRoundScores(
    game: IGame,
    roundNumber: number
  ): Record<string, number> {
    const map: Record<string, number> = {};

    game.scores
      .filter((score: IScore): boolean => score.roundNumber === roundNumber)
      .forEach((score: IScore): void => {
        map[score.playerId] = score.score;
      });

    return map;
  }

  /**
   * Returns the id of the player who went out first in the given round, or null.
   */
  public static getWentOutForRound(
    game: IGame,
    roundNumber: number
  ): string | null {
    const result = (game.roundResults ?? []).find(
      (item): boolean => item.roundNumber === roundNumber
    );

    return result ? result.wentOutPlayerId : null;
  }

  // ---------------------------------------------------------------------------
  // Totals, standings, and stats
  // ---------------------------------------------------------------------------

  /**
   * Cumulative score for one player across every recorded round.
   */
  public static getPlayerTotal(game: IGame, playerId: string): number {
    return game.scores
      .filter((score: IScore): boolean => score.playerId === playerId)
      .reduce((total: number, score: IScore): number => total + score.score, 0);
  }

  /**
   * Number of rounds a player went out first. Defaults to an empty list for
   * older saves that lack roundResults.
   */
  public static getWentOutCount(game: IGame, playerId: string): number {
    return (game.roundResults ?? []).filter(
      (result): boolean => result.wentOutPlayerId === playerId
    ).length;
  }

  /**
   * Standings sorted ascending (lowest total wins in Five Crowns).
   */
  public static getStandings(
    game: IGame
  ): { player: IPlayer; total: number }[] {
    return game.players
      .map((player: IPlayer) => ({
        player,
        total: GameService.getPlayerTotal(game, player.id)
      }))
      .sort((a, b): number => a.total - b.total);
  }

  /**
   * Builds a display-ready summary for the History screen.
   */
  public static getGameSummary(game: IGame): IGameSummary {
    const standings = GameService.getStandings(game);
    const leader = standings.length > 0 ? standings[0] : null;

    return {
      id: game.id,
      createdDate: game.createdDate,
      playerNames: game.players.map((player) => player.name),
      completed: game.completed,
      currentRound: game.currentRound,
      winnerName: game.completed && leader ? leader.player.name : null,
      winnerTotal: game.completed && leader ? leader.total : null
    };
  }

  // ---------------------------------------------------------------------------
  // Charting
  // ---------------------------------------------------------------------------

  /**
   * Builds cumulative-score-per-round data for charting.
   *
   * For each round that has any recorded scores, returns each player's running
   * total up to and including that round. Rounds not yet played are omitted, so
   * the chart works for in-progress games too (it simply stops at the last
   * played round). Treats any absent score as 0, so older saves chart safely.
   *
   * @param game - The game to chart.
   * @returns One point per played round, in round order.
   */
  public static getScoreProgress(game: IGame): IScoreProgressPoint[] {
    // Determine how many rounds actually have scores recorded.
    const playedRounds: number = game.scores.reduce(
      (max: number, score: IScore): number =>
        score.roundNumber > max ? score.roundNumber : max,
      0
    );

    const points: IScoreProgressPoint[] = [];

    // Running total per player id, seeded at 0.
    const running: Record<string, number> = {};
    game.players.forEach((player) => {
      running[player.id] = 0;
    });

    for (let round = 1; round <= playedRounds; round = round + 1) {
      // Add this round's scores to each player's running total.
      game.players.forEach((player) => {
        const entry = game.scores.find(
          (score) =>
            score.playerId === player.id && score.roundNumber === round
        );

        running[player.id] = running[player.id] + (entry?.score ?? 0);
      });

      // Snapshot the running totals for this round (copy, not reference).
      points.push({ round, totals: { ...running } });
    }

    return points;
  }
}
