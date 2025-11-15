import { Task } from '../types/api';
import { escapeHTML } from '../lib/sanitize';
import { triggerHaptic } from '../lib/maxBridge';

interface TaskCardProps {
  task: Task;
  onToggle?: (taskId: string, currentStatus: string) => void;
  onClick?: () => void;
  isOverdue?: boolean;
  contextColor?: string;
}

export function TaskCard({ task, onToggle, onClick, isOverdue = false, contextColor = '#3B82F6' }: TaskCardProps) {
  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    triggerHaptic('selection');
    onToggle?.(task.id, task.status);
  };

  const handleClick = () => {
    triggerHaptic('impact');
    onClick?.();
  };

  return (
    <div className="task-item">
      <div className="task-checkbox">
        <input 
          type="checkbox" 
          checked={task.status === 'completed'}
          onChange={handleToggle}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="task-content" onClick={handleClick}>
        <div className="task-header">
          <div className="task-color-indicator" style={{ background: contextColor }}></div>
          <div 
            className={`task-text ${task.status === 'completed' ? 'completed' : ''}`}
            style={{ color: isOverdue && task.status !== 'completed' ? '#f44336' : undefined }}
            dangerouslySetInnerHTML={{ __html: escapeHTML(task.title) }}
          />
        </div>
        {task.description && (
          <div className="task-meta">
            <span dangerouslySetInnerHTML={{ __html: escapeHTML(task.description) }} />
          </div>
        )}
      </div>
    </div>
  );
}
