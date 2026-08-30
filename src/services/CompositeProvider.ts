import { IGame } from "../models/IGame";
import { IStorageProvider } from "./IStorageProvider";
import { LocalStorageProvider } from "./LocalStorageProvider";
import { FirestoreProvider } from "./FirestoreProvider";

/**
 * Combines the local and cloud providers behind the single IStorageProvider
 * contract the app depends on.
 *
 * Write strategy: localStorage first (so the UI is never blocked and the game
 * is safe offline), then Firestore. A cloud failure is surfaced to the caller
 * so the completion screen can show a save status, but it never loses the local
 * copy.
 *
 * Read strategy: prefer Firestore (the durable, cross-device copy); fall back
 * to localStorage when offline or on error.
 */
export class CompositeProvider implements IStorageProvider {
    private readonly _local: LocalStorageProvider = new LocalStorageProvider();
    private readonly _cloud: FirestoreProvider = new FirestoreProvider();

    /**
     * Saves locally (always) then to the cloud. If the cloud write fails, the
     * error is re-thrown AFTER the local save has succeeded, so callers can show
     * an "offline / will retry" status while the local copy stays intact.
     */
    public async saveGame(game: IGame): Promise<void> {
        // Local first - instant and offline-safe.
        await this._local.saveGame(game);

        // Then mirror to the cloud. Surface failure to the caller.
        await this._cloud.saveGame(game);
    }

    /**
     * Loads a game, preferring the cloud copy and falling back to local.
     */
    public async loadGame(id: string): Promise<IGame | null> {
        try {
            const cloudGame: IGame | null = await this._cloud.loadGame(id);
            if (cloudGame) {
                return cloudGame;
            }
        }
        catch (error) {
            console.warn("Cloud load failed; using local copy.", error);
        }

        return this._local.loadGame(id);
    }

    /**
     * Returns all games, preferring the cloud list and falling back to local.
     */
    public async getGames(): Promise<IGame[]> {
        try {
            return await this._cloud.getGames();
        }
        catch (error) {
            console.warn("Cloud list failed; using local games.", error);
            return this._local.getGames();
        }
    }

    /**
     * Deletes a game from both stores. Local first so the UI updates even if the
     * cloud delete fails.
     */
    public async deleteGame(id: string): Promise<void> {
        await this._local.deleteGame(id);
        await this._cloud.deleteGame(id);
    }
}