import { IGame } from "../models/IGame";
import { IStorageProvider } from "./IStorageProvider";

/**
 * Stores Five Crowns games in the current browser's localStorage.
 *
 * This remains the fast, offline-safe primary store. Methods are async only to
 * satisfy the shared IStorageProvider contract; the underlying reads and writes
 * are still synchronous and instant.
 */
export class LocalStorageProvider implements IStorageProvider {
    private readonly _storageKey: string = "five-crowns-games";

    /**
     * Returns all games currently stored in localStorage.
     */
    public async getGames(): Promise<IGame[]> {
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
     * Creates a new saved game or replaces an existing game with the same id.
     */
    public async saveGame(game: IGame): Promise<void> {
        const games: IGame[] = await this.getGames();

        const existingGameIndex: number = games.findIndex(
            (existingGame: IGame): boolean => existingGame.id === game.id
        );

        if (existingGameIndex >= 0) {
            games[existingGameIndex] = game;
        }
        else {
            games.push(game);
        }

        localStorage.setItem(this._storageKey, JSON.stringify(games));
    }

    /**
     * Loads one saved game by its unique identifier.
     */
    public async loadGame(id: string): Promise<IGame | null> {
        const games: IGame[] = await this.getGames();

        const game: IGame | undefined = games.find(
            (existingGame: IGame): boolean => existingGame.id === id
        );

        return game ?? null;
    }

    /**
     * Deletes one saved game from localStorage.
     */
    public async deleteGame(id: string): Promise<void> {
        const games: IGame[] = await this.getGames();

        const remaining: IGame[] = games.filter(
            (existingGame: IGame): boolean => existingGame.id !== id
        );

        localStorage.setItem(this._storageKey, JSON.stringify(remaining));
    }
}