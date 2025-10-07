// Individual Messaging Privileges
// Each privilege represents the ability to send messages to a specific role
export interface MessagingPrivilege {
  id: string;
  name: string;
  description: string;
  targetRole: string;
  isDefault: boolean;
  category: 'messaging';
}

export const MESSAGING_PRIVILEGES: MessagingPrivilege[] = [
  {
    id: 'message_admin',
    name: 'Message Admin',
    description: 'Send messages to administrators',
    targetRole: 'ADMIN',
    isDefault: true, // Default for all users
    category: 'messaging'
  },
  {
    id: 'message_teacher',
    name: 'Message Teacher',
    description: 'Send messages to teachers',
    targetRole: 'USER',
    isDefault: false,
    category: 'messaging'
  },
  {
    id: 'message_super_teacher',
    name: 'Message Super Teacher',
    description: 'Send messages to super teachers',
    targetRole: 'SUPER_TEACHER',
    isDefault: false,
    category: 'messaging'
  },
  {
    id: 'message_parent',
    name: 'Message Parent',
    description: 'Send messages to parents',
    targetRole: 'PARENT',
    isDefault: false,
    category: 'messaging'
  },
  {
    id: 'message_nurse',
    name: 'Message Nurse',
    description: 'Send messages to school nurses',
    targetRole: 'NURSE',
    isDefault: false,
    category: 'messaging'
  },
  {
    id: 'message_sponsor',
    name: 'Message Sponsor',
    description: 'Send messages to sponsors',
    targetRole: 'SPONSOR',
    isDefault: false,
    category: 'messaging'
  },
  {
    id: 'message_sponsorships_overseer',
    name: 'Message Sponsorships Overseer',
    description: 'Send messages to sponsorships overseer',
    targetRole: 'SPONSORSHIPS_OVERSEER',
    isDefault: false,
    category: 'messaging'
  },
  {
    id: 'message_sponsorship_coordinator',
    name: 'Message Sponsorship Coordinator',
    description: 'Send messages to sponsorship coordinators',
    targetRole: 'SPONSORSHIP_COORDINATOR',
    isDefault: false,
    category: 'messaging'
  },
  {
    id: 'message_superuser',
    name: 'Message Super User',
    description: 'Send messages to super users',
    targetRole: 'SUPERUSER',
    isDefault: false,
    category: 'messaging'
  }
];

// User Privilege Assignment
export interface UserPrivilegeAssignment {
  userId: string;
  userName: string;
  userRole: string;
  assignedPrivileges: string[]; // Array of privilege IDs
}

// Helper function to get all messaging privileges
export const getAllMessagingPrivileges = (): MessagingPrivilege[] => {
  return MESSAGING_PRIVILEGES;
};

// Helper function to get default messaging privileges
export const getDefaultMessagingPrivileges = (): string[] => {
  return MESSAGING_PRIVILEGES
    .filter(privilege => privilege.isDefault)
    .map(privilege => privilege.id);
};

// Merge provided privileges with defaults so everyone always has base messaging rights
export const withDefaultMessagingPrivileges = (userPrivileges?: string[]): string[] => {
  const merged = new Set<string>(getDefaultMessagingPrivileges());
  (userPrivileges || []).forEach(p => merged.add(p));
  return Array.from(merged);
};

// Helper function to get privilege by ID
export const getMessagingPrivilegeById = (id: string): MessagingPrivilege | undefined => {
  return MESSAGING_PRIVILEGES.find(privilege => privilege.id === id);
};

// Helper function to get privileges by target role
export const getMessagingPrivilegesByTargetRole = (targetRole: string): MessagingPrivilege[] => {
  return MESSAGING_PRIVILEGES.filter(privilege => privilege.targetRole === targetRole);
};

