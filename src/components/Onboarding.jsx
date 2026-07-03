import { useState } from "react";
import { load, save } from "../api/localState";
import ReportsManager from "./ReportsManager";

const INTEGRATIONS = [
  { service: "GitHub", vars: "VITE_GITHUB_TOKEN, VITE_GITHUB_OWNER, VITE_GITHUB_REPO, VITE_GITHUB_USERNAME" },
  { service: "Jira", vars: "VITE_JIRA_DOMAIN, VITE_JIRA_EMAIL, VITE_JIRA_TOKEN, VITE_JIRA_PROJECT" },
  { service: "Confluence", vars: "VITE_CONFLUENCE_DOMAIN, VITE_CONFLUENCE_EMAIL, VITE_CONFLUENCE_TOKEN, VITE_CONFLUENCE_SPACE" },
  { service: "Microsoft Graph (Calendar/Teams/Mail)", vars: "VITE_MS_GRAPH_TOKEN" },
  { service: "Slack", vars: "VITE_SLACK_TOKEN" },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);

  async function finish() {
    setFinishing(true);
    const state = await load();
    await save({ ...state, onboardingComplete: true });
    onComplete();
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {step === 0 && (
          <>
            <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Welcome to em.dashboard</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
              This runs fully on mock data out of the box — connecting real tokens is entirely optional and can be
              done anytime later.
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
              To connect a real data source, copy <code>.env.example</code> to <code>.env</code>, fill in whichever
              tokens you have, and restart <code>npm run dev</code>. Tokens can't be entered from this UI — see the
              README for details.
            </p>
            <div style={{ marginTop: 12 }}>
              {INTEGRATIONS.map(i => (
                <div key={i.service} style={{ fontSize: 12, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{i.service}</div>
                  <div style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: 11 }}>{i.vars}</div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={finish} disabled={finishing}>Skip setup</button>
              <button className="btn btn-teal" onClick={() => setStep(1)}>Next: add your reports</button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Add your direct reports</h2>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
              Used to detect when a task or PR review is blocking someone on your team, so it's ranked higher in
              Priority Tasks. You can add, edit, or remove reports anytime later too.
            </p>
            <ReportsManager />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={finish} disabled={finishing}>Skip for now</button>
              <button className="btn btn-teal" onClick={finish} disabled={finishing}>Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
