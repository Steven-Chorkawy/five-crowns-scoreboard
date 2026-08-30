import { IGame } from "../models/IGame";

/**
 * Defines the operations that every game storage provider must implement.
 *
 * The application initially uses localStorage. A future provider can implement
 * this same interface to connect to Firebase, SQL, Azure Functions, or another
 * API without requiring the React components to change.
 */
export interface IStorageProvider {
    /**
     * Creates a new game or updates an existing game.
     *
     * @param game - Complete game object to persist.
     */
    saveGame(game: IGame): void;

    /**
     * Loads one game by its unique identifier.
     *
     * @param id - Unique identifier of the game to load.
     * @returns The matching game, or null when no matching game exists.
     */
    loadGame(id: string): IGame | null;

    /**
     * Returns every saved game.
     *
     * @returns Array containing all saved games.
     */
    getGames(): IGame[];

    /**
     * Permanently removes one game.
     *
     * @param id - Unique identifier of the game to remove.
     */
    deleteGame(id: string): void;
}