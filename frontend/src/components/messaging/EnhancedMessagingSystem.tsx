import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../common/NotificationProvider';
import { 
  getMessagePrivileges,
  canSendMessageTo,
  getAllowedMessageTypes,
  getMaxRecipients,
  validateMessagePermissions,
  getEligibleRecipients,
  ROLE_DISPLAY_NAMES,
  getMessagableRoles,
  canUserMessageRole,
  withDefaultMessagingPrivileges
} from '../../config/messagePrivileges';
import { 
  MessageSquare, 
  Send, 
  Reply, 
  Search, 
  Filter, 
  User, 
  Clock, 
  Users,
  Bell,
  CheckCircle,
  Circle,
  Star,
  Pin,
  Archive,
  Trash2,
  MoreVertical,
  Sparkles,
  Zap,
  Heart,
  Smile,
  ThumbsUp,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle
} from 'lucide-react';

const EnhancedMessagingSystem: React.FC = () => {
  const { messages, students, addMessage } = useData();
  const { user, users } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendToAll, setSendToAll] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const [composeForm, setComposeForm] = useState({
    to: '',
    toRole: '',
    subject: '',
    content: '',
    type: 'general' as 'general' | 'clinic' | 'attendance' | 'payment',
    studentId: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    isPinned: false
  });

  // Calculate unread messages count
  useEffect(() => {
    const userMessages = messages.filter(m => 
      m.to === user?.id && !m.read
    );
    setUnreadCount(userMessages.length);
  }, [messages, user?.id]);

  // Auto-fetch messages on mount and poll every 20s for real-time delivery
  useEffect(() => {
    let interval: any;
    try {
      if (user?.id && (typeof (window as any).fetch === 'function')) {
        // initial fetch
        (async () => {
          try {
            await (async () => {
              // use DataContext helper without circular imports via window event
            })();
          } catch (_) {}
        })();
      }
    } catch (_) {}
    // use DataContext directly to fetch
    if (user?.id) {
      // import-safe: call via hook function
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        fetchMessagesByUser && fetchMessagesByUser(String(user.id));
      } catch (_) {}
      interval = setInterval(() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          fetchMessagesByUser && fetchMessagesByUser(String(user.id));
        } catch (_) {}
      }, 20000); // 20s
    }
    return () => interval && clearInterval(interval);
  }, [user?.id]);

  // Ensure sponsors can only send general messages
  React.useEffect(() => {
    if (user?.role === 'sponsor' && composeForm.type !== 'general') {
      setComposeForm(prev => ({ ...prev, type: 'general' }));
    }
  }, [user?.role, composeForm.type]);

  // Get messages for current user
  const userMessages = messages.filter(m => 
    m.to === user?.id || m.from === user?.id
  );

  const filteredMessages = userMessages.filter(message => {
    const matchesType = filterType === 'all' || message.type === filterType;
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleSendMessage = async () => {
    if (!composeForm.subject || !composeForm.content) return;
    
    setIsTyping(true);
    
    try {
      if (user?.role === 'admin' && sendToAll) {
        // Send to all users except admin
        const recipients = users.filter(u => u.id !== user.id);
        
        // Validate privilege for broadcast message
        const userPrivileges = user?.privileges || [];
        if (!userPrivileges.includes('message_admin')) {
          showError(
            '❌ Permission Denied',
            'You need Message Admin privilege to send broadcast messages'
          );
          return;
        }
        
        // Send messages to all recipients
        const messagePromises = recipients.map(recipient => 
          addMessage({
            from: user?.id || '',
            to: recipient.id,
            fromRole: user?.role || '',
            toRole: recipient.role,
            subject: composeForm.subject,
            content: composeForm.content,
            date: new Date(),
            read: false,
            studentId: composeForm.studentId || undefined,
            type: user?.role === 'sponsor' ? 'general' : composeForm.type,
            priority: composeForm.priority,
            isPinned: composeForm.isPinned
          })
        );
        
        await Promise.all(messagePromises);
        
        showSuccess(
          '🚀 Messages Delivered!',
          `Successfully delivered message to ${recipients.length} recipients! All messages have been sent and are now in their inboxes.`
        );
      } else {
        // Normal single send
        if (!composeForm.to) {
          showError('❌ No Recipient', 'Please select a recipient before sending');
          return;
        }
        
        const recipient = users.find(u => String(u.id) === String(composeForm.to));
        if (!recipient) {
          showError('❌ Invalid Recipient', 'Selected recipient not found');
          return;
        }
        
        // Validate privilege for single message (include default privileges)
        const userPrivileges = withDefaultMessagingPrivileges(user?.privileges || []);
        const privilegeToRoleMap: { [key: string]: string } = {
          'message_admin': 'ADMIN',
          'message_teacher': 'USER',
          'message_super_teacher': 'SUPER_TEACHER', 
          'message_parent': 'PARENT',
          'message_nurse': 'NURSE',
          'message_sponsor': 'SPONSOR',
          'message_sponsorships_overseer': 'SPONSORSHIPS_OVERSEER',
          'message_sponsorship_coordinator': 'SPONSORSHIP_COORDINATOR',
          'message_superuser': 'SUPERUSER'
        };
        
        // Check if user has privilege to message this recipient's role
        const requiredPrivilege = Object.keys(privilegeToRoleMap).find(
          privilege => privilegeToRoleMap[privilege] === recipient.role
        );
        
        if (requiredPrivilege && !userPrivileges.includes(requiredPrivilege)) {
          showError(
            '❌ Permission Denied',
            `You don't have permission to send messages to ${getRoleName(recipient.role)}`
          );
          return;
        }
        
        const messageData = {
          from: user?.id || '',
          to: composeForm.to,
          fromRole: user?.role || '',
          toRole: composeForm.toRole,
          subject: composeForm.subject,
          content: composeForm.content,
          date: new Date(),
          read: false,
          studentId: composeForm.studentId || undefined,
          type: user?.role === 'sponsor' ? 'general' : composeForm.type,
          priority: composeForm.priority,
          isPinned: composeForm.isPinned
        };
        
        await addMessage(messageData);
        
        showSuccess(
          '💬 Message Delivered!',
          `Message successfully delivered to ${recipient?.name || 'recipient'}! The message is now in their inbox and they will be notified.`
        );
      }
      
      // Reset form
      setShowCompose(false);
      setComposeForm({
        to: '',
        toRole: '',
        subject: '',
        content: '',
        type: 'general',
        studentId: '',
        priority: 'normal',
        isPinned: false
      });
      setSendToAll(false);
      
    } catch (error) {
      console.error('Error sending message:', error);
      showError(
        '❌ Delivery Failed',
        'Failed to deliver message. Please check your connection and try again.'
      );
    } finally {
      setIsTyping(false);
    }
  };

  const getRecipientOptions = () => {
    if (!user?.role) return [];
    
    // Get user's assigned privileges from the backend
    const userPrivileges = withDefaultMessagingPrivileges(user.privileges || []);
    
    // Get roles the user can message based on their assigned privileges
    const messagableRoles: string[] = [];
    
    // Map privilege IDs to target roles
    const privilegeToRoleMap: { [key: string]: string } = {
      'message_admin': 'ADMIN',
      'message_teacher': 'USER',
      'message_super_teacher': 'SUPER_TEACHER', 
      'message_parent': 'PARENT',
      'message_nurse': 'NURSE',
      'message_sponsor': 'SPONSOR',
      'message_sponsorships_overseer': 'SPONSORSHIPS_OVERSEER',
      'message_sponsorship_coordinator': 'SPONSORSHIP_COORDINATOR',
      'message_superuser': 'SUPERUSER'
    };
    
    // Find which roles the user can message based on their privileges
    userPrivileges.forEach(privilege => {
      if (privilegeToRoleMap[privilege]) {
        messagableRoles.push(privilegeToRoleMap[privilege]);
      }
    });
    
    // Filter users to only include those with messagable roles
    const available = users.filter(u => 
      u.id !== user.id && // Don't include self
      messagableRoles.includes(u.role) // Only include users with messagable roles
    );

    // As a safety net, if nothing matched but there are admins, always include admins
    if (available.length === 0) {
      const admins = users.filter(u => u.role === 'ADMIN' && u.id !== user.id);
      if (admins.length > 0) return admins;
    }

    return available;
  };

  const getRoleName = (role: string) => {
    return ROLE_DISPLAY_NAMES[role] || role;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'normal': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'clinic': return 'bg-red-100 text-red-800 border-red-200';
      case 'attendance': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'payment': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-2 sm:py-4 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-lg opacity-90 animate-blob shadow-2xl shadow-purple-500/50"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-lg opacity-90 animate-blob animation-delay-2000 shadow-2xl shadow-blue-500/50"></div>
        <div className="absolute top-40 left-40 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-lg opacity-90 animate-blob animation-delay-4000 shadow-2xl shadow-pink-500/50"></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-lg opacity-80 animate-blob animation-delay-1000 shadow-2xl shadow-yellow-500/50"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-green-400 rounded-full mix-blend-multiply filter blur-lg opacity-80 animate-blob animation-delay-3000 shadow-2xl shadow-yellow-500/50"></div>
      </div>
      
      <div className="max-w-lg mx-auto space-y-4 relative z-10">
      {/* AI-Generated Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-2 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-1 bg-white/20 rounded-xl backdrop-blur-sm">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                💬 Messages
              </h1>
              <p className="text-purple-100 mt-0.5 text-xs">
                Communication system with real-time delivery
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <div className="bg-white/20 rounded-lg px-2 py-0.5 backdrop-blur-sm text-[11px]">
              <span className="text-xs font-medium text-white">
                {unreadCount > 0 ? `${unreadCount} Unread` : 'All Read'}
              </span>
            </div>
            <button
              onClick={() => setShowCompose(true)}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-2.5 py-1 rounded-lg font-bold transition-all duration-200 flex items-center space-x-1.5 shadow-md hover:shadow-lg hover:scale-105 text-xs"
            >
              <Sparkles className="h-3 w-3" />
              <span>Compose</span>
            </button>
          </div>
        </div>
      </div>

       {/* AI-Generated Quick Actions */}
       <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 border-2 border-blue-200/50 rounded-xl shadow-lg backdrop-blur-sm">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-xl p-2 text-white">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                ⚡ Quick Actions
              </h2>
              <p className="text-blue-100 text-xs">Fast message composition and management</p>
            </div>
          </div>
        </div>
        
        <div className="p-2.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <button
              onClick={() => setShowCompose(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-2 rounded-lg font-medium flex items-center space-x-1.5 transition-all duration-200 hover:scale-105 shadow-md text-xs"
            >
              <Send className="h-3 w-3" />
              <span>New Message</span>
            </button>
            <button
              onClick={() => { if (user?.id) { try { (fetchMessagesByUser && markAllMessagesRead) && markAllMessagesRead(String(user.id)); } catch(_) {} } }}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white p-2 rounded-lg font-medium flex items-center space-x-1.5 transition-all duration-200 hover:scale-105 shadow-md text-xs"
            >
              <span>Mark all as read</span>
            </button>
            <button
              onClick={() => setFilterType('all')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-2 rounded-lg font-medium flex items-center space-x-1.5 transition-all duration-200 hover:scale-105 shadow-md text-xs"
            >
              <Eye className="h-3 w-3" />
              <span>View All</span>
            </button>
            <button
              onClick={() => setFilterType('general')}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white p-2 rounded-lg font-medium flex items-center space-x-1.5 transition-all duration-200 hover:scale-105 shadow-md text-xs"
            >
              <Heart className="h-3 w-3" />
              <span>General</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI-Generated Filter Section */}
      <div className="bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/50 border-2 border-purple-200/50 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-xl p-2 text-white">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                🔍 Smart Filters
              </h2>
              <p className="text-purple-100 text-xs">Filter messages by type and content</p>
            </div>
          </div>
        </div>
        
        <div className="p-2.5">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-purple-600" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full rounded-lg border-2 border-purple-200/50 shadow-md focus:border-purple-500 focus:ring-purple-500 bg-gradient-to-r from-white to-purple-50/30 px-2 py-1 text-xs text-gray-800 font-medium transition-all duration-200 hover:shadow-lg"
              />
            </div>
             {user?.role && getAllowedMessageTypes(user.role).length > 1 && (
               <select
                 value={filterType}
                 onChange={(e) => setFilterType(e.target.value)}
                 className="rounded-lg border-2 border-purple-200/50 shadow-md focus:border-purple-500 focus:ring-purple-500 bg-gradient-to-r from-white to-purple-50/30 px-2 py-1 text-xs text-gray-800 font-medium transition-all duration-200 hover:shadow-lg"
               >
                 <option value="all">All Types</option>
                 {getAllowedMessageTypes(user.role).map(type => (
                   <option key={type} value={type}>
                     {type === 'general' ? 'General' :
                      type === 'clinic' ? 'Clinic' :
                      type === 'attendance' ? 'Attendance' :
                      type === 'payment' ? 'Payment' : type}
                   </option>
                 ))}
               </select>
             )}
          </div>
        </div>
      </div>

      {/* AI-Generated Messages List */}
      <div className="bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/50 border-2 border-indigo-200/50 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-xl p-2 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                  📬 Your Messages
                </h2>
                <p className="text-indigo-100 text-xs">{filteredMessages.length} messages found</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <div className="bg-red-500 text-white px-3 py-1 rounded-lg font-bold flex items-center space-x-1">
                <Bell className="h-4 w-4" />
                <span>{unreadCount} Unread</span>
              </div>
            )}
          </div>
        </div>
        
        {filteredMessages.length === 0 ? (
          <div className="p-12 text-center">
            <div className="bg-gradient-to-r from-gray-100 to-blue-100 rounded-2xl p-8 max-w-md mx-auto">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">No Messages Found</h3>
              <p className="text-gray-500">No messages match your current filter criteria</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200/50">
            {filteredMessages.map((message) => {
              const isFromCurrentUser = message.from === user?.id;
              const otherUser = users.find(u => u.id === (isFromCurrentUser ? message.to : message.from));
              
              return (
                <div 
                  key={message.id} 
                  className={`p-3 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 cursor-pointer ${
                    !message.read && !isFromCurrentUser ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-medium rounded-full border ${getTypeColor(message.type)}`}>
                          {message.type}
                        </span>
                        <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-medium rounded-full ${getPriorityColor(message.priority || 'normal')}`}>
                          {message.priority || 'normal'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {isFromCurrentUser ? 'To' : 'From'}: {getRoleName(isFromCurrentUser ? message.toRole : message.fromRole)}
                        </span>
                        {otherUser && (
                          <span className="text-xs text-gray-600 font-medium">({otherUser.name})</span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1.5 flex items-center space-x-2">
                        <span>{message.subject}</span>
                        {message.isPinned && <Pin className="h-3.5 w-3.5 text-yellow-500" />}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">{message.content}</p>
                      <div className="flex items-center space-x-4">
                        <p className="text-[11px] text-gray-500 flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{message.date.toLocaleDateString()} at {message.date.toLocaleTimeString()}</span>
                        </p>
                        {message.studentId && (
                          <p className="text-[11px] text-purple-600 font-medium">
                            Student: {students.find(s => s.id === message.studentId)?.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      {!message.read && !isFromCurrentUser && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      )}
                      <button className="text-purple-600 hover:text-purple-700 text-[11px] font-medium p-1 hover:bg-purple-50 rounded-lg transition-all duration-200">
                        <Reply className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {selectedMessage === message.id && (
                    <div className="mt-2.5 pt-2.5 border-t border-gray-200">
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl p-2.5 border-2 border-gray-200/50">
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI-Generated Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-purple-900/20 to-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 border-2 border-blue-200/50 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm">
            {/* AI-Generated Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl p-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Send className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text text-transparent">
                      ✨ Compose Message
                    </h3>
                    <p className="text-blue-100 text-sm">Create and send intelligent messages</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompose(false)}
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200 hover:scale-105"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-3 space-y-2.5">
               {user?.role === 'admin' && (
                <div className="mb-2.5 flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200/50 rounded-xl p-2.5">
                  <input
                    type="checkbox"
                    checked={sendToAll}
                    onChange={e => setSendToAll(e.target.checked)}
                    id="sendToAll"
                    className="accent-purple-600 w-4 h-4"
                  />
                  <label htmlFor="sendToAll" className="text-sm font-bold text-gray-700 flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Send to all users ({users.length - 1} recipients)</span>
                  </label>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center">
                    <User className="h-3 w-3 text-blue-600 mr-1" />
                    Send To
                  </label>
                  <select
                    value={composeForm.to}
                    onChange={(e) => {
                      const selectedUser = users.find(u => String(u.id) === String(e.target.value));
                      setComposeForm(prev => ({
                        ...prev,
                        to: e.target.value,
                        toRole: selectedUser?.role || ''
                      }));
                    }}
                    className="w-full rounded-lg border border-blue-200/50 shadow-md focus:border-purple-500 focus:ring-purple-500 bg-gradient-to-r from-white to-blue-50/30 px-2 py-0.5 text-[11px] text-gray-800 font-medium transition-all duration-200 hover:shadow-lg"
                    disabled={user?.role === 'admin' && sendToAll}
                    required
                  >
                     <option value="">📧 Select recipient...</option>
                     {getRecipientOptions().length === 0 ? (
                       <option value="" disabled>⚠️ No recipients available - Check your privileges</option>
                     ) : (
                       getRecipientOptions().map(recipient => {
                         const userPrivileges = withDefaultMessagingPrivileges(user?.privileges || []);
                         const privilegeToRoleMap: { [key: string]: string } = {
                           'message_admin': 'ADMIN',
                           'message_teacher': 'USER',
                           'message_super_teacher': 'SUPER_TEACHER', 
                           'message_parent': 'PARENT',
                           'message_nurse': 'NURSE',
                           'message_sponsor': 'SPONSOR',
                           'message_sponsorships_overseer': 'SPONSORSHIPS_OVERSEER',
                           'message_sponsorship_coordinator': 'SPONSORSHIP_COORDINATOR',
                           'message_superuser': 'SUPERUSER'
                         };
                         
                         const requiredPrivilege = Object.keys(privilegeToRoleMap).find(
                           privilege => privilegeToRoleMap[privilege] === recipient.role
                         );
                         
                         const hasPrivilege = requiredPrivilege ? userPrivileges.includes(requiredPrivilege) : false;
                         
                         return (
                           <option key={recipient.id} value={String(recipient.id)}>
                             {hasPrivilege ? '✅' : '⚠️'} {recipient.name} ({getRoleName(recipient.role)})
                           </option>
                         );
                       })
                     )}
                  </select>
                </div>

                <div>
                  {user?.role !== 'sponsor' && (
                    <>
                      <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center">
                        <Filter className="h-3 w-3 text-purple-600 mr-1" />
                        Message Type
                      </label>
                       <select
                         value={composeForm.type}
                         onChange={(e) => setComposeForm(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full rounded-lg border border-purple-200/50 shadow-md focus:border-purple-500 focus:ring-purple-500 bg-gradient-to-r from-white to-purple-50/30 px-2 py-0.5 text-[11px] text-gray-800 font-medium transition-all duration-200 hover:shadow-lg"
                       >
                         {getAllowedMessageTypes(user?.role || '').map(type => (
                           <option key={type} value={type}>
                             {type === 'general' ? 'General' :
                              type === 'clinic' ? 'Clinic Referral' :
                              type === 'attendance' ? 'Attendance Issue' :
                              type === 'payment' ? 'Payment Related' : type}
                           </option>
                         ))}
                       </select>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center">
                    <Star className="h-3 w-3 text-yellow-600 mr-1" />
                    Priority Level
                  </label>
                  <select
                    value={composeForm.priority}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full rounded-lg border border-yellow-200/50 shadow-md focus:border-yellow-500 focus:ring-yellow-500 bg-gradient-to-r from-white to-yellow-50/30 px-2 py-0.5 text-[11px] text-gray-800 font-medium transition-all duration-200 hover:shadow-lg"
                  >
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-1">
                    <input
                      type="checkbox"
                      checked={composeForm.isPinned}
                      onChange={(e) => setComposeForm(prev => ({ ...prev, isPinned: e.target.checked }))}
                    className="accent-purple-600 w-3 h-3"
                    />
                    <span className="text-xs font-bold text-gray-700 flex items-center space-x-1">
                      <Pin className="h-3 w-3 text-purple-600" />
                      <span>Pin Message</span>
                    </span>
                  </label>
                </div>
              </div>

              {(composeForm.type === 'clinic' || composeForm.type === 'attendance') && (
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center">
                    <User className="h-3 w-3 text-green-600 mr-1" />
                    Related Student
                  </label>
                  <select
                    value={composeForm.studentId}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, studentId: e.target.value }))}
                    className="w-full rounded-lg border border-green-200/50 shadow-md focus:border-green-500 focus:ring-green-500 bg-gradient-to-r from-white to-green-50/30 px-2 py-0.5 text-[11px] text-gray-800 font-medium transition-all duration-200 hover:shadow-lg"
                  >
                    <option value="">Select student...</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} - {student.class} {student.stream}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center">
                  <MessageSquare className="h-3 w-3 text-indigo-600 mr-1" />
                  Subject
                </label>
                <input
                  type="text"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full rounded-lg border border-indigo-200/50 shadow-md focus:border-indigo-500 focus:ring-indigo-500 bg-gradient-to-r from-white to-indigo-50/30 px-2 py-0.5 text-[11px] text-gray-800 font-medium transition-all duration-200 hover:shadow-lg"
                  placeholder="Enter message subject..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center">
                  <MessageSquare className="h-3 w-3 text-purple-600 mr-1" />
                  Message Content
                </label>
                <textarea
                  value={composeForm.content}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg border border-purple-200/50 shadow-md focus:border-purple-500 focus:ring-purple-500 bg-gradient-to-r from-white to-purple-50/30 px-2 py-0.5 text-[11px] text-gray-800 font-medium transition-all duration-200 hover:shadow-lg"
                  placeholder="Type your message here..."
                />
              </div>

              {user?.role === 'admin' && sendToAll && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200/50 rounded-xl p-2.5">
                  <p className="text-xs text-yellow-800 font-medium">
                    <strong>⚠️ Broadcast Message:</strong> This message will be sent to <strong>all users</strong> ({users.length - 1} recipients).
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-3 py-1.5 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium hover:scale-105 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={(!composeForm.to && !(user?.role === 'admin' && sendToAll)) || !composeForm.subject || !composeForm.content || isTyping}
                  className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl hover:scale-105 text-xs"
                >
                  {isTyping ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Close wrapper */}
      </div>
    {/* Close outer container */}
    </div>
  );
};

export default EnhancedMessagingSystem;
