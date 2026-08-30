import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc
} from "firebase/firestore";

import { IGame } from "../models/IGame";
import { IStorageProvider } from "./IStorageProvider";
import { firestore, authReady } from "./firebaseConfig";

/**
 * Persists games to Firebase Firestore.
 *
 * Each game is a single document in the "games" collection, keyed by game.id.
 * Every method awaits authReady first so a valid (anonymous) auth token exists
 * before the request runs - required by the security rules in Step 68.2.
 */
export class FirestoreProvider implements IStorageProvider {
  /** Name of the Firestore collection holding game documents. */
  private readonly _collectionName: string = "games";

  /**
   * Creates or overwrites the game's document.
   */
  public async saveGame(game: IGame): Promise<void> {
    await authReady;
    const gameRef = doc(firestore, this._collectionName, game.id);
    await setDoc(gameRef, game);
  }

  /**
   * Loads one game document by id.
   */
  public async loadGame(id: string): Promise<IGame | null> {
    await authReady;
    const gameRef = doc(firestore, this._collectionName, id);
    const snapshot = await getDoc(gameRef);

    return snapshot.exists() ? (snapshot.data() as IGame) : null;
  }

  /**
   * Returns every game document in the collection.
   */
  public async getGames(): Promise<IGame[]> {
    await authReady;
    const gamesRef = collection(firestore, this._collectionName);
    const snapshot = await getDocs(gamesRef);

    return snapshot.docs.map((document): IGame => document.data() as IGame);
  }

  /**
   * Deletes one game document by id.
   */
  public async deleteGame(id: string): Promise<void> {
    await authReady;
    const gameRef = doc(firestore, this._collectionName, id);
    await deleteDoc(gameRef);
  }
}