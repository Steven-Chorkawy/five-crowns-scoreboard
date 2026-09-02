import { IPlayer } from "../models/IPlayer";
import { IPlayerRepository } from "./IPlayerRepository";

/**
 * localStorage-backed roster. Async only to satisfy the shared interface; the
 * underlying storage is synchronous and instant.
 */
export class LocalPlayerRepository implements IPlayerRepository {
  private readonly _storageKey: string = "five-crowns-players";

  /** Reads and parses the roster, failing safe to an empty list. */
  private read(): IPlayer[] {
    const value: string | null = localStorage.getItem(this._storageKey);

    if (!value) {
      return [];
    }

    try {
      return JSON.parse(value) as IPlayer[];
    }
    catch (error) {
      console.error("The player roster could not be loaded.", error);
      return [];
    }
  }

  /** Writes the roster. */
  private write(players: IPlayer[]): void {
    localStorage.setItem(this._storageKey, JSON.stringify(players));
  }

  public async getAll(): Promise<IPlayer[]> {
    // Return alphabetically for a stable, friendly chip order.
    return this.read().sort((a, b) => a.name.localeCompare(b.name));
  }

  public async getById(id: string): Promise<IPlayer | null> {
    return this.read().find((player) => player.id === id) ?? null;
  }

  public async addByName(name: string): Promise<IPlayer> {
    const trimmed: string = name.trim();
    const players: IPlayer[] = this.read();

    // Reuse an existing player with the same name (case-insensitive).
    const existing = players.find(
      (player) => player.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      return existing;
    }

    const created: IPlayer = { id: crypto.randomUUID(), name: trimmed };
    this.write([...players, created]);
    return created;
  }

  public async rename(id: string, newName: string): Promise<void> {
    const players: IPlayer[] = this.read().map((player) =>
      player.id === id ? { ...player, name: newName.trim() } : player
    );
    this.write(players);
  }

  public async remove(id: string): Promise<void> {
    this.write(this.read().filter((player) => player.id !== id));
  }
}