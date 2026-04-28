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
  captionClass: string;
  workspaceTabs: WorkspaceTab[];
  activeWorkspace: WorkspaceMode;
  kpis: KpiItem[];
};

export default function CollegeAdminHeader({
  captionClass,
  workspaceTabs,
  activeWorkspace,
  kpis,
}: Props) {
  const activeWorkspaceMeta = workspaceTabs.find(
    (workspace) => workspace.id === activeWorkspace,
  );

  return (
    <header className="mb-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className={captionClass}>College Administration</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#0f172a] sm:text-3xl">
            {activeWorkspaceMeta?.label}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Govern outcomes, attainment policy, programmes, and faculty
            assignments from one institutional control surface.
          </p>
        </div>

        <div className="hidden lg:grid gap-x-7 gap-y-4 border-t border-slate-300/70 pt-4 grid-cols-4 border-t-0 pt-0">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.title}
                className="min-w-0 border-l border-slate-300/80 pl-3"
              >
                <div className="flex items-center gap-2 text-[#64748b]">
                  <Icon className="h-3.5 w-3.5" />
                  <p className="truncate text-[0.68rem] font-bold uppercase">
                    {kpi.title}
                  </p>
                </div>
                <p className="mt-1 text-2xl font-semibold text-[#0f172a]">
                  {kpi.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
