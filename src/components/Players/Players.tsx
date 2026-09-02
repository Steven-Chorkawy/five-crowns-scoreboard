import React from "react";

import { Button } from "@progress/kendo-react-buttons";
import { Card } from "@progress/kendo-react-layout";

import { IPlayer } from "../../models/IPlayer";

import "./Players.css";

/**
 * Props for the players list screen.
 */
export interface IPlayersProps {
    /** All roster players. */
    players: IPlayer[];

    /** Raised when a player is chosen (to view their stats). */
    onSelect: (id: string) => void;

    /** Raised to return to the previous screen. */
    onBack: () => void;
}

/**
 * Roster list. Tapping a player opens their stats.
 */
export const Players: React.FC<IPlayersProps> = (props) => {
    return (
        <div className="players-screen">
            <Card className="players-card">
                <div className="players-content">

                    <div className="players-header">
                        <h2>Players</h2>
                        <Button fillMode="outline" onClick={props.onBack}>
                            Back
                        </Button>
                    </div>

                    {props.players.length === 0 && (
                        <p className="hint-text">
                            No players yet. Add players when starting a new game.
                        </p>
                    )}

                    {props.players.map((player) => (
                        <button
                            key={player.id}
                            className="player-list-row"
                            onClick={() => props.onSelect(player.id)}
                        >
                            <span className="player-list-name">{player.name}</span>
                            <span className="player-list-chevron">›</span>
                        </button>
                    ))}

                </div>
            </Card>
        </div>
    );
};