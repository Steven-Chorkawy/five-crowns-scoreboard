import { IPlayer } from "../models/IPlayer";
import { IPlayerRepository } from "./IPlayerRepository";
import { LocalPlayerRepository } from "./LocalPlayerRepository";
import { FirestorePlayerRepository } from "./FirestorePlayerRepository";

/**
 * Combines the local and cloud roster repositories behind the single
 * IPlayerRepository contract the app depends on. Mirrors CompositeProvider,
 * which does the same job for games.
 *
 * Write strategy: localStorage first (instant and offline-safe), then
 * Firestore. A cloud failure is logged and swallowed rather than thrown -
 * creating a player happens mid-setup, and a dropped connection should never
 * block someone from starting a game. The local copy is authoritative until
 * the next successful sync.
 *
 * Read strategy: MERGE cloud and local by id rather than preferring one. A
 * player created while offline exists only locally; preferring the cloud would
 * make them vanish from the chip list the moment the network returned.
 */
export class CompositePlayerRepository implements IPlayerRepository {
    private readonly _local: LocalPlayerRepository = new LocalPlayerRepository();
    private readonly _cloud: FirestorePlayerRepository =
        new FirestorePlayerRepository();

    /**
     * Returns the union of the cloud and local rosters, de-duplicated by id and
     * sorted alphabetically. The cloud copy wins on a name conflict for the same
     * id, because it is the cross-device source of truth.
     */
    public async getAll(): Promise<IPlayer[]> {
        const local: IPlayer[] = await this._local.getAll();
        let cloud: IPlayer[] = [];

        try {
            cloud = await this._cloud.getAll();
        }
        catch (error) {
            console.warn("Cloud roster load failed; using local roster.", error);
            return local;
        }

        // Seed with local, then let cloud entries overwrite by id.
        const merged: Map<string, IPlayer> = new Map<string, IPlayer>();
        local.forEach((player) => merged.set(player.id, player));
        cloud.forEach((player) => merged.set(player.id, player));

        return Array.from(merged.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }

    /**
     * Returns one roster player, preferring the cloud copy and falling back to
     * local. The local fallback is what makes offline stats keep working.
     */
    public async getById(id: string): Promise<IPlayer | null> {
        try {
            const cloudPlayer: IPlayer | null = await this._cloud.getById(id);

            if (cloudPlayer) {
                return cloudPlayer;
            }
        }
        catch (error) {
            console.warn("Cloud player load failed; using local copy.", error);
        }

        return this._local.getById(id);
    }

    /**
     * Adds (or reuses) a player by name.
     *
     * De-duplication runs against the MERGED roster, so typing a name that
     * already exists in the cloud reuses that stable id instead of minting a
     * second one. The id is generated exactly once here and written identically
     * to both stores.
     */
    public async addByName(name: string): Promise<IPlayer> {
        const trimmed: string = name.trim();
        const players: IPlayer[] = await this.getAll();

        const existing = players.find(
            (player) => player.name.toLowerCase() === trimmed.toLowerCase()
        );

        if (existing) {
            // Make sure both stores hold the record before returning it.
            await this.save(existing);
            return existing;
        }

        const created: IPlayer = { id: crypto.randomUUID(), name: trimmed };
        await this.save(created);
        return created;
    }

    /**
     * Writes the identical player record to local (always) then cloud. A cloud
     * failure is logged, not thrown - the roster stays usable offline.
     */
    public async save(player: IPlayer): Promise<void> {
        await this._local.save(player);

        try {
            await this._cloud.save(player);
        }
        catch (error) {
            console.warn("Cloud roster save failed; kept locally.", error);
        }
    }

    /**
     * Renames a player in both stores.
     */
    public async rename(id: string, newName: string): Promise<void> {
        await this._local.rename(id, newName);

        try {
            await this._cloud.rename(id, newName);
        }
        catch (error) {
            console.warn("Cloud roster rename failed; kept locally.", error);
        }
    }

    /**
     * Removes a player from both stores. Local first so the UI updates even if
     * the cloud delete fails.
     */
    public async remove(id: string): Promise<void> {
        await this._local.remove(id);

        try {
            await this._cloud.remove(id);
        }
        catch (error) {
            console.warn("Cloud roster delete failed; removed locally.", error);
        }
    }

    /**
     * One-time migration: pushes any player that exists locally but not in the
     * cloud up to Firestore.
     *
     * Safe to call on every app start. It writes by EXISTING id, so it never
     * mints a new id and never creates duplicates. This is what carries your
     * pre-Stage-15 roster into the cloud without anyone re-typing names.
     *
     * @returns The number of players uploaded (0 when already in sync).
     */
    public async migrateLocalToCloud(): Promise<number> {
        const local: IPlayer[] = await this._local.getAll();

        if (local.length === 0) {
            return 0;
        }

        let cloud: IPlayer[] = [];

        try {
            cloud = await this._cloud.getAll();
        }
        catch (error) {
            console.warn("Roster migration skipped; cloud unreachable.", error);
            return 0;
        }

        const cloudIds: Set<string> = new Set<string>(
            cloud.map((player) => player.id)
        );
        const missing: IPlayer[] = local.filter(
            (player) => !cloudIds.has(player.id)
        );

        // Run the uploads in parallel; one failure should not abort the rest.
        await Promise.all(
            missing.map(async (player): Promise<void> => {
                try {
                    await this._cloud.save(player);
                }
                catch (error) {
                    console.warn(`Could not migrate player ${player.name}.`, error);
                }
            })
        );

        return missing.length;
    }
}