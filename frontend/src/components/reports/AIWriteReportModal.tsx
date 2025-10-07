import React, { useState, useRef } from 'react';
import { 
  FileText, 
  X, 
  Send, 
  Image as ImageIcon, 
  Trash2, 
  Sparkles, 
  Star, 
  Zap,
  Calendar,
  User,
  Target,
  AlertCircle,
  CheckCircle,
  Plus,
  Minus,
  Wand2,
  Crown,
  Rocket
} from 'lucide-react';

interface AIWriteReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reportData: any) => void;
  isSubmitting?: boolean;
  userRole?: string;
}

const AIWriteReportModal: React.FC<AIWriteReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  userRole = 'user'
}) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'general',
    priority: 'normal',
    content: '',
    achievements: [''],
    challenges: [''],
    nextWeekGoals: ['']
  });
  const [attachments, setAttachments] = useState<{ name: string; type: string; url: string; size: number }[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    { id: 1, title: 'Basic Info', icon: FileText },
    { id: 2, title: 'Content', icon: Target },
    { id: 3, title: 'Attachments', icon: ImageIcon },
    { id: 4, title: 'Review', icon: CheckCircle }
  ];

  const categories = [
    { value: 'general', label: 'General', icon: '📝', color: 'blue' },
    { value: 'academic', label: 'Academic', icon: '🎓', color: 'purple' },
    { value: 'behavioral', label: 'Behavioral', icon: '👥', color: 'green' },
    { value: 'administrative', label: 'Administrative', icon: '⚙️', color: 'gray' },
    { value: 'emergency', label: 'Emergency', icon: '🚨', color: 'red' },
    { value: 'achievement', label: 'Achievement', icon: '🏆', color: 'yellow' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'green', icon: '🟢' },
    { value: 'normal', label: 'Normal', color: 'blue', icon: '🔵' },
    { value: 'high', label: 'High', color: 'orange', icon: '🟠' },
    { value: 'urgent', label: 'Urgent', color: 'red', icon: '🔴' }
  ];

  // Predeclared Tailwind classes to avoid dynamic class generation issues
  const priorityActiveClasses: Record<string, string> = {
    low: 'border-green-500 bg-green-50 text-green-700',
    normal: 'border-blue-500 bg-blue-50 text-blue-700',
    high: 'border-orange-500 bg-orange-50 text-orange-700',
    urgent: 'border-red-500 bg-red-50 text-red-700'
  };

  const priorityBadgeClasses: Record<string, string> = {
    low: 'bg-green-100 text-green-700',
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addField = (field: 'achievements' | 'challenges' | 'nextWeekGoals') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateField = (field: 'achievements' | 'challenges' | 'nextWeekGoals', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const removeField = (field: 'achievements' | 'challenges' | 'nextWeekGoals', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    const newAttachments: { name: string; type: string; url: string; size: number }[] = [];
    
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newAttachments.push({ 
        name: file.name, 
        type: file.type, 
        url: dataUrl, 
        size: file.size 
      });
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (name: string) => {
    setAttachments(prev => prev.filter(att => att.name !== name));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      attachments,
      submittedAt: new Date(),
      userRole
    });
  };

  const getStepIcon = (stepNumber: number) => {
    const Icon = steps[stepNumber - 1]?.icon || FileText;
    return <Icon className="h-5 w-5" />;
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    return cat?.icon || '📝';
  };

  const getPriorityActiveClass = (priority: string) => {
    return priorityActiveClasses[priority] || priorityActiveClasses.normal;
  };

  const getPriorityBadgeClass = (priority: string) => {
    return priorityBadgeClasses[priority] || priorityBadgeClasses.normal;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-gray-900/50 to-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
      {/* Modal Container */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-500">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white relative overflow-hidden sticky top-0 z-20">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full animate-pulse" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/5 rounded-full animate-bounce" />
            <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/10 rounded-full animate-ping" />
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Report Writer</h2>
                <p className="text-blue-100 text-sm">Create comprehensive weekly reports</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="h-10 w-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-6 flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                  currentStep >= step.id 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'bg-white/20 text-white/70'
                }`}>
                  {getStepIcon(step.id)}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.id ? 'text-white' : 'text-white/70'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 transition-all duration-300 ${
                    currentStep > step.id ? 'bg-white' : 'bg-white/30'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] pb-24">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className={`space-y-6 transition-all duration-300 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">📝 Basic Information</h3>
                  <p className="text-gray-600">Let's start with the essential details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Report Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                      placeholder="Enter a descriptive title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {priorities.map(priority => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => handleInputChange('priority', priority.value)}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                          formData.priority === priority.value
                            ? getPriorityActiveClass(priority.value)
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{priority.icon}</div>
                        <div className="text-sm font-medium">{priority.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Content */}
            {currentStep === 2 && (
              <div className={`space-y-6 transition-all duration-300 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">📋 Report Content</h3>
                  <p className="text-gray-600">Share your weekly activities and insights</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Weekly Summary *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                    placeholder="Describe your activities, progress, and key highlights for this week..."
                  />
                </div>

                {/* Achievements */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🏆 Achievements
                  </label>
                  {formData.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-3 mb-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={achievement}
                          onChange={(e) => updateField('achievements', index, e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200"
                          placeholder="Enter an achievement..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeField('achievements', index)}
                        className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField('achievements')}
                    className="text-green-600 hover:text-green-800 text-sm font-semibold flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Achievement</span>
                  </button>
                </div>

                {/* Challenges */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    ⚠️ Challenges
                  </label>
                  {formData.challenges.map((challenge, index) => (
                    <div key={index} className="flex items-center space-x-3 mb-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={challenge}
                          onChange={(e) => updateField('challenges', index, e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
                          placeholder="Enter a challenge..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeField('challenges', index)}
                        className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField('challenges')}
                    className="text-orange-600 hover:text-orange-800 text-sm font-semibold flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Challenge</span>
                  </button>
                </div>

                {/* Next Week Goals */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🎯 Next Week Goals
                  </label>
                  {formData.nextWeekGoals.map((goal, index) => (
                    <div key={index} className="flex items-center space-x-3 mb-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={goal}
                          onChange={(e) => updateField('nextWeekGoals', index, e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                          placeholder="Enter a goal..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeField('nextWeekGoals', index)}
                        className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addField('nextWeekGoals')}
                    className="text-purple-600 hover:text-purple-800 text-sm font-semibold flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Goal</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Attachments */}
            {currentStep === 3 && (
              <div className={`space-y-6 transition-all duration-300 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">📎 Attachments</h3>
                  <p className="text-gray-600">Add images or documents to support your report</p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors duration-200">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center space-x-3 px-6 py-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all duration-200"
                  >
                    <ImageIcon className="h-6 w-6" />
                    <span className="font-semibold">Add Images</span>
                  </button>
                  <p className="text-sm text-gray-500 mt-2">Click to select multiple images</p>
                </div>

                {attachments.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {attachments.map((attachment, index) => (
                      <div key={index} className="relative border rounded-xl overflow-hidden">
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="w-full h-32 object-contain bg-gray-50"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttachment(attachment.name)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <div className="p-2">
                          <p className="text-xs text-gray-600 truncate">{attachment.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className={`space-y-6 transition-all duration-300 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">✨ Review & Submit</h3>
                  <p className="text-gray-600">Review your report before submitting</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCategoryIcon(formData.category)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{formData.title}</h4>
                      <p className="text-sm text-gray-600 capitalize">{formData.category} Report</p>
                    </div>
                    <div className="ml-auto">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityBadgeClass(formData.priority)}`}>
                        {formData.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Summary</h5>
                    <p className="text-gray-700 text-sm">{formData.content}</p>
                  </div>

                  {formData.achievements.filter(a => a.trim()).length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Achievements</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {formData.achievements.filter(a => a.trim()).map((achievement, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {attachments.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Attachments</h5>
                      <p className="text-sm text-gray-700">{attachments.length} image(s) attached</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-6 flex items-center justify-between border-t-2 border-gray-200 sticky bottom-0 z-20">
          <div className="flex space-x-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold shadow-sm"
              >
                ← Previous
              </button>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold shadow-sm"
            >
              Cancel
            </button>
            
            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
              >
                <span>Next</span>
                <Rocket className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIWriteReportModal;
