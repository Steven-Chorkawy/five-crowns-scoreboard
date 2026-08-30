import { IGame } from "../models/IGame";
import { IPlayer } from "../models/IPlayer";

/**
 * Contains Five Crowns business logic.
 */
export class GameService {

  /**
   * Creates a new game.
   */
  public static createGame(
    players: IPlayer[]
  ): IGame {

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
   * Returns the current wild card value.
   */
  public static getWildCard(
    round: number
  ): string {

    const values: string[] = [
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K"
    ];

    return values[round - 1];
  }

  /**
   * Gets a player's total score.
   */
  public static getPlayerTotal(
    game: IGame,
    playerId: string
  ): number {

    return game.scores
      .filter(
        score => score.playerId === playerId
      )
      .reduce(
        (
          total,
          score
        ) => total + score.score,
        0
      );
  }
}