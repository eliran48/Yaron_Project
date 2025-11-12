import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { PROJECT_DATA } from './constants';
import { Phase, Task, TaskStatus } from './types';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getIconComponent } from './components/Icons';

// =================================================================
// Helper Functions
// =================================================================

/**
 * Calculates the status of a phase based on its tasks.
 */
const calculatePhaseStatus = (phase: Omit<Phase, 'status'>): TaskStatus => {
  const totalTasks = phase.tasks.length;
  if (totalTasks === 0) return TaskStatus.Pending;

  const completedTasks = phase.tasks.filter(t => t.status === TaskStatus.Completed).length;

  if (completedTasks === totalTasks) {
    return TaskStatus.Completed;
  }
  if (completedTasks > 0 || phase.tasks.some(t => t.status === TaskStatus.InProgress)) {
    return TaskStatus.InProgress;
  }
  return TaskStatus.Pending;
};

/**
 * Initializes the project data by calculating the initial status for each phase.
 */
const initializeProjectData = (data: Omit<Phase, 'status'>[]): Phase[] => {
  return data.map(phase => ({
    ...phase,
    status: calculatePhaseStatus(phase),
  }));
};

const getStatusStyles = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.Completed:
      return {
        badge: 'bg-green-100 text-green-800 border-green-300',
        border: 'border-l-green-500',
      };
    case TaskStatus.InProgress:
      return {
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        border: 'border-l-blue-500',
      };
    case TaskStatus.Pending:
    default:
      return {
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        border: 'border-l-yellow-400',
      };
  }
};


// =================================================================
// Components
// =================================================================


interface TaskItemProps {
  task: Task;
  onUpdate: (updatedValues: Partial<Task>) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdate }) => {
  const [currentHours, setCurrentHours] = useState(task.hours);

  useEffect(() => {
    setCurrentHours(task.hours);
  }, [task.hours]);

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentHours(Number(e.target.value));
  };

  const handleHoursBlur = () => {
    const newHours = currentHours < 0 ? 0 : currentHours;
    if (task.hours !== newHours) {
        onUpdate({ hours: newHours });
    }
  };

  const handleHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const cycleStatus = () => {
    const statuses = [TaskStatus.Pending, TaskStatus.InProgress, TaskStatus.Completed];
    const currentIndex = statuses.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    onUpdate({ status: statuses[nextIndex] });
  };
  
  const statusConfig = {
    [TaskStatus.Pending]: { button: 'bg-yellow-400 hover:bg-yellow-500', text: 'text-slate-800', title: 'סטטוס: ממתין. לחץ לשינוי.' },
    [TaskStatus.InProgress]: { button: 'bg-blue-500 hover:bg-blue-600', text: 'text-slate-800 font-medium', title: 'סטטוס: בתהליך. לחץ לשינוי.' },
    [TaskStatus.Completed]: { button: 'bg-teal-500 hover:bg-teal-600', text: 'line-through text-slate-500', title: 'סטטוס: הושלם. לחץ לשינוי.' }
  };

  return (
    <li
      className="flex items-center p-3 transition-all duration-200 rounded-lg hover:bg-slate-100"
    >
      <button 
          onClick={cycleStatus} 
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all duration-300 ${statusConfig[task.status].button} border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          aria-label={`Change status for ${task.name}. Current status: ${task.status}.`}
          title={statusConfig[task.status].title}
      />
      <span className={`mx-4 flex-grow transition-colors duration-300 ${statusConfig[task.status].text}`}>
        {task.name}
      </span>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <label htmlFor={`hours-${task.id}`} className="cursor-pointer">שעות:</label>
        <input
          id={`hours-${task.id}`}
          type="number"
          value={currentHours}
          onChange={handleHoursChange}
          onBlur={handleHoursBlur}
          onKeyDown={handleHoursKeyDown}
          className="w-16 p-1 text-center bg-slate-100 border border-transparent rounded-md focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          min="0"
          aria-label={`Hours for task ${task.name}`}
        />
      </div>
    </li>
  );
};

interface PhaseCardProps {
  phase: Phase;
  onUpdateTask: (phaseId: string, taskId: string, updatedValues: Partial<Task>) => void;
  onAddTask: (phaseId: string, taskName: string) => void;
  isInitiallyOpen: boolean;
}

