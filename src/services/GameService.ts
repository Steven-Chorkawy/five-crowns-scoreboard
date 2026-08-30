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
 * Contains all Five Crowns business logic. Stateless: every method takes the
 * current game (or its parts) and returns new data.
 */
export class GameService {

  /** Total number of rounds in a Five Crowns game. */
  public static readonly TOTAL_ROUNDS: number = 11;

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

  /**
   * Returns the wild-card rank for a given round, clamped to 1..11.
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
   * Defends against older saved games that lack dealerStartIndex by defaulting
   * it to 0.
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

  /**
   * Appends a round's scores plus its "went out first" result, and advances
   * (or completes) the game.
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
   * Cumulative score for one player across every recorded round.
   */
  public static getPlayerTotal(game: IGame, playerId: string): number {
    return game.scores
      .filter((score: IScore): boolean => score.playerId === playerId)
      .reduce((total: number, score: IScore): number => total + score.score, 0);
  }

  /**
   * Number of rounds a player went out first. Defends against older saves that
   * lack roundResults.
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
}