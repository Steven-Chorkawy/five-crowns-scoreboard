import { IGame } from "../models/IGame";

export interface IAppState {
  activeGame: IGame | null;
}