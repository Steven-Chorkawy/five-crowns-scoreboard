import React from "react";

import {
    Chart,
    ChartTitle,
    ChartLegend,
    ChartCategoryAxis,
    ChartCategoryAxisItem,
    ChartValueAxis,
    ChartValueAxisItem,
    ChartSeries,
    ChartSeriesItem,
    ChartTooltip
} from "@progress/kendo-react-charts";

import { IGame } from "../../models/IGame";
import { GameService } from "../../services/GameService";

/**
 * Props for the score progression chart.
 */
export interface IScoreProgressChartProps {
    /** The game to visualize (completed or in-progress). */
    game: IGame;
}

/**
 * Renders a cumulative-score line chart: one line per player, showing each
 * player's running total after every played round.
 *
 * Lowest total wins in Five Crowns, so the BEST-performing player's line is the
 * lowest on the chart.
 */
export const ScoreProgressChart: React.FC<IScoreProgressChartProps> = (props) => {

    const progress = GameService.getScoreProgress(props.game);

    // If no round has been played there is nothing meaningful to plot.
    if (progress.length === 0) {
        return null;
    }

    // Category axis labels: "R1", "R2", ...
    const categories: string[] = progress.map((point) => `R${point.round}`);

    return (
        <div className="score-progress-chart">
            <Chart>
                <ChartTitle text="Cumulative score by round (lower is better)" />

                <ChartLegend position="bottom" orientation="horizontal" />

                <ChartTooltip />

                <ChartCategoryAxis>
                    <ChartCategoryAxisItem
                        categories={categories}
                        title={{ text: "Round" }}
                    />
                </ChartCategoryAxis>

                <ChartValueAxis>
                    <ChartValueAxisItem title={{ text: "Total points" }} min={0} />
                </ChartValueAxis>

                <ChartSeries>
                    {props.game.players.map((player) => {
                        // One line series per player: their cumulative total each round.
                        const data: number[] = progress.map(
                            (point) => point.totals[player.id] ?? 0
                        );

                        return (
                            <ChartSeriesItem
                                key={player.id}
                                type="line"
                                name={player.name}
                                data={data}
                            />
                        );
                    })}
                </ChartSeries>
            </Chart>
        </div>
    );
};