import { IPlayer } from "./IPlayer";
import { IScore } from "./IScore";
import { IRoundResult } from "./IRoundResult";

/**
 * Represents a complete Five Crowns game.
 */
export interface IGame {
    /** Unique game identifier. */
    id: string;

    /** UTC creation date. */
    createdDate: string;

    /**
     * Players in SEATING ORDER around the table. The array order is meaningful:
     * it drives dealer rotation and represents where people sit.
     */
    players: IPlayer[];

    /** All scores entered for the game. */
    scores: IScore[];

    /** Per-round "who went out first" records. */
    roundResults: IRoundResult[];

    /**
     * Seating index (into players[]) of the dealer for round 1. The dealer for
     * later rounds is derived by rotating one seat per round.
     */
    dealerStartIndex: number;

    /** Active round (1..11). */
    currentRound: number;

    /** Whether all 11 rounds are complete. */
    completed: boolean;
}