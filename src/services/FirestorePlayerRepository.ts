import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc
} from "firebase/firestore";
import { IPlayer } from "../models/IPlayer";
import { IPlayerRepository } from "./IPlayerRepository";
import { firestore, authReady } from "./firebaseConfig";

/**
 * Persists the player roster to Firebase Firestore.
 *
 * Each roster player is a single document in the "players" collection, keyed
 * by player.id. Every method awaits authReady first so a valid (anonymous)
 * auth token exists before the request runs - the same gate FirestoreProvider
 * uses for games.
 */
export class FirestorePlayerRepository implements IPlayerRepository {
  /** Name of the Firestore collection holding player documents. */
  private readonly _collectionName: string = "players";

  /**
   * Returns every roster player, sorted alphabetically for a stable chip order.
   */
  public async getAll(): Promise<IPlayer[]> {
    await authReady;

    const playersRef = collection(firestore, this._collectionName);
    const snapshot = await getDocs(playersRef);

    return snapshot.docs
      .map((document): IPlayer => document.data() as IPlayer)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Loads one roster player document by id.
   */
  public async getById(id: string): Promise<IPlayer | null> {
    await authReady;

    const playerRef = doc(firestore, this._collectionName, id);
    const snapshot = await getDoc(playerRef);

    return snapshot.exists() ? (snapshot.data() as IPlayer) : null;
  }

  /**
   * Adds a player by name, reusing an existing cloud entry when the name
   * already exists (case-insensitive).
   *
   * Note: in the composite setup this is rarely called directly - the
   * composite decides the id and calls save() instead. It is implemented here
   * so this class remains a complete, standalone IPlayerRepository.
   */
  public async addByName(name: string): Promise<IPlayer> {
    const trimmed: string = name.trim();
    const players: IPlayer[] = await this.getAll();

    const existing = players.find(
      (player) => player.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      return existing;
    }

    const created: IPlayer = { id: crypto.randomUUID(), name: trimmed };
    await this.save(created);
    return created;
  }

  /**
   * Creates or overwrites a player document using a caller-supplied id.
   */
  public async save(player: IPlayer): Promise<void> {
    await authReady;

    const playerRef = doc(firestore, this._collectionName, player.id);
    await setDoc(playerRef, player);
  }

  /**
   * Renames a player. Reads first so we never blank out other fields if the
   * IPlayer shape grows later.
   */
  public async rename(id: string, newName: string): Promise<void> {
    const existing: IPlayer | null = await this.getById(id);

    if (!existing) {
      return;
    }

    await this.save({ ...existing, name: newName.trim() });
  }

  /**
   * Deletes one roster player document by id.
   */
  public async remove(id: string): Promise<void> {
    await authReady;

    const playerRef = doc(firestore, this._collectionName, id);
    await deleteDoc(playerRef);
  }
}