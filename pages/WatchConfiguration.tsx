import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { RotationStatus, ScheduleMode, WatchConfig, StandardConfig, DayNightConfig, CustomSlot } from '../types';
import { checkRotationQuality } from '../utils/scheduleLogic';
import { AlertTriangle, CheckCircle, Info, Plus, Trash2, ChevronUp, ChevronDown, Shuffle, Pencil, Lock } from 'lucide-react';

const WATCH_DURATIONS = [2, 3, 4, 6];

// ─── Duration Button Grid ─────────────────────────────────────────────────────

const DurationPicker: React.FC<{
  label: string;
  value: number;
  onChange: (h: number) => void;
}> = ({ label, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
    <div className="flex gap-2">
      {WATCH_DURATIONS.map(h => (
        <button
          key={h}
          onClick={() => onChange(h)}
          className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all ${
            value === h
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-500'
          }`}
        >
          {h}h
        </button>
      ))}
    </div>
  </div>
);

// ─── Hour Select ──────────────────────────────────────────────────────────────

const HourSelect: React.FC<{
  label: string;
  value: number;
  onChange: (h: number) => void;
  disabled?: boolean;
}> = ({ label, value, onChange, disabled }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
    <select
      value={value}
      disabled={disabled}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full text-sm rounded border-gray-300 dark:border-slate-500 dark:bg-slate-600 dark:text-white px-2 py-1.5 disabled:opacity-50"
    >
      {Array.from({ length: 24 }, (_, i) => (
        <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
      ))}
    </select>
  </div>
);

// ─── Captain's Hour Row ───────────────────────────────────────────────────────

const CaptainsHourRow: React.FC<{
  enabled: boolean;
  start: number;
  onToggle: () => void;
  onChangeStart: (h: number) => void;
}> = ({ enabled, start, onToggle, onChangeStart }) => (
  <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-600 p-4 rounded-lg">
    <div>
      <div className="flex items-center space-x-2">
        <h3 className="text-sm font-medium text-slate-800 dark:text-white">Captain's Hour</h3>
        <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold uppercase">All Hands</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Everyone is awake for 1 hour daily.</p>
    </div>
    <div className="flex items-center space-x-3">
      <select
        disabled={!enabled}
        value={start}
        onChange={e => onChangeStart(Number(e.target.value))}
        className="text-sm rounded border-gray-300 dark:border-slate-500 dark:bg-slate-600 dark:text-white px-2 py-1 disabled:opacity-50"
      >
        {Array.from({ length: 24 }, (_, i) => (
          <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
        ))}
      </select>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-500'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  </div>
);

// ─── Rotation Health ──────────────────────────────────────────────────────────

const RotationHealth: React.FC<{ status: RotationStatus; crewCount: number; watchHours: number }> = ({
  status, crewCount, watchHours,
}) => {
  const colors = {
    [RotationStatus.BAD]:     'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900 dark:text-red-300',
    [RotationStatus.WARNING]: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-900 dark:text-yellow-300',
    [RotationStatus.GOOD]:    'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900 dark:text-green-300',
  };
  return (
    <div className={`rounded-xl p-5 border ${colors[status]}`}>
      <div className="flex items-start space-x-3">
        {status === RotationStatus.BAD     && <AlertTriangle className="w-6 h-6 flex-shrink-0" />}
        {status === RotationStatus.WARNING && <Info className="w-6 h-6 flex-shrink-0" />}
        {status === RotationStatus.GOOD    && <CheckCircle className="w-6 h-6 flex-shrink-0" />}
        <div>
          <h3 className="font-semibold text-lg">
            {status === RotationStatus.BAD     && 'Static Rotation Detected'}
            {status === RotationStatus.WARNING && 'Check Configuration'}
            {status === RotationStatus.GOOD    && 'Healthy Rotation'}
          </h3>
          <p className="text-sm mt-1 opacity-90">
            {status === RotationStatus.BAD     && `With ${crewCount} crew and ${watchHours}h watches, the schedule repeats exactly every 24 hours. Crew will get the same sleep hours every night.`}
            {status === RotationStatus.WARNING && 'Add more crew or adjust settings to calculate rotation health.'}
            {status === RotationStatus.GOOD    && `With ${crewCount} crew and ${watchHours}h watches, the schedule will drift naturally, ensuring a fair share of night shifts.`}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Standard Panel ───────────────────────────────────────────────────────────

const StandardPanel: React.FC<{
  cfg: StandardConfig;
  crewCount: number;
  onChange: (u: Partial<StandardConfig>) => void;
}> = ({ cfg, crewCount, onChange }) => {
  const rotationStatus = useMemo(
    () => checkRotationQuality(crewCount, cfg.watchDurationHours),
    [crewCount, cfg.watchDurationHours]
  );
  return (
    <>
      <div className="space-y-6">
        <DurationPicker
          label="Watch Duration"
          value={cfg.watchDurationHours}
          onChange={h => onChange({ watchDurationHours: h })}
        />
        <p className="text-xs text-gray-500 -mt-4">Common schedules: 3h (fast rotation), 4h (standard), 6h (long rest).</p>
        <hr className="border-gray-100 dark:border-slate-600" />
        <CaptainsHourRow
          enabled={cfg.captainsHourEnabled}
          start={cfg.captainsHourStart}
          onToggle={() => onChange({ captainsHourEnabled: !cfg.captainsHourEnabled })}
          onChangeStart={h => onChange({ captainsHourStart: h })}
        />
      </div>
      <RotationHealth status={rotationStatus} crewCount={crewCount} watchHours={cfg.watchDurationHours} />
    </>
  );
};

// ─── Day/Night Panel ──────────────────────────────────────────────────────────

const DayNightPanel: React.FC<{
  cfg: DayNightConfig;
  onChange: (u: Partial<DayNightConfig>) => void;
}> = ({ cfg, onChange }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-orange-500">☀</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Day Window</span>
        </div>
        <DurationPicker
          label="Watch Duration"
          value={cfg.dayWatchDurationHours}
          onChange={h => onChange({ dayWatchDurationHours: h })}
        />
        <HourSelect
          label="Day starts at"
          value={cfg.dayStartHour}
          onChange={h => onChange({ dayStartHour: h })}
        />
      </div>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <span className="text-indigo-500">☽</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Night Window</span>
        </div>
        <DurationPicker
          label="Watch Duration"
          value={cfg.nightWatchDurationHours}
          onChange={h => onChange({ nightWatchDurationHours: h })}
        />
        <HourSelect
          label="Night starts at"
          value={cfg.nightStartHour}
          onChange={h => onChange({ nightStartHour: h })}
        />
      </div>
    </div>
    <p className="text-xs text-gray-500">
      Day window: {cfg.dayStartHour.toString().padStart(2,'0')}:00 – {cfg.nightStartHour.toString().padStart(2,'0')}:00 &nbsp;·&nbsp;
      Night window: {cfg.nightStartHour.toString().padStart(2,'0')}:00 – {cfg.dayStartHour.toString().padStart(2,'0')}:00 next day.
      Crew rotation is continuous across the boundary.
    </p>
    <hr className="border-gray-100 dark:border-slate-600" />
    <CaptainsHourRow
      enabled={cfg.captainsHourEnabled}
      start={cfg.captainsHourStart}
      onToggle={() => onChange({ captainsHourEnabled: !cfg.captainsHourEnabled })}
      onChangeStart={h => onChange({ captainsHourStart: h })}
    />
  </div>
);

// ─── Custom Panel ─────────────────────────────────────────────────────────────

const CustomPanel: React.FC<{
  slots: CustomSlot[];
  activeCrew: { id: string; name: string }[];
  defaultDurationHours: number;
  onSlotsChange: (slots: CustomSlot[]) => void;
}> = ({ slots, activeCrew, defaultDurationHours, onSlotsChange }) => {
  const cycleDurationHours = slots.reduce((sum, s) => sum + Math.max(0.5, s.durationHours || 1), 0);
  const formatCycleDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const addSlot = () =>
    onSlotsChange([...slots, { id: crypto.randomUUID(), durationHours: defaultDurationHours, crewMemberId: null }]);

  const removeSlot = (id: string) =>
    onSlotsChange(slots.filter(s => s.id !== id));

  const updateSlot = (id: string, updates: Partial<CustomSlot>) =>
    onSlotsChange(slots.map(s => s.id === id ? { ...s, ...updates } : s));

  const moveSlot = (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= slots.length) return;
    const reordered = [...slots];
    [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    onSlotsChange(reordered);
  };

  const autoFill = () =>
    onSlotsChange(
      activeCrew.map(c => ({ id: crypto.randomUUID(), durationHours: defaultDurationHours, crewMemberId: c.id }))
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Pattern slots</p>
          {slots.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              Pattern repeats every <span className="font-semibold">{formatCycleDuration(cycleDurationHours)}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={autoFill}
            disabled={activeCrew.length === 0}
            title="Create one slot per active crew member"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-500 disabled:opacity-40 transition-colors"
          >
            <Shuffle size={14} />
            Auto-fill
          </button>
          <button
            onClick={addSlot}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={14} />
            Add slot
          </button>
        </div>
      </div>

      {slots.length === 0 && (
        <div className="text-center py-10 bg-gray-50 dark:bg-slate-600 rounded-xl border-2 border-dashed border-gray-200 dark:border-slate-500">
          <p className="text-sm text-gray-500 dark:text-gray-400">No slots yet.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Add slots manually or use <strong>Auto-fill</strong> to create one slot per crew member.
          </p>
        </div>
      )}

      {slots.length > 0 && (
        <div className="space-y-2">
          {slots.map((slot, i) => (
            <div key={slot.id} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-600 rounded-lg p-3">
              <span className="text-xs font-mono text-gray-400 w-5 text-center select-none">{i + 1}</span>
              <select
                value={slot.crewMemberId ?? ''}
                onChange={e => updateSlot(slot.id, { crewMemberId: e.target.value || null })}
                className="flex-1 text-sm rounded border-gray-300 dark:border-slate-500 dark:bg-slate-700 dark:text-white px-2 py-1.5"
              >
                <option value="">Auto (rotation)</option>
                {activeCrew.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0.5}
                  max={24}
                  step={0.5}
                  value={slot.durationHours}
                  onChange={e => updateSlot(slot.id, { durationHours: parseFloat(e.target.value) || 1 })}
                  className="w-16 text-sm rounded border-gray-300 dark:border-slate-500 dark:bg-slate-700 dark:text-white px-2 py-1.5 text-center"
                />
                <span className="text-xs text-gray-400">h</span>
              </div>
              <div className="flex flex-col">
                <button onClick={() => moveSlot(i, -1)} disabled={i === 0} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-25 transition-colors">
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => moveSlot(i, 1)} disabled={i === slots.length - 1} className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-25 transition-colors">
                  <ChevronDown size={14} />
                </button>
              </div>
              <button onClick={() => removeSlot(slot.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        <strong>Auto (rotation)</strong> slots are assigned in order from the crew list, continuing across pattern cycles.
        Explicit assignments always use the named crew member.
      </p>
    </div>
  );
};

// ─── View Summary ─────────────────────────────────────────────────────────────

const MODES: { id: ScheduleMode; label: string; description: string }[] = [
  { id: 'standard',  label: 'Standard',  description: 'Equal-length watches, rotating crew' },
  { id: 'day-night', label: 'Day / Night', description: 'Different durations for day and night' },
  { id: 'custom',    label: 'Custom',    description: 'Define any pattern of slots' },
];

const pad2 = (n: number) => n.toString().padStart(2, '0');

const ViewSummary: React.FC<{ config: WatchConfig }> = ({ config }) => {
  const startDate = new Date(config.startDate);
  const formattedDate = startDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-slate-800 dark:text-white text-right">{value}</span>
    </div>
  );

  const modeLabel = MODES.find(m => m.id === config.mode)?.label ?? config.mode;

  return (
    <section className="bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-6 space-y-1">
      <Row label="Mode" value={modeLabel} />
      <Row label="Started" value={`${formattedDate} at ${config.startTime}`} />

      {config.mode === 'standard' && <>
        <Row label="Watch duration" value={`${config.standard.watchDurationHours} hours`} />
        <Row
          label="Captain's Hour"
          value={config.standard.captainsHourEnabled
            ? `Enabled at ${pad2(config.standard.captainsHourStart)}:00`
            : 'Disabled'}
        />
      </>}

      {config.mode === 'day-night' && <>
        <Row label="Day watches" value={`${config.dayNight.dayWatchDurationHours}h from ${pad2(config.dayNight.dayStartHour)}:00`} />
        <Row label="Night watches" value={`${config.dayNight.nightWatchDurationHours}h from ${pad2(config.dayNight.nightStartHour)}:00`} />
        <Row
          label="Captain's Hour"
          value={config.dayNight.captainsHourEnabled
            ? `Enabled at ${pad2(config.dayNight.captainsHourStart)}:00`
            : 'Disabled'}
        />
      </>}

      {config.mode === 'custom' && <>
        <Row label="Slots" value={`${config.custom.slots.length} slot${config.custom.slots.length !== 1 ? 's' : ''}`} />
        {config.custom.slots.length > 0 && (
          <Row
            label="Cycle duration"
            value={(() => {
              const total = config.custom.slots.reduce((s, slot) => s + Math.max(0.5, slot.durationHours || 1), 0);
              const h = Math.floor(total);
              const m = Math.round((total - h) * 60);
              return m > 0 ? `${h}h ${m}m` : `${h}h`;
            })()}
          />
        )}
      </>}
    </section>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const WatchConfiguration: React.FC = () => {
  const { config, updateConfig, crew } = useApp();
  const activeCrew = crew.filter(c => c.isActive);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<WatchConfig>(config);

  const handleEdit = () => {
    setDraft(config);
    setEditing(true);
  };

  const handleSave = () => {
    updateConfig(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(config);
    setEditing(false);
  };

  const updateDraft = (updates: Partial<WatchConfig>) =>
    setDraft(prev => ({ ...prev, ...updates }));

  const updateDraftStandard = (updates: Partial<StandardConfig>) =>
    setDraft(prev => ({ ...prev, standard: { ...prev.standard, ...updates } }));

  const updateDraftDayNight = (updates: Partial<DayNightConfig>) =>
    setDraft(prev => ({ ...prev, dayNight: { ...prev.dayNight, ...updates } }));

  const updateDraftSlots = (slots: CustomSlot[]) =>
    setDraft(prev => ({ ...prev, custom: { slots } }));

  // ── View Mode ──────────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Watch Schedule</h1>
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow"
          >
            <Pencil className="w-4 h-4" />
            Edit Schedule
          </button>
        </div>
        <ViewSummary config={config} />
      </div>
    );
  }

  // ── Edit Mode ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Edit Schedule</h1>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow"
          >
            <Lock className="w-4 h-4" />
            Save & Apply
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-1.5 flex gap-1">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => updateDraft({ mode: m.id })}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all text-center ${
              draft.mode === m.id
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Start Date / Time */}
      <section className="bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
            <input
              type="date"
              value={draft.startDate.split('T')[0]}
              onChange={e => updateDraft({ startDate: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white text-slate-900 dark:border-slate-500 dark:bg-slate-600 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time (Ship Time)</label>
            <input
              type="time"
              value={draft.startTime}
              onChange={e => updateDraft({ startTime: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white text-slate-900 dark:border-slate-500 dark:bg-slate-600 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
            />
          </div>
        </div>
      </section>

      {/* Mode-specific panel */}
      <section className="bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-gray-200 dark:border-slate-600 p-6 space-y-6">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {MODES.find(m => m.id === draft.mode)?.description}
        </p>
        {draft.mode === 'standard' && (
          <StandardPanel
            cfg={draft.standard}
            crewCount={activeCrew.length}
            onChange={updateDraftStandard}
          />
        )}
        {draft.mode === 'day-night' && (
          <DayNightPanel
            cfg={draft.dayNight}
            onChange={updateDraftDayNight}
          />
        )}
        {draft.mode === 'custom' && (
          <CustomPanel
            slots={draft.custom.slots}
            activeCrew={activeCrew}
            defaultDurationHours={draft.standard.watchDurationHours}
            onSlotsChange={updateDraftSlots}
          />
        )}
      </section>
    </div>
  );
};
