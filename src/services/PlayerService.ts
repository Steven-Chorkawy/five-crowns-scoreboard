import { IGame } from "../models/IGame";
import { IPlayer } from "../models/IPlayer";
import { IScore } from "../models/IScore";
import { IPlayerStats } from "../models/IPlayerStats";
import { IStorageProvider } from "./IStorageProvider";
import type { IPlayerRepository } from "./IPlayerRepository";
import { GameService } from "./GameService";

/**
 * Provides roster access and per-player statistics.
 *
 * Stats are computed from every game (in the games store) that references the
 * player's stable id. Games created before Stage 13 used per-game random ids
 * and therefore do not match any roster player - they are simply excluded.
 */
export class PlayerService {

  // 1. Declare the properties at the class level
  private readonly _players: IPlayerRepository;
  private readonly _games: IStorageProvider;

  // 2. Assign them inside the constructor
  public constructor(
    players: IPlayerRepository,
    games: IStorageProvider
  ) {
    this._players = players;
    this._games = games;
  }

  /** Returns all roster players. */
  public async getAllPlayers(): Promise<IPlayer[]> {
    return this._players.getAll();
  }

  /** Returns one roster player by id, or null. */
  public async getPlayer(id: string): Promise<IPlayer | null> {
    return this._players.getById(id);
  }

  /** Adds (or reuses) a roster player by name. */
  public async addPlayer(name: string): Promise<IPlayer> {
    return this._players.addByName(name);
  }

  /**
   * Computes aggregated stats for a player across all games.
   *
   * @param id - Stable roster id of the player.
   * @returns The player's stats, or null if the player is not in the roster.
   */
  public async getPlayerStats(id: string): Promise<IPlayerStats | null> {
    const player: IPlayer | null = await this._players.getById(id);
    if (!player) {
      return null;
    }

    const allGames: IGame[] = await this._games.getGames();

    // Only games this player participated in (by stable id).
    const games: IGame[] = allGames.filter((game) =>
      game.players.some((p) => p.id === id)
    );

    const completed: IGame[] = games.filter((game) => game.completed);

    // Wins: completed games where the player's total equals the minimum total.
    let gamesWon = 0;
    const finalTotals: number[] = [];

    completed.forEach((game) => {
      const standings = GameService.getStandings(game); // ascending
      if (standings.length === 0) {
        return;
      }

      const minTotal: number = standings[0].total;
      const playerTotal: number = GameService.getPlayerTotal(game, id);
      finalTotals.push(playerTotal);

      if (playerTotal === minTotal) {
        gamesWon = gamesWon + 1;
      }
    });

    // Round-level stats across ALL games the player is in (not just completed).
    let highestRoundScore: number | null = null;
    let longestZeroStreak = 0;
    let totalZeroRounds = 0;

    games.forEach((game) => {
      const playerScores: IScore[] = game.scores
        .filter((score) => score.playerId === id)
        .sort((a, b) => a.roundNumber - b.roundNumber);

      let currentStreak = 0;

      playerScores.forEach((score) => {
        if (highestRoundScore === null || score.score > highestRoundScore) {
          highestRoundScore = score.score;
        }

        if (score.score === 0) {
          totalZeroRounds = totalZeroRounds + 1;
          currentStreak = currentStreak + 1;
          if (currentStreak > longestZeroStreak) {
            longestZeroStreak = currentStreak;
          }
        }
        else {
          currentStreak = 0;
        }
      });
    });

    const completedGames: number = completed.length;

    const highestGameTotal: number | null =
      finalTotals.length > 0 ? Math.max(...finalTotals) : null;

    const lowestGameTotal: number | null =
      finalTotals.length > 0 ? Math.min(...finalTotals) : null;

    const averageGameTotal: number | null =
      finalTotals.length > 0
        ? finalTotals.reduce((sum, t) => sum + t, 0) / finalTotals.length
        : null;

    const winPercentage: number =
      completedGames > 0 ? (gamesWon / completedGames) * 100 : 0;

    return {
      playerId: id,
      name: player.name,
      gamesPlayed: games.length,
      completedGames,
      gamesWon,
      winPercentage,
      highestGameTotal,
      lowestGameTotal,
      averageGameTotal,
      highestRoundScore,
      longestZeroStreak,
      totalZeroRounds
    };
  }
}