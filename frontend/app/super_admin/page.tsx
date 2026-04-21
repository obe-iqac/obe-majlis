"use client";

import { SERVER_URL } from "@/constants";
import { FormEvent, useEffect, useMemo, useState } from "react";

type College = {
  _id: string;
  name: string;
  AISHECode: string;
  isActive: boolean;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  createdBy?: string;
  code: string;
};

type CollegeForm = {
  name: string;
  AISHECode: string;
  isActive: boolean;
  trialEndsAt: string;
  subscriptionEndsAt: string;
  code: string;
};

const initialForm: CollegeForm = {
  name: "",
  AISHECode: "",
  isActive: true,
  trialEndsAt: "",
  subscriptionEndsAt: "",
  code: " ",
};

const SUPER_ADMIN_BASE = `${SERVER_URL}/super_admin`;

const formatDateForInput = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const toPayloadDate = (value: string) => {
  if (!value) return null;
  return `${value}T00:00:00.000Z`;
};

export default function SuperAdminPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [rowLoadingId, setRowLoadingId] = useState<string | null>(null);
  const [newCollege, setNewCollege] = useState<CollegeForm>(initialForm);

  const activeCount = useMemo(
    () => colleges.filter((college) => college.isActive).length,
    [colleges],
  );

  const fetchColleges = async () => {
    setLoading(true);
    setPageError("");

    try {
      const response = await fetch(`${SUPER_ADMIN_BASE}/get-all-colleges`, {
        method: "GET",
        credentials: "include",
      });

      const data = (await response.json().catch(() => ({}))) as {
        collegeWithCode?: College[];
        message?: string;
      };

      if (!response.ok) {
        setPageError(data.message || "Unable to fetch colleges.");
        return;
      }

      const normalized = (data.collegeWithCode || []).map((college) => ({
        ...college,
        trialEndsAt: formatDateForInput(college.trialEndsAt),
        subscriptionEndsAt: formatDateForInput(college.subscriptionEndsAt),
      }));

      setColleges(normalized);
    } catch {
      setPageError("Unable to fetch colleges right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const updateLocalCollege = (
    id: string,
    field: keyof College,
    value: string | boolean,
  ) => {
    console.log(id, field, value);
    setColleges((prev) =>
      prev.map((college) =>
        college._id === id ? { ...college, [field]: value } : college,
      ),
    );
  };
  const getISODateAfterDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  const handleSaveCollege = async (college: College) => {
    setPageError("");
    setPageSuccess("");
    setRowLoadingId(college._id);

    try {
      const response = await fetch(
        `${SUPER_ADMIN_BASE}/update-college/${college._id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: college.isActive,
            trialEndsAt: toPayloadDate(college.trialEndsAt || ""),
            subscriptionEndsAt: toPayloadDate(college.subscriptionEndsAt || ""),
            code: college.code,
          }),
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        setPageError(data.message || "Unable to update college.");
        return;
      }

      setPageSuccess("College details updated successfully.");
    } catch {
      setPageError("Unable to update college right now.");
    } finally {
      setRowLoadingId(null);
    }
  };
  const handleDeleteCollege = async (_id: string) => {
    setPageError("");
    setPageSuccess("");
    setRowLoadingId(_id);

    try {
      const response = await fetch(
        `${SUPER_ADMIN_BASE}/delete-college/${_id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        setPageError(data.message || "Unable to delete college.");
        return;
      }

      setPageSuccess("College details deleted successfully.");
      setColleges((prev) => prev.filter((college) => college._id !== _id));
    } catch {
      setPageError("Unable to delete college right now.");
    } finally {
      setRowLoadingId(null);
    }
  };

  const handleAddCollege = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPageError("");
    setPageSuccess("");

    if (
      !newCollege.name.trim() ||
      !newCollege.AISHECode.trim() ||
      !newCollege.code.trim()
    ) {
      setPageError("Name, Login Code  and AISHE code are required.");
      return;
    }

    setCreateLoading(true);

    try {
      const response = await fetch(`${SUPER_ADMIN_BASE}/add-college`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCollege.name.trim(),
          AISHECode: newCollege.AISHECode.trim(),
          isActive: true,
          code: newCollege.code.trim(),
          trialEndsAt: getISODateAfterDays(14),
          subscriptionEndsAt: toPayloadDate(newCollege.subscriptionEndsAt),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message: string;
        college: College;
      };
      if (!response.ok) {
        setPageError(data.message || "Unable to add college.");
        return;
      }

      setPageSuccess("College added successfully.");
      setNewCollege(initialForm);
      setIsAddOpen(false);
      setColleges((prev) => [
        ...prev,
        {
          _id: data.college._id,
          name: newCollege.name.trim(),
          AISHECode: newCollege.AISHECode.trim(),
          isActive: true,
          trialEndsAt: formatDateForInput(getISODateAfterDays(14)),
          subscriptionEndsAt: formatDateForInput(
            toPayloadDate(newCollege.subscriptionEndsAt),
          ),
          code: newCollege.code.trim(),
        },
      ]);
    } catch {
      setPageError("Unable to add college right now.");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[color:var(--color-primary)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Super Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage colleges, access status, and trial/subscription dates.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddOpen((prev) => !prev)}
              className="h-10 rounded-md bg-secondary px-4 text-sm font-semibold text-white transition hover:brightness-95"
            >
              {isAddOpen ? "Close Form" : "Add College"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Total Colleges</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {colleges.length}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Active Colleges</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {activeCount}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Inactive Colleges</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {colleges.length - activeCount}
              </p>
            </div>
          </div>
        </section>

        {isAddOpen && (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Add College
            </h2>
            <form
              className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"
              onSubmit={handleAddCollege}
            >
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  College Name
                </label>
                <input
                  type="text"
                  value={newCollege.name}
                  onChange={(event) =>
                    setNewCollege((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-secondary"
                  placeholder="Enter college name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  AISHE Code
                </label>
                <input
                  type="text"
                  value={newCollege.AISHECode}
                  onChange={(event) =>
                    setNewCollege((prev) => ({
                      ...prev,
                      AISHECode: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-secondary"
                  placeholder="Enter AISHE code"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Login Code
                </label>
                <input
                  type="text"
                  value={newCollege.code}
                  onChange={(event) =>
                    setNewCollege((prev) => ({
                      ...prev,
                      code: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-secondary"
                  placeholder="Enter Login code"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Trial Ends At
                </label>
                <p>
                  {new Date(
                    Date.now() + 14 * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Subscription Ends At
                </label>
                <input
                  type="date"
                  value={newCollege.subscriptionEndsAt}
                  onChange={(event) =>
                    setNewCollege((prev) => ({
                      ...prev,
                      subscriptionEndsAt: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-secondary"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="h-10 rounded-md bg-secondary px-4 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {createLoading ? "Adding..." : "Add College"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Colleges</h2>
          </div>

          {pageError && (
            <p className="mt-4 rounded-md border border-secondary/45 bg-[color:var(--color-primary)] px-3 py-2 text-sm text-slate-800">
              {pageError}
            </p>
          )}

          {pageSuccess && (
            <p className="mt-4 rounded-md border border-tertiary/50 bg-[color:var(--color-primary)] px-3 py-2 text-sm text-slate-800">
              {pageSuccess}
            </p>
          )}

          <div className="mt-4 grid grid-cols-1 gap-4">
            {!loading && colleges.length === 0 && (
              <p className="rounded-md border border-slate-200 bg-[color:var(--color-primary)] px-3 py-6 text-center text-sm text-slate-600">
                No colleges found.
              </p>
            )}

            {colleges.map((college) => (
              <article
                key={college._id}
                className="rounded-md border border-slate-200 bg-white p-4 transition hover:border-tertiary/50"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteCollege(college._id);
                    }}
                    disabled={loading}
                    className="h-9 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:border-tertiary hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Delete
                  </button>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {college.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      AISHE: {college.AISHECode}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Trail ends on: {college.trialEndsAt || "N/A"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Active Status:{" "}
                      {college.isActive === true ? "Active" : "Not Active"}
                    </p>
                  </div>

                  <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-2xl">
                    <div className="rounded-md border border-slate-200 bg-[color:var(--color-primary)] px-3 py-2">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Login Code
                      </label>
                      <input
                        type="text"
                        value={college.code}
                        onChange={(event) =>
                          updateLocalCollege(
                            college._id,
                            "code",
                            event.target.value,
                          )
                        }
                        className=" accent-secondary"
                      />
                    </div>

                    <div className="rounded-md border border-slate-200 bg-[color:var(--color-primary)] px-3 py-2">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Extend subscription to
                      </label>
                      <input
                        type="date"
                        value={college.subscriptionEndsAt || ""}
                        onChange={(event) =>
                          updateLocalCollege(
                            college._id,
                            "subscriptionEndsAt",
                            event.target.value,
                          )
                        }
                        className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm outline-none transition focus:border-secondary"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleSaveCollege(college)}
                    disabled={rowLoadingId === college._id}
                    className="h-9 rounded-md bg-secondary px-4 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {rowLoadingId === college._id
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