// Helper function to check if user has privilege to message a specific role
export const canUserMessageRole = (userPrivileges: string[], targetRole: string): boolean => {
  // Ensure defaults are applied when checking permissions
  const effective = withDefaultMessagingPrivileges(userPrivileges);
  const privilege = MESSAGING_PRIVILEGES.find(p => p.targetRole === targetRole);
  return privilege ? effective.includes(privilege.id) : false;
};

// Helper function to get all roles a user can message based on their privileges
export const getMessagableRoles = (userPrivileges: string[]): string[] => {
  const effective = withDefaultMessagingPrivileges(userPrivileges);
  return MESSAGING_PRIVILEGES
    .filter(privilege => effective.includes(privilege.id))
    .map(privilege => privilege.targetRole);
};

// Message Sending Privileges Configuration
// Each role defines which other roles they can send messages to

export interface MessagePrivilege {
  role: string;
  canSendTo: string[];
  description: string;
  restrictions?: {
    messageTypes?: string[];
    requiresApproval?: boolean;
    maxRecipients?: number;
  };
}

export const MESSAGE_PRIVILEGES: MessagePrivilege[] = [
  {
    role: 'ADMIN',
    canSendTo: ['USER', 'TEACHER', 'PARENT', 'NURSE', 'SUPER_TEACHER', 'SPONSOR', 'SPONSORSHIPS_OVERSEER', 'SPONSORSHIP_COORDINATOR', 'SUPERUSER'],
    description: 'Administrators can send messages to all roles',
    restrictions: {
      maxRecipients: 1000 // For broadcast messages
    }
  },
  {
    role: 'SUPERUSER',
    canSendTo: ['USER', 'TEACHER', 'PARENT', 'NURSE', 'SUPER_TEACHER', 'ADMIN', 'SPONSOR', 'SPONSORSHIPS_OVERSEER', 'SPONSORSHIP_COORDINATOR'],
    description: 'Super users have full messaging privileges',
    restrictions: {
      maxRecipients: 1000
    }
  },
  {
    role: 'SUPER_TEACHER',
    canSendTo: ['USER', 'TEACHER', 'PARENT', 'NURSE', 'ADMIN'],
    description: 'Super teachers can communicate with teachers, parents, nurses, and admins',
    restrictions: {
      messageTypes: ['general', 'clinic', 'attendance', 'payment']
    }
  },
  {
    role: 'USER',
    canSendTo: ['ADMIN', 'PARENT', 'NURSE', 'SUPER_TEACHER'],
    description: 'Teachers can send messages to admins, parents, nurses, and super teachers',
    restrictions: {
      messageTypes: ['general', 'clinic', 'attendance'],
      maxRecipients: 10
    }
  },
  {
    role: 'TEACHER',
    canSendTo: ['ADMIN', 'PARENT', 'NURSE', 'SUPER_TEACHER', 'USER'],
    description: 'Teachers can communicate with admins, parents, nurses, super teachers, and fellow teachers',
    restrictions: {
      messageTypes: ['general', 'clinic', 'attendance'],
      maxRecipients: 10
    }
  },
  {
    role: 'PARENT',
    canSendTo: ['USER', 'TEACHER', 'ADMIN', 'NURSE', 'SUPER_TEACHER'],
    description: 'Parents can contact teachers, admins, nurses, and super teachers',
    restrictions: {
      messageTypes: ['general', 'clinic', 'attendance'],
      maxRecipients: 5
    }
  },
  {
    role: 'NURSE',
    canSendTo: ['USER', 'TEACHER', 'ADMIN', 'PARENT', 'SUPER_TEACHER'],
    description: 'School nurses can communicate with teachers, admins, parents, and super teachers',
    restrictions: {
      messageTypes: ['general', 'clinic', 'attendance'],
      maxRecipients: 10
    }
  },
  {
    role: 'SPONSOR',
    canSendTo: ['SPONSORSHIPS_OVERSEER', 'ADMIN'],
    description: 'Sponsors can only contact sponsorships overseer and admins',
    restrictions: {
      messageTypes: ['general', 'payment'],
      maxRecipients: 3,
      requiresApproval: true
    }
  },
  {
    role: 'SPONSORSHIPS_OVERSEER',
    canSendTo: ['SPONSOR', 'ADMIN', 'SPONSORSHIP_COORDINATOR'],
    description: 'Sponsorships overseer manages sponsor communications',
    restrictions: {
      messageTypes: ['general', 'payment'],
      maxRecipients: 50
    }
  },
  {
    role: 'SPONSORSHIP_COORDINATOR',
    canSendTo: ['SPONSOR', 'SPONSORSHIPS_OVERSEER', 'ADMIN', 'PARENT'],
    description: 'Sponsorship coordinators facilitate sponsor-parent communications',
    restrictions: {
      messageTypes: ['general', 'payment'],
      maxRecipients: 20
    }
  }
];

