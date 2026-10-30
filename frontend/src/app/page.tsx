
"use client";

import { useEffect, useState } from "react";
import {
  getCommittees,
  createCommittee,
  updateCommittee,
  deleteCommittee,
  getCommitteeAudit,
  getDonations,
  type Committee,
  type AuditLog,
  type Donation, 
} from "@/lib/api";

const menu = [
  { name: "Overview", icon: "⌂" },
  { name: "Committees", icon: "♧" },
  { name: "Donations", icon: "₹" },
  { name: "Expenses", icon: "↗" },
  { name: "Members", icon: "♙" },
  { name: "Reports", icon: "▤" },
];

export default function Home() {
  const [active, setActive] = useState("Overview");
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [year, setYear] = useState("2026");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editYear, setEditYear] = useState("2026");
  const [editStatus, setEditStatus] = useState("draft");

  const [historyId, setHistoryId] = useState<number | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function loadCommittees() {
    setLoading(true);
    setError("");

    try {
      const data = await getCommittees();
      setCommittees(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not load committees: ${err.message}`
          : "Could not load committees. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }
  async function loadDonations() {
  setDonationsLoading(true);
  setError("");

  try {
    const data = await getDonations();
    setDonations(data);
  } catch (err) {
    setError(
      err instanceof Error
        ? `Could not load donations: ${err.message}`
        : "Could not load donations. Check that the backend is running."
    );
  } finally {
    setDonationsLoading(false);
  }
}

 useEffect(() => {
  if (
    active === "Overview" ||
    active === "Committees" ||
    active === "Donations"
  ) {
    void loadCommittees();
  }

  if (active === "Overview" || active === "Donations") {
    void loadDonations();
  }
}, [active]);

  async function handleCreate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await createCommittee({
        name: name.trim(),
        location: location.trim(),
        festival_year: Number(year),
      });

      setName("");
      setLocation("");
      setYear("2026");
      setShowForm(false);
      setSuccess("Committee registered successfully!");
      await loadCommittees();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not register committee: ${err.message}`
          : "Could not register committee."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(committee: Committee) {
    setEditingId(committee.id);
    setEditName(committee.name);
    setEditLocation(committee.location);
    setEditYear(String(committee.festival_year));
    setEditStatus(committee.status);
    setHistoryId(null);
    setAuditLogs([]);
    setError("");
    setSuccess("");
  }

  async function handleUpdate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (editingId === null) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateCommittee(editingId, {
        name: editName.trim(),
        location: editLocation.trim(),
        festival_year: Number(editYear),
        status: editStatus,
      });

      setEditingId(null);
      setSuccess("Committee updated successfully. History recorded.");
      await loadCommittees();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not update committee: ${err.message}`
          : "Could not update committee."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(committee: Committee) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${committee.name}"? This cannot be undone. Its audit history should remain available.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await deleteCommittee(committee.id);

      if (editingId === committee.id) {
        setEditingId(null);
      }

      if (historyId === committee.id) {
        setHistoryId(null);
        setAuditLogs([]);
      }

      setSuccess(
        "Committee deleted. Audit history has been preserved."
      );
      await loadCommittees();
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not delete committee: ${err.message}`
          : "Could not delete committee."
      );
    }
  }

  async function toggleHistory(committeeId: number) {
    if (historyId === committeeId) {
      setHistoryId(null);
      setAuditLogs([]);
      return;
    }

    setHistoryId(committeeId);
    setHistoryLoading(true);
    setAuditLogs([]);
    setError("");

    try {
      const history = await getCommitteeAudit(committeeId);

      setAuditLogs(history);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not load history: ${err.message}`
          : "Could not load audit history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 text-slate-800 md:flex">
      <aside className="bg-orange-950 p-5 text-white md:min-h-screen md:w-64">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-3xl">
            ॐ
          </div>

          <div>
            <h1 className="text-lg font-bold">Ganesh Committee</h1>
            <p className="text-xs text-orange-200">
              Festival Management
            </p>
          </div>
        </div>

        <p className="mb-3 text-xs uppercase tracking-widest text-orange-300">
          Main Menu
        </p>

        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          {menu.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setActive(item.name);
                setError("");
                setSuccess("");
              }}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left ${
                active === item.name
                  ? "bg-orange-500 font-semibold text-white"
                  : "text-orange-100 hover:bg-orange-900"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="mt-8 rounded-xl border border-orange-800 p-4">
          <p className="text-sm font-semibold">Festival Year 2026</p>
          <p className="mt-1 text-xs text-orange-200">
            Your community, organised in one place.
          </p>
        </div>
      </aside>

      <section className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">
              Ganesh Committee / {active}
            </p>

            <h2 className="mt-1 text-2xl font-bold md:text-3xl">
              {active === "Overview" ? "Dashboard Overview" : active}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Manage your festival activities with ease.
            </p>
          </div>

          <div className="rounded-xl border border-orange-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">Current Festival</p>
            <p className="font-semibold text-orange-800">
              🪔 Ganesh Utsav 2026
            </p>
          </div>
        </header>

        {active === "Overview" ? (
          <>
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-orange-700 to-amber-500 p-6 text-white">
              <p className="text-sm text-orange-100">
                Welcome to your committee workspace
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                Celebrate together. Manage transparently.
              </h3>

              <p className="mt-2 max-w-xl text-sm text-orange-50">
                Keep committee activities, contributions, expenses and
                reports organised in one place.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                 label: "Total Donations",
                value: `₹${donations
                  .reduce((total, item) => total + Number(item.amount), 0)
                  .toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
                note: "Recorded contributions",
                icon: "₹",
                },
                {
                  label: "Total Expenses",
                  value: "₹0",
                  note: "Recorded spending",
                  icon: "↗",
                },
                {
                  label: "Available Balance",
                  value: "₹0",
                  note: "Recorded entries only",
                  icon: "▣",
                },
                {
                  label: "Registered Committees",
                  value: String(committees.length),
                  note: "Registered records",
                  icon: "♙",
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      {card.label}
                    </p>

                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-xl text-orange-700">
                      {card.icon}
                    </span>
                  </div>

                  <p className="mt-5 text-3xl font-bold">
                    {card.value}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {card.note}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
              <h3 className="text-lg font-bold">Quick Actions</h3>

              <p className="mt-1 text-sm text-slate-500">
                Choose what you want to manage.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {["Committees", "Donations", "Expenses", "Reports"].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setActive(item)}
                      className="rounded-xl border border-orange-200 p-4 text-left font-medium hover:bg-orange-50"
                    >
                      <span className="block text-orange-700">＋</span>
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>

            <p className="mt-6 text-xs text-slate-400">
              Prototype dashboard. Financial figures are placeholders,
              not live transaction data.
            </p>
          </>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 md:p-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">
                  {active} Management
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Manage your festival records.
                </p>
              </div>

              {active === "Committees" && (
                <button
                  onClick={() => {
                    setShowForm(!showForm);
                    setError("");
                    setSuccess("");
                  }}
                  className="rounded-xl bg-orange-700 px-4 py-3 font-semibold text-white hover:bg-orange-800"
                >
                  {showForm ? "Cancel" : "+ Add Committee"}
                </button>
              )}
            </div>

            {error && (
              <p className="mb-4 break-words rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {error}
              </p>
            )}

            {success && (
              <p className="mb-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">
                {success}
              </p>
            )}

            {active === "Committees" ? (
              <>
                {showForm && (
                  <form
                    onSubmit={handleCreate}
                    className="mb-8 space-y-4 rounded-2xl border border-orange-200 bg-orange-50/50 p-5"
                  >
                    <h4 className="font-bold">
                      Register a New Committee
                    </h4>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Committee Name
                      </label>
                      <input
                        required
                        minLength={3}
                        maxLength={150}
                        value={name}
                        onChange={(event) =>
                          setName(event.target.value)
                        }
                        placeholder="e.g. Venkat Reddy Nagar Ganesh Committee"
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Location
                      </label>
                      <input
                        required
                        minLength={2}
                        maxLength={250}
                        value={location}
                        onChange={(event) =>
                          setLocation(event.target.value)
                        }
                        placeholder="e.g. Hyderabad, Telangana"
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Festival Year
                      </label>
                      <input
                        required
                        type="number"
                        min={2020}
                        max={2100}
                        value={year}
                        onChange={(event) =>
                          setYear(event.target.value)
                        }
                        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 outline-none focus:border-orange-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-orange-700 px-5 py-3 font-semibold text-white hover:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save Committee"}
                    </button>
                  </form>
                )}

                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-semibold">
                    Registered Committees
                  </h4>

                  <button
                    onClick={() => void loadCommittees()}
                    disabled={loading}
                    className="text-sm font-medium text-orange-800 hover:underline disabled:opacity-50"
                  >
                    {loading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {loading && (
                  <p className="py-4 text-slate-500">
                    Loading committees...
                  </p>
                )}

                {!loading && !error && committees.length === 0 && (
                  <p className="rounded-xl bg-stone-50 p-5 text-slate-500">
                    No committees found in the database.
                  </p>
                )}

                <div className="space-y-4">
                  {committees.map((committee) => (
                    <div
                      key={committee.id}
                      className="rounded-xl border border-stone-200 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold">
                            {committee.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {committee.location} · {committee.festival_year}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Status: {committee.status}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            ID: {committee.id} · Slug: {committee.slug}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(committee)}
                            className="rounded-lg border border-orange-300 px-3 py-2 text-sm font-medium text-orange-800 hover:bg-orange-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void toggleHistory(committee.id)
                            }
                            className="rounded-lg border border-blue-300 px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-50"
                          >
                            {historyId === committee.id
                              ? "Hide History"
                              : "History"}
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(committee)}
                            className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {editingId === committee.id && (
                        <form
                          onSubmit={handleUpdate}
                          className="mt-5 space-y-4 rounded-xl bg-orange-50 p-4"
                        >
                          <h4 className="font-semibold">
                            Edit Committee
                          </h4>

                          <div>
                            <label className="mb-1 block text-sm font-medium">
                              Committee Name
                            </label>
                            <input
                              required
                              minLength={3}
                              maxLength={150}
                              value={editName}
                              onChange={(event) =>
                                setEditName(event.target.value)
                              }
                              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium">
                              Location
                            </label>
                            <input
                              required
                              minLength={2}
                              maxLength={250}
                              value={editLocation}
                              onChange={(event) =>
                                setEditLocation(event.target.value)
                              }
                              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
                            />
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-sm font-medium">
                                Festival Year
                              </label>
                              <input
                                required
                                type="number"
                                min={2020}
                                max={2100}
                                value={editYear}
                                onChange={(event) =>
                                  setEditYear(event.target.value)
                                }
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
                              />
                            </div>

                            <div>
                              <label className="mb-1 block text-sm font-medium">
                                Status
                              </label>
                              <select
                                value={editStatus}
                                onChange={(event) =>
                                  setEditStatus(event.target.value)
                                }
                                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
                              >
                                <option value="draft">Draft</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="submit"
                              disabled={saving}
                              className="rounded-lg bg-orange-700 px-4 py-2 font-semibold text-white hover:bg-orange-800 disabled:opacity-50"
                            >
                              {saving ? "Saving..." : "Save Changes"}
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-lg border border-stone-300 px-4 py-2"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}

                      {historyId === committee.id && (
                        <div className="mt-5 rounded-xl bg-stone-50 p-4">
                          <h4 className="font-semibold">
                            Field Change History
                          </h4>

                          <p className="mt-1 text-sm text-slate-500">
                            Previous and updated values for this committee.
                          </p>

                          {historyLoading ? (
                            <p className="mt-4 text-sm text-slate-500">
                              Loading history...
                            </p>
                          ) : auditLogs.length === 0 ? (
                            <p className="mt-4 text-sm text-slate-500">
                              No history records found.
                            </p>
                          ) : (
                            <div className="mt-4 space-y-3">
                              {auditLogs.map((log) => (
                                <div
                                  key={log.id}
                                  className="rounded-lg border border-stone-200 bg-white p-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-semibold">
                                      {log.field_name ?? "Committee"}
                                    </span>

                                    <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800">
                                      {log.action}
                                    </span>
                                  </div>

                                  <p className="mt-2 break-words text-sm">
                                    <span className="text-slate-500">
                                      Old value:
                                    </span>{" "}
                                    {log.old_value ?? "—"}
                                  </p>

                                  <p className="mt-1 break-words text-sm">
                                    <span className="text-slate-500">
                                      New value:
                                    </span>{" "}
                                    {log.new_value ?? "—"}
                                  </p>

                                  <p className="mt-2 text-xs text-slate-500">
                                    By {log.actor} ·{" "}
                                    {new Date(
                                      log.changed_at
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-4 text-slate-600">
                This section is ready for development. Forms, database
                records and access controls will be added before using
                real committee information.
              </p>
            )}

            <button
              onClick={() => setActive("Overview")}
              className="mt-6 rounded-xl bg-orange-700 px-5 py-3 font-semibold text-white hover:bg-orange-800"
            >
              Back to Overview
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
