import React from "react";

import { Button } from "@progress/kendo-react-buttons";
import { Card } from "@progress/kendo-react-layout";

import { IGame } from "../../models/IGame";
import { IPlayerStats } from "../../models/IPlayerStats";
import { ScoreProgressChart } from "../ScoreProgressChart/ScoreProgressChart";

import "./PlayerStats.css";

/**
 * Props for the per-player stats card.
 */
export interface IPlayerStatsProps {
    /** The computed stats to display. */
    stats: IPlayerStats;

    /** The player's best completed game (for the chart), or null. */
    bestGame: IGame | null;

    /** Raised to go back to the players list. */
    onBack: () => void;
}

/**
 * Formats a nullable number for display, showing a dash when null.
 */
function formatNumber(value: number | null): string {
    return value === null ? "—" : String(value);
}

/**
 * Formats a nullable average to one decimal place, or a dash when null.
 */
function formatAverage(value: number | null): string {
    return value === null ? "—" : value.toFixed(1);
}

/**
 * Read-only card summarizing a single player's performance, with a chart of
 * their best completed game.
 */
export const PlayerStats: React.FC<IPlayerStatsProps> = (props) => {

    const { stats } = props;

    // Win % only meaningful with at least one completed game.
    const winPctDisplay: string =
        stats.completedGames > 0 ? `${stats.winPercentage.toFixed(0)}%` : "—";

    return (
        <div className="player-stats-screen">
            <Card className="player-stats-card">
                <div className="player-stats-content">

                    <div className="player-stats-header">
                        <h2>{stats.name}</h2>
                        <Button fillMode="outline" onClick={props.onBack}>
                            Back
                        </Button>
                    </div>

                    <div className="stats-grid">
                        <div className="stat">
                            <span className="stat-value">{stats.gamesPlayed}</span>
                            <span className="stat-label">Games played</span>
                        </div>

                        <div className="stat">
                            <span className="stat-value">{stats.completedGames}</span>
                            <span className="stat-label">Completed</span>
                        </div>

                        <div className="stat">
                            <span className="stat-value">{stats.gamesWon}</span>
                            <span className="stat-label">Games won</span>
                        </div>

                        <div className="stat">
                            <span className="stat-value">{winPctDisplay}</span>
                            <span className="stat-label">Win %</span>
                        </div>

                        <div className="stat">
                            <span className="stat-value">
                                {formatNumber(stats.lowestGameTotal)}
                            </span>
                            <span className="stat-label">Best game total</span>
                        </div>

                        <div className="stat">
                            <span className="stat-value">
                                {formatNumber(stats.highestGameTotal)}
                            </span>
                            <span className="stat-label">Worst game total</span>
                        </div>

                        <div className="stat">
                            <span className="stat-value">
                                {formatAverage(stats.averageGameTotal)}
                            </span>
                            <span className="stat-label">Avg game total</span>
                        </div>

                        <div className="stat">
                            <span className="stat-value">
                                {formatNumber(stats.highestRoundScore)}
                            </span>
                            <span className="stat-label">Highest round</span>
                        </div>

                        <div className="stat">
                            <span className="stat-value">{stats.longestZeroStreak}</span>
                            <span className="stat-label">Longest 0 streak</span>
                        </div>

                        <div className="stat">
                            <span className="stat-value">{stats.totalZeroRounds}</span>
                            <span className="stat-label">Total 0 rounds</span>
                        </div>
                    </div>

                    {props.bestGame ? (
                        <div className="best-game-section">
                            <h3>Best game</h3>
                            <ScoreProgressChart game={props.bestGame} />
                        </div>
                    ) : (
                        <p className="hint-text">No completed games yet.</p>
                    )}

                </div>
            </Card>
        </div>
    );
};