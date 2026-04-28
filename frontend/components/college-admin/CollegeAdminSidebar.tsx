import { WorkspaceMode } from "./types";

type IconType = React.ComponentType<{ className?: string }>;

type WorkspaceTab = {
  id: WorkspaceMode;
  label: string;
  icon: IconType;
};

type KpiItem = {
  title: string;
  value: number;
  icon: IconType;
};

type Props = {
  collegeName?: string;
  captionClass: string;
  workspaceTabs: WorkspaceTab[];
  activeWorkspace: WorkspaceMode;
  setActiveWorkspace: React.Dispatch<React.SetStateAction<WorkspaceMode>>;
  kpis: KpiItem[];
};

export default function CollegeAdminSidebar({
  collegeName,
  captionClass,
  workspaceTabs,
  activeWorkspace,
  setActiveWorkspace,
  kpis,
}: Props) {
  return (
    <aside className="border-b border-slate-200 bg-white px-4 py-5 lg:border-b-0 lg:border-r lg:px-3 lg:py-6">
      <div className="mb-5 px-1">
        <p className={captionClass}>Workspace</p>
        <h1 className="mt-1 text-lg font-semibold text-[#101827]">
          {collegeName ?? "College"} Admin
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-4 lg:hidden">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-3"
            >
              <div className="flex items-center gap-2 text-[#64748b]">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <p className="truncate text-[0.62rem] font-bold uppercase tracking-wide">
                  {kpi.title}
                </p>
              </div>
              <p className="mt-1 text-xl font-semibold text-[#0f172a]">
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 mb-2 px-1">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-400">
          Admin Modules
        </p>
      </div>

      <nav className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {workspaceTabs.map((workspace) => {
          const Icon = workspace.icon;
          const isActive = activeWorkspace === workspace.id;

          return (
            <button
              key={workspace.id}
              type="button"
              onClick={() => setActiveWorkspace(workspace.id)}
              className={`group relative flex h-12 w-full items-center gap-3 rounded-xl border px-3 text-left text-sm transition-all duration-200 ${
                isActive
                  ? "border-[#c8d9e8] bg-[#eaf2f8] font-semibold text-[#14324a] shadow-sm before:absolute before:left-0 before:top-2 before:h-8 before:w-1 before:rounded-r-full before:bg-[#2f5f86]"
                  : "border-slate-200 bg-white font-medium text-slate-600 hover:border-slate-300 hover:bg-[#f8fafc] hover:text-[#14324a]"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive
                    ? "text-[#2f5f86]"
                    : "text-slate-400 group-hover:text-[#2f5f86]"
                }`}
              />
              <span className="truncate">{workspace.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
