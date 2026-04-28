import { FormEvent } from "react";
import { GitBranchPlus } from "lucide-react";
import { ProgramOutcome } from "../types";

type Props = {
  captionClass: string;
  panelTitleClass: string;
  fieldClass: string;
  primaryButtonClass: string;
  tableHeadClass: string;
  newPOValue: string;
  setNewPOValue: React.Dispatch<React.SetStateAction<string>>;
  poMessage: string;
  pos: ProgramOutcome[];
  handleAddPO: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export default function ProgramOutcomesWorkspace({
  captionClass,
  panelTitleClass,
  fieldClass,
  primaryButtonClass,
  tableHeadClass,
  newPOValue,
  setNewPOValue,
  poMessage,
  pos,
  handleAddPO,
}: Props) {
  return (
    <div className="space-y-7">
      <div className="border-b border-slate-300/70 pb-5">
        <p className={captionClass}>Outcomes Registry</p>
        <h3 className={panelTitleClass}>Program outcomes</h3>
      </div>

      <form
        onSubmit={handleAddPO}
        className="grid grid-cols-1 gap-3 border-b border-slate-300/70 pb-6 sm:grid-cols-[minmax(0,1fr)_auto]"
      >
        <input
          type="text"
          value={newPOValue}
          onChange={(event) => setNewPOValue(event.target.value)}
          placeholder="Enter program outcome statement"
          className={fieldClass}
        />
        <button type="submit" className={primaryButtonClass}>
          <GitBranchPlus className="h-4 w-4" />
          Add Outcome
        </button>
      </form>
      {poMessage && (
        <p className="text-sm font-medium text-slate-600">{poMessage}</p>
      )}

      <div className="overflow-auto border-y border-slate-200 bg-[#fcfdfd]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-[#f5f7f9]">
              <th className={tableHeadClass}>ID</th>
              <th className={tableHeadClass}>Outcome Statement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            {pos.map((po) => (
              <tr key={po.id} className="hover:bg-[#f7fafc]">
                <td className="px-3 py-4 font-semibold text-[#111827]">
                  {po.id}
                </td>
                <td className="px-3 py-4 leading-6 text-slate-700">{po.po}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {pos.length === 0 && (
          <p className="px-3 py-8 text-sm text-slate-500">
            No program outcomes added yet.
          </p>
        )}
      </div>
    </div>
  );
}
