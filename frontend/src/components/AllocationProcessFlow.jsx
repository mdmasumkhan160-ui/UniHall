import React from 'react'

/**
 * Visual Process Flow Component
 * Shows the allocation journey: Application → Room Selection → Waiting List → Payment → Allocated
 */
export default function AllocationProcessFlow({ currentStep, application }) {
  const steps = [
    {
      id: 1,
      name: 'Application Submitted',
      description: 'Your application is under review',
      icon: '📝',
      status: 'completed'
    },
    {
      id: 2,
      name: 'Room Selected',
      description: 'Room assigned by admin',
      icon: '🏠',
      status: currentStep >= 2 ? 'completed' : 'pending'
    },
    {
      id: 3,
      name: 'In Waiting List',
      description: 'Temporarily reserved, payment pending',
      icon: '⏳',
      status: currentStep >= 3 ? 'completed' : 'pending'
    },
    {
      id: 4,
      name: 'Payment Confirmed',
      description: 'Payment verified by admin',
      icon: '💳',
      status: currentStep >= 4 ? 'completed' : 'pending'
    },
    {
      id: 5,
      name: 'Permanently Allocated',
      description: 'Room confirmed and active',
      icon: '✅',
      status: currentStep >= 5 ? 'completed' : 'pending'
    }
  ]

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Allocation Process</h3>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-brand-600">
            {Math.round((currentStep / 5) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-brand-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex gap-4">
            {/* Icon */}
            <div className="flex flex-col items-center">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-xl
                ${step.status === 'completed' 
                  ? 'bg-brand-100 text-brand-600 ring-4 ring-brand-50' 
                  : step.status === 'active'
                  ? 'bg-amber-100 text-amber-600 ring-4 ring-amber-50 animate-pulse'
                  : 'bg-gray-100 text-gray-400'
                }
              `}>
                {step.icon}
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-0.5 h-12 mt-2
                  ${step.status === 'completed' ? 'bg-brand-300' : 'bg-gray-200'}
                `} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-semibold ${
                  step.status === 'completed' ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.name}
                </h4>
                {step.status === 'completed' && (
                  <span className="text-brand-600 text-sm">✓</span>
                )}
              </div>
              <p className={`text-sm ${
                step.status === 'completed' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {step.description}
              </p>

              {/* Dynamic content based on step */}
              {step.id === 2 && currentStep >= 2 && application?.roomNumber && (
                <div className="mt-2 p-3 bg-brand-50 rounded-lg border border-brand-100">
                  <p className="text-sm font-medium text-brand-900">
                    Room {application.roomNumber} assigned
                  </p>
                  <p className="text-xs text-brand-600 mt-1">
                    Capacity: {application.roomCapacity || 2} students
                  </p>
                </div>
              )}

              {step.id === 3 && currentStep === 3 && (
                <div className="mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-900">
                    ⚠️ Action Required: Complete payment within 7 days
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Your room is temporarily reserved. Pay to confirm allocation.
                  </p>
                </div>
              )}

              {step.id === 4 && currentStep >= 4 && application?.paymentAmount && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-900">
                    ৳{application.paymentAmount} payment received
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Receipt: #{application.receiptNumber || 'PENDING'}
                  </p>
                </div>
              )}

              {step.id === 5 && currentStep >= 5 && (
                <div className="mt-2 p-3 bg-brand-50 rounded-lg border border-brand-200">
                  <p className="text-sm font-medium text-brand-900">
                    🎉 Welcome to {application?.hallName}!
                  </p>
                  <p className="text-xs text-brand-600 mt-1">
                    Move-in date: {application?.moveInDate || 'TBA'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Next Action */}
      {currentStep < 5 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-2">Next Step</h4>
          <p className="text-sm text-gray-600">
            {currentStep === 1 && "Wait for admin to review and assign a room"}
            {currentStep === 2 && "Admin will add you to waiting list"}
            {currentStep === 3 && "Complete payment to confirm your allocation"}
            {currentStep === 4 && "Admin will verify payment and activate your room"}
          </p>
        </div>
      )}
    </div>
  )
}
