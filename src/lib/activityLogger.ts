import { apiClient as supabase } from '@/lib/apiClient';

export type ActivityAction = 'create' | 'update' | 'delete';
export type EntityType = 'material' | 'student' | 'submission' | 'user';

interface LogActivityParams {
  userId: string;
  username: string;
  action: ActivityAction;
  entityType: EntityType;
  entityTitle?: string;
  entitySubject?: string;
  entityCategory?: string;
  details?: Record<string, any>;
}

export const logActivity = async (params: LogActivityParams) => {
  try {
    await supabase.from('activity_logs').insert([{
      user_id: params.userId,
      username: params.username,
      action: params.action,
      entity_type: params.entityType,
      entity_title: params.entityTitle || null,
      entity_subject: params.entitySubject || null,
      entity_category: params.entityCategory || null,
      details: params.details || null,
    }]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
