/**
 * Device-local helper that remembers which game the user currently has open on
 * THIS browser/device.
 *
 * This is intentionally separate from IStorageProvider. The active-game pointer
 * is session/UI state, not shared domain data, so it should never be synced to
 * a future backend database. Only the game records themselves flow through
 * IStorageProvider.
 */
export class SessionState {

    /** localStorage key holding the id of the game currently open on this device. */
    private static readonly ACTIVE_GAME_KEY: string = "five-crowns-active-game-id";

    /**
     * Returns the id of the game the user currently has open, or null if none.
     */
    public static getActiveGameId(): string | null {
        return localStorage.getItem(SessionState.ACTIVE_GAME_KEY);
    }

    /**
     * Records which game the user currently has open on this device.
     *
     * @param id - Unique identifier of the active game.
     */
    public static setActiveGameId(id: string): void {
        localStorage.setItem(SessionState.ACTIVE_GAME_KEY, id);
    }

    /**
     * Clears the active-game pointer (for example when returning to the New Game
     * screen or after deleting the active game).
     */
    public static clearActiveGameId(): void {
        localStorage.removeItem(SessionState.ACTIVE_GAME_KEY);
    }
}