// rankTasks() expects each task already normalized to a common shape by the
// caller (source-specific mapping — e.g. jira.js's mapIssueToMyTask, or
// github.js's mapSearchItemToPR — lives with each source, not here):
//
//   {
//     id: string,
//     title: string,
//     dueDate: string | null,           // ISO "YYYY-MM-DD", or null
//     blockingIdentifier: string | null // whoever is waiting on this task —
//                                       // a report's name/githubUsername/
//                                       // jiraAccountId, or any other
//                                       // identifier; null if nothing blocks
//   }
//
// `reports` is the TP-2 reports list: [{ id, name, githubUsername, jiraAccountId }]

export const BLOCKING_TIER = { REPORT: 0, COLLABORATOR: 1, NONE: 2 };

export function resolveBlockingTier(blockingIdentifier, reports = []) {
  if (!blockingIdentifier) return BLOCKING_TIER.NONE;
  const blocksReport = reports.some(r =>
    r.name === blockingIdentifier ||
    r.githubUsername === blockingIdentifier ||
    r.jiraAccountId === blockingIdentifier
  );
  return blocksReport ? BLOCKING_TIER.REPORT : BLOCKING_TIER.COLLABORATOR;
}

function daysUntilDue(dueDate) {
  if (!dueDate) return Infinity;
  return (new Date(dueDate) - Date.now()) / 86_400_000;
}

export function rankTasks(tasks, reports = []) {
  return [...tasks].sort((a, b) => {
    const tierDelta = resolveBlockingTier(a.blockingIdentifier, reports)
      - resolveBlockingTier(b.blockingIdentifier, reports);
    if (tierDelta !== 0) return tierDelta;

    const daysA = daysUntilDue(a.dueDate);
    const daysB = daysUntilDue(b.dueDate);
    return daysA === daysB ? 0 : daysA - daysB;
  });
}
