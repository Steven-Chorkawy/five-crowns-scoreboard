/**
 * Score entered for a player in a specific round.
 */
export interface IScore {
  playerId: string;

  roundNumber: number;

  score: number;
}