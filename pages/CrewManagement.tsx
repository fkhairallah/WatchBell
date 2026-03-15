import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, GripVertical, Plus, User } from 'lucide-react';

export const CrewManagement: React.FC = () => {
  const { crew, addCrewMember, removeCrewMember, reorderCrew, navigateTo } = useApp();
  const [newName, setNewName] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      addCrewMember(newName.trim());
      setNewName('');
    }
  };

  const onDragStart = (e: React.PointerEvent<HTMLButtonElement>, index: number) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragIndex(index);
    setDropIndex(index);
  };

  const onDragMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragIndex === null) return;
    const y = e.clientY;
    let target = dragIndex;
    itemRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const { top, height } = ref.getBoundingClientRect();
      if (y > top + height / 2) target = i + 1;
    });
    setDropIndex(Math.min(target, crew.length - 1));
  };

  const getItemTransform = (index: number): string => {
    if (dragIndex === null || dropIndex === null || dragIndex === dropIndex || index === dragIndex) return '';
    const ref = itemRefs.current[dragIndex];
    const shift = (ref ? ref.getBoundingClientRect().height : 64) + 12; // 12px = space-y-3
    if (dragIndex < dropIndex && index > dragIndex && index <= dropIndex) return `translateY(-${shift}px)`;
    if (dragIndex > dropIndex && index >= dropIndex && index < dragIndex) return `translateY(${shift}px)`;
    return '';
  };

  const onDragEnd = () => {
    if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
      const updated = [...crew];
      const [item] = updated.splice(dragIndex, 1);
      updated.splice(dropIndex, 0, item);
      reorderCrew(updated);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Crew List</h1>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
          {crew.length} Active
        </span>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter crew name..."
          className="flex-1 rounded-lg border border-gray-300 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-4 py-2"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="space-y-3">
        {crew.map((member, index) => (
          <React.Fragment key={member.id}>
            {dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex && dropIndex === index && index <= dragIndex && (
              <div className="h-0.5 bg-red-500 rounded-full -mb-1.5 mx-1 transition-opacity duration-150" />
            )}
            <div
              ref={el => { itemRefs.current[index] = el; }}
              className={`bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border flex items-center justify-between ${
                dragIndex === index
                  ? 'opacity-30 scale-[0.97] border-gray-200 dark:border-slate-600'
                  : 'border-gray-200 dark:border-slate-600'
              }`}
              style={{
                transform: getItemTransform(index),
                transition: dragIndex !== null ? 'transform 180ms ease, opacity 180ms ease' : 'transform 250ms ease',
                zIndex: dragIndex === index ? 0 : 1,
              }}
            >
            <div className="flex items-center space-x-4">
              <button
                onPointerDown={(e) => onDragStart(e, index)}
                onPointerMove={onDragMove}
                onPointerUp={onDragEnd}
                onPointerCancel={onDragEnd}
                className="touch-none cursor-grab active:cursor-grabbing p-1 text-gray-400 dark:text-gray-500 hover:text-blue-500"
                aria-label="Drag to reorder"
              >
                <GripVertical className="w-5 h-5" />
              </button>

              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => dragIndex === null && navigateTo(`/crew/${member.id}`)}
              >
                <div className="bg-gray-100 dark:bg-slate-600 p-2.5 rounded-full">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 dark:text-white text-lg">{member.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Position #{index + 1} in rotation</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => removeCrewMember(member.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              aria-label="Remove crew member"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            </div>
            {dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex && dropIndex === index && index >= dragIndex && (
              <div className="h-0.5 bg-red-500 rounded-full -mt-1.5 mx-1 transition-opacity duration-150" />
            )}
          </React.Fragment>
        ))}

        {crew.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400">No crew members yet.</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-slate-700/50 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-300">
        <p className="font-medium mb-1">Tip:</p>
        <p>Order matters! The rotation will follow the sequence shown above. Drag the handle to reorder.</p>
      </div>
    </div>
  );
};
