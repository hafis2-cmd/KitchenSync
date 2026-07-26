import React, { useState } from 'react';
import { RestaurantTable } from '../../types';
import { updateTableStatus } from '../../lib/api';
import { LayoutGrid, Move, Plus, Save, RotateCcw, Users, CheckCircle, Info } from 'lucide-react';

interface FloorPlanEditorProps {
  tables: RestaurantTable[];
}

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({ tables }) => {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [localTables, setLocalTables] = useState<RestaurantTable[]>(tables);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync props if changed
  React.useEffect(() => {
    setLocalTables(tables);
  }, [tables]);

  const selectedTable = localTables.find((t) => t.id === selectedTableId);

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent, table: RestaurantTable) => {
    e.stopPropagation();
    setSelectedTableId(table.id);
    setDraggingTableId(table.id);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingTableId) return;
    const canvas = e.currentTarget.getBoundingClientRect();
    const xRaw = e.clientX - canvas.left - dragOffset.x;
    const yRaw = e.clientY - canvas.top - dragOffset.y;

    // Snap to 20px grid
    const posX = Math.max(20, Math.min(800, Math.round(xRaw / 20) * 20));
    const posY = Math.max(20, Math.min(500, Math.round(yRaw / 20) * 20));

    setLocalTables((prev) =>
      prev.map((t) => (t.id === draggingTableId ? { ...t, positionX: posX, positionY: posY } : t))
    );
    setHasUnsavedChanges(true);
  };

  const handleMouseUp = () => {
    setDraggingTableId(null);
  };

  const handleSaveFloorPlan = async () => {
    setIsSaving(true);
    try {
      for (const t of localTables) {
        await updateTableStatus(t.id, t.status, t.assignedWaiterId);
        // Send layout position payload
        await fetch(`/api/tables/${t.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            positionX: t.positionX || 100,
            positionY: t.positionY || 100,
            shape: t.shape || 'square',
            capacity: t.capacity,
          }),
        });
      }
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to save layout:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetLayout = () => {
    setLocalTables(
      tables.map((t, idx) => ({
        ...t,
        positionX: (idx % 4) * 200 + 60,
        positionY: Math.floor(idx / 4) * 160 + 60,
      }))
    );
    setHasUnsavedChanges(true);
  };

  const handleUpdateSelectedTableShape = (shape: 'square' | 'round' | 'rectangle') => {
    if (!selectedTableId) return;
    setLocalTables((prev) =>
      prev.map((t) => (t.id === selectedTableId ? { ...t, shape } : t))
    );
    setHasUnsavedChanges(true);
  };

  const handleUpdateSelectedTableCapacity = (capacity: number) => {
    if (!selectedTableId) return;
    setLocalTables((prev) =>
      prev.map((t) => (t.id === selectedTableId ? { ...t, capacity } : t))
    );
    setHasUnsavedChanges(true);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-blue-600" />
            Interactive Dining Room Floor Plan Editor
          </h2>
          <p className="text-xs text-gray-500">
            Drag tables around the floor plan canvas to rearrange dining room layout in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetLayout}
            className="px-3.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Auto-arrange tables into grid"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Auto Grid
          </button>

          <button
            onClick={handleSaveFloorPlan}
            disabled={!hasUnsavedChanges || isSaving}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
              hasUnsavedChanges
                ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Floor Plan' : 'Layout Saved'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Canvas Area */}
        <div className="lg:col-span-3 space-y-2">
          <div
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative w-full h-[540px] bg-slate-900 rounded-2xl border-2 border-slate-800 overflow-hidden shadow-inner cursor-crosshair select-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          >
            {/* Zone Markers */}
            <div className="absolute top-4 left-4 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 border border-slate-800 px-2 py-1 rounded">
              🍷 Main Dining Hall
            </div>
            <div className="absolute bottom-4 right-4 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 border border-slate-800 px-2 py-1 rounded">
              🌴 Patio Terrace
            </div>

            {localTables.map((table) => {
              const posX = table.positionX || 100;
              const posY = table.positionY || 100;
              const isSelected = table.id === selectedTableId;
              const isDragging = table.id === draggingTableId;

              let shapeStyle = 'rounded-xl';
              if (table.shape === 'round') shapeStyle = 'rounded-full';
              if (table.shape === 'rectangle') shapeStyle = 'rounded-lg w-28 h-20';
              else shapeStyle = 'rounded-xl w-24 h-20';

              let statusColor = 'bg-slate-800 border-slate-600 text-slate-200';
              if (table.status === 'Occupied') statusColor = 'bg-blue-900/80 border-blue-500 text-blue-200';
              if (table.status === 'Needs Cleaning') statusColor = 'bg-amber-900/80 border-amber-500 text-amber-200';
              if (table.status === 'Reserved') statusColor = 'bg-purple-900/80 border-purple-500 text-purple-200';

              return (
                <div
                  key={table.id}
                  onMouseDown={(e) => handleMouseDown(e, table)}
                  style={{
                    left: `${posX}px`,
                    top: `${posY}px`,
                  }}
                  className={`absolute flex flex-col items-center justify-center p-2 border-2 cursor-grab active:cursor-grabbing transition-transform ${shapeStyle} ${statusColor} ${
                    isSelected ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-slate-900 z-30 scale-105' : 'hover:scale-102 z-10'
                  } ${isDragging ? 'shadow-2xl z-40 opacity-90' : 'shadow-md'}`}
                >
                  <div className="flex items-center gap-1 font-mono font-black text-xs">
                    <Move className="w-3 h-3 text-slate-400 opacity-60" />
                    <span>T-{table.tableNumber}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-medium text-slate-300 mt-0.5">
                    <Users className="w-3 h-3" />
                    <span>{table.capacity}</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase mt-1 px-1.5 py-0.2 rounded bg-black/40">
                    {table.status}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 font-mono px-1">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              Click & drag any table to reposition. Grid snaps to 20px intervals.
            </span>
            <span>{localTables.length} Configured Tables</span>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Selected Table Configurator
            </h3>

            {selectedTable ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-white border border-gray-200 rounded-lg space-y-1">
                  <p className="font-bold text-gray-900 text-sm">Table #{selectedTable.tableNumber}</p>
                  <p className="text-gray-500">Status: <span className="font-semibold text-blue-600 uppercase">{selectedTable.status}</span></p>
                  <p className="text-gray-500">Assigned Waiter: <span className="font-semibold text-gray-700">{selectedTable.assignedWaiterName || 'Unassigned'}</span></p>
                </div>

                {/* Shape Selector */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 block">Table Geometry Shape</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['square', 'round', 'rectangle'] as const).map((sh) => (
                      <button
                        key={sh}
                        onClick={() => handleUpdateSelectedTableShape(sh)}
                        className={`py-2 rounded-lg font-bold capitalize text-[11px] border transition-all ${
                          selectedTable.shape === sh
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {sh}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Capacity Selector */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-700 block">Guest Capacity</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[2, 4, 6, 8, 10, 12].map((cap) => (
                      <button
                        key={cap}
                        onClick={() => handleUpdateSelectedTableCapacity(cap)}
                        className={`py-1.5 rounded-lg font-bold font-mono text-xs border transition-all ${
                          selectedTable.capacity === cap
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {cap} seats
                      </button>
                    ))}
                  </div>
                </div>

                {/* Position Info */}
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg font-mono text-[11px] text-blue-800 space-y-0.5">
                  <p>X Coordinate: {selectedTable.positionX || 100}px</p>
                  <p>Y Coordinate: {selectedTable.positionY || 100}px</p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 space-y-2">
                <Move className="w-8 h-8 mx-auto text-gray-300" />
                <p className="text-xs font-semibold">Select a table on the floor plan to modify shape or seating capacity.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