// Helper function to get privileges for a specific role
export const getMessagePrivileges = (role: string): MessagePrivilege | undefined => {
  return MESSAGE_PRIVILEGES.find(privilege => privilege.role === role);
};

// Helper function to check if a role can send messages to another role
export const canSendMessageTo = (senderRole: string, recipientRole: string): boolean => {
  const privileges = getMessagePrivileges(senderRole);
  return privileges ? privileges.canSendTo.includes(recipientRole) : false;
};

// Helper function to get allowed message types for a role
export const getAllowedMessageTypes = (role: string): string[] => {
  const privileges = getMessagePrivileges(role);
  return privileges?.restrictions?.messageTypes || ['general'];
};

// Helper function to get maximum recipients for a role
export const getMaxRecipients = (role: string): number => {
  const privileges = getMessagePrivileges(role);
  return privileges?.restrictions?.maxRecipients || 1;
};

// Helper function to check if message requires approval
export const requiresApproval = (role: string): boolean => {
  const privileges = getMessagePrivileges(role);
  return privileges?.restrictions?.requiresApproval || false;
};

// Helper function to validate message sending permissions
export const validateMessagePermissions = (
  senderRole: string, 
  recipientRole: string, 
  messageType: string, 
  recipientCount: number = 1
): { allowed: boolean; reason?: string } => {
  // Check if sender can send to recipient role
  if (!canSendMessageTo(senderRole, recipientRole)) {
    return {
      allowed: false,
      reason: `${senderRole} is not authorized to send messages to ${recipientRole}`
    };
  }

  // Check message type restrictions
  const allowedTypes = getAllowedMessageTypes(senderRole);
  if (!allowedTypes.includes(messageType)) {
    return {
      allowed: false,
      reason: `${senderRole} is not authorized to send ${messageType} messages`
    };
  }

  // Check recipient count restrictions
  const maxRecipients = getMaxRecipients(senderRole);
  if (recipientCount > maxRecipients) {
    return {
      allowed: false,
      reason: `${senderRole} can only send messages to ${maxRecipients} recipients at once`
    };
  }

  return { allowed: true };
};

// Get all roles that can receive messages from a specific sender
export const getEligibleRecipients = (senderRole: string): string[] => {
  const privileges = getMessagePrivileges(senderRole);
  return privileges ? privileges.canSendTo : [];
};

// Role display names mapping
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  'USER': 'Teacher',
  'TEACHER': 'Teacher',
  'ADMIN': 'Administrator',
  'PARENT': 'Parent',
  'NURSE': 'School Nurse',
  'SPONSOR': 'Sponsor',
  'SPONSORSHIPS_OVERSEER': 'Sponsorships Overseer',
  'SUPERUSER': 'Super User',
  'SUPER_TEACHER': 'Super Teacher',
  'SPONSORSHIP_COORDINATOR': 'Sponsorship Coordinator',
  'SECRETARY': 'Secretary',
  'ACCOUNTANT': 'Accountant',
  'CFO': 'Chief Financial Officer',
  'OPM': 'Operations Manager',
  'HR': 'Human Resources'
};
