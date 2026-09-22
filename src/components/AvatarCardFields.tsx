"use client";

type Draft = {
  talkingPhotoName: string;
  project: string;
  voiceId: string;
};

type Props = {
  id: string;
  displayed: Draft;
  isDirty: boolean;
  isOnGeneratePage: boolean;
  isSelected: boolean;
  onFieldChange: (
    field: keyof Draft
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onSelect: () => void;
};

export default function AvatarCardFields({
  id,
  displayed,
  isDirty,
  isOnGeneratePage,
  isSelected,
  onFieldChange,
  onSave,
  onSelect,
}: Props) {
  const nameFieldId = `talkingPhotoName-${id}`;
  const projectFieldId = `project-${id}`;
  const voiceFieldId = `voiceId-${id}`;

  return (
    <div className="mt-2">
      <label className="text-xs px-1 text-gray-600" htmlFor={nameFieldId}>
        Talking Photo Name
      </label>
      <input
        id={nameFieldId}
        type="text"
        value={displayed.talkingPhotoName}
        onChange={onFieldChange("talkingPhotoName")}
        placeholder="Talking Photo Name"
        className="border rounded-sm p-1 w-full"
      />
      <label
        className="text-xs px-1 text-gray-600 mt-2 block"
        htmlFor={projectFieldId}
      >
        Project
      </label>
      <input
        id={projectFieldId}
        type="text"
        value={displayed.project}
        onChange={onFieldChange("project")}
        placeholder="Project"
        className="border rounded-sm p-1 w-full"
      />
      <label
        className="text-xs px-1 text-gray-600 mt-2 block"
        htmlFor={voiceFieldId}
      >
        Voice ID
      </label>
      <input
        id={voiceFieldId}
        type="text"
        value={displayed.voiceId}
        onChange={onFieldChange("voiceId")}
        placeholder="Voice ID"
        className="border rounded-sm p-1 w-full"
      />
      <div className="flex justify-between items-center mt-2">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className={`bg-blue-500 text-white px-3 py-2 rounded-md ${
              isDirty ? "hover:bg-blue-600" : "opacity-50 cursor-not-allowed"
            }`}
            disabled={!isDirty}
          >
            Save
          </button>
          {!isOnGeneratePage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600"
            >
              {isSelected ? "Go to Generate" : "Select"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
