export default function ConfigBanner({ onDismiss }) {
  return (
    <div className="config-banner">
      <div className="config-banner-text">
        Connect your tools — GitHub, Jira, Confluence, and Outlook tokens are stored only in this session.
      </div>
      <div className="config-inputs">
        <input className="config-input" placeholder="GitHub token (ghp_…)" type="password" />
        <input className="config-input" placeholder="Jira API token" type="password" />
        <input className="config-input" placeholder="Outlook / MS Graph token" type="password" />
        <button className="btn btn-teal" style={{ fontSize:12 }}>Connect</button>
        <button className="btn btn-ghost" style={{ fontSize:12 }} onClick={onDismiss}>Dismiss</button>
      </div>
    </div>
  );
}
