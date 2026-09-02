/**
 * Aggregated statistics for a single roster player, computed across all games
 * that reference the player's stable id.
 */
export interface IPlayerStats {
    /** Stable roster id of the player. */
    playerId: string;

    /** Display name (from the roster). */
    name: string;

    /** Total games (any state) the player appears in. */
    gamesPlayed: number;

    /** Completed games the player appears in. */
    completedGames: number;

    /**
     * Completed games the player won. A win is having the lowest final total in
     * that game (Five Crowns is lowest-score-wins). Ties count as a win for each
     * tied player.
     */
    gamesWon: number;

    /** gamesWon / completedGames * 100, or 0 when no completed games. */
    winPercentage: number;

    /**
     * Highest (worst) final game total across completed games, or null if none.
     * "Highest score" in Five Crowns is the worst result.
     */
    highestGameTotal: number | null;

    /**
     * Lowest (best) final game total across completed games, or null if none.
     */
    lowestGameTotal: number | null;

    /** Mean final total across completed games, or null if none. */
    averageGameTotal: number | null;

    /** Highest single-round score across all games, or null if none. */
    highestRoundScore: number | null;

    /**
     * Longest run of CONSECUTIVE rounds scored 0 within a single game (best
     * streak across all games). Rounds are ordered by round number.
     */
    longestZeroStreak: number;

    /** Total number of rounds the player scored 0 across all games. */
    totalZeroRounds: number;
}