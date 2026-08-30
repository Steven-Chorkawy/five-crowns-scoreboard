import { IPlayer } from "./IPlayer";
import { IScore } from "./IScore";

export interface IGame {
    id: string;
    createdDate: string;
    players: IPlayer[];
    scores: IScore[];
    currentRound: number;
    completed: boolean;
}