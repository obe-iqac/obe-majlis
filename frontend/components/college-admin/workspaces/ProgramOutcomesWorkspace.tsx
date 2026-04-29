import { FormEvent, useState } from "react";
import { GitBranchPlus, Save, X } from "lucide-react";
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
  handleDeletePO: (_id: string, id: string) => Promise<void>;
  handleEditPO: (index: number, newValue: string) => Promise<void>;
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
  handleDeletePO,
  handleEditPO,
}: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedPOValue, setEditedPOValue] = useState("");

  const beginEdit = (index: number, value: string) => {
    setEditingIndex(index);
    setEditedPOValue(value);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditedPOValue("");
  };

  const saveEdit = async (index: number) => {
    if (!editedPOValue.trim()) {
      return;
    }

    await handleEditPO(index, editedPOValue.trim());
    cancelEdit();
  };

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
              <th className={tableHeadClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            {pos.map((po, index) => {
              const isEditing = editingIndex === index;

              return (
                <tr key={po._id ?? po.id} className="hover:bg-[#f7fafc]">
                  <td className="px-3 py-4 font-semibold text-[#111827]">
                    {po.id}
                  </td>
                  <td className="px-3 py-4 leading-6 text-slate-700">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedPOValue}
                        onChange={(event) =>
                          setEditedPOValue(event.target.value)
                        }
                        className={fieldClass}
                        autoFocus
                      />
                    ) : (
                      po.po
                    )}
                  </td>
                  <td className="px-3 py-4 leading-6 text-slate-700">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(index)}
                            disabled={!editedPOValue.trim()}
                            className={primaryButtonClass}
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#eef3f6] px-3 text-sm font-semibold text-[#25425a] transition hover:bg-[#e3ebf1] focus:outline-none focus:ring-2 focus:ring-[#2f5f86]/20"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => beginEdit(index, po.po)}
                          className="inline-flex h-9 items-center justify-center rounded-md bg-[#eef3f6] px-3 text-sm font-semibold text-[#25425a] transition hover:bg-[#e3ebf1] focus:outline-none focus:ring-2 focus:ring-[#2f5f86]/20"
                        >
                          Edit
                        </button>
                      )}

                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to delete ${po.po}? This action cannot be undone.`,
                              )
                            ) {
                              handleDeletePO(po._id ?? po.id, po.id);
                            }
                          }}
                          className="inline-flex h-9 items-center justify-center rounded-md bg-red-50 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
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
