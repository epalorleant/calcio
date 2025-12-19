import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { isAxiosError } from "axios";
import { Link, useParams } from "react-router-dom";
import { getPlayers, type Player } from "../api/players";
import {
  generateBalancedTeams,
  getAvailability,
  getSession,
  setAvailabilityBatch,
  type Availability,
  type BalancedTeamsResponse,
  type Session,
  type SessionPlayer,
} from "../api/sessions";
import {
  createMatch,
  getMatchForSession,
  updateMatch,
  sessionTeamToMatchTeam,
  type MatchTeam,
  type PlayerStatInput,
  type SessionMatch,
} from "../api/matches";
import { AvailabilityManagement } from "../components/AvailabilityManagement";
import { BalancedTeamsSection } from "../components/BalancedTeamsSection";
import { MatchResultSection } from "../components/MatchResultSection";
import { commonStyles } from "../styles/common";

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);

  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [availability, setAvailabilityList] = useState<SessionPlayer[]>([]);
  const [balanced, setBalanced] = useState<BalancedTeamsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchForm, setMatchForm] = useState({
    scoreTeamA: 0,
    scoreTeamB: 0,
    notes: "",
  });
  const [playerStats, setPlayerStats] = useState<
    Record<number, { goals: number; assists: number; minutes_played: number }>
  >({});
  const [existingMatch, setExistingMatch] = useState<SessionMatch | null>(null);
  const [benchTeams, setBenchTeams] = useState<Record<number, MatchTeam | null>>({});
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchSuccess, setMatchSuccess] = useState<string | null>(null);
  const [savingMatch, setSavingMatch] = useState(false);

  const [form, setForm] = useState<{
    player_ids: number[];
    availability: Availability;
    is_goalkeeper: boolean;
  }>({
    player_ids: [],
    availability: "YES",
    is_goalkeeper: false,
  });

  const assignedPlayerIds = useMemo(() => new Set(availability.map((entry) => entry.player_id)), [availability]);

  useEffect(() => {
    // Drop any selections that have since been assigned.
    setForm((prev) => ({
      ...prev,
      player_ids: prev.player_ids.filter((pid) => !assignedPlayerIds.has(pid)),
    }));
  }, [assignedPlayerIds]);

  const loadData = async () => {
    if (!sessionId) {
      setError("Invalid session id.");
      return;
    }
    setExistingMatch(null);
    setMatchForm({ scoreTeamA: 0, scoreTeamB: 0, notes: "" });
    setPlayerStats({});
    setBenchTeams({});
    setMatchError(null);
    setMatchSuccess(null);
    try {
      setLoading(true);
      setError(null);
      const [sessionData, playersData, availabilityRes] = await Promise.all([
        getSession(sessionId),
        getPlayers(),
        fetchAvailability(sessionId),
      ]);
      setSession(sessionData);
      setPlayers(playersData);
      setAvailabilityList(availabilityRes);
      await loadMatch(sessionId);
    } catch (err) {
      console.error(err);
      setError("Failed to load session details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async (sid: number) => {
    return getAvailability(sid);
  };

  const loadMatch = async (sid: number) => {
    setExistingMatch(null);
    setMatchSuccess(null);
    try {
      const matchData = await getMatchForSession(sid);
      if (matchData) {
        setExistingMatch(matchData);
        setMatchForm({
          scoreTeamA: matchData.score_team_a,
          scoreTeamB: matchData.score_team_b,
          notes: matchData.notes ?? "",
        });
        const statsMap: Record<number, { goals: number; assists: number; minutes_played: number }> = {};
        matchData.stats.forEach((stat) => {
          statsMap[stat.player_id] = {
            goals: stat.goals,
            assists: stat.assists,
            minutes_played: stat.minutes_played,
          };
        });
        setPlayerStats((prev) => ({ ...prev, ...statsMap }));
        const benchSelection: Record<number, MatchTeam | null> = {};
        matchData.bench_players.forEach((sp) => {
          const stat = matchData.stats.find((s) => s.player_id === sp.player_id);
          benchSelection[sp.player_id] = stat?.team ?? null;
        });
        setBenchTeams((prev) => ({ ...prev, ...benchSelection }));
      } else {
        setMatchForm({ scoreTeamA: 0, scoreTeamB: 0, notes: "" });
      }
    } catch (err) {
      console.error(err);
      setMatchError("Failed to load match data.");
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const teamAPlayers = availability.filter((entry) => entry.team === "A");
  const teamBPlayers = availability.filter((entry) => entry.team === "B");
  const benchPlayers = availability.filter((entry) => entry.team !== "A" && entry.team !== "B");

  const derivedBalanced = useMemo<BalancedTeamsResponse | null>(() => {
    if (availability.length === 0) return null;

    const resolvePlayer = (playerId: number) =>
      players.find((p) => p.id === playerId) ?? ({ id: playerId, name: String(playerId) } as Player);

    const toBalancedPlayer = (entry: SessionPlayer) => {
      const player = resolvePlayer(entry.player_id);
      return {
        player_id: entry.player_id,
        name: player.name,
        rating: player.rating?.overall_rating ?? 0,
        is_goalkeeper: entry.is_goalkeeper,
      };
    };

    const teamA = availability.filter((entry) => entry.team === "A").map(toBalancedPlayer);
    const teamB = availability.filter((entry) => entry.team === "B").map(toBalancedPlayer);
    const bench = availability
      .filter((entry) => entry.team !== "A" && entry.team !== "B")
      .map(toBalancedPlayer);

    // If there are no team assignments yet, fall back to null so the UI can show the empty state.
    if (teamA.length === 0 && teamB.length === 0 && bench.length === 0) {
      return null;
    }

    return {
      team_a: teamA,
      team_b: teamB,
      bench,
      balance_score: 0,
    };
  }, [availability, players]);

  const displayBalanced = balanced ?? derivedBalanced;

  const hasExistingTeams = teamAPlayers.length > 0 || teamBPlayers.length > 0;
  const canGenerateTeams = availability.filter((entry) => entry.availability === "YES").length >= 10;

  useEffect(() => {
    const relevant = [...teamAPlayers, ...teamBPlayers, ...benchPlayers];
    if (relevant.length === 0) return;
    setPlayerStats((prev) => {
      const next = { ...prev };
      relevant.forEach((entry) => {
        if (!next[entry.player_id]) {
          next[entry.player_id] = { goals: 0, assists: 0, minutes_played: 0 };
        }
      });
      return next;
    });
  }, [teamAPlayers, teamBPlayers, benchPlayers]);

  useEffect(() => {
    if (benchPlayers.length === 0) return;
    setBenchTeams((prev) => {
      const next = { ...prev };
      benchPlayers.forEach((entry) => {
        if (next[entry.player_id] === undefined) {
          next[entry.player_id] = null;
        }
      });
      return next;
    });
  }, [benchPlayers]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sessionId || form.player_ids.length === 0) {
      setError("Select at least one player.");
      return;
    }
    try {
      setError(null);
      await setAvailabilityBatch(sessionId, {
        entries: form.player_ids.map((pid) => ({
          player_id: pid,
          availability: form.availability,
          is_goalkeeper: form.is_goalkeeper,
        })),
      });
      setForm({ player_ids: [], availability: "YES", is_goalkeeper: false });
      const availabilityRes = await fetchAvailability(sessionId);
      setAvailabilityList(availabilityRes);
    } catch (err) {
      console.error(err);
      setError("Failed to set availability.");
    }
  };

  const handleStatChange = (
    playerId: number,
    field: "goals" | "assists" | "minutes_played",
    value: number,
  ) => {
    setPlayerStats((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] ?? { goals: 0, assists: 0, minutes_played: 0 }),
        [field]: Number.isNaN(value) ? 0 : value,
      },
    }));
  };

  const handleSaveMatch = async () => {
    if (!sessionId) return;
    const participants = [...teamAPlayers, ...teamBPlayers, ...benchPlayers];
    if (participants.length === 0) {
      setMatchError("Add players to the session before saving a result.");
      return;
    }
    const missingBenchTeams = benchPlayers.filter((entry) => !benchTeams[entry.player_id]);
    if (missingBenchTeams.length > 0) {
      setMatchError("Select which team each bench player appeared for.");
      return;
    }

    let teamAGoals = 0;
    let teamBGoals = 0;
    const resolveTeam = (entry: SessionPlayer): MatchTeam | null =>
      entry.team === "A" || entry.team === "B"
        ? sessionTeamToMatchTeam(entry.team)
        : benchTeams[entry.player_id] ?? null;

    for (const entry of participants) {
      const resolvedTeam = resolveTeam(entry);
      if (!resolvedTeam) continue;
      const line = playerStats[entry.player_id];
      const goals = line?.goals ?? 0;
      if (resolvedTeam === "A") teamAGoals += goals;
      if (resolvedTeam === "B") teamBGoals += goals;
    }

    if (teamAGoals !== matchForm.scoreTeamA || teamBGoals !== matchForm.scoreTeamB) {
      setMatchError("Team scores must match the sum of individual goals.");
      return;
    }

    setMatchError(null);
    setMatchSuccess(null);
    setSavingMatch(true);
    try {
      const payload = {
        session_id: sessionId,
        score_team_a: matchForm.scoreTeamA,
        score_team_b: matchForm.scoreTeamB,
        notes: matchForm.notes || undefined,
        player_stats: participants
          .map((entry) => {
            const resolvedTeam =
              entry.team === "A" || entry.team === "B"
                ? sessionTeamToMatchTeam(entry.team)
                : benchTeams[entry.player_id] ?? null;
            if (!resolvedTeam) return null;
            const line = playerStats[entry.player_id];
            return {
              player_id: entry.player_id,
              team: resolvedTeam,
              goals: line?.goals ?? 0,
              assists: line?.assists ?? 0,
              minutes_played: line?.minutes_played ?? 0,
            } satisfies PlayerStatInput;
          })
          .filter((stat): stat is PlayerStatInput => Boolean(stat)),
      };

      const savedMatch = existingMatch
        ? await updateMatch(existingMatch.id, payload)
        : await createMatch(payload);
      setExistingMatch(savedMatch);
      setMatchSuccess(existingMatch ? "Match result updated." : "Match result saved.");
    } catch (err) {
      console.error(err);
      if (isAxiosError(err) && err.response?.data?.detail) {
        setMatchError(String(err.response.data.detail));
      } else {
        setMatchError("Failed to save match result.");
      }
    } finally {
      setSavingMatch(false);
    }
  };

  const handleGenerate = async () => {
    if (!sessionId) return;
    try {
      setError(null);
      setLoading(true);
      const data = await generateBalancedTeams(sessionId);
      setBalanced(data);
      const availabilityRes = await fetchAvailability(sessionId);
      setAvailabilityList(availabilityRes);
    } catch (err) {
      console.error(err);
      setError("Failed to generate balanced teams.");
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId) {
    return <p>Invalid session.</p>;
  }

  return (
    <div style={commonStyles.container}>
      <Link to="/sessions" style={commonStyles.linkButton} reloadDocument>
        ← Back to sessions
      </Link>
      <h1 style={commonStyles.heading}>Session Details</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={commonStyles.error}>{error}</p>}
      {session && (
        <div style={commonStyles.card}>
          <p>
            <strong>Date:</strong> {new Date(session.date).toLocaleString()}
          </p>
          <p>
            <strong>Location:</strong> {session.location}
          </p>
          <p>
            <strong>Status:</strong> {session.status}
          </p>
        </div>
      )}

      <AvailabilityManagement
        players={players}
        availability={availability}
        form={form}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        error={error}
      />

      <BalancedTeamsSection
        balanced={displayBalanced}
        hasExistingTeams={hasExistingTeams}
        canGenerateTeams={canGenerateTeams}
        onGenerate={handleGenerate}
      />

      <MatchResultSection
        matchForm={matchForm}
        onMatchFormChange={setMatchForm}
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        benchPlayers={benchPlayers}
        players={players}
        playerStats={playerStats}
        benchTeams={benchTeams}
        onStatChange={handleStatChange}
        onBenchTeamChange={(playerId, team) => setBenchTeams((prev) => ({ ...prev, [playerId]: team }))}
        onSaveMatch={handleSaveMatch}
        savingMatch={savingMatch}
        existingMatch={!!existingMatch}
        matchError={matchError}
        matchSuccess={matchSuccess}
      />
    </div>
  );
}
