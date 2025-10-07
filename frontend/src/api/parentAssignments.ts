// API endpoints for parent assignments
// This file will be used when the backend is ready

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface ParentAssignment {
  parentId: string;
  studentIds: string[];
  assignedAt: string;
}

export const parentAssignmentsAPI = {
  // Save parent assignment
  saveAssignment: async (parentId: string, studentIds: string[]): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/parent-assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId,
          studentIds,
          assignedAt: new Date().toISOString()
        }),
      });
      
      if (response.ok) {
        console.log('✅ Parent assignment saved to backend');
        return true;
      } else {
        console.error('❌ Failed to save parent assignment to backend');
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving parent assignment:', error);
      return false;
    }
  },

  // Remove parent assignment
  removeAssignment: async (parentId: string, studentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/parent-assignments/${parentId}/students/${studentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        console.log('✅ Parent assignment removed from backend');
        return true;
      } else {
        console.error('❌ Failed to remove parent assignment from backend');
        return false;
      }
    } catch (error) {
      console.error('❌ Error removing parent assignment:', error);
      return false;
    }
  },

  // Fetch all parent assignments
  fetchAssignments: async (): Promise<{[parentId: string]: string[]} | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/parent-assignments`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Parent assignments fetched from backend:', data);
        return data;
      } else {
        console.error('❌ Failed to fetch parent assignments from backend');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching parent assignments:', error);
      return null;
    }
  },

  // Get assignments for a specific parent
  getParentAssignments: async (parentId: string): Promise<string[] | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/parent-assignments/${parentId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Parent assignments fetched for parent:', parentId, data);
        return data.studentIds || [];
      } else {
        console.error('❌ Failed to fetch parent assignments for parent:', parentId);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching parent assignments for parent:', parentId, error);
      return null;
    }
  }
};

export default parentAssignmentsAPI;
