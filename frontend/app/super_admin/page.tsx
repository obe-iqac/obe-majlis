"use client";

import { SERVER_URL } from "@/constants";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  KeyRound,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

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

const getISODateAfterDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const getDaysUntil = (value: string | null) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
};

const getGovernanceStatus = (college: College) => {
  const trialDays = getDaysUntil(college.trialEndsAt);
  const subscriptionDays = getDaysUntil(college.subscriptionEndsAt);

  if (!college.isActive) {
    return {
      label: "Restricted",
      detail: "Access manually restricted",
      className: "bg-[#fff7f7] text-[#8a1f1f] ring-[#f0c4c4]",
    };
  }

  if (subscriptionDays !== null && subscriptionDays < 0) {
    return {
      label: "Expired Access",
      detail: "Subscription term elapsed",
      className: "bg-[#fff7f7] text-[#8a1f1f] ring-[#f0c4c4]",
    };
  }

  if (subscriptionDays !== null && subscriptionDays <= 30) {
    return {
      label: "Expiring Soon",
      detail: `${subscriptionDays} days remaining`,
      className: "bg-[#fff8ed] text-[#8a4b16] ring-[#eed0a8]",
    };
  }

  if (subscriptionDays !== null) {
    return {
      label: "Subscription Controlled",
      detail: "Paid tenancy window active",
      className: "bg-[#f0f7fb] text-[#245778] ring-[#bdd7e7]",
    };
  }

  if (trialDays !== null && trialDays >= 0) {
    return {
      label: "Trial Active",
      detail: `${trialDays} days in trial window`,
      className: "bg-[#f3faf7] text-[#1f684c] ring-[#b8decf]",
    };
  }

  return {
    label: "Expired Access",
    detail: "No active commercial term",
    className: "bg-[#fff7f7] text-[#8a1f1f] ring-[#f0c4c4]",
  };
};

