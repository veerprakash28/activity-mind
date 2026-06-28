'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import Header from '@/components/layout/Header';
import StatusModal from '@/components/ui/StatusModal';
import {
  PersonalTask, TaskStatus, getTasks, addTask, updateTask,
  deleteTask
} from '@/database/db';
import {
  ClipboardList, Plus, Trash2, Pencil, Calendar, AlertCircle, CheckCircle, Clock
} from 'lucide-react';

const STATUSES: TaskStatus[] = ['pending', 'completed', 'blocked', 'review', 'discussion'];

export default function TasksPage() {
  const { theme, refreshTasksCount, dbReady } = useAppContext();
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [reminderTime, setReminderTime] = useState('');

  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PersonalTask | null>(null);

  const loadTasks = useCallback(async () => {
    const fetched = await getTasks();
    setTasks(fetched);
  }, []);

  useEffect(() => {
    if (dbReady) {
      loadTasks();
    }
  }, [dbReady, loadTasks]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setNotes('');
    setStatus('pending');
    setPriority('Medium');
    setReminderTime('');
    setEditingTask(null);
  };

  const handleSaveTask = async () => {
    if (!title.trim()) return;
    const timeStr = reminderTime ? new Date(reminderTime).toISOString() : null;

    if (editingTask?.id) {
      await updateTask(editingTask.id, {
        title: title.trim(),
        description: description.trim() || null,
        notes: notes.trim() || null,
        status,
        priority,
        reminder_time: timeStr
      });
    } else {
      await addTask(
        title.trim(),
        description.trim() || null,
        timeStr,
        notes.trim() || null,
        status,
        priority
      );
    }

    resetForm();
    setModalVisible(false);
    loadTasks();
    refreshTasksCount();
  };

  const handleToggleTask = async (task: PersonalTask) => {
    if (!task.id) return;
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await updateTask(task.id, { status: newStatus });
    loadTasks();
    refreshTasksCount();
  };

  const handleEditTask = (task: PersonalTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setNotes(task.notes || '');
    setStatus(task.status);
    setPriority(task.priority);
    setReminderTime(task.reminder_time ? task.reminder_time.split('T')[0] : '');
    setModalVisible(true);
  };

  const handleDeleteClick = (task: PersonalTask) => {
    setDeleteTarget(task);
    setDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    await deleteTask(deleteTarget.id);
    setDeleteConfirmVisible(false);
    loadTasks();
    refreshTasksCount();
  };

  const handleClearCompleted = async () => {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    for (const t of completedTasks) {
      if (t.id) await deleteTask(t.id);
    }
    setClearModalVisible(false);
    loadTasks();
    refreshTasksCount();
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount = tasks.filter(t => t.status !== 'completed').length;

  return (
    <>
      <Header
        title="My Tasks"
        subtitle="Organize and manage engagement actions"
        actions={
          completedCount > 0 ? (
            <button className="btn btn-outline btn-sm" onClick={() => setClearModalVisible(true)} style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
              Clear Completed
            </button>
          ) : undefined
        }
      />

      <div className="page-content">
        {/* Task Counter */}
        {tasks.length > 0 && (
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-text-secondary)',
            letterSpacing: 0.5,
            marginBottom: 16,
            textTransform: 'uppercase'
          }}>
            {pendingCount} Pending · {completedCount} Completed
          </div>
        )}

        {/* Task List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tasks.map(task => {
            const isCompleted = task.status === 'completed';
            const priorityColor = task.priority === 'High'
              ? 'var(--color-error)'
              : task.priority === 'Medium'
                ? 'var(--color-warning)'
                : 'var(--color-success)';

            return (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-surface)',
                  border: `1px solid var(--color-border)`,
                  boxShadow: 'var(--shadow-sm)',
                  opacity: isCompleted ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleTask(task)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: `2px solid ${isCompleted ? 'var(--color-success)' : 'var(--color-border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-success)',
                    background: isCompleted ? 'color-mix(in srgb, var(--color-success) 10%, transparent)' : 'transparent',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {isCompleted && <CheckCircle size={16} />}
                </button>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    marginBottom: task.description ? 4 : 0
                  }}>
                    {task.title}
                  </h4>
                  {task.description && (
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
                      {task.description}
                    </p>
                  )}
                  {task.notes && (
                    <p style={{
                      fontSize: 12,
                      color: 'var(--color-text-secondary)',
                      fontStyle: 'italic',
                      marginTop: 6,
                      padding: '6px 12px',
                      background: 'var(--color-background)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: '3px solid var(--color-primary)'
                    }}>
                      📝 {task.notes}
                    </p>
                  )}
                  
                  {/* Notes & Badges */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: priorityColor,
                      background: `color-mix(in srgb, ${priorityColor} 10%, transparent)`,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>
                      {task.priority}
                    </span>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      background: 'var(--color-primary-light)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>
                      {task.status}
                    </span>
                    {task.reminder_time && (
                      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> {new Date(task.reminder_time).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="header-icon-btn" onClick={() => handleEditTask(task)}>
                    <Pencil size={16} />
                  </button>
                  <button className="header-icon-btn" style={{ color: 'var(--color-error)' }} onClick={() => handleDeleteClick(task)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {tasks.length === 0 && (
          <div className="empty-state">
            <ClipboardList size={48} className="empty-state-icon" />
            <p className="empty-state-title">No tasks yet</p>
            <p className="empty-state-text">Create tasks to stay on top of your team building workflow!</p>
          </div>
        )}

        {/* FAB */}
        <button className="fab" onClick={() => { resetForm(); setModalVisible(true); }}>
          <Plus size={24} />
        </button>
      </div>

      {/* Add/Edit Modal */}
      {modalVisible && (
        <div className="modal-overlay" onClick={() => { setModalVisible(false); resetForm(); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>{editingTask ? 'Edit Task' : 'New Task'}</h3>
              <button className="modal-close" onClick={() => { setModalVisible(false); resetForm(); }}>✕</button>
            </div>
            <div className="modal-body">
              <label className="input-label" style={{ marginTop: 0 }}>Title *</label>
              <input className="input" placeholder="Task title..." value={title} onChange={e => setTitle(e.target.value)} />

              <label className="input-label">Description (optional)</label>
              <textarea className="input textarea" placeholder="Add details..." value={description} onChange={e => setDescription(e.target.value)} />

              <label className="input-label">Notes / comments (optional)</label>
              <textarea className="input textarea" placeholder="Add notes..." value={notes} onChange={e => setNotes(e.target.value)} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="input-label">Priority</label>
                  <select className="input" value={priority} onChange={e => setPriority(e.target.value as any)}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Status</label>
                  <select className="input" value={status} onChange={e => setStatus(e.target.value as any)}>
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="input-label">Reminder Date (optional)</label>
              <input type="date" className="input" value={reminderTime} onChange={e => setReminderTime(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setModalVisible(false); resetForm(); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveTask} disabled={!title.trim()}>
                {editingTask ? 'Update' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Completed Confirmation */}
      <StatusModal
        visible={clearModalVisible}
        type="confirm"
        title="Clear Completed?"
        message={`This will permanently delete all completed tasks. Are you sure?`}
        confirmLabel="Clear All"
        onConfirm={handleClearCompleted}
        onClose={() => setClearModalVisible(false)}
      />

      {/* Delete Confirmation */}
      <StatusModal
        visible={deleteConfirmVisible}
        type="confirm"
        title="Delete Task?"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmVisible(false)}
      />
    </>
  );
}
