/**
 * Records the outcome metadata for a single round that is not a raw score -
 * specifically, which player went out first (ended the round).
 */
export interface IRoundResult {
    /** The round this result belongs to (1..11). */
    roundNumber: number;

    /**
     * Id of the player who went out first this round, or null if it was not
     * recorded / nobody was marked.
     */
    wentOutPlayerId: string | null;
}