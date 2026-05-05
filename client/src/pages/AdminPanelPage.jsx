export default function AdminPanelPage() {
  return (
    <main className="dash-layout">
      <aside className="dash-sidebar">
        <h3>Admin</h3>
        <p className="dash-nav-title">Menu</p>
        <p>
          <a href="#top">Dashboard</a>
        </p>
        <p>
          <a href="#top">Events</a>
        </p>
        <p>
          <a href="#top">Approvals</a>
        </p>
        <p>
          <a href="#top">Users</a>
        </p>
        <p>
          <a href="#top">Settings</a>
        </p>
      </aside>

      <section className="dash-content" id="top">
        <h1 className="page-title">Event approvals</h1>
        <p className="page-lede">Review and moderate organizer submissions. (Wireframe — connect to live data as needed.)</p>

        <div className="card" style={{ overflow: "hidden" }}>
          <div className="admin-toolbar">
            <button type="button" className="btn btn-secondary">
              Pending
            </button>
            <button type="button" className="btn btn-ghost">
              Approved
            </button>
            <button type="button" className="btn btn-ghost">
              Rejected
            </button>
            <label htmlFor="admin-event-search" className="sr-only">
              Search events
            </label>
            <input id="admin-event-search" type="text" className="search-input" placeholder="Search events…" style={{ maxWidth: "220px", marginLeft: "auto" }} />
            <label htmlFor="admin-status-filter" className="sr-only">
              Filter events by status
            </label>
            <select id="admin-status-filter" className="select" style={{ maxWidth: "140px" }}>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>
          </div>

          <div className="admin-table-head">
            <div>Event</div>
            <div>Organizer</div>
            <div>Date</div>
            <div>Status</div>
            <div>Action</div>
          </div>

          <div className="admin-table-row">
            <div>
              <strong>Night of Jazz</strong>
            </div>
            <div>Jazz Club</div>
            <div>May 20</div>
            <div>Pending</div>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-primary" style={{ padding: "0.35rem 0.65rem", fontSize: "0.8125rem" }}>
                Approve
              </button>
              <button type="button" className="btn btn-secondary" style={{ padding: "0.35rem 0.65rem", fontSize: "0.8125rem" }}>
                Reject
              </button>
            </div>
          </div>

          <div className="admin-table-row">
            <div>
              <strong>Hackathon Summit</strong>
            </div>
            <div>CodeLab</div>
            <div>Jun 01</div>
            <div>Pending</div>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              <button type="button" className="btn btn-primary" style={{ padding: "0.35rem 0.65rem", fontSize: "0.8125rem" }}>
                Approve
              </button>
              <button type="button" className="btn btn-secondary" style={{ padding: "0.35rem 0.65rem", fontSize: "0.8125rem" }}>
                Reject
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
