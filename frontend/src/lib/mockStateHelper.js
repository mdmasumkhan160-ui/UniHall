/**
 * Helper to simulate different allocation process states for testing
 * This allows you to visualize each step of the process
 */

export function setMockApplicationState(state) {
  const apps = JSON.parse(localStorage.getItem('uh_applications') || '[]')
  
  if (apps.length === 0) {
    console.warn('No applications found. Create an application first.')
    return
  }
  
  const latestApp = apps[0]
  
  switch(state) {
    case 'submitted':
      latestApp.status = 'Submitted'
      latestApp.roomAssigned = false
      latestApp.inWaitlist = false
      latestApp.paymentDone = false
      break
      
    case 'room-selected':
      latestApp.status = 'Approved'
      latestApp.roomAssigned = true
      latestApp.inWaitlist = false
      latestApp.paymentDone = false
      break
      
    case 'waitlist':
      latestApp.status = 'Approved'
      latestApp.roomAssigned = true
      latestApp.inWaitlist = true
      latestApp.paymentDone = false
      break
      
    case 'payment-pending':
      latestApp.status = 'Approved'
      latestApp.roomAssigned = true
      latestApp.inWaitlist = true
      latestApp.paymentDone = false
      break
      
    case 'allocated':
      latestApp.status = 'Approved'
      latestApp.roomAssigned = true
      latestApp.inWaitlist = false
      latestApp.paymentDone = true
      break
      
    default:
      console.error('Invalid state. Use: submitted, room-selected, waitlist, payment-pending, allocated')
      return
  }
  
  apps[0] = latestApp
  localStorage.setItem('uh_applications', JSON.stringify(apps))
  console.log(`✅ Application state set to: ${state}`)
  console.log('Refresh the page to see changes')
}

// Add to window for easy testing in browser console
if (typeof window !== 'undefined') {
  window.setMockState = setMockApplicationState
  console.log('💡 To test different process states, use: setMockState("submitted|room-selected|waitlist|payment-pending|allocated")')
}
