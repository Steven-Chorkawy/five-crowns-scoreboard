import { IGame } from "../models/IGame";
import { IStorageProvider } from "./IStorageProvider";

/**
 * Stores Five Crowns games in the current browser's localStorage.
 *
 * This provider is intended for the proof of concept. It implements
 * IStorageProvider so that it can be replaced later by a database-backed
 * provider without changing the React components.
 */
export class LocalStorageProvider implements IStorageProvider {
    private readonly _storageKey: string = "five-crowns-games";

    /**
     * Returns all games currently stored in localStorage.
     *
     * @returns Array containing all saved games. Returns an empty array when no
     * games have been saved or when the stored value cannot be parsed.
     */
    public getGames(): IGame[] {
        const value: string | null = localStorage.getItem(this._storageKey);

        if (!value) {
            return [];
        }

        try {
            return JSON.parse(value) as IGame[];
        }
        catch (error) {
            console.error("The saved Five Crowns games could not be loaded.", error);
            return [];
        }
    }

    /**
     * Creates a new saved game or replaces an existing game with the same ID.
     *
     * @param game - Complete game object to save.
     */
    public saveGame(game: IGame): void {
        const games: IGame[] = this.getGames();

        const existingGameIndex: number = games.findIndex(
            (existingGame: IGame): boolean => existingGame.id === game.id
        );

        if (existingGameIndex >= 0) {
            games[existingGameIndex] = game;
        }
        else {
            games.push(game);
        }

        localStorage.setItem(
            this._storageKey,
            JSON.stringify(games)
        );
    }

    /**
     * Loads one saved game by its unique identifier.
     *
     * @param id - Unique identifier of the game to load.
     * @returns The matching game, or null when no matching game exists.
     */
    public loadGame(id: string): IGame | null {
        const game: IGame | undefined = this.getGames().find(
            (existingGame: IGame): boolean => existingGame.id === id
        );

        return game ?? null;
    }

    /**
     * Deletes one saved game from localStorage.
     *
     * @param id - Unique identifier of the game to delete.
     */
    public deleteGame(id: string): void {
        const games: IGame[] = this.getGames().filter(
            (existingGame: IGame): boolean => existingGame.id !== id
        );

        localStorage.setItem(
            this._storageKey,
            JSON.stringify(games)
        );
    }
}