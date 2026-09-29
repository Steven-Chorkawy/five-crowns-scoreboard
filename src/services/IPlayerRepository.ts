import { IPlayer } from "../models/IPlayer";

/**
 * Persistence contract for the player roster. Async so a Firestore-backed
 * implementation can satisfy the same interface later.
 */
export interface IPlayerRepository {
  /** Returns every roster player. */
  getAll(): Promise<IPlayer[]>;

  /** Returns one roster player by id, or null. */
  getById(id: string): Promise<IPlayer | null>;

  /**
   * Adds a player by name and returns the created (or existing) player.
   * Implementations should reuse an existing player when the name already
   * exists (case-insensitive) to avoid duplicate roster entries.
   */
  addByName(name: string): Promise<IPlayer>;

  /**
   * Creates or overwrites a player using an id that the CALLER has already
   * decided.
   *
   * This is what makes a composite (local + cloud) roster possible: the
   * composite mints the id once, then writes the identical IPlayer object to
   * every underlying store. Without it, each store would call addByName and
   * generate its own conflicting id for the same person.
   *
   * @param player - The complete player record to persist.
   */
  save(player: IPlayer): Promise<void>;

  /** Renames a player. */
  rename(id: string, newName: string): Promise<void>;

  /** Removes a player from the roster. */
  remove(id: string): Promise<void>;
}