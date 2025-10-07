import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { X, Heart, User, Mail, Phone, DollarSign, Calendar, MapPin, Building, Globe, CreditCard } from 'lucide-react';

interface SponsorshipFormProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
}

const SponsorshipForm: React.FC<SponsorshipFormProps> = ({ isOpen, onClose, student }) => {
  const { addSponsorship } = useData();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    sponsorName: user?.name || '',
    sponsorEmail: user?.email || '',
    sponsorPhone: user?.phone || '',
    sponsorCountry: '',
    sponsorCity: '',
    sponsorRelationship: 'individual', // individual, organization, family
    sponsorshipAmount: '',
    sponsorshipDuration: '1', // months
    sponsorshipStartDate: '',
    message: '',
    paymentMethod: 'monthly',
    preferredContactMethod: 'email' // email, phone, both
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('Submitting sponsorship data:', formData);
      
      const sponsorshipData = {
        studentId: student.id,
        studentName: student.name,
        sponsorId: user?.id?.toString() || 'sponsor-' + Date.now(),
        sponsorName: formData.sponsorName,
        sponsorEmail: formData.sponsorEmail,
        sponsorPhone: formData.sponsorPhone,
        sponsorCountry: formData.sponsorCountry,
        sponsorCity: formData.sponsorCity,
        sponsorRelationship: formData.sponsorRelationship,
        amount: parseFloat(formData.sponsorshipAmount),
        duration: parseInt(formData.sponsorshipDuration),
        sponsorshipStartDate: formData.sponsorshipStartDate,
        description: formData.message,
        paymentSchedule: formData.paymentMethod,
        preferredContactMethod: formData.preferredContactMethod,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      console.log('Processed sponsorship data:', sponsorshipData);
      
      await addSponsorship(sponsorshipData);
      setSuccess(true);
      
      // Close form after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          sponsorName: user?.name || '',
          sponsorEmail: user?.email || '',
          sponsorPhone: user?.phone || '',
          sponsorCountry: '',
          sponsorCity: '',
          sponsorRelationship: 'individual',
          sponsorshipAmount: '',
          sponsorshipDuration: '1',
          sponsorshipStartDate: '',
          message: '',
          paymentMethod: 'monthly',
          preferredContactMethod: 'email'
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting sponsorship:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit sponsorship request');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sponsor This Child</h2>
              <p className="text-sm text-gray-600">Complete your sponsorship application</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Student Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{student.name}</h3>
              <p className="text-sm text-gray-600">{student.class} - Stream {student.stream}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Access: {student.accessNumber} | Age: {student.age} years</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-6 bg-green-50 border-b border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Sponsorship Request Submitted!</h3>
                <p className="text-sm text-green-600">Your request has been sent to the sponsorship overseer for review. We'll contact you soon!</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-6 bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Submission Failed</h3>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && !error && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Sponsor Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Your Name
              </label>
              <input
                type="text"
                name="sponsorName"
                value={formData.sponsorName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            {/* Sponsor Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Address
              </label>
              <input
                type="email"
                name="sponsorEmail"
                value={formData.sponsorEmail}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

                         {/* Sponsor Phone */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 <Phone className="w-4 h-4 inline mr-1" />
                 Phone Number
               </label>
               <input
                 type="tel"
                 name="sponsorPhone"
                 value={formData.sponsorPhone}
                 onChange={handleInputChange}
                 required
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                 placeholder="Enter your phone number"
               />
             </div>



             {/* Sponsor Country */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 <Globe className="w-4 h-4 inline mr-1" />
                 Country
               </label>
               <input
                 type="text"
                 name="sponsorCountry"
                 value={formData.sponsorCountry}
                 onChange={handleInputChange}
                 required
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                 placeholder="Enter your country"
               />
             </div>

             {/* Sponsor City */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 <MapPin className="w-4 h-4 inline mr-1" />
                 City
               </label>
               <input
                 type="text"
                 name="sponsorCity"
                 value={formData.sponsorCity}
                 onChange={handleInputChange}
                 required
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                 placeholder="Enter your city"
               />
             </div>



             {/* Sponsor Relationship Type */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 <Building className="w-4 h-4 inline mr-1" />
                 Sponsorship Type
               </label>
               <select
                 name="sponsorRelationship"
                 value={formData.sponsorRelationship}
                 onChange={handleInputChange}
                 required
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
               >
                 <option value="individual">Individual Sponsor</option>
                 <option value="organization">Organization/Company</option>
                 <option value="family">Family Sponsor</option>
               </select>
             </div>

            {/* Sponsorship Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Monthly Sponsorship Amount (USD)
              </label>
              <input
                type="number"
                name="sponsorshipAmount"
                value={formData.sponsorshipAmount}
                onChange={handleInputChange}
                required
                min="10"
                step="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter amount (minimum $10)"
              />
            </div>

            {/* Sponsorship Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Sponsorship Start Date
              </label>
              <input
                type="date"
                name="sponsorshipStartDate"
                value={formData.sponsorshipStartDate}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Sponsorship Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Sponsorship Duration
              </label>
              <select
                name="sponsorshipDuration"
                value={formData.sponsorshipDuration}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">1 Year</option>
                <option value="24">2 Years</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="w-4 h-4 inline mr-1" />
                Payment Schedule
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="monthly">Monthly Payment</option>
                <option value="quarterly">Quarterly Payment</option>
                <option value="yearly">Yearly Payment</option>
              </select>
            </div>

            {/* Preferred Contact Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Preferred Contact Method
              </label>
              <select
                name="preferredContactMethod"
                value={formData.preferredContactMethod}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="both">Both Email & Phone</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message to the Child (Optional)
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Write a message of encouragement..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" />
                  Submit Sponsorship Request
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SponsorshipForm;
