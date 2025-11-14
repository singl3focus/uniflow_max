import { Context } from '../types/api';
import { escapeHTML } from '../lib/sanitize';

interface ContextCardProps {
  context: Context;
  onClick?: () => void;
}

export function ContextCard({ context: ctx, onClick }: ContextCardProps) {
  const getContextTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'subject': 'Предмет',
      'project': 'Проект',
      'personal': 'Личное',
      'work': 'Работа',
      'other': 'Другое'
    };
    return labels[type] || type;
  };

  return (
    <div
      className="context-card"
      style={{ borderLeftColor: ctx.color || '#667eea', margin: '0 0 12px 0' }}
      onClick={onClick}
    >
      <div className="context-header">
        <div className="context-title" dangerouslySetInnerHTML={{ __html: escapeHTML(ctx.title) }} />
        <div className="context-type">
          {getContextTypeLabel(ctx.type)}
        </div>
      </div>
      {ctx.description && (
        <div className="context-description" dangerouslySetInnerHTML={{ __html: escapeHTML(ctx.description) }} />
      )}
    </div>
  );
}
