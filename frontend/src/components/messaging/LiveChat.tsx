import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, Send, Reply, Search, Filter, User, Clock, Users } from 'lucide-react';

const LiveChat: React.FC = () => {
  const { messages, students, addMessage } = useData();
  const { user, users } = useAuth();
  const [showCompose, setShowCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendToAll, setSendToAll] = useState(false);

  const [composeForm, setComposeForm] = useState({
    to: '',
    toRole: '',
    subject: '',
    content: '',
    type: 'general' as 'general' | 'clinic' | 'attendance' | 'payment',
    studentId: ''
  });

  // Ensure sponsors can only send general messages
  React.useEffect(() => {
    if (user?.role === 'SPONSOR' && composeForm.type !== 'general') {
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

  const handleSendMessage = () => {
    if (!composeForm.subject || !composeForm.content) return;
    if (user?.role === 'ADMIN' && sendToAll) {
      // Send to all users except admin
      users.filter(u => u.id !== user.id).forEach(recipient => {
        const messageData = {
          from: user?.id || '',
          to: recipient.id,
          fromRole: user?.role || '',
          toRole: recipient.role,
          subject: composeForm.subject,
          content: composeForm.content,
          date: new Date(),
          read: false,
          studentId: composeForm.studentId || undefined,
          type: user?.role === 'SPONSOR' ? 'general' : composeForm.type
        };
        addMessage(messageData);
      });
      setShowCompose(false);
      setComposeForm({
        to: '',
        toRole: '',
        subject: '',
        content: '',
        type: 'general',
        studentId: ''
      });
      setSendToAll(false);
      return;
    }
    // Normal single send
    if (!composeForm.to) return;
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
      type: user?.role === 'SPONSOR' ? 'general' : composeForm.type
    };
    addMessage(messageData);
    setShowCompose(false);
    setComposeForm({
      to: '',
      toRole: '',
      subject: '',
      content: '',
      type: 'general',
      studentId: ''
    });
    setSendToAll(false);
  };

  const getRecipientOptions = () => {
    console.log('Current user role:', user?.role);
    console.log('Available users:', users);
    
    let filteredUsers = [];
    switch (user?.role) {
      case 'PARENT':
        // Parents can only message: class teacher (main), nurse, and admin who created their account
        filteredUsers = users.filter(u => {
          // Always allow nurses
          if (u.role === 'NURSE') return true;
          
          // Allow main teachers (USER role)
          if (u.role === 'USER') return true;
          
          // Allow admin who created/assigned their account (you'll need to add this logic)
          // For now, allow all admins - you can refine this later
          if (u.role === 'ADMIN') return true;
          
          return false;
        });
        break;
      case 'USER':
        filteredUsers = users.filter(u => u.role === 'ADMIN' || u.role === 'PARENT' || u.role === 'NURSE');
        break;
      case 'NURSE':
        filteredUsers = users.filter(u => u.role === 'ADMIN' || u.role === 'USER' || u.role === 'PARENT');
        break;
      case 'ADMIN':
        filteredUsers = users.filter(u => u.id !== user.id);
        break;
      case 'SPONSOR':
        filteredUsers = users.filter(u => u.role === 'SPONSORSHIPS_OVERSEER');
        break;
      case 'SUPERUSER':
        filteredUsers = users.filter(u => u.id !== user.id);
        break;
      case 'SUPER_TEACHER':
        filteredUsers = users.filter(u => u.role === 'ADMIN' || u.role === 'PARENT' || u.role === 'NURSE');
        break;
      default:
        filteredUsers = users.filter(u => u.id !== user.id);
    }
    
    console.log('Filtered recipients:', filteredUsers);
    return filteredUsers;
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'USER': return 'Class Teacher (Main)';
      case 'ADMIN': return 'Administrator';
      case 'PARENT': return 'Parent';
      case 'NURSE': return 'School Nurse';
      case 'SPONSOR': return 'Sponsor';
      case 'SPONSORSHIPS_OVERSEER': return 'Sponsorships Overseer';
      case 'SUPERUSER': return 'Super User';
      case 'SUPER_TEACHER': return 'Super Teacher';
      case 'SPONSORSHIP_COORDINATOR': return 'Sponsorship Coordinator';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Live Chat</h1>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6 text-purple-600" />
          <span className="text-sm text-gray-600">Real-time messaging</span>
        </div>
        <button
          onClick={() => {
            if (!composeForm.to) {
              alert('Please select a recipient first from the Quick Message section below');
              return;
            }
            setShowCompose(true);
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <Send className="h-5 w-5" />
          <span>Compose</span>
        </button>
      </div>

      {/* Recipient Selection Box */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl shadow-sm border-0 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-4">Chat with</h3>
            <div className="flex items-center space-x-4">
              <Users className="h-8 w-8" />
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 opacity-90">
                  Select a recipient to start chatting
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
                  className="w-full rounded-lg border-white border-opacity-30 bg-white bg-opacity-20 text-gray-900 placeholder-gray-600 focus:border-white focus:ring-white p-3"
                >
                  <option value="">Choose who to message...</option>
                  {getRecipientOptions().map(recipient => (
                    <option key={recipient.id} value={String(recipient.id)}>
                      {recipient.name} ({getRoleName(recipient.role)})
                    </option>
                  ))}
                </select>
                {composeForm.to && (
                  <p className="text-sm text-green-200 mt-2">
                    ✓ Recipient selected: {users.find(u => String(u.id) === String(composeForm.to))?.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-3">
            <button
              onClick={() => setShowCompose(true)}
              disabled={!composeForm.to}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
            >
              <Send className="h-5 w-5" />
              <span>Compose Message</span>
            </button>
            {composeForm.to && (
              <p className="text-xs text-white opacity-80 text-center">
                Ready to send message
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl shadow-sm border-0 text-white">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white opacity-80" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setSearchTerm(e.currentTarget.value); }}
              className="pl-10 w-full rounded-lg border-white border-opacity-30 bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-80 focus:border-white focus:ring-white"
            />
          </div>
          {user?.role !== 'SPONSOR' && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border-white border-opacity-30 bg-white bg-opacity-20 text-white focus:border-white focus:ring-white"
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="clinic">Clinic</option>
            <option value="attendance">Attendance</option>
            <option value="payment">Payment</option>
          </select>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Messages</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredMessages.map((message) => {
            const isFromCurrentUser = message.from === user?.id;
            const otherUser = users.find(u => String(u.id) === String(isFromCurrentUser ? message.to : message.from));
            
            return (
              <div 
                key={message.id} 
                className={`p-4 hover:bg-gray-50 cursor-pointer ${!message.read && !isFromCurrentUser ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        message.type === 'clinic' ? 'bg-red-100 text-red-800' :
                        message.type === 'attendance' ? 'bg-blue-100 text-blue-800' :
                        message.type === 'payment' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {message.type}
                      </span>
                      <span className="text-sm text-gray-500">
                        {isFromCurrentUser ? 'To' : 'From'}: {getRoleName(isFromCurrentUser ? message.toRole : message.fromRole)}
                      </span>
                      {otherUser && (
                        <span className="text-sm text-gray-600">({otherUser.name})</span>
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">{message.subject}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{message.content}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <p className="text-xs text-gray-500">
                        {message.date.toLocaleDateString()} at {message.date.toLocaleTimeString()}
                      </p>
                      {message.studentId && (
                        <p className="text-xs text-purple-600">
                          Student: {students.find(s => s.id === message.studentId)?.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!message.read && !isFromCurrentUser && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                    <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                      <Reply className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {selectedMessage === message.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredMessages.length === 0 && (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No messages found</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Message Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Compose Message</h2>
              <button
                onClick={() => setShowCompose(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {user?.role === 'ADMIN' && (
                <div className="mb-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sendToAll}
                    onChange={e => setSendToAll(e.target.checked)}
                    id="sendToAll"
                    className="accent-purple-600"
                  />
                  <label htmlFor="sendToAll" className="text-sm font-medium text-gray-700">Send to all users</label>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Send To
                  </label>
                  <select
                    value={composeForm.to}
                    onChange={(e) => {
                      const selectedUser = users.find(u => u.id === e.target.value);
                      setComposeForm(prev => ({
                        ...prev,
                        to: e.target.value,
                        toRole: selectedUser?.role || ''
                      }));
                    }}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    disabled={user?.role === 'ADMIN' && sendToAll}
                  >
                    <option value="">Select recipient...</option>
                    {getRecipientOptions().map(recipient => (
                      <option key={recipient.id} value={recipient.id}>
                        {recipient.name} ({getRoleName(recipient.role)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  {user?.role !== 'SPONSOR' && (
                    <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Type
                  </label>
                  <select
                    value={composeForm.type}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="general">General</option>
                    <option value="clinic">Clinic Referral</option>
                    <option value="attendance">Attendance Issue</option>
                    <option value="payment">Payment Related</option>
                  </select>
                    </>
                  )}
                </div>
              </div>

              {(composeForm.type === 'clinic' || composeForm.type === 'attendance') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Student
                  </label>
                  <select
                    value={composeForm.studentId}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, studentId: e.target.value }))}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Enter message subject..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={composeForm.content}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Type your message here..."
                />
              </div>

              {user?.role === 'ADMIN' && sendToAll && (
                <div className="text-xs text-gray-600 mb-2">This message will be sent to <b>all users</b> ({users.length - 1} recipients).</div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCompose(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={(!composeForm.to && !(user?.role === 'ADMIN' && sendToAll)) || !composeForm.subject || !composeForm.content}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveChat; 