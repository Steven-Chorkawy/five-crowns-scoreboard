import { IGame } from "../models/IGame";

/**
 * Defines the operations that every game storage provider must implement.
 *
 * As of Stage 8 these are asynchronous (Promise-returning) so the same contract
 * can be satisfied by both a synchronous store (localStorage) and an
 * asynchronous one (Firestore, or any future REST/SQL backend).
 */
export interface IStorageProvider {
    /**
     * Creates a new game or updates an existing game.
     *
     * @param game - Complete game object to persist.
     */
    saveGame(game: IGame): Promise<void>;

    /**
     * Loads one game by its unique identifier.
     *
     * @param id - Unique identifier of the game to load.
     * @returns The matching game, or null when no matching game exists.
     */
    loadGame(id: string): Promise<IGame | null>;

    /**
     * Returns every saved game.
     *
     * @returns Array containing all saved games.
     */
    getGames(): Promise<IGame[]>;

    /**
     * Permanently removes one game.
     *
     * @param id - Unique identifier of the game to remove.
     */
    deleteGame(id: string): Promise<void>;
}