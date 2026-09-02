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

  /** Renames a player. */
  rename(id: string, newName: string): Promise<void>;

  /** Removes a player from the roster. */
  remove(id: string): Promise<void>;
}