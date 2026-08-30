import { IGame } from "../models/IGame";
import { IPlayer } from "../models/IPlayer";
import { IScore } from "../models/IScore";

/**
 * Lightweight, display-ready summary of a game for the History screen.
 * Avoids recalculating standings in the component layer.
 */
export interface IGameSummary {
  /** Unique game identifier. */
  id: string;

  /** ISO creation date of the game. */
  createdDate: string;

  /** Names of every player in the game. */
  playerNames: string[];

  /** Whether all 11 rounds have been completed. */
  completed: boolean;

  /** The round the game is currently on (relevant for in-progress games). */
  currentRound: number;

  /** Winner's name when completed; otherwise null. */
  winnerName: string | null;

  /** Winner's total when completed; otherwise null. */
  winnerTotal: number | null;
}

/**
 * Contains all Five Crowns business logic.
 *
 * The service is intentionally stateless: every method takes the current game
 * (or its parts) and returns new data. This keeps the React components simple
 * and makes the rules easy to unit test later.
 */
export class GameService {

  /**
   * Total number of rounds in a Five Crowns game.
   * Round 1 deals 3 cards (3s wild) through round 11 which deals 13 (Kings wild).
   */
  public static readonly TOTAL_ROUNDS: number = 11;

  /**
   * Creates a new, empty game for the supplied players.
   *
   * @param players - Players participating in the game.
   * @returns A new game positioned on round 1 with no scores recorded.
   */
  public static createGame(players: IPlayer[]): IGame {
    return {
      id: crypto.randomUUID(),
      createdDate: new Date().toISOString(),
      players,
      scores: [],
      currentRound: 1,
      completed: false
    };
  }

  /**
   * Returns the wild-card rank for a given round.
   *
   * The round value is clamped to the valid 1..11 range so that an unexpected
   * out-of-range round can never produce an undefined wild card.
   *
   * @param round - Round number (expected 1..11).
   * @returns The wild-card rank label for that round.
   */
  public static getWildCard(round: number): string {
    const values: string[] = [
      "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"
    ];

    // Clamp to 1..TOTAL_ROUNDS, then convert to a 0-based index.
    const clampedRound: number = Math.min(
      Math.max(round, 1),
      GameService.TOTAL_ROUNDS
    );

    return values[clampedRound - 1];
  }

  /**
   * Indicates whether the supplied round is the final round.
   *
   * @param round - Round number to test.
   * @returns True when the round is the last round of the game.
   */
  public static isLastRound(round: number): boolean {
    return round >= GameService.TOTAL_ROUNDS;
  }

  /**
   * Appends a round's scores and advances (or completes) the game.
   *
   * When the current round is the final round the game is marked completed and
   * the round counter is NOT advanced beyond the last round.
   *
   * @param game - The current game.
   * @param scores - One score per player for the current round.
   * @returns A new game object with the scores applied.
   */
  public static addRoundScores(game: IGame, scores: IScore[]): IGame {
    const wasLastRound: boolean = GameService.isLastRound(game.currentRound);

    return {
      ...game,
      scores: [...game.scores, ...scores],
      // Only advance the round when the game is not already on the final round.
      currentRound: wasLastRound ? game.currentRound : game.currentRound + 1,
      // The game is finished once scores for the final round are recorded.
      completed: wasLastRound ? true : game.completed
    };
  }

  /**
   * Calculates a single player's cumulative score across every recorded round.
   *
   * @param game - The current game.
   * @param playerId - Unique identifier of the player.
   * @returns The player's running total.
   */
  public static getPlayerTotal(game: IGame, playerId: string): number {
    return game.scores
      .filter((score: IScore): boolean => score.playerId === playerId)
      .reduce((total: number, score: IScore): number => total + score.score, 0);
  }

  /**
   * Produces the current standings sorted from best to worst.
   *
   * IMPORTANT: Five Crowns is won by the LOWEST total, so this sorts ascending.
   *
   * @param game - The current game.
   * @returns Players paired with their totals, lowest total first.
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
   *
   * For completed games the winner is the player with the LOWEST total
   * (Five Crowns is a lowest-score-wins game), taken from getStandings.
   *
   * @param game - The game to summarize.
   * @returns A summary suitable for list display.
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
}