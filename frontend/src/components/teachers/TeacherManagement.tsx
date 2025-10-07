import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useNotification } from '../common/NotificationProvider';
import { User, Plus, Edit, Trash2, Upload, FileText, Users, BookOpen, Calendar, Camera, Mail, Phone, Building, Save, X, GraduationCap, Clock, Star } from 'lucide-react';

interface TeacherFormData {
  name: string;
  email: string;
  phone: string;
  photo: string;
  cv: string;
  gender: string;
  age: string;
  residence: string;
  assignedClasses: Array<{
    id: string;
    classId: string;
    streamId: string;
    className: string;
    streamName: string;
    subjects: string[];
    isMainTeacher: boolean;
  }>;
}

const TeacherManagement: React.FC = () => {
  const { users, addUser, updateUser, deleteUser } = useAuth();
  const { classes } = useData();
  const { showSuccess, showError, showInfo } = useNotification();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<string | null>(null);
  const [showAssignments, setShowAssignments] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [teacherForm, setTeacherForm] = useState<TeacherFormData>({
    name: '',
    email: '',
    phone: '',
    photo: '',
    cv: '',
    gender: '',
    age: '',
    residence: '',
    assignedClasses: []
  });

  const teachers = users.filter(u => 
    (u.role === 'TEACHER' || u.role === 'SUPER_TEACHER') && 
    (u.status === 'active' || u.status === 'ACTIVE')
  );

  // Dashboard statistics
  const totalTeachers = teachers.length;
  const superTeachers = teachers.filter(t => t.role === 'SUPER_TEACHER').length;
  const regularTeachers = teachers.filter(t => t.role === 'TEACHER').length;
  const teachersWithPhoto = teachers.filter(t => t.photo).length;
  const teachersWithCV = teachers.filter(t => t.cv).length;
  const activeTeachers = teachers.filter(t => t.status === 'active' || t.status === 'ACTIVE').length;
  
  // Calculate total class assignments
  const totalAssignments = teachers.reduce((total, teacher) => {
    let assignedClasses = [];
    if (teacher.assignedClasses) {
      try {
        assignedClasses = typeof teacher.assignedClasses === 'string' 
          ? JSON.parse(teacher.assignedClasses) 
          : teacher.assignedClasses;
      } catch (error) {
        assignedClasses = [];
      }
    }
    return total + (assignedClasses?.length || 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const teacherData = {
      name: teacherForm.name,
      email: teacherForm.email,
      phone: teacherForm.phone,
      role: 'TEACHER' as const,
      status: 'active' as const,
      gender: teacherForm.gender,
      age: teacherForm.age,
      residence: teacherForm.residence,
      assignedClasses: teacherForm.assignedClasses // Include assigned classes
    };

    try {
      if (editingTeacher) {
        await updateUser(editingTeacher, teacherData);
        setEditingTeacher(null);
        showSuccess(
          '🎉 Teacher Updated!',
          'Teacher has been successfully updated with all changes!',
          4000
        );
      } else {
        await addUser(teacherData);
        showSuccess(
          '👨‍🏫 Teacher Added!',
          'New teacher has been successfully added to the system!',
          4000
        );
      }

      setShowAddForm(false);
      setTeacherForm({
        name: '',
        email: '',
        phone: '',
        photo: '',
        cv: '',
        gender: '',
        age: '',
        residence: '',
        assignedClasses: []
      });
    } catch (error) {
      console.error('Error saving teacher:', error);
      showError(
        '❌ Save Failed',
        `Failed to save teacher: ${error instanceof Error ? error.message : 'Unknown error'}`,
        5000
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (teacher: any) => {
    // Parse assignedClasses if it's a JSON string
    let assignedClasses = [];
    if (teacher.assignedClasses) {
      try {
        assignedClasses = typeof teacher.assignedClasses === 'string' 
          ? JSON.parse(teacher.assignedClasses) 
          : teacher.assignedClasses;
      } catch (error) {
        console.error('Error parsing assignedClasses:', error);
        assignedClasses = [];
      }
    }

    setTeacherForm({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone || '',
      photo: teacher.photo || '',
      cv: teacher.cv || '',
      gender: teacher.gender || '',
      age: teacher.age || '',
      residence: teacher.residence || '',
      assignedClasses: assignedClasses
    });
    setEditingTeacher(teacher.id);
    setShowAddForm(true);
  };

  const handleViewDetails = (teacher: any) => {
    setShowDetails(teacher.id);
  };

  const handleDeleteTeacher = (teacher: any) => {
    if (window.confirm(`Are you sure you want to delete ${teacher.name}? This action cannot be undone.`)) {
      deleteUser(teacher.id);
    }
  };

  const addClassAssignment = async () => {
    const newAssignment = {
      id: Date.now().toString(),
      classId: '',
      streamId: '',
      className: '',
      streamName: '',
      subjects: [],
      isMainTeacher: false
    };

    setTeacherForm(prev => ({
      ...prev,
      assignedClasses: [...prev.assignedClasses, newAssignment]
    }));

    // If we're editing a teacher, save the new class assignment to backend immediately
    if (editingTeacher) {
      try {
        const updatedTeacherData = {
          ...teacherForm,
          assignedClasses: [...teacherForm.assignedClasses, newAssignment]
        };

        // Save to backend immediately
        await updateUser(editingTeacher, updatedTeacherData);
        
        showSuccess(
          '✅ Assignment Added!',
          'New class assignment has been successfully added!',
          3000
        );
      } catch (error) {
        console.error('Error saving new class assignment to backend:', error);
        showError(
          '❌ Assignment Failed',
          'Failed to save new class assignment. Please try again.',
          4000
        );
      }
    }
  };

  const updateClassAssignment = async (index: number, field: string, value: any) => {
    setTeacherForm(prev => ({
      ...prev,
      assignedClasses: prev.assignedClasses.map((assignment, i) => {
        if (i === index) {
          const updated = { ...assignment, [field]: value };
          
          // If class or stream changed, update the class/stream names
          if (field === 'classId') {
            const selectedClass = classes.find(c => c.id === value);
            updated.className = selectedClass?.name || '';
          }
          if (field === 'streamId') {
            const selectedClass = classes.find(c => c.id === assignment.classId);
            const selectedStream = selectedClass?.streams.find(s => s.id === value);
            updated.streamName = selectedStream?.name || '';
            updated.subjects = selectedStream?.subjects || [];
          }
          
          return updated;
        }
        return assignment;
      })
    }));

    // If we're editing a teacher, save the updated class assignments to backend immediately
    if (editingTeacher) {
      try {
        const updatedTeacherData = {
          ...teacherForm,
          assignedClasses: teacherForm.assignedClasses.map((assignment, i) => {
            if (i === index) {
              const updated = { ...assignment, [field]: value };
              
              // If class or stream changed, update the class/stream names
              if (field === 'classId') {
                const selectedClass = classes.find(c => c.id === value);
                updated.className = selectedClass?.name || '';
              }
              if (field === 'streamId') {
                const selectedClass = classes.find(c => c.id === assignment.classId);
                const selectedStream = selectedClass?.streams.find(s => s.id === value);
                updated.streamName = selectedStream?.name || '';
                updated.subjects = selectedStream?.subjects || [];
              }
              
              return updated;
            }
            return assignment;
          })
        };

        // Save to backend immediately
        await updateUser(editingTeacher, updatedTeacherData);
        
        showSuccess(
          '🔄 Assignment Updated!',
          'Class assignment has been successfully updated!',
          3000
        );
      } catch (error) {
        console.error('Error saving class assignment to backend:', error);
        showError(
          '❌ Update Failed',
          'Failed to save class assignment. Please try again.',
          4000
        );
      }
    }
  };

  const removeClassAssignment = async (index: number) => {
    setTeacherForm(prev => ({
      ...prev,
      assignedClasses: prev.assignedClasses.filter((_, i) => i !== index)
    }));

    // If we're editing a teacher, save the removed class assignment to backend immediately
    if (editingTeacher) {
      try {
        const updatedTeacherData = {
          ...teacherForm,
          assignedClasses: teacherForm.assignedClasses.filter((_, i) => i !== index)
        };

        // Save to backend immediately
        await updateUser(editingTeacher, updatedTeacherData);
        
        showSuccess(
          '🗑️ Assignment Removed!',
          'Class assignment has been successfully removed!',
          3000
        );
      } catch (error) {
        console.error('Error saving class assignment removal to backend:', error);
        showError(
          '❌ Removal Failed',
          'Failed to save class assignment removal. Please try again.',
          4000
        );
      }
    }
  };

  const handleFileUpload = (type: 'photo' | 'cv', file: File) => {
    // In a real app, this would upload to a server
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setTeacherForm(prev => ({
        ...prev,
        [type]: result
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
          <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Teacher Management</h1>
            <button
              onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
          <Plus className="h-5 w-5" />
          <span>Add Teacher</span>
            </button>
      </div>

      {/* Dashboard Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
          <GraduationCap className="h-6 w-6 text-blue-600" />
          <span>Teacher Dashboard</span>
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Total Teachers */}
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">{totalTeachers}</div>
            <div className="text-sm text-gray-600">Total Teachers</div>
          </div>

          {/* Super Teachers */}
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-purple-100">
            <div className="text-2xl font-bold text-purple-600">{superTeachers}</div>
            <div className="text-sm text-gray-600">Super Teachers</div>
          </div>

          {/* Regular Teachers */}
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-green-100">
            <div className="text-2xl font-bold text-green-600">{regularTeachers}</div>
            <div className="text-sm text-gray-600">Regular Teachers</div>
          </div>

          {/* Active Teachers */}
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-emerald-100">
            <div className="text-2xl font-bold text-emerald-600">{activeTeachers}</div>
            <div className="text-sm text-gray-600">Active Teachers</div>
          </div>

          {/* Teachers with Photos */}
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-orange-100">
            <div className="text-2xl font-bold text-orange-600">{teachersWithPhoto}</div>
            <div className="text-sm text-gray-600">With Photos</div>
          </div>

          {/* Total Assignments */}
          <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-indigo-100">
            <div className="text-2xl font-bold text-indigo-600">{totalAssignments}</div>
            <div className="text-sm text-gray-600">Class Assignments</div>
          </div>
        </div>

        {/* Summary Row */}
        <div className="mt-6 pt-4 border-t border-blue-200">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>{superTeachers > 0 ? `${((superTeachers / totalTeachers) * 100).toFixed(1)}%` : '0%'} are Super Teachers</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-500" />
              <span>{totalAssignments > 0 ? `Avg: ${(totalAssignments / totalTeachers).toFixed(1)}` : '0'} assignments per teacher</span>
        </div>
          </div>
                    </div>
                  </div>
                  
      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map((teacher, idx) => {
          // Parse assignedClasses if it's a JSON string
          let assignedClasses = [];
          if (teacher.assignedClasses) {
            try {
              assignedClasses = typeof teacher.assignedClasses === 'string' 
                ? JSON.parse(teacher.assignedClasses) 
                : teacher.assignedClasses;
            } catch (error) {
              console.error('Error parsing assignedClasses in card:', error);
              assignedClasses = [];
            }
          }

          return (
          <div
            key={teacher.id}
            className={
              `rounded-xl shadow-lg border-0 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer transform ` +
              [
                'bg-gradient-to-br from-blue-400 to-blue-600',
                'bg-gradient-to-br from-green-400 to-green-600',
                'bg-gradient-to-br from-purple-400 to-purple-600',
                'bg-gradient-to-br from-pink-400 to-pink-600',
                'bg-gradient-to-br from-yellow-400 to-yellow-600',
                'bg-gradient-to-br from-orange-400 to-orange-600',
                'bg-gradient-to-br from-teal-400 to-teal-600',
              ][idx % 7]
            }
          >
            <div className="p-3 text-white">
              <div className="flex items-center space-x-3 mb-2">
                {teacher.photo ? (
                  <img 
                    src={teacher.photo} 
                    alt={teacher.name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-lg"
                  />
                ) : (
                  <div className="h-12 w-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center border-2 border-white">
                    <User className="h-6 w-6 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white mb-1">{teacher.name}</h3>
                  <p className="text-xs text-white text-opacity-90 mb-1">{teacher.email}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    teacher.role === 'SUPER_TEACHER'
                      ? 'bg-white bg-opacity-20 text-white border border-white' 
                      : 'bg-white bg-opacity-20 text-white border border-white'
                  }`}>
                    {teacher.role === 'SUPER_TEACHER' ? 'Super Teacher' : 'Teacher'}
                  </span>
                  </div>
                </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white text-opacity-90">Classes:</span>
                  <span className="text-xs font-bold text-white bg-white bg-opacity-20 px-2 py-1 rounded-full">
                    {assignedClasses?.length || 0}
                    </span>
                  </div>

                  {assignedClasses && assignedClasses.length > 0 && (
                    <div className="space-y-1">
                      {assignedClasses.slice(0, 1).map((assignment: any, index: number) => (
                        <div key={index} className="text-xs bg-white bg-opacity-20 rounded-lg px-2 py-1 text-white">
                          <div className="font-medium">{assignment.className} - {assignment.streamName}</div>
                            {assignment.isMainTeacher && (
                            <span className="text-xs bg-white bg-opacity-30 px-1 py-0.5 rounded-full ml-1">Main</span>
                            )}
                          </div>
                      ))}
                      {assignedClasses.length > 1 && (
                        <div className="text-xs text-white text-opacity-80">
                          +{assignedClasses.length - 1} more
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-1 pt-1">
                    <button
                      onClick={() => handleEdit(teacher)}
                    className="flex-1 bg-blue-600 text-white px-1 py-1 rounded-lg text-xs hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-1"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Edit</span>
                    </button>
                    <button
                    onClick={() => setShowAssignments(teacher.id)}
                    className="flex-1 bg-green-600 text-white px-1 py-1 rounded-lg text-xs hover:bg-green-700 transition-all duration-200 flex items-center justify-center space-x-1"
                    >
                    <Calendar className="h-3 w-3" />
                    <span>Schedule</span>
                    </button>
                    <button
                    onClick={() => handleViewDetails(teacher)}
                    className="flex-1 bg-purple-600 text-white px-1 py-1 rounded-lg text-xs hover:bg-purple-700 transition-all duration-200 flex items-center justify-center space-x-1"
                    >
                    <FileText className="h-3 w-3" />
                    <span>Details</span>
                    </button>
                    <button
                    onClick={() => handleDeleteTeacher(teacher)}
                    className="flex-1 bg-red-600 text-white px-1 py-1 rounded-lg text-xs hover:bg-red-700 transition-all duration-200 flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Delete</span>
                    </button>
                  </div>
                </div>
            </div>
          </div>
          );
        })}
      </div>

        {/* Add/Edit Teacher Modal */}
        {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-purple-200 via-pink-200 to-purple-300 rounded-2xl shadow-2xl border border-purple-400 p-4 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 px-4 py-2 rounded-lg">
                    {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingTeacher(null);
                    }}
                className="text-gray-600 hover:text-gray-800 bg-white/20 rounded-full p-1"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Full Name
                  </label>
                      <input
                        type="text"
                        value={teacherForm.name}
                    onChange={(e) => setTeacherForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                    className="w-full bg-gray-100 text-gray-800 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Email
                  </label>
                      <input
                        type="email"
                        value={teacherForm.email}
                    onChange={(e) => setTeacherForm(prev => ({ ...prev, email: e.target.value }))}
                        required
                    className="w-full bg-gray-100 text-gray-800 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Phone
                  </label>
                      <input
                        type="tel"
                        value={teacherForm.phone}
                    onChange={(e) => setTeacherForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-gray-100 text-gray-800 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Gender</label>
                  <select className="w-full bg-gray-100 text-gray-800 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500" value={teacherForm.gender} onChange={e => setTeacherForm(prev => ({ ...prev, gender: e.target.value }))} required>
                        <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Age</label>
                  <input type="number" min="1" className="w-full bg-gray-100 text-gray-800 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500" value={teacherForm.age} onChange={e => setTeacherForm(prev => ({ ...prev, age: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">Residence</label>
                  <input type="text" className="w-full bg-gray-100 text-gray-800 rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500" value={teacherForm.residence} onChange={e => setTeacherForm(prev => ({ ...prev, residence: e.target.value }))} required />
                </div>
                </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Profile Photo
                  </label>
                  <div className="flex items-center space-x-3">
                    {teacherForm.photo && (
                      <img 
                        src={teacherForm.photo} 
                        alt="Profile preview"
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('photo', file);
                        }}
                          className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="cursor-pointer bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-2 rounded-lg hover:from-purple-200 hover:to-pink-200 transition-colors flex items-center space-x-2 border border-purple-200"
                      >
                        <Camera className="h-4 w-4" />
                        <span>Upload Photo</span>
                      </label>
                    </div>
                  </div>
                        </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    CV/Resume
                  </label>
                  <div className="flex items-center space-x-3">
                    {teacherForm.cv && (
                      <div className="h-16 w-16 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-8 w-8 text-green-600" />
                      </div>
                    )}
                    <div className="flex-1">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('cv', file);
                        }}
                          className="hidden"
                        id="cv-upload"
                      />
                      <label
                        htmlFor="cv-upload"
                        className="cursor-pointer bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-2 rounded-lg hover:from-purple-200 hover:to-pink-200 transition-colors flex items-center space-x-2 border border-purple-200"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Upload CV</span>
                      </label>
                    </div>
                    </div>
                  </div>
                </div>

              {/* Class Assignments */}
              <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Class & Stream Assignments</h3>
                    <button
                      type="button"
                    onClick={addClassAssignment}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg flex items-center space-x-2"
                    >
                    <Plus className="h-4 w-4" />
                    <span>Add Assignment</span>
                    </button>
                  </div>
                  
                <div className="space-y-4">
                      {teacherForm.assignedClasses.map((assignment, index) => (
                    <div key={assignment.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Assignment {index + 1}</h4>
                          <button
                            type="button"
                          onClick={() => removeClassAssignment(index)}
                          className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Class
                          </label>
                          <select
                            value={assignment.classId}
                            onChange={(e) => updateClassAssignment(index, 'classId', e.target.value)}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="">Select Class</option>
                            {classes.map(cls => (
                              <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stream
                          </label>
                          <select
                            value={assignment.streamId}
                            onChange={(e) => updateClassAssignment(index, 'streamId', e.target.value)}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            disabled={!assignment.classId}
                          >
                            <option value="">Select Stream</option>
                            {assignment.classId && classes.find(c => c.id === assignment.classId)?.streams.map(stream => (
                              <option key={stream.id} value={stream.id}>{stream.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`main-teacher-${index}`}
                            checked={assignment.isMainTeacher}
                            onChange={(e) => updateClassAssignment(index, 'isMainTeacher', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`main-teacher-${index}`} className="ml-2 text-sm text-gray-700">
                            Main Teacher
                          </label>
                        </div>
                      </div>

                      {assignment.subjects && assignment.subjects.length > 0 && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subjects
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {assignment.subjects.map((subject, subIndex) => (
                              <span key={subIndex} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {subject}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingTeacher(null);
                    }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{editingTeacher ? 'Update' : 'Add'} Teacher</span>
                    </>
                  )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Assignments Modal */}
      {showAssignments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Teacher Schedule</h2>
              <button
                onClick={() => setShowAssignments(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <p className="text-gray-600">Schedule management coming soon...</p>
          </div>
        </div>
      )}

              {/* Teacher Details Modal */}
        {showDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <User className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-bold">Teacher Profile</h2>
                </div>
                <button
                  onClick={() => setShowDetails(null)}
                  className="text-white hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-20"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {(() => {
              const teacher = teachers.find(t => t.id === showDetails);
              if (!teacher) return <p className="text-gray-600 p-6">Teacher not found.</p>;
              
              // Parse assignedClasses if it's a JSON string
              let assignedClasses = [];
              if (teacher.assignedClasses) {
                try {
                  assignedClasses = typeof teacher.assignedClasses === 'string' 
                    ? JSON.parse(teacher.assignedClasses) 
                    : teacher.assignedClasses;
                } catch (error) {
                  console.error('Error parsing assignedClasses in details:', error);
                  assignedClasses = [];
                }
              }
              
              return (
                <div className="p-6 space-y-6">
                  {/* Profile Header */}
                  <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center space-x-6">
                      {teacher.photo ? (
                        <div className="relative">
                          <img 
                            src={teacher.photo} 
                            alt={teacher.name}
                            className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                          />
                          <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                            <div className="w-4 h-4 bg-white rounded-full"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="h-32 w-32 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                            <User className="h-16 w-16 text-white" />
                          </div>
                          <div className="absolute -bottom-2 -right-2 bg-gray-400 rounded-full p-1">
                            <div className="w-4 h-4 bg-white rounded-full"></div>
                          </div>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-3xl font-bold text-gray-900 mb-2">{teacher.name}</h3>
                        <p className="text-lg text-gray-600 mb-3">{teacher.email}</p>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                            teacher.role === 'SUPER_TEACHER'
                              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' 
                              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          }`}>
                            {teacher.role === 'SUPER_TEACHER' ? 'Super Teacher' : 'Teacher'}
                          </span>
                          <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                            teacher.status === 'active' || teacher.status === 'ACTIVE'
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                              : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                          }`}>
                            {teacher.status === 'ACTIVE' ? 'active' : teacher.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Information Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                          {/* Contact Information */}
                      <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl p-6 border border-purple-200 shadow-sm">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                            <Mail className="h-5 w-5 text-purple-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Contact Information</h4>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                            <Mail className="h-5 w-5 text-purple-500" />
                            <div>
                              <div className="text-sm text-gray-500 font-medium">Email</div>
                              <div className="text-sm font-semibold text-gray-900">{teacher.email}</div>
                            </div>
                          </div>
                          {teacher.phone && (
                            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200">
                              <Phone className="h-5 w-5 text-green-500" />
                              <div>
                                <div className="text-sm text-gray-500 font-medium">Phone</div>
                                <div className="text-sm font-semibold text-gray-900">{teacher.phone}</div>
                              </div>
                            </div>
                          )}
                          {teacher.residence && (
                            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                              <Building className="h-5 w-5 text-purple-500" />
                              <div>
                                <div className="text-sm text-gray-500 font-medium">Residence</div>
                                <div className="text-sm font-semibold text-gray-900">{teacher.residence}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                                          {/* Personal Information */}
                      <div className="bg-gradient-to-br from-white to-pink-50 rounded-xl p-6 border border-pink-200 shadow-sm">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg">
                            <User className="h-5 w-5 text-pink-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Personal Information</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {teacher.gender && (
                            <div className="p-3 bg-gradient-to-r from-pink-100 to-rose-100 rounded-lg border border-pink-200">
                              <div className="text-sm text-gray-500 font-medium">Gender</div>
                              <div className="text-sm font-semibold text-gray-900 capitalize">{teacher.gender}</div>
                            </div>
                          )}
                          {teacher.age && (
                            <div className="p-3 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg border border-orange-200">
                              <div className="text-sm text-gray-500 font-medium">Age</div>
                              <div className="text-sm font-semibold text-gray-900">{teacher.age} years</div>
                            </div>
                          )}
                          <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-200">
                            <div className="text-sm text-gray-500 font-medium">Status</div>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              teacher.status === 'active' || teacher.status === 'ACTIVE' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                            }`}>
                              {teacher.status === 'ACTIVE' ? 'active' : teacher.status}
                            </span>
                          </div>
                          <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                            <div className="text-sm text-gray-500 font-medium">Role</div>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              teacher.role === 'SUPER_TEACHER' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            }`}>
                              {teacher.role === 'SUPER_TEACHER' ? 'Super Teacher' : 'Teacher'}
                            </span>
                          </div>
                        </div>
                      </div>
                  </div>

                  {/* Class Assignments */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <BookOpen className="h-5 w-5 text-green-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Class Assignments</h4>
                    </div>
                    {assignedClasses && assignedClasses.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assignedClasses.map((assignment: any, index: number) => (
                          <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                              <div className="font-semibold text-gray-900 text-lg">
                                {assignment.className} - {assignment.streamName}
                              </div>
                              {assignment.isMainTeacher && (
                                <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                                  Main Teacher
                                </span>
                              )}
                            </div>
                            {assignment.subjects && assignment.subjects.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {assignment.subjects.map((subject: string, subIndex: number) => (
                                  <span key={subIndex} className="bg-white text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-200">
                                    {subject}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No class assignments yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Documents & Media */}
                  {(teacher.cv || teacher.photo) && (
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Documents & Media</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* CV/Resume */}
                        {teacher.cv && (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                            <div className="flex items-center space-x-3">
                              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-6 w-6 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900">CV Document</div>
                                <div className="text-sm text-gray-500">Resume uploaded</div>
                                <button
                                  onClick={() => window.open(teacher.cv, '_blank')}
                                  className="text-green-600 hover:text-green-700 text-sm font-medium underline mt-1"
                                >
                                  View CV
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Profile Photo */}
                        {teacher.photo && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center space-x-3">
                              <img 
                                src={teacher.photo} 
                                alt={teacher.name}
                                className="h-12 w-12 rounded-full object-cover border-2 border-white"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900">Profile Picture</div>
                                <div className="text-sm text-gray-500">Photo uploaded</div>
                                <button
                                  onClick={() => window.open(teacher.photo, '_blank')}
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium underline mt-1"
                                >
                                  View Full Size
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
      </div>
      )}
    </div>
  );
};

export default TeacherManagement;