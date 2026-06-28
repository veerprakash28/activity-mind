'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import ActivityCard from '@/components/ActivityCard';
import ActivityDetailModal from '@/components/ActivityDetailModal';
import StatusModal from '@/components/ui/StatusModal';
import {
  Activity, getAllActivities, addCustomActivity, updateActivity,
  deleteActivity, toggleFavorite, isFavorite
} from '@/database/db';
import {
  Search, Plus, X, BookOpen, Pencil, Trash2, Bot
} from 'lucide-react';
import Link from 'next/link';

export default function BankPage() {
  const { theme, categories, refreshCategories, dbReady } = useAppContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tab, setTab] = useState<'builtin' | 'custom'>('builtin');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [favMap, setFavMap] = useState<Record<number, boolean>>({});

  // Add/Edit form
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formNewCategory, setFormNewCategory] = useState('');
  const [formDuration, setFormDuration] = useState('30 min');
  const [formCost, setFormCost] = useState('Low');
  const [formDifficulty, setFormDifficulty] = useState('Medium');
  const [formMinEmp, setFormMinEmp] = useState('2');
  const [formMaxEmp, setFormMaxEmp] = useState('20');
  const [formIndoor, setFormIndoor] = useState('Indoor');
  const [formRemote, setFormRemote] = useState(false);
  const [formSteps, setFormSteps] = useState('');
  const [formMaterials, setFormMaterials] = useState('');

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);

  const [statusVisible, setStatusVisible] = useState(false);
  const [statusTitle, setStatusTitle] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const loadActivities = useCallback(async () => {
    const all = await getAllActivities();
    setActivities(all);
    const map: Record<number, boolean> = {};
    for (const a of all) {
      if (a.id) map[a.id] = await isFavorite(a.id);
    }
    setFavMap(map);
  }, []);

  useEffect(() => {
    if (dbReady) loadActivities();
  }, [dbReady, loadActivities]);

  const filtered = activities.filter(a => {
    const isTab = tab === 'builtin' ? a.is_custom === 0 : a.is_custom === 1;
    const matchesSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !selectedCategory || a.category === selectedCategory;
    return isTab && matchesSearch && matchesCat;
  });

  const builtinCount = activities.filter(a => a.is_custom === 0).length;
  const customCount = activities.filter(a => a.is_custom === 1).length;

  const resetForm = () => {
    setEditingId(null);
    setFormName(''); setFormDesc(''); setFormCategory(''); setFormNewCategory('');
    setFormDuration('30 min'); setFormCost('Low'); setFormDifficulty('Medium');
    setFormMinEmp('2'); setFormMaxEmp('20'); setFormIndoor('Indoor'); setFormRemote(false);
    setFormSteps(''); setFormMaterials('');
  };

  const handleEdit = (a: Activity) => {
    setEditingId(a.id!);
    setFormName(a.name); setFormDesc(a.description); setFormCategory(a.category);
    setFormDuration(a.duration); setFormCost(a.estimated_cost); setFormDifficulty(a.difficulty);
    setFormMinEmp(String(a.min_employees)); setFormMaxEmp(String(a.max_employees));
    setFormIndoor(a.indoor_outdoor); setFormRemote(a.remote_compatible === 1);
    try { setFormSteps(JSON.parse(a.steps).join('\n')); } catch { setFormSteps(''); }
    try { setFormMaterials(JSON.parse(a.materials).join('\n')); } catch { setFormMaterials(''); }
    setFormVisible(true);
  };

  const handleSave = async () => {
    const cat = formNewCategory.trim() || formCategory || categories[0] || 'Team Bonding';
    const data = {
      name: formName.trim(), description: formDesc.trim(), category: cat,
      steps: JSON.stringify(formSteps.split('\n').filter(s => s.trim())),
      materials: JSON.stringify(formMaterials.split('\n').filter(s => s.trim())),
      estimated_cost: formCost, duration: formDuration, difficulty: formDifficulty,
      prep_time: '10 min', min_employees: parseInt(formMinEmp) || 2,
      max_employees: parseInt(formMaxEmp) || 20,
      indoor_outdoor: formIndoor, remote_compatible: formRemote ? 1 : 0,
    };

    if (editingId) {
      await updateActivity(editingId, data);
      setStatusTitle('Updated!');
      setStatusMessage(`"${data.name}" has been updated.`);
    } else {
      await addCustomActivity(data);
      setStatusTitle('Created!');
      setStatusMessage(`"${data.name}" has been added to your bank.`);
    }

    setStatusVisible(true);
    setFormVisible(false);
    resetForm();
    loadActivities();
    refreshCategories();
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await deleteActivity(deleteTarget.id);
    setDeleteConfirmVisible(false);
    loadActivities();
    refreshCategories();
  };

  return (
    <>
      <Header
        title="Activity Bank"
        actions={
          <Link href="/brainstorm" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
            <Bot size={16} /> AI Brainstorm
          </Link>
        }
      />

      <div className="page-content">
        {/* Search */}
        <div className="search-bar" style={{ marginBottom: 16 }}>
          <Search size={18} color={theme.colors.textSecondary} />
          <input placeholder="Search activities..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')}><X size={16} color={theme.colors.textSecondary} /></button>}
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 16 }}>
          <button className={`filter-chip ${!selectedCategory ? 'selected' : ''}`} onClick={() => setSelectedCategory(null)}>All</button>
          {categories.map(c => (
            <button key={c} className={`filter-chip ${selectedCategory === c ? 'selected' : ''}`} onClick={() => setSelectedCategory(selectedCategory === c ? null : c)}>
              {c}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="tab-row">
          <button className={`tab ${tab === 'builtin' ? 'active' : ''}`} onClick={() => setTab('builtin')}>
            <BookOpen size={16} /> Built-in ({builtinCount})
          </button>
          <button className={`tab ${tab === 'custom' ? 'active' : ''}`} onClick={() => setTab('custom')}>
            <Pencil size={16} /> Custom ({customCount})
          </button>
        </div>

        {/* Grid */}
        <div className="card-grid">
          {filtered.map(a => (
            <ActivityCard
              key={a.id}
              activity={a}
              isFav={favMap[a.id!]}
              onPress={() => { setSelectedActivity(a); setDetailVisible(true); }}
              onFavToggle={async () => {
                if (!a.id) return;
                const r = await toggleFavorite(a.id);
                setFavMap(p => ({ ...p, [a.id!]: r }));
              }}
              actions={a.is_custom === 1 ? (
                <>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(a)}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: theme.colors.error }} onClick={() => { setDeleteTarget(a); setDeleteConfirmVisible(true); }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              ) : undefined}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <BookOpen size={48} className="empty-state-icon" />
            <p className="empty-state-title">No activities found</p>
            <p className="empty-state-text">{tab === 'custom' ? 'Create your first custom activity!' : 'Try adjusting your search or filters.'}</p>
          </div>
        )}

        {tab === 'custom' && (
          <button className="fab" onClick={() => { resetForm(); setFormVisible(true); }}>
            <Plus size={24} />
          </button>
        )}
      </div>

      {/* Add/Edit Modal */}
      {formVisible && (
        <div className="modal-overlay" onClick={() => { setFormVisible(false); resetForm(); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>{editingId ? 'Edit Activity' : 'New Custom Activity'}</h3>
              <button className="modal-close" onClick={() => { setFormVisible(false); resetForm(); }}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <label className="input-label" style={{ marginTop: 0 }}>Name *</label>
              <input className="input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Activity name" />

              <label className="input-label">Description *</label>
              <textarea className="input textarea" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Describe the activity..." />

              <label className="input-label">Category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {categories.map(c => (
                  <button key={c} className={`filter-chip ${formCategory === c && !formNewCategory ? 'selected' : ''}`} onClick={() => { setFormCategory(c); setFormNewCategory(''); }} style={{ fontSize: 12 }}>
                    {c}
                  </button>
                ))}
              </div>
              <input className="input" value={formNewCategory} onChange={e => setFormNewCategory(e.target.value)} placeholder="+ Add new category" style={{ fontSize: 13 }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="input-label">Duration</label>
                  <select className="input" value={formDuration} onChange={e => setFormDuration(e.target.value)}>
                    {['15 min', '30 min', '1 hr', 'Half Day'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Budget</label>
                  <select className="input" value={formCost} onChange={e => setFormCost(e.target.value)}>
                    {['Low', 'Medium', 'High'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Min Employees</label>
                  <input className="input" type="number" value={formMinEmp} onChange={e => setFormMinEmp(e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Max Employees</label>
                  <input className="input" type="number" value={formMaxEmp} onChange={e => setFormMaxEmp(e.target.value)} />
                </div>
              </div>

              <label className="input-label">Steps (one per line)</label>
              <textarea className="input textarea" value={formSteps} onChange={e => setFormSteps(e.target.value)} placeholder="Step 1&#10;Step 2&#10;Step 3" />

              <label className="input-label">Materials (one per line)</label>
              <textarea className="input textarea" value={formMaterials} onChange={e => setFormMaterials(e.target.value)} placeholder="Item 1&#10;Item 2" />

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                <input type="checkbox" checked={formRemote} onChange={e => setFormRemote(e.target.checked)} id="remote" />
                <label htmlFor="remote" style={{ fontSize: 14, color: theme.colors.text }}>Remote Compatible</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setFormVisible(false); resetForm(); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!formName.trim() || !formDesc.trim()}>
                {editingId ? 'Update' : 'Create Activity'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ActivityDetailModal activity={selectedActivity} visible={detailVisible} onClose={() => setDetailVisible(false)} />
      <StatusModal visible={deleteConfirmVisible} type="confirm" title="Delete Activity?" message={`"${deleteTarget?.name}" will be permanently deleted.`} confirmLabel="Delete" onConfirm={handleDelete} onClose={() => setDeleteConfirmVisible(false)} />
      <StatusModal visible={statusVisible} type="success" title={statusTitle} message={statusMessage} onConfirm={() => setStatusVisible(false)} onClose={() => setStatusVisible(false)} />
    </>
  );
}
