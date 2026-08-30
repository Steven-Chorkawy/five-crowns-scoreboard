import { IPlayer } from "./IPlayer";

export interface IGame {
    id: string;
    createdDate: string;
    players: IPlayer[];
}