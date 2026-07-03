// `sources` is the caller-computed list of unconfigured source names for
// this card — this component just renders (or doesn't), it has no opinion
// on what "configured" means for any given integration.
export default function MockDataBadge({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <span
      className="badge badge-amber"
      title="Showing mock data for this — see README to connect a real token"
    >
      Mock: {sources.join(", ")}
    </span>
  );
}