export default function SuperAdminPage() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [rowLoadingId, setRowLoadingId] = useState<string | null>(null);
  const [newCollege, setNewCollege] = useState<CollegeForm>(initialForm);
  const [trialEndsPreviewDate] = useState(() =>
    formatDateForInput(getISODateAfterDays(14)),
  );

  const activeCount = useMemo(
    () => colleges.filter((college) => college.isActive).length,
    [colleges],
  );

  const fetchColleges = async () => {
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
      setPageError("");
    } catch {
      setPageError("Unable to fetch colleges right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const inactiveCount = colleges.length - activeCount;
  const fieldClass =
    "h-10 w-full rounded-md border-0 bg-[#f4f6f8] px-3 text-sm font-medium text-slate-900 outline-none ring-1 ring-inset ring-slate-300/70 transition placeholder:font-normal placeholder:text-slate-400 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#2f5f86]/35";
  const compactFieldClass =
    "h-9 w-full rounded-md border-0 bg-[#f4f6f8] px-2.5 text-sm font-medium text-slate-900 outline-none ring-1 ring-inset ring-slate-300/70 transition hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#2f5f86]/35";
  const primaryButtonClass =
    "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#17324a] px-3.5 text-sm font-semibold text-white transition hover:bg-[#10263a] focus:outline-none focus:ring-2 focus:ring-[#17324a]/20 disabled:cursor-not-allowed disabled:opacity-60";
  const secondaryButtonClass =
    "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#eef3f6] px-3 text-sm font-semibold text-[#25425a] transition hover:bg-[#e3ebf1] focus:outline-none focus:ring-2 focus:ring-[#2f5f86]/20";
  const dangerButtonClass =
    "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#fff1f1] px-3 text-sm font-semibold text-[#9f1d1d] ring-1 ring-inset ring-red-200/70 transition hover:bg-[#ffe6e6] focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60";
  const captionClass = "text-[0.68rem] font-bold uppercase text-[#587089]";

  return (
    <main className="min-h-screen bg-[#eef1f4] text-slate-950">
      <div className="mx-auto min-h-screen w-full max-w-[1440px]">
        <section className="border-b border-slate-300/70 bg-[#f8fafb] px-5 py-4 sm:px-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div>
              <p className={captionClass}>Platform Governance</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal text-[#101827] sm:text-3xl">
                Super Admin Control
              </h1>
              <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">
                Executive oversight for institution onboarding, college access,
                subscription governance, and OBE platform tenancy.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-x-6 gap-y-3 border-t border-slate-300/70 pt-3 sm:gap-x-8 xl:min-w-[520px] xl:border-t-0 xl:pt-0">
              <div className="min-w-0 border-l border-slate-300/80 pl-3">
                <p className="truncate text-[0.68rem] font-bold uppercase text-[#587089]">
                  Institutions
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-[#111827]">
                  {colleges.length}
                </p>
              </div>
              <div className="min-w-0 border-l border-slate-300/80 pl-3">
                <p className="truncate text-[0.68rem] font-bold uppercase text-[#587089]">
                  Active Access
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-[#111827]">
                  {activeCount}
                </p>
              </div>
              <div className="min-w-0 border-l border-slate-300/80 pl-3">
                <p className="truncate text-[0.68rem] font-bold uppercase text-[#587089]">
                  Restricted
                </p>
                <p className="mt-0.5 text-2xl font-semibold text-[#111827]">
                  {inactiveCount}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
              <ShieldCheck className="h-4 w-4 text-[#2f5f86]" />
              <span>Master registry authority across onboarded colleges</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddOpen((prev) => !prev)}
              className={isAddOpen ? secondaryButtonClass : primaryButtonClass}
            >
              {isAddOpen ? (
                <>
                  <X className="h-4 w-4" />
                  Close Onboarding
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Register Institution
                </>
              )}
            </button>
          </div>
        </section>

        <div className="space-y-5 bg-white px-5 py-5 sm:px-6">
          {isAddOpen && (
            <section className="border-y border-slate-300/70 bg-[#fcfdfd] px-4 py-4 sm:px-5">
              <div className="grid gap-5 xl:grid-cols-[230px_minmax(0,1fr)]">
                <div>
                  <p className={captionClass}>Institution Onboarding</p>
                  <h2 className="mt-1 text-xl font-semibold text-[#111827]">
                    Register New Institution
                  </h2>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">
                    Create a governed tenant record with AISHE identity,
                    platform login code, trial window, and subscription term.
                  </p>
                </div>

                <form
                  className="grid grid-cols-1 gap-3 lg:grid-cols-4"
                  onSubmit={handleAddCollege}
                >
                  <div className="space-y-1.5 lg:col-span-2">
                    <label className={captionClass}>Institution Name</label>
                    <input
                      type="text"
                      value={newCollege.name}
                      onChange={(event) =>
                        setNewCollege((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      className={fieldClass}
                      placeholder="Enter college name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={captionClass}>AISHE Identity</label>
                    <input
                      type="text"
                      value={newCollege.AISHECode}
                      onChange={(event) =>
                        setNewCollege((prev) => ({
                          ...prev,
                          AISHECode: event.target.value,
                        }))
                      }
                      className={fieldClass}
                      placeholder="Enter AISHE code"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={captionClass}>Login Credential Code</label>
                    <input
                      type="text"
                      value={newCollege.code}
                      onChange={(event) =>
                        setNewCollege((prev) => ({
                          ...prev,
                          code: event.target.value,
                        }))
                      }
                      className={fieldClass}
                      placeholder="Enter login code"
                    />
                  </div>

                  <div className="space-y-1.5 lg:col-span-2">
                    <label className={captionClass}>Trial Access Ends</label>
                    <div className="flex h-10 items-center rounded-md bg-[#eef3f6] px-3 text-sm font-semibold text-[#25425a] ring-1 ring-inset ring-slate-300/70">
                      <CalendarClock className="mr-2 h-4 w-4 text-[#587089]" />
                      {trialEndsPreviewDate || "N/A"}
                    </div>
                  </div>

                  <div className="space-y-1.5 lg:col-span-2">
                    <label className={captionClass}>Subscription Ends</label>
                    <input
                      type="date"
                      value={newCollege.subscriptionEndsAt}
                      onChange={(event) =>
                        setNewCollege((prev) => ({
                          ...prev,
                          subscriptionEndsAt: event.target.value,
                        }))
                      }
                      className={fieldClass}
                    />
                  </div>

                  <div className="flex justify-end border-t border-slate-200 pt-3 lg:col-span-4">
                    <button
                      type="submit"
                      disabled={createLoading}
                      className={primaryButtonClass}
                    >
                      <Building2 className="h-4 w-4" />
                      {createLoading ? "Registering..." : "Register College"}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          <section>
            <div className="flex flex-col gap-3 border-b border-slate-300/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={captionClass}>Institution Registry</p>
                <h2 className="mt-1 text-xl font-semibold text-[#111827]">
                  Managed colleges
                </h2>
              </div>
              <p className="text-sm font-medium text-slate-500">
                {loading
                  ? "Loading platform records..."
                  : `${colleges.length} records under governance`}
              </p>
            </div>

            {pageError && (
              <p className="mt-4 border-l-2 border-[#b64040] bg-[#fff7f7] px-3 py-2 text-sm font-medium text-[#8a1f1f]">
                {pageError}
              </p>
            )}

            {pageSuccess && (
              <p className="mt-4 border-l-2 border-[#2f7d5f] bg-[#f3faf7] px-3 py-2 text-sm font-medium text-[#1f684c]">
                {pageSuccess}
              </p>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3">
              {!loading && colleges.length === 0 && (
                <p className="border-y border-slate-200 bg-[#fcfdfd] px-3 py-10 text-center text-sm font-medium text-slate-500">
                  No institution records are currently onboarded.
                </p>
              )}

              {colleges.map((college) => (
                <article
                  key={college._id}
                  className="border-y border-slate-200 bg-[#fcfdfd] transition hover:bg-white"
                >
                  {(() => {
                    const governanceStatus = getGovernanceStatus(college);

                    return (
                      <>
                        <div className="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(250px,0.9fr)_minmax(0,1.55fr)_minmax(190px,auto)] xl:items-start">
                          <div>
                            <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#e7eef5] text-[#2f5f86]">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold text-[#111827]">
                            {college.name}
                          </h3>
                          <div className="mt-1.5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                            <span className="rounded-md bg-white px-2 py-1 ring-1 ring-inset ring-slate-200">
                              AISHE {college.AISHECode || "N/A"}
                            </span>
                            <span
                              className={`rounded-md px-2 py-1 ring-1 ring-inset ${governanceStatus.className}`}
                            >
                              {governanceStatus.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 text-sm">
                        <div>
                          <p className={captionClass}>Trial Ends</p>
                          <p className="mt-0.5 font-semibold text-slate-800">
                            {college.trialEndsAt || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className={captionClass}>Subscription</p>
                          <p className="mt-0.5 font-semibold text-slate-800">
                            {college.subscriptionEndsAt || "Not set"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                      <div className="space-y-1.5">
                        <label className={captionClass}>Credential Code</label>
                        <div className="relative">
                          <KeyRound className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
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
                            className={`${compactFieldClass} pl-8`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className={captionClass}>Access Status</label>
                        <select
                          value={college.isActive ? "active" : "inactive"}
                          onChange={(event) =>
                            updateLocalCollege(
                              college._id,
                              "isActive",
                              event.target.value === "active",
                            )
                          }
                          className={compactFieldClass}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Restricted</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className={captionClass}>Subscription Term</label>
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
                          className={compactFieldClass}
                        />
                      </div>
                    </div>

                          <div className="flex flex-col gap-2">
                            <div className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                              <p className={captionClass}>Governance Cue</p>
                              <p className="mt-1 text-slate-800">
                                {governanceStatus.detail}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveCollege(college)}
                                disabled={rowLoadingId === college._id}
                                className={`${primaryButtonClass} px-2.5`}
                              >
                                <Save className="h-4 w-4" />
                                {rowLoadingId === college._id
                                  ? "Saving..."
                                  : "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleDeleteCollege(college._id);
                                }}
                                disabled={loading || rowLoadingId === college._id}
                                className={`${dangerButtonClass} px-2.5`}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 border-t border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-500 sm:grid-cols-3">
                          <div className="flex items-center gap-2 py-0.5">
                            <BadgeCheck className="h-4 w-4 text-[#587089]" />
                            Institution registry record
                          </div>
                          <div className="py-0.5">Tenant ID: {college._id}</div>
                          <div className="py-0.5 sm:text-right">
                            Governance: {governanceStatus.label}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