const PhaseCard: React.FC<PhaseCardProps> = ({ phase, onUpdateTask, onAddTask, isInitiallyOpen }) => {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = getIconComponent(phase.icon);

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskName.trim()) {
      onAddTask(phase.id, newTaskName.trim());
      setNewTaskName('');
      setIsAdding(false);
    }
  };

  const completedTasks = useMemo(() => phase.tasks.filter(t => t.status === TaskStatus.Completed).length, [phase.tasks]);
  const progress = useMemo(() => (phase.tasks.length > 0 ? (completedTasks / phase.tasks.length) * 100 : 0), [completedTasks, phase.tasks.length]);
  const styles = getStatusStyles(phase.status);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`mb-6 bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border-l-4 ${styles.border}`}>
      <div
        className="flex items-center p-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        role="button"
        aria-expanded={isOpen}
        aria-controls={`phase-content-${phase.id}`}
        tabIndex={0}
      >
        <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg mr-4">
          <Icon className="w-6 h-6 text-slate-600" />
        </div>
        <div className="flex-grow">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">{phase.title}</h3>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${styles.badge}`}>
              {phase.status}
            </span>
          </div>
          <p className="text-sm text-slate-500">{phase.timeline} • {completedTasks}/{phase.tasks.length} הושלמו</p>
        </div>
        <svg className={`w-5 h-5 text-slate-500 ml-4 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      <div
        id={`phase-content-${phase.id}`}
        className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen' : 'max-h-0'}`}
      >
        <div className="px-4 pb-4 border-t border-slate-200">
           <div className="mt-4">
              <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold text-slate-700">מטרות:</h4>
            <ul className="mt-2 text-sm text-slate-600 list-disc list-inside space-y-1">
              {phase.goals.map((goal, index) => <li key={index}>{goal}</li>)}
            </ul>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold text-slate-700">פעולות:</h4>
            <ul className="mt-2 space-y-1">
              {phase.tasks.map(task => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onUpdate={(updates) => onUpdateTask(phase.id, task.id, updates)}
                />
              ))}
            </ul>
            <div className="mt-4">
              {isAdding ? (
                <form onSubmit={handleAddTaskSubmit} className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="הזן שם משימה חדשה..."
                    className="flex-grow p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    aria-label="New task name"
                  />
                  <button type="submit" className="px-4 py-2 bg-teal-500 text-white font-semibold rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors">
                    שמור
                  </button>
                  <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors">
                    בטל
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full text-left p-3 flex items-center gap-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label={`Add task to ${phase.title}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  הוסף משימה חדשה
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// =================================================================
// Add Task Modal Component
// =================================================================
interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (phaseId: string, taskName: string) => void;
  phases: Phase[];
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAddTask, phases }) => {
  const [taskName, setTaskName] = useState('');
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // When modal opens, reset state and focus the input
    if (isOpen) {
      setTaskName('');
      if (phases.length > 0) {
        setSelectedPhaseId(phases[0].id);
      }
      // Timeout to allow modal to render before focusing
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, phases]);
  
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim() && selectedPhaseId) {
      onAddTask(selectedPhaseId, taskName.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300" 
        onClick={handleBackdropClick}
        role="presentation"
    >
      <div 
        ref={modalRef} 
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="addTaskModalTitle"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="addTaskModalTitle" className="text-xl font-bold text-slate-800">הוספת משימה חדשה</h2>
          <button onClick={onClose} aria-label="Close modal" className="text-slate-500 hover:text-slate-800 p-1 rounded-full hover:bg-slate-100 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="taskName" className="block text-sm font-medium text-slate-700 mb-1">שם המשימה</label>
              <input
                ref={inputRef}
                id="taskName"
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="מה צריך לעשות?"
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="phaseSelect" className="block text-sm font-medium text-slate-700 mb-1">שיוך לשלב</label>
              <select
                id="phaseSelect"
                value={selectedPhaseId}
                onChange={(e) => setSelectedPhaseId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white appearance-none pr-8 bg-no-repeat"
                style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="gray" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>')`, backgroundPosition: 'left 0.5rem center' }}
                required
              >
                <option value="" disabled>בחר שלב...</option>
                {phases.map(phase => (
                  <option key={phase.id} value={phase.id}>{phase.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 transition-colors">
              ביטול
            </button>
            <button type="submit" disabled={!taskName.trim() || !selectedPhaseId} className="px-4 py-2 bg-teal-500 text-white font-semibold rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
              הוסף משימה
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ===================================
// Main App Component
// ===================================

const App: React.FC = () => {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const projectDocRef = useMemo(() => doc(db, 'projects', 'yaron-weisberg'), []);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const docSnap = await getDoc(projectDocRef);
        if (docSnap.exists()) {
          setPhases(docSnap.data().phases as Phase[]);
        } else {
          // Document doesn't exist, so we seed it with initial data
          const initialData = initializeProjectData(PROJECT_DATA);
          await setDoc(projectDocRef, { phases: initialData });
          setPhases(initialData);
        }
      } catch (error) {
        console.error("Error fetching or seeding project data:", error);
        // Fallback to local data on error
        setPhases(initializeProjectData(PROJECT_DATA));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectDocRef]);

  const handleUpdateTask = useCallback(async (phaseId: string, taskId: string, updatedValues: Partial<Task>) => {
    const originalPhases = phases;
    const newPhases = phases.map(phase => {
        if (phase.id === phaseId) {
            const newTasks = phase.tasks.map(task => {
                if (task.id === taskId) {
                    return { ...task, ...updatedValues };
                }
                return task;
            });
            const updatedPhase = { ...phase, tasks: newTasks };
            const newPhaseStatus = calculatePhaseStatus(updatedPhase);
            return { ...updatedPhase, status: newPhaseStatus };
        }
        return phase;
    });
    
    // Optimistic update
    setPhases(newPhases);

    // Persist to Firebase
    try {
        await setDoc(projectDocRef, { phases: newPhases });
    } catch (error) {
        console.error("Error updating task in Firebase:", error);
        // Revert on failure
        setPhases(originalPhases);
        alert("Failed to save changes. Please try again.");
    }
  }, [phases, projectDocRef]);
  
  const handleAddTask = useCallback(async (phaseId: string, taskName: string) => {
    const originalPhases = phases;
    const newPhases = phases.map(phase => {
        if (phase.id === phaseId) {
            const newTask: Task = {
                id: `task-${Date.now()}`, // Simple unique ID
                name: taskName,
                status: TaskStatus.Pending,
                hours: 0,
            };
            const updatedPhase = { ...phase, tasks: [...phase.tasks, newTask] };
            const newPhaseStatus = calculatePhaseStatus(updatedPhase);
            return { ...updatedPhase, status: newPhaseStatus };
        }
        return phase;
    });

    // Optimistic update
    setPhases(newPhases);

    // Persist to Firebase
    try {
        await setDoc(projectDocRef, { phases: newPhases });
    } catch (error) {
        console.error("Error adding task in Firebase:", error);
        // Revert on failure
        setPhases(originalPhases);
        alert("Failed to save new task. Please try again.");
    }
}, [phases, projectDocRef]);

  const overallProgress = useMemo(() => {
    const allTasks = phases.flatMap(p => p.tasks);
    if (allTasks.length === 0) return 0;
    const completedTasks = allTasks.filter(t => t.status === TaskStatus.Completed).length;
    return (completedTasks / allTasks.length) * 100;
  }, [phases]);
  
  const totalProjectHours = useMemo(() => {
    return phases
      .flatMap(p => p.tasks)
      .reduce((sum, task) => sum + (task.hours || 0), 0);
  }, [phases]);

  const firstInProgressPhaseIndex = useMemo(() => {
      const index = phases.findIndex(p => p.status !== TaskStatus.Completed);
      return index === -1 ? 0 : index;
  }, [phases]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" role="status" aria-label="Loading..."></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <header className="bg-slate-800 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">ממשק ניהול פרויקט 🧭</h1>
                    <p className="text-md text-slate-300">ירון ויסברג - הקמת מערכת CRM ואוטומציה</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-2xl font-bold">{totalProjectHours.toLocaleString()}</div>
                        <div className="text-sm text-slate-300">סה"כ שעות עבודה</div>
                    </div>
                    <div className="w-full sm:w-52">
                        <p className="text-sm text-slate-300 text-right mb-1">התקדמות כללית</p>
                        <div className="flex items-center">
                            <div className="w-full bg-slate-600 rounded-full h-4">
                                <div 
                                    className="bg-gradient-to-r from-teal-400 to-blue-500 h-4 rounded-full text-center text-white text-xs flex items-center justify-center transition-all duration-500" 
                                    style={{ width: `${overallProgress}%` }}
                                    role="progressbar"
                                    aria-valuenow={overallProgress}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                 >
                                    <span className="font-bold">{Math.round(overallProgress)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {phases.map((phase, index) => (
          <PhaseCard 
            key={phase.id} 
            phase={phase} 
            onUpdateTask={handleUpdateTask}
            onAddTask={handleAddTask}
            isInitiallyOpen={index === firstInProgressPhaseIndex}
          />
        ))}
      </main>

      <button
        onClick={() => setIsAddTaskModalOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-teal-500 text-white rounded-full p-4 shadow-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-300 transform hover:scale-110 z-20"
        aria-label="הוסף משימה חדשה"
        title="הוסף משימה חדשה"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      </button>

      <AddTaskModal 
        isOpen={isAddTaskModalOpen} 
        onClose={() => setIsAddTaskModalOpen(false)} 
        onAddTask={handleAddTask} 
        phases={phases} 
      />
    </div>
  );
};

export default App;