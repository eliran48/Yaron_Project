import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { PROJECT_DATA } from './constants';
import { Phase, Task, TaskStatus } from './types';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
  onToggle: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle }) => {
  const isCompleted = task.status === TaskStatus.Completed;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onToggle(task.id);
    }
  };

  return (
    <li
      className="flex items-center p-3 transition-all duration-200 rounded-lg cursor-pointer hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onClick={() => onToggle(task.id)}
      onKeyDown={handleKeyDown}
      role="checkbox"
      aria-checked={isCompleted}
      tabIndex={0}
      aria-label={task.name}
    >
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isCompleted ? 'bg-teal-500 border-teal-500' : 'border-slate-300 bg-white'}`}>
        {isCompleted && (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`mr-4 flex-grow transition-colors duration-300 ${isCompleted ? 'line-through text-slate-500' : 'text-slate-800'}`}>
        {task.name}
      </span>
    </li>
  );
};

interface PhaseCardProps {
  phase: Phase;
  onToggleTask: (phaseId: string, taskId:string) => void;
  isInitiallyOpen: boolean;
}

const PhaseCard: React.FC<PhaseCardProps> = ({ phase, onToggleTask, isInitiallyOpen }) => {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);
  const Icon = phase.icon;

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
                <TaskItem key={task.id} task={task} onToggle={(taskId) => onToggleTask(phase.id, taskId)} />
              ))}
            </ul>
          </div>
        </div>
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

  const handleToggleTask = useCallback(async (phaseId: string, taskId: string) => {
    const originalPhases = phases;
    const newPhases = phases.map(phase => {
      if (phase.id === phaseId) {
        const newTasks = phase.tasks.map(task => {
          if (task.id === taskId) {
            const newStatus = task.status === TaskStatus.Completed ? TaskStatus.Pending : TaskStatus.Completed;
            return { ...task, status: newStatus };
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
      console.error("Error updating task status in Firebase:", error);
      // Revert on failure
      setPhases(originalPhases);
      alert("Failed to save changes. Please try again.");
    }

  }, [phases, projectDocRef]);
  
  const overallProgress = useMemo(() => {
    const allTasks = phases.flatMap(p => p.tasks);
    if (allTasks.length === 0) return 0;
    const completedTasks = allTasks.filter(t => t.status === TaskStatus.Completed).length;
    return (completedTasks / allTasks.length) * 100;
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
                <div className="w-full sm:w-2/5 md:w-1/3">
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
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {phases.map((phase, index) => (
          <PhaseCard 
            key={phase.id} 
            phase={phase} 
            onToggleTask={handleToggleTask}
            isInitiallyOpen={index === firstInProgressPhaseIndex}
          />
        ))}
      </main>
    </div>
  );
};

export default App;