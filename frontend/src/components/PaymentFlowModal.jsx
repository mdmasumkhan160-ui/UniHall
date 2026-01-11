import React, { useState } from 'react'

/**
 * Payment Flow Modal Component
 * Shows payment process with visual feedback
 */
export default function PaymentFlowModal({ isOpen, onClose, allocation, onPaymentComplete }) {
  const [step, setStep] = useState(1) // 1: Info, 2: Upload, 3: Confirm, 4: Success
  const [paymentMethod, setPaymentMethod] = useState('bank')
  const [receiptImage, setReceiptImage] = useState(null)
  const [transactionId, setTransactionId] = useState('')

  if (!isOpen) return null

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    if (!transactionId || !receiptImage) {
      alert('Please fill all required fields')
      return
    }
    
    setStep(4)
    
    // Simulate API call
    setTimeout(() => {
      onPaymentComplete({
        transactionId,
        receiptImage,
        paymentMethod,
        amount: allocation.amount,
        timestamp: new Date().toISOString()
      })
    }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-4 text-white">
          <h2 className="text-xl font-bold">Complete Payment</h2>
          <p className="text-sm text-white/80 mt-1">Room {allocation?.roomNumber} - {allocation?.hallName}</p>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Amount' },
              { num: 2, label: 'Upload' },
              { num: 3, label: 'Confirm' },
              { num: 4, label: 'Done' }
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${step >= s.num 
                      ? 'bg-brand-600 text-white' 
                      : 'bg-gray-200 text-gray-400'
                    }
                  `}>
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span className="text-xs text-gray-600 mt-1">{s.label}</span>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${step > s.num ? 'bg-brand-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Step 1: Amount Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">Total Amount</span>
                  <span className="text-2xl font-bold text-brand-900">৳{allocation?.amount || 15000}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admission Fee</span>
                    <span className="font-medium">৳5,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Rent (6 months)</span>
                    <span className="font-medium">৳6,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Deposit</span>
                    <span className="font-medium">৳4,000</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <div className="space-y-2">
                  {[
                    { id: 'bank', label: 'Bank Transfer', icon: '🏦' },
                    { id: 'bkash', label: 'bKash', icon: '📱' },
                    { id: 'nagad', label: 'Nagad', icon: '💰' }
                  ].map(method => (
                    <label key={method.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-brand-600"
                      />
                      <span className="text-xl">{method.icon}</span>
                      <span className="font-medium">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {paymentMethod === 'bank' && (
                <div className="bg-gray-50 border rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">Bank Details:</p>
                  <p>Bank: Sonali Bank Limited</p>
                  <p>Account: 1234567890</p>
                  <p>Branch: NSTU Campus</p>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                className="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors"
              >
                Continue to Upload Receipt
              </button>
            </div>
          )}

          {/* Step 2: Upload Receipt */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID / Reference Number
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g., TXN123456789"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Payment Receipt
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-brand-400 transition-colors">
                  {receiptImage ? (
                    <div className="space-y-2">
                      <img src={receiptImage} alt="Receipt" className="max-h-40 mx-auto rounded" />
                      <button
                        onClick={() => setReceiptImage(null)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-sm text-gray-600 mb-2">Click to upload receipt image</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!transactionId || !receiptImage}
                  className="flex-1 bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Review Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-amber-900 mb-1">⚠️ Please Review Carefully</p>
                <p className="text-amber-700">Once submitted, your payment will be verified by admin within 24-48 hours.</p>
              </div>

              <div className="space-y-3 border rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-bold">৳{allocation?.amount || 15000}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium capitalize">{paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="font-medium">{transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Receipt</span>
                  <span className="text-green-600 font-medium">✓ Uploaded</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors"
                >
                  Submit Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center py-8 space-y-4">
              <div className="text-6xl animate-bounce">✅</div>
              <h3 className="text-2xl font-bold text-gray-900">Payment Submitted!</h3>
              <p className="text-gray-600">
                Your payment has been submitted for verification. You'll be notified once it's confirmed.
              </p>
              <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-sm text-left">
                <p className="font-medium text-brand-900 mb-2">What's Next?</p>
                <ul className="space-y-1 text-brand-700">
                  <li>• Admin will verify your payment within 24-48 hours</li>
                  <li>• You'll receive a notification once verified</li>
                  <li>• Your room will be permanently allocated</li>
                  <li>• You can then proceed with move-in arrangements</li>
                </ul>
              </div>
              <button
                onClick={onClose}
                className="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
