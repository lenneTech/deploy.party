const teamState = () => useState<any | null>('team_state', () => null);

export function useTeamState() {
  function reset() {
    teamState().value = null;
  }

  return {
    reset,
    teamState: teamState(),
  };
}
