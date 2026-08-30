import React from "react";

import { Button } from "@progress/kendo-react-buttons";
import { Card } from "@progress/kendo-react-layout";

import { IGame } from "../../models/IGame";
import { GameService, IGameSummary } from "../../services/GameService";

import "./History.css";

/**
 * Props for the History screen.
 */
export interface IHistoryProps {
    /** Every saved game, in any order (this component sorts newest-first). */
    games: IGame[];

    /** Raised to resume or view a specific game. */
    onResume: (id: string) => void;

    /** Raised to permanently delete a specific game. */
    onDelete: (id: string) => void;

    /** Raised to return to the New Game screen. */
    onBack: () => void;
}

/**
 * Lists all saved games (completed and in-progress) newest first, and allows
 * the user to resume/view or delete each one.
 */
export const History: React.FC<IHistoryProps> = (props) => {

    // Sort a copy newest-first so we never mutate the array owned by the parent.
    const summaries: IGameSummary[] = [...props.games]
        .sort((a, b) => b.createdDate.localeCompare(a.createdDate))
        .map((game) => GameService.getGameSummary(game));

    /**
     * Confirms before deleting so an accidental tap cannot wipe a game.
     */
    const confirmDelete = (id: string): void => {
        const shouldDelete: boolean = window.confirm(
            "Delete this game permanently? This cannot be undone."
        );

        if (shouldDelete) {
            props.onDelete(id);
        }
    };

    return (
        <div className="history-screen">
            <Card className="history-card">
                <div className="history-card-content">

                    <div className="history-header">
                        <h2>Game History</h2>
                        <Button fillMode="outline" onClick={props.onBack}>
                            Back
                        </Button>
                    </div>

                    {summaries.length === 0 && (
                        <p className="history-empty">No saved games yet.</p>
                    )}

                    {summaries.map((summary) => (
                        <div key={summary.id} className="history-row">

                            <div className="history-row-info">
                                <div className="history-row-title">
                                    {summary.playerNames.join(", ")}
                                </div>

                                <div className="history-row-meta">
                                    {new Date(summary.createdDate).toLocaleDateString()}
                                    {" - "}
                                    {summary.completed
                                        ? `Winner: ${summary.winnerName} (${summary.winnerTotal})`
                                        : `In progress - round ${summary.currentRound} of ${GameService.TOTAL_ROUNDS}`}
                                </div>
                            </div>

                            <div className="history-row-actions">
                                <Button
                                    themeColor="primary"
                                    size="small"
                                    onClick={() => props.onResume(summary.id)}
                                >
                                    {summary.completed ? "View" : "Resume"}
                                </Button>

                                <Button
                                    themeColor="error"
                                    fillMode="outline"
                                    size="small"
                                    onClick={() => confirmDelete(summary.id)}
                                >
                                    Delete
                                </Button>
                            </div>

                        </div>
                    ))}

                </div>
            </Card>
        </div>
    );
};