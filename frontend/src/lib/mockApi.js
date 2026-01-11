
// Data model keys
const KEYS = {
  users: 'uh_users',
  session: 'uh_session',
  forms: 'uh_forms',
  applications: 'uh_applications',
  seats: 'uh_seats',
  waitlist: 'uh_waitlist',
  complaints: 'uh_complaints',
  notifications: 'uh_notifications',
  renewals: 'uh_renewals',
  halls: 'uh_halls',
  results: 'uh_results',
  seatPlanUploads: 'uh_seat_plan_uploads',
  interviews: 'uh_interviews',
  seatAllocations: 'uh_seat_allocations',
  disciplinaryRecords: 'uh_disciplinary_records',
  studentProfiles: 'uh_student_profiles',
  adminProfiles: 'uh_admin_profiles',
  staffProfiles: 'uh_staff_profiles',
  examProfiles: 'uh_exam_profiles',
  seedVersion: 'uh_seed_version'
}

// Increment this version number whenever you change seed data structure
// This will force a reseed on next page load
const CURRENT_SEED_VERSION = 7

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function ensureSeedData() {
  // Check seed version - if changed, clear all data and reseed
  const storedVersion = read(KEYS.seedVersion, 0)
  if (storedVersion !== CURRENT_SEED_VERSION) {
    console.log(`Seed version changed (${storedVersion} → ${CURRENT_SEED_VERSION}). Reseeding all data...`)
    // Clear all data except session (preserve login)
    const session = read(KEYS.session, null)
    Object.values(KEYS).forEach(k => {
      if (k !== KEYS.session && k !== KEYS.seedVersion) {
        localStorage.removeItem(k)
      }
    })
    write(KEYS.seedVersion, CURRENT_SEED_VERSION)
    // If session exists, refresh it after reseed
    if (session) {
      setTimeout(() => {
        const users = read(KEYS.users, [])
        const u = users.find(x => x.id === session.id || x.email === session.email)
        if (u) {
          write(KEYS.session, { 
            id: u.id, 
            name: u.name, 
            role: u.role, 
            email: u.email, 
            hallId: u.hallId ?? null, 
            studentId: u.studentId ?? null 
          })
        }
      }, 100)
    }
  }
  
  // NSTU Halls of Residence (official data from nstu.edu.bd)
  const masterHalls = [
    { id: 'hall-ash', name: 'Basha Shaheed Abdus Salam Hall', shortName: 'ASH', category: 'Male', capacity: 400, established: 2006,
      localImg: '/halls/ASH.jpg', img: 'https://nstu.edu.bd/assets/images/accommodation/ASH.jpg', fallbackImg: 'https://images.unsplash.com/photo-1520637736862-4d197d17c155?w=800',
      provost: { name: 'Md. Farid Dewan', phone: '+8801717386048', email: 'provost.ash@nstu.edu.bd' },
      address: 'Basha Shaheed Abdus Salam Hall, NSTU Campus, Sonapur, Noakhali-3814' },
    { id: 'hall-muh', name: 'Bir Muktijuddha Abdul Malek Ukil Hall', shortName: 'MUH', category: 'Male', capacity: 350, established: 2010,
      localImg: '/halls/MUH.jpg', img: 'https://nstu.edu.bd/assets/images/accommodation/MUH.jpg', fallbackImg: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      provost: { name: 'Hall Provost', phone: '+880-XXXX-XXXXXX', email: 'provost.muh@nstu.edu.bd' },
      address: 'Bir Muktijuddha Abdul Malek Ukil Hall, NSTU Campus, Sonapur, Noakhali-3814' },
    { id: 'hall-bkh', name: 'Hazrat Bibi Khadiza Hall', shortName: 'BKH', category: 'Female', capacity: 300, established: 2008,
      localImg: '/halls/BKH.jpg', img: 'https://nstu.edu.bd/assets/images/accommodation/BKH.jpg', fallbackImg: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
      provost: { name: 'Hall Provost', phone: '+880-XXXX-XXXXXX', email: 'provost.bkh@nstu.edu.bd' },
      address: 'Hazrat Bibi Khadiza Hall, NSTU Campus, Sonapur, Noakhali-3814' },
    { id: 'hall-jsh', name: 'July Shaheed Smriti Chhatri Hall', shortName: 'JSH', category: 'Female', capacity: 280, established: 2012,
      localImg: '/halls/BMH.jpg', img: 'https://nstu.edu.bd/assets/images/accommodation/JSH.jpg', fallbackImg: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      provost: { name: 'Hall Provost', phone: '+880-XXXX-XXXXXX', email: 'provost.jsh@nstu.edu.bd' },
      address: 'July Shaheed Smriti Chhatri Hall, NSTU Campus, Sonapur, Noakhali-3814' },
    { id: 'hall-nfh', name: 'Nabab Foyzunnessa Choudhurani Hall', shortName: 'NFH', category: 'Female', capacity: 320, established: 2014,
      localImg: '/halls/FMH.jpg', img: 'https://nstu.edu.bd/assets/images/accommodation/NFH.jpg', fallbackImg: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
      provost: { name: 'Hall Provost', phone: '+880-XXXX-XXXXXX', email: 'provost.nfh@nstu.edu.bd' },
      address: 'Nabab Foyzunnessa Choudhurani Hall, NSTU Campus, Sonapur, Noakhali-3814' }
  ]
  if (!read(KEYS.halls)) {
    write(KEYS.halls, masterHalls)
  }

  let hallsNow = read(KEYS.halls, [])
  if (Array.isArray(hallsNow) && hallsNow.length) {
    let changed = false
    // Normalize existing and ensure all master halls are present
    const normalized = hallsNow.map(h => {
      const sn = h.shortName || ''
      const expectedLocal = sn === 'JSH' ? '/halls/BMH.jpg' : sn === 'NFH' ? '/halls/FMH.jpg' : (sn ? `/halls/${sn}.jpg` : (h.localImg || ''))
      const expectedRemote = sn ? `https://nstu.edu.bd/assets/images/accommodation/${sn}.jpg` : (h.img || '')
      const next = { ...h }
      if (expectedLocal && next.localImg !== expectedLocal) { next.localImg = expectedLocal; changed = true }
      if (expectedRemote && next.img !== expectedRemote) { next.img = expectedRemote; changed = true }
      return next
    })
    
    // Merge with master halls and deduplicate
    const byShort = new Map()
    const masterByShort = new Map(masterHalls.map(m => [m.shortName, m]))
    
    const combined = [...normalized, ...masterHalls]
    combined.forEach(h => {
      if (!h.shortName) return
      const m = masterByShort.get(h.shortName) || {}
      const merged = { ...m, ...h, id: m.id || h.id }
      const prev = byShort.get(merged.shortName)
      if (!prev || (merged.localImg && !prev.localImg)) {
        byShort.set(merged.shortName, merged)
      }
    })
    
    const deduped = masterHalls.map(m => byShort.get(m.shortName)).filter(Boolean)
    if (changed || deduped.length !== hallsNow.length) {
      write(KEYS.halls, deduped)
      changed = true
    }
  }
  const existingUsers = read(KEYS.users)
  if (!existingUsers) {
    const halls = read(KEYS.halls, [])
    write(KEYS.users, [
      // Admin credentials for each hall
    { id: 'admin-ash', name: 'Admin - Abdus Salam Hall', email: 'admin.ash@nstu.edu.bd', role: 'admin', hallId: 'hall-ash', password: 'ash123' },
    { id: 'admin-muh', name: 'Admin - Abdul Malek Ukil Hall', email: 'admin.muh@nstu.edu.bd', role: 'admin', hallId: 'hall-muh', password: 'muh123' },
    { id: 'admin-bkh', name: 'Admin - Bibi Khadiza Hall', email: 'admin.bkh@nstu.edu.bd', role: 'admin', hallId: 'hall-bkh', password: 'bkh123' },
      { id: 'admin-jsh', name: 'Admin - July Shaheed Hall', email: 'admin.jsh@nstu.edu.bd', role: 'admin', hallId: 'hall-jsh', password: 'jsh123' },
      { id: 'admin-nfh', name: 'Admin - Foyzunnessa Hall', email: 'admin.nfh@nstu.edu.bd', role: 'admin', hallId: 'hall-nfh', password: 'nfh123' },
      
      // Student credentials for each hall
    { id: 'student-ash', name: 'Rakib Hasan', email: 'student.ash@student.nstu.edu.bd', role: 'student', hallId: 'hall-ash', studentId: 'ASH2021001M', password: 'student123' },
    { id: 'student-muh', name: 'Hasan Mahmud', email: 'student.muh@student.nstu.edu.bd', role: 'student', hallId: 'hall-muh', studentId: 'MUH2225007M', password: 'student123' },
    { id: 'student-bkh', name: 'Sheuli Akter', email: 'student.bkh@student.nstu.edu.bd', role: 'student', hallId: 'hall-bkh', studentId: 'BKH2021012F', password: 'student123' },
      { id: 'student-jsh', name: 'Nusrat Jahan', email: 'student.jsh@student.nstu.edu.bd', role: 'student', hallId: 'hall-jsh', studentId: 'JSH2022005F', password: 'student123' },
      { id: 'student-nfh', name: 'Taslima Akter', email: 'student.nfh@student.nstu.edu.bd', role: 'student', hallId: 'hall-nfh', studentId: 'NFH2022008F', password: 'student123' },

      // Other roles
      { id: 'exam-1', name: 'Exam Controller', email: 'exam@nstu.edu.bd', role: 'examcontroller', password: 'exam123' },
      { id: 'staff-1', name: 'Hall Staff', email: 'staff@nstu.edu.bd', role: 'staff', hallId: 'hall-ash', password: 'staff123' }
    ])
  } else {
    // Ensure all hall admins exist
    const halls = read(KEYS.halls, [])
    const users = Array.isArray(existingUsers) ? existingUsers : []
    
    // Migrate existing student users to new email domain and add studentId
    const studentMigrations = [
      { id: 'student-ash', email: 'student.ash@student.nstu.edu.bd', studentId: 'ASH2021001M', name: 'Rakib Hasan' },
      { id: 'student-muh', email: 'student.muh@student.nstu.edu.bd', studentId: 'MUH2225007M', name: 'Hasan Mahmud' },
      { id: 'student-bkh', email: 'student.bkh@student.nstu.edu.bd', studentId: 'BKH2021012F', name: 'Sheuli Akter' },
      { id: 'student-jsh', email: 'student.jsh@student.nstu.edu.bd', studentId: 'JSH2022005F', name: 'Nusrat Jahan' },
      { id: 'student-nfh', email: 'student.nfh@student.nstu.edu.bd', studentId: 'NFH2022008F', name: 'Taslima Akter' }
    ]
    
    studentMigrations.forEach(migration => {
      const user = users.find(u => u.id === migration.id)
      if (user) {
        user.email = migration.email
        user.studentId = migration.studentId
        user.name = migration.name
      }
    })
    
    // Add missing hall admins
    const hallAdmins = [
    { id: 'admin-ash', name: 'Admin - Abdus Salam Hall', email: 'admin.ash@nstu.edu.bd', role: 'admin', hallId: 'hall-ash', password: 'ash123' },
    { id: 'admin-muh', name: 'Admin - Abdul Malek Ukil Hall', email: 'admin.muh@nstu.edu.bd', role: 'admin', hallId: 'hall-muh', password: 'muh123' },
    { id: 'admin-bkh', name: 'Admin - Bibi Khadiza Hall', email: 'admin.bkh@nstu.edu.bd', role: 'admin', hallId: 'hall-bkh', password: 'bkh123' },
      { id: 'admin-jsh', name: 'Admin - July Shaheed Hall', email: 'admin.jsh@nstu.edu.bd', role: 'admin', hallId: 'hall-jsh', password: 'jsh123' },
      { id: 'admin-nfh', name: 'Admin - Foyzunnessa Hall', email: 'admin.nfh@nstu.edu.bd', role: 'admin', hallId: 'hall-nfh', password: 'nfh123' }
    ]
    
    hallAdmins.forEach(admin => {
      if (!users.some(u => u.email === admin.email)) {
        users.push(admin)
      }
    })
    
    // Add other essential users if missing
    if (!users.some(u => u.email === 'exam@nstu.edu.bd')) {
      users.push({ id: `exam-${Date.now()}`, name: 'Exam Controller', email: 'exam@nstu.edu.bd', role: 'examcontroller', password: 'exam123' })
    }
    if (!users.some(u => u.email === 'staff@nstu.edu.bd')) {
      users.push({ id: `staff-${Date.now()}`, name: 'Hall Staff', email: 'staff@nstu.edu.bd', role: 'staff', hallId: 'hall-ash', password: 'staff123' })
    }
    
    write(KEYS.users, users)
  }

  if (!read(KEYS.studentProfiles)) {
    write(KEYS.studentProfiles, [
      {
        userId: 'student-ash',
        hallId: 'hall-ash',
        universityId: 'ASH2021-0001',
        cgpa: 3.82,
        sessionYear: '2020-2021',
        program: 'BSc in Computer Science and Engineering',
        department: 'Computer Science and Telecommunication Engineering',
        additionalInfo: 'Emergency Contact: +88017XXXXXXXX; Medical: None; Guardian: Mr. Rakib (Dhaka)'
      },
      {
        userId: 'student-muh',
        hallId: 'hall-muh', // Not allocated yet
        universityId: 'MUH2225007M',
        cgpa: 3.67,
        sessionYear: '2021-2022',
        program: 'BSc in Software Engineering',
        department: 'Institute of Information Technology',
        additionalInfo: 'Emergency Contact: +88016XXXXXXXX'
      },
      {
        userId: 'student-bkh',
        hallId: 'hall-bkh',
        universityId: 'BKH2021-0012',
        cgpa: 3.91,
        sessionYear: '2020-2021',
        program: 'BBA in Marketing',
        department: 'Business Administration',
        additionalInfo: 'Emergency Contact: +88018XXXXXXXX; Guardian: Mrs. Sheuli (Chattogram)'
      }
    ])
  }

  if (!read(KEYS.adminProfiles)) {
    write(KEYS.adminProfiles, [
      {
        userId: 'admin-ash',
        designation: 'Hall Provost',
        department: 'Student Affairs',
        responsibilities: [
          'Supervise hall administration and maintenance',
          'Approve seat allocations and renewals',
          'Oversee disciplinary hearings'
        ],
        officeLocation: 'Provost Office, Ground Floor, ASH',
        contactExt: '2101',
        hallId: 'hall-ash',
        additionalInfo: 'Office Hours: Sun-Tue 10:00-13:00; Delegation: Assistant Provost during leave'
      },
      {
        userId: 'admin-muh',
        designation: 'Assistant Provost',
        department: 'Student Welfare',
        responsibilities: [
          'Coordinate maintenance requests',
          'Monitor hall budget utilization',
          'Lead staff duty roster planning'
        ],
        officeLocation: 'Admin Block, Level 2, MUH',
        contactExt: '2204',
        hallId: 'hall-muh',
        additionalInfo: 'Special Authority: Emergency procurement up to 50,000 BDT'
      }
    ])
  }

  if (!read(KEYS.staffProfiles)) {
    write(KEYS.staffProfiles, [
      {
        userId: 'staff-1',
        designation: 'Maintenance Supervisor',
        department: 'Facilities Management',
        hallId: 'hall-ash',
        hallsCovered: ['hall-ash', 'hall-muh'],
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: 'admin-ash',
        updated_by: 'admin-ash',
        additionalInfo: 'Primary duty hall: ASH; Secondary support: MUH; Emergency contact: +88019XXXXXXXX'
      }
    ])
  }

  if (!read(KEYS.examProfiles)) {
    write(KEYS.examProfiles, [
      {
        userId: 'exam-1',
        contactExt: '3105',
        additionalInfo: 'Verification Authority: NSTU Controller Office; Special Permissions: Upload notice without prior approval'
      }
    ])
  }
  if (!read(KEYS.forms)) {
    const defaultForm = {
      id: 'form-1', name: 'Hall Admission Form', active: true, hallId: null, createdAt: Date.now(),
      schema: [
        { id: 'f1', label: 'Full Name', type: 'text', required: true },
        { id: 'f2', label: 'Student ID', type: 'text', required: true },
        { id: 'f3', label: 'Department', type: 'dropdown', options: ['CSE','EEE','ICE','BBA'], required: true },
        { id: 'f4', label: 'Session (e.g., 2019-20)', type: 'text', required: true },
        { id: 'f5', label: 'Date of Birth', type: 'date' },
        { id: 'f6', label: 'Guardian Contact', type: 'text' },
        { id: 'f7', label: 'Quota', type: 'checkbox', options: ['Freedom Fighter','Tribal','None'] }
      ]
    }
    write(KEYS.forms, [defaultForm])
  }
  if (!read(KEYS.seats)) {
    // Seed different seat maps for each hall to make them look distinct
    const halls = read(KEYS.halls, [])
  const seats = []
  halls.forEach((hall, idx) => {
      // Each hall has different number of floors, rooms, and bed configurations
      const floors = idx === 0 ? 3 : idx === 1 ? 4 : idx === 2 ? 2 : idx === 3 ? 3 : 2 // ASH:3, MUH:4, BKH:2, JSH:3, NFH:2
      const roomsPerFloor = idx === 0 ? 4 : idx === 1 ? 5 : idx === 2 ? 3 : idx === 3 ? 4 : 3
      const bedsPerRoom = idx % 2 === 0 ? 2 : 3 // Alternate 2 and 3 beds per room
      
      for (let floor = 1; floor <= floors; floor++) {
        const roomStart = floor * 100 + 1
        for (let room = roomStart; room < roomStart + roomsPerFloor; room++) {
          for (let bed = 1; bed <= bedsPerRoom; bed++) {
            // Vary the status to make halls look different
            const statusOptions = ['Available', 'Available', 'Available', 'Occupied', 'Reserved']
            const status = Math.random() > 0.7 ? statusOptions[3 + idx % 2] : 'Available'
            seats.push({ 
              id: `${hall.id}-${floor}-${room}-${bed}`, 
              hallId: hall.id, 
              floor, 
              room, 
              bed, 
              status, 
              studentId: status === 'Occupied' ? `student-${hall.shortName}-${Math.floor(Math.random()*100)}` : null 
            })
          }
        }
      }
    })

    const salamHallId = halls.find(h => h.shortName === 'ASH')?.id || 'hall-ash'
  const salamSeat = seats.find(seat => seat.hallId === salamHallId && seat.status === 'Available')
    const assignedSeat = salamSeat || seats.find(seat => seat.hallId === salamHallId)
    if (assignedSeat) {
      assignedSeat.status = 'Occupied'
      assignedSeat.studentId = 'student-ash'
    }

    write(KEYS.seats, seats)
  }
  if (!read(KEYS.notifications)) {
    const halls = read(KEYS.halls, [])
    const notifications = []
    halls.forEach((hall, idx) => {
      // Different notifications for each hall
      const notifContent = [
        { title: 'Admission Open', body: 'Hall admission applications are now being accepted for the new session.' },
        { title: 'Seat Allocation Complete', body: 'Room assignments have been posted. Check your dashboard.' },
        { title: 'Maintenance Notice', body: 'Scheduled maintenance on 2nd floor next week.' },
        { title: 'Cultural Program', body: 'Annual cultural program registration is now open.' },
        { title: 'Fee Reminder', body: 'Hall fees for this semester are due by end of month.' }
      ]
      const content = notifContent[idx % notifContent.length]
      notifications.push({ 
        id: `n-${hall.id}`, 
        title: `${hall.shortName}: ${content.title}`, 
        body: content.body, 
        date: Date.now() - (idx * 86400000), // Stagger dates
        hallId: hall.id 
      })
    })
    write(KEYS.notifications, notifications)
  }
  if (!read(KEYS.applications)) {
    // Seed sample applications for different halls
    const halls = read(KEYS.halls, [])
    const users = read(KEYS.users, [])
    const applications = []
    
    // Define proper male/female names for each hall
    const maleHallsData = {
      'hall-ash': [
        { name: 'Rakib Hasan', userId: 'student-ash', studentId: 'ASH2021001M', dept: 'CSE' },
        { name: 'Arif Rahman', userId: 'app-student-ash-2', studentId: 'ASH2022005M', dept: 'EEE' },
        { name: 'Sohel Rana', userId: 'app-student-ash-3', studentId: 'ASH2023008M', dept: 'ICE' }
      ],
      'hall-muh': [
        { name: 'Fahim Ahmed', userId: 'student-muh-2', studentId: 'MUH2021003M', dept: 'CSE' },
        { name: 'Tanvir Islam', userId: 'student-muh-3', studentId: 'MUH2022015M', dept: 'EEE' },
        { name: 'Karim Uddin', userId: 'student-muh-5', studentId: 'MUH2021011M', dept: 'BBA' }
      ]
    }
    
    const femaleHallsData = {
      'hall-bkh': [
        { name: 'Sheuli Akter', userId: 'student-bkh', studentId: 'BKH2021012F', dept: 'BBA' },
        { name: 'Ruma Begum', userId: 'app-student-bkh-2', studentId: 'BKH2022018F', dept: 'English' },
        { name: 'Nasrin Jahan', userId: 'app-student-bkh-3', studentId: 'BKH2023005F', dept: 'Economics' }
      ],
      'hall-jsh': [
        { name: 'Nusrat Jahan', userId: 'student-jsh', studentId: 'JSH2022005F', dept: 'English' },
        { name: 'Sadia Islam', userId: 'app-student-jsh-2', studentId: 'JSH2021010F', dept: 'CSE' },
        { name: 'Rupa Akter', userId: 'app-student-jsh-3', studentId: 'JSH2023012F', dept: 'BBA' }
      ],
      'hall-nfh': [
        { name: 'Taslima Akter', userId: 'student-nfh', studentId: 'NFH2022008F', dept: 'Economics' },
        { name: 'Farhana Khan', userId: 'app-student-nfh-2', studentId: 'NFH2021015F', dept: 'MBA' },
        { name: 'Mousumi Roy', userId: 'app-student-nfh-3', studentId: 'NFH2023020F', dept: 'English' }
      ]
    }
    
    halls.forEach((hall) => {
      const hallData = hall.category === 'Male' ? maleHallsData[hall.id] : femaleHallsData[hall.id]
      if (!hallData) return // Skip if no data for this hall
      
      hallData.forEach((studentData, i) => {
        const statuses = ['Submitted', 'Under Review', 'Approved']
        const status = statuses[i % statuses.length]
        
        applications.push({
          id: `app-${hall.id}-${i}`,
          userId: studentData.userId,
          formId: 'form-1',
          data: {
            fullName: studentData.name,
            studentId: studentData.studentId,
            department: studentData.dept,
            session: '2024-25',
            hall: hall.name
          },
          attachments: {},
          status,
          submittedAt: Date.now() - ((i + 1) * 86400000),
          createdAt: Date.now() - ((i + 1) * 86400000),
          paymentDone: status === 'Approved' && i === 0,
          hallId: hall.id
        })
      })
    })
    
    // Add a demo application for student-muh (Masum Bhuiyan) who is not allocated
    applications.push({
      id: 'app-demo-muh-001',
      userId: 'student-muh',
      formId: 'form-1',
      data: {
        fullName: 'Masum Bhuiyan',
        studentId: 'MUH2225007M',
        department: 'CSE',
        session: '2022-23',
        hall: 'Bir Muktijuddha Abdul Malek Ukil Hall'
      },
      attachments: {},
      status: 'Selected for Interview',
      submittedAt: Date.now() - (5 * 86400000), // 5 days ago
      createdAt: Date.now() - (5 * 86400000),
      paymentDone: false,
      hallId: 'hall-muh'
    })
    
    write(KEYS.applications, applications)
  }
  
  // Seed demo complaints with actions/status (force reseed if empty)
  const existingComplaints = read(KEYS.complaints, [])
  if (existingComplaints.length === 0) {
    const halls = read(KEYS.halls, [])
    const users = read(KEYS.users, [])
    const complaints = []
    
    // Only create complaints for first 2 halls to keep dashboard clean
    halls.slice(0, 2).forEach((hall, idx) => {
      const student = users.find(u => u.role === 'student' && u.hallId === hall.id)
      const hallAdmin = users.find(u => u.role === 'admin' && u.hallId === hall.id)
      const day = 86400000
      const primaryStudentId = student?.id || `student-${hall.shortName}-1`

      if (idx === 0) {
        // First complaint - Resolved
        const resolvedCreatedAt = Date.now() - (7 * day)
        const resolvedWorkingAt = resolvedCreatedAt + (3 * day)
        const resolvedAt = Date.now() - (2 * day)

        complaints.push({
          id: `complaint-${hall.id}-1`,
          userId: primaryStudentId,
          hallId: hall.id,
          title: 'Water Supply Issue',
          body: 'There is no water supply in the 3rd floor bathroom for the last 2 days.',
          attachments: ['maintenance-ticket.pdf'],
          status: 'Resolved',
          reviewNotes: 'Water pump has been fixed. Supply restored.',
          createdAt: resolvedCreatedAt,
          updatedAt: resolvedAt,
          reviewedBy: hallAdmin?.id || null,
          history: [
            { status: 'Pending', timestamp: resolvedCreatedAt, actorId: primaryStudentId, notes: 'Complaint submitted by student.' },
            { status: 'Working', timestamp: resolvedWorkingAt, actorId: hallAdmin?.id || null, notes: 'Maintenance team assigned to investigate.' },
            { status: 'Resolved', timestamp: resolvedAt, actorId: hallAdmin?.id || null, notes: 'Water pump repaired and supply restored.' }
          ]
        })
      } else {
        // Second complaint - Working
        const workingCreatedAt = Date.now() - (1 * day)
        const workingUpdatedAt = workingCreatedAt + (12 * 60 * 60 * 1000)

        complaints.push({
          id: `complaint-${hall.id}-2`,
          userId: primaryStudentId,
          hallId: hall.id,
          title: 'Electricity Problem in Room 305',
          body: 'Power socket not working. Need urgent repair for study purposes.',
          attachments: ['room-305-socket.jpg'],
          status: 'Working',
          reviewNotes: 'Electrician has been notified. Will be fixed within 24 hours.',
          createdAt: workingCreatedAt,
          updatedAt: workingUpdatedAt,
          reviewedBy: hallAdmin?.id || null,
          history: [
            { status: 'Pending', timestamp: workingCreatedAt, actorId: primaryStudentId, notes: 'Complaint submitted by student.' },
            { status: 'Working', timestamp: workingUpdatedAt, actorId: hallAdmin?.id || null, notes: 'Electrician scheduled to visit the room.' }
          ]
        })
      }
    })
    
    write(KEYS.complaints, complaints)
  }
  
  // Seed demo renewals (force reseed if empty)
  const existingRenewals = read(KEYS.renewals, [])
  if (existingRenewals.length === 0) {
    const halls = read(KEYS.halls, [])
    const users = read(KEYS.users, [])
    const renewals = []
    const day = 86400000
    const sampleReasons = [
      'Need additional semester to complete research project and thesis documentation.',
      'Awaiting internship completion certificate that is required for graduation clearance.',
      'Medical treatment schedule overlaps with current semester; require accommodation for recovery period.'
    ]
    const sampleDocs = [
      ['project-extension-letter.pdf'],
      ['internship-offer-letter.jpg', 'department-endorsement.pdf'],
      ['medical-report.pdf']
    ]

    halls.forEach(hall => {
      const students = users.filter(u => u.role === 'student' && u.hallId === hall.id)
      if (students.length === 0) return

      for (let idx = 0; idx < 3; idx += 1) {
        const student = students[idx % students.length]
        const status = idx === 0 ? 'Approved' : idx === 1 ? 'Pending' : 'Rejected'
        const requestedAt = Date.now() - ((idx + 1) * 4 * day)
        const reviewedAt = status === 'Pending' ? null : requestedAt + (2 * day)
        renewals.push({
          id: `renewal-${hall.id}-${idx}`,
          userId: student.id,
          hallId: hall.id,
          status,
          reason: sampleReasons[idx],
          proofDocuments: sampleDocs[idx],
          requestedAt,
          updatedAt: reviewedAt || requestedAt,
          reviewedAt,
          reviewedBy: status === 'Pending' ? null : (users.find(u => u.role === 'admin' && u.hallId === hall.id)?.id || null),
          reviewNotes: status === 'Approved'
            ? 'Reviewed and approved. Student has cleared dues and provided supporting documents.'
            : status === 'Rejected'
              ? 'Rejected due to insufficient documentation. Please resubmit with complete medical report.'
              : ''
        })
      }
    })

    write(KEYS.renewals, renewals)
  }
  
  // Seed demo waitlist entries (force reseed if empty)
  const existingWaitlist = read(KEYS.waitlist, [])
  if (existingWaitlist.length === 0) {
    const halls = read(KEYS.halls, [])
    const waitlist = []
    
    const maleNames = ['Rakib Hasan', 'Masum Bhuiyan', 'Fahim Ahmed']
    const femaleNames = ['Sheuli Akter', 'Nusrat Jahan', 'Taslima Akter']
    
    halls.forEach((hall, hallIdx) => {
      const studentNames = hall.category === 'Female' ? femaleNames : maleNames
      // Add 2-3 waitlist entries per hall
      for (let i = 0; i < 2; i++) {
        waitlist.push({
          id: `waitlist-${hall.id}-${i}`,
          studentName: studentNames[i % 3],
          studentId: `${hall.shortName}202${5+hallIdx}-W00${i+1}`,
          email: `waitlist${i+1}.${hall.shortName.toLowerCase()}@student.nstu.edu.bd`,
          phone: `017${hallIdx}${i}000000`,
          department: ['CSE', 'EEE', 'ICE', 'BBA', 'MBA'][i % 5],
          session: `202${5+hallIdx}-2${6+hallIdx}`,
          position: i + 1,
          hallId: hall.id,
          addedAt: Date.now() - ((i + 1) * 3 * 86400000) // Staggered dates
        })
      }
    })
    
    write(KEYS.waitlist, waitlist)
  }
  
  // Seed room allocations (room-based, no seats - max 5 students per room)
  if (!read(KEYS.seatAllocations)) {
    const roomAllocations = []
    const halls = read(KEYS.halls, [])
    const ash = halls.find(h => h.shortName === 'ASH')
    const muh = halls.find(h => h.shortName === 'MUH')
    const hallId = muh?.id || 'hall-muh'
    
    // Create additional mock students for allocation demo
    const users = read(KEYS.users, [])
    const mockStudents = [
      { id: 'student-muh-2', name: 'Fahim Ahmed', email: 'fahim@student.nstu.edu.bd', role: 'student', hallId, studentId: 'MUH2021003M', password: 'student123' },
      { id: 'student-muh-3', name: 'Tanvir Islam', email: 'tanvir@student.nstu.edu.bd', role: 'student', hallId, studentId: 'MUH2022015M', password: 'student123' },
      { id: 'student-muh-4', name: 'Rahim Khan', email: 'rahim@student.nstu.edu.bd', role: 'student', hallId, studentId: 'MUH2023008M', password: 'student123' },
      { id: 'student-muh-5', name: 'Karim Uddin', email: 'karim@student.nstu.edu.bd', role: 'student', hallId, studentId: 'MUH2021011M', password: 'student123' },
      { id: 'student-muh-6', name: 'Sabbir Hossain', email: 'sabbir@student.nstu.edu.bd', role: 'student', hallId, studentId: 'MUH2022020M', password: 'student123' },
      { id: 'student-muh-7', name: 'Rafiq Molla', email: 'rafiq@student.nstu.edu.bd', role: 'student', hallId, studentId: 'MUH2023012M', password: 'student123' },
      { id: 'student-muh-8', name: 'Shakib Rahman', email: 'shakib@student.nstu.edu.bd', role: 'student', hallId, studentId: 'MUH2021005M', password: 'student123' },
      { id: 'student-muh-9', name: 'Jamil Ahmed', email: 'jamil@student.nstu.edu.bd', role: 'student', hallId, studentId: 'MUH2022018M', password: 'student123' },
      { id: 'student-muh-10', name: 'Habib Chowdhury', email: 'habib@student.nstu.edu.bd', role: 'student', hallId, studentId: 'MUH2023025M', password: 'student123' },
      { id: 'student-muh-11', name: 'Nasir Uddin', email: 'nasir@student.nstu.edu.bd', role: 'student', hallId, studentId: 'MUH2021009M', password: 'student123' },
      { id: 'student-muh-12', name: 'Salman Khan', email: 'salman@student.nstu.edu.bd', role: 'student', hallId, studentId: 'MUH2022022M', password: 'student123' },
      { id: 'student-muh-13', name: 'Imran Hossain', email: 'imran@student.nstu.edu.bd', role: 'student', hallId, studentId: 'MUH2023030M', password: 'student123' }
    ]
    
    mockStudents.forEach(student => {
      if (!users.find(u => u.id === student.id)) {
        users.push(student)
      }
    })
    write(KEYS.users, users)
    
    // Ensure Abdus Salam Hall primary student has an active allocation
    roomAllocations.push({
      id: 'alloc-ash-core',
      userId: 'student-ash',
      hallId: ash?.id || 'hall-ash',
      floor: '2',
      roomNumber: '204',
      session: '2021-22',
      department: 'CSE',
      status: 'Active',
      allocatedAt: Date.now() - (120 * 86400000)
    })

    // Floor 1 - Rooms 101-103
    roomAllocations.push(
      { id: `alloc-101-1`, userId: 'student-muh-2', hallId, floor: '1', roomNumber: '101', session: '2021-22', department: 'CSE', status: 'Active', allocatedAt: Date.now() - (120 * 86400000) },
      { id: `alloc-101-2`, userId: 'student-muh-3', hallId, floor: '1', roomNumber: '101', session: '2021-22', department: 'EEE', status: 'Active', allocatedAt: Date.now() - (115 * 86400000) },
      { id: `alloc-101-3`, userId: 'student-muh-4', hallId, floor: '1', roomNumber: '101', session: '2021-22', department: 'ICE', status: 'Active', allocatedAt: Date.now() - (110 * 86400000) },
      { id: `alloc-101-4`, userId: 'student-muh-5', hallId, floor: '1', roomNumber: '101', session: '2021-22', department: 'CSE', status: 'Active', allocatedAt: Date.now() - (105 * 86400000) },
      { id: `alloc-101-5`, userId: 'student-muh-6', hallId, floor: '1', roomNumber: '101', session: '2021-22', department: 'BBA', status: 'Active', allocatedAt: Date.now() - (100 * 86400000) },
      
      { id: `alloc-102-1`, userId: 'student-muh-7', hallId, floor: '1', roomNumber: '102', session: '2022-23', department: 'EEE', status: 'Active', allocatedAt: Date.now() - (95 * 86400000) },
      { id: `alloc-102-2`, userId: 'student-muh-8', hallId, floor: '1', roomNumber: '102', session: '2022-23', department: 'ICE', status: 'Active', allocatedAt: Date.now() - (90 * 86400000) },
      { id: `alloc-102-3`, userId: 'student-muh-9', hallId, floor: '1', roomNumber: '102', session: '2022-23', department: 'CSE', status: 'Active', allocatedAt: Date.now() - (85 * 86400000) },
      
      { id: `alloc-103-1`, userId: 'student-muh-10', hallId, floor: '1', roomNumber: '103', session: '2023-24', department: 'English', status: 'Active', allocatedAt: Date.now() - (80 * 86400000) },
      { id: `alloc-103-2`, userId: 'student-muh-11', hallId, floor: '1', roomNumber: '103', session: '2023-24', department: 'CSE', status: 'Active', allocatedAt: Date.now() - (75 * 86400000) }
    )
    
    // Floor 2 - Rooms 201, 205
    roomAllocations.push(
      { id: `alloc-201-1`, userId: 'student-muh-12', hallId, floor: '2', roomNumber: '201', session: '2022-23', department: 'BBA', status: 'Active', allocatedAt: Date.now() - (70 * 86400000) },
      { id: `alloc-201-2`, userId: 'student-muh-13', hallId, floor: '2', roomNumber: '201', session: '2023-24', department: 'ICE', status: 'Active', allocatedAt: Date.now() - (65 * 86400000) },
      
      { id: `alloc-205-1`, userId: 'student-muh-2', hallId, floor: '2', roomNumber: '205', session: '2021-22', department: 'CSE', status: 'Active', allocatedAt: Date.now() - (60 * 86400000) }
    )
    
    // Room 106 in Floor 1 - Empty (available for new allocations)
    
    // Room 106 - Empty (available for new allocations - 5 spots available)
    
    write(KEYS.seatAllocations, roomAllocations)
  } else {
    const allocations = read(KEYS.seatAllocations, [])
    const halls = read(KEYS.halls, [])
    const ashId = halls.find(h => h.shortName === 'ASH')?.id || 'hall-ash'
    const existingAllocation = allocations.find(a => a.userId === 'student-ash' && a.status && a.status !== 'Vacant' && a.status !== 'Vacated')

    if (!existingAllocation) {
      allocations.push({
        id: `alloc-ash-${Date.now()}`,
        userId: 'student-ash',
        hallId: ashId,
        floor: '2',
        roomNumber: '204',
        session: '2021-22',
        department: 'CSE',
        status: 'Active',
        allocatedAt: Date.now() - (120 * 86400000)
      })
      write(KEYS.seatAllocations, allocations)
    }
  }
  
  // Seed mock result documents
  if (!read(KEYS.results)) {
    const mockResults = [
      { 
        id: 'res-1', 
        hallId: 'hall-ash', 
        name: 'Final Exam Results - Spring 2025', 
        fileName: 'Final_Exam_Results_Spring_2025.pdf',
        fileType: 'PDF',
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days ago
      },
      { 
        id: 'res-2', 
        hallId: 'hall-muh', 
        name: 'Mid-term Results - Fall 2024', 
        fileName: 'Midterm_Results_Fall_2024.pdf',
        fileType: 'PDF',
        createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000 // 14 days ago
      }
    ]
    write(KEYS.results, mockResults)
  }
  
  // Seed mock seat plan documents
  if (!read(KEYS.seatPlanUploads)) {
    const mockSeatPlans = [
      { 
        id: 'sp-1', 
        hallId: 'hall-ash', 
        name: 'CSE Department Final Exam Seat Plan', 
        fileName: 'CSE_Final_Exam_Seat_Plan.pdf',
        fileType: 'PDF',
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000 // 5 days ago
      },
      { 
        id: 'sp-2', 
        hallId: 'hall-muh', 
        name: 'EEE Department Mid-term Seat Plan', 
        fileName: 'EEE_Midterm_Seat_Plan.pdf',
        fileType: 'PDF',
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000 // 10 days ago
      }
    ]
    write(KEYS.seatPlanUploads, mockSeatPlans)
  }

  // Seed a default student for quick testing
  const usersNow = read(KEYS.users, [])
  if (!usersNow.some(u => u.email === 'student1@student.nstu.edu.bd')) {
    const studentId = 'MUH2025-0001'
    const hallId = HALL_PREFIX_MAP['MUH']
    usersNow.push({ id: `u-${Date.now()}`, name: 'Hasan Mahmud', email: 'student1@student.nstu.edu.bd', role: 'student', password: 'student123', studentId, hallId })
    write(KEYS.users, usersNow)
  }
}

export function resetDemoData() {
  // Clear all application keys to reseed
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
  localStorage.removeItem('uh_pending_registration')
  ensureSeedData()
}

export function getSessionUser() {
  // Return session, enriched with latest user info (hallId, studentId) if missing
  const sess = read(KEYS.session, null)
  if (!sess) return null
  
  // Check if session data is stale (missing fields that user has, or has fields user doesn't)
  const users = read(KEYS.users, [])
  const u = users.find(x => x.id === sess.id || x.email === sess.email)
  if (!u) return sess
  
  // Only refresh if there's a mismatch (e.g., user was edited in code but session is stale)
  const needsRefresh = (
    sess.name !== u.name ||
    sess.role !== u.role ||
    sess.email !== u.email ||
    sess.hallId !== (u.hallId ?? null) ||
    sess.studentId !== (u.studentId ?? null)
  )
  
  if (!needsRefresh) return sess
  
  // Build fresh session from current user data
  const enriched = { 
    id: u.id, 
    name: u.name, 
    role: u.role, 
    email: u.email, 
    hallId: u.hallId ?? null, 
    studentId: u.studentId ?? null 
  }
  write(KEYS.session, enriched)
  return enriched
}
export function logout() {
  localStorage.removeItem(KEYS.session)
}
export async function login(identifier, password) {
  const users = read(KEYS.users, [])
  let u = null
  
  // If identifier looks like an email
  if (identifier.includes('@')) {
    u = users.find(x => x.email === identifier && x.password === password)
  } 
  // If identifier looks like a student ID (3 letters + 7 digits + 1 letter)
  else if (/^[A-Z]{3}\d{7}[A-Z]$/i.test(identifier)) {
    u = users.find(x => x.studentId && x.studentId.toUpperCase() === identifier.toUpperCase() && x.password === password)
  }
  
  if (!u) throw new Error('Invalid credentials')
  
  // Validate email domain based on role
  if (u.role === 'student' && !u.email.endsWith('@student.nstu.edu.bd')) {
    throw new Error('Student email must be @student.nstu.edu.bd')
  }
  if (u.role !== 'student' && u.email.endsWith('@student.nstu.edu.bd')) {
    throw new Error('Non-student email cannot use @student.nstu.edu.bd domain')
  }
  
  // Persist hallId and studentId to enable hall-scoped UI (e.g., backgrounds)
  write(KEYS.session, { id: u.id, name: u.name, role: u.role, email: u.email, hallId: u.hallId ?? null, studentId: u.studentId })
  return getSessionUser()
}
export async function register({ name, email, password }) {
  const users = read(KEYS.users, [])
  if (users.some(u => u.email === email)) throw new Error('Email already exists')
  // Only students can self-register, and they must use student email domain
  if (!/^[^@]+@student\.nstu\.edu\.bd$/i.test(email)) {
    throw new Error('Only students can register with @student.nstu.edu.bd emails')
  }
  // Expect studentId and derive hall from its prefix
  const pending = pendingRegistration()
  const studentId = pending?.studentId
  if (!studentId) throw new Error('Student ID is required')
  const hallId = deriveHallFromStudentId(studentId)
  if (!hallId) throw new Error('Invalid Student ID prefix. Cannot determine hall.')
  const newUser = { id: `u-${Date.now()}`, name, email, role: 'student', password, studentId, hallId }
  users.push(newUser)
  write(KEYS.users, users)
  write(KEYS.session, { id: newUser.id, name: newUser.name, role: newUser.role, email: newUser.email, hallId: newUser.hallId })
  return getSessionUser()
}

// User queries
export function getUserById(userId) {
  const users = read(KEYS.users, [])
  return users.find(u => u.id === userId) || null
}

// Forms
export function getFormById(formId) {
  const forms = read(KEYS.forms, [])
  return forms.find(f => f.id === formId) || null
}

export function getActiveFormForHall(hallId) {
  const forms = read(KEYS.forms, [])
  // Prefer hall-specific active form, else a global active form
  return forms.find(f => f.active && f.hallId === hallId) || forms.find(f => f.active && (f.hallId == null)) || null
}
export function listForms(filter = {}) {
  let forms = read(KEYS.forms, [])
  if (filter.hallId !== undefined) forms = forms.filter(f => f.hallId === filter.hallId)
  return forms
}
export function saveForm(form) {
  const forms = read(KEYS.forms, [])
  const idx = forms.findIndex(f => f.id === form.id)
  if (idx >= 0) forms[idx] = form; else forms.push(form)
  write(KEYS.forms, forms)
  return form
}
export function createForm(payload) {
  const form = { id: `form-${Date.now()}`, active: false, hallId: payload.hallId ?? null, createdAt: Date.now(), ...payload }
  const forms = read(KEYS.forms, [])
  forms.push(form)
  write(KEYS.forms, forms)
  return form
}
export function setActiveForm(id, hallId) {
  const forms = read(KEYS.forms, [])
  // Deactivate all forms for this hall (including global null if hallId is null)
  forms.forEach(f => { if (f.hallId === hallId) f.active = false })
  const form = forms.find(f => f.id === id)
  if (form) { form.active = true; form.hallId = hallId }
  write(KEYS.forms, forms)
}

// Applications
export function submitApplication({ userId, formId, data, attachments }) {
  const apps = read(KEYS.applications, [])
  const users = read(KEYS.users, [])
  const user = users.find(u => u.id === userId)
  
  // Get hallId from user or derive from studentId
  let hallId = user?.hallId
  if (!hallId && user?.studentId) {
    hallId = deriveHallFromStudentId(user.studentId)
  }
  
  const app = { 
    id: `app-${Date.now()}`, 
    userId, 
    formId, 
    data, 
    attachments: attachments || {}, 
    status: 'Submitted', 
    createdAt: Date.now(), 
    paymentDone: false, 
    hallId 
  }
  apps.push(app)
  write(KEYS.applications, apps)
  return app
}

// Alias for compatibility
export const createApplication = submitApplication
export function listApplications(filter = {}) {
  let apps = read(KEYS.applications, [])
  if (filter.userId) apps = apps.filter(a => a.userId === filter.userId)
  if (filter.hallId) apps = apps.filter(a => a.hallId === filter.hallId)
  if (filter.formId) apps = apps.filter(a => a.formId === filter.formId)
  return apps
}
export function updateApplicationStatus(id, status) {
  const apps = read(KEYS.applications, [])
  const a = apps.find(x => x.id === id)
  if (a) a.status = status
  write(KEYS.applications, apps)
  return a
}
export function markPayment(id, paid) {
  const apps = read(KEYS.applications, [])
  const a = apps.find(x => x.id === id)
  if (a) a.paymentDone = paid
  write(KEYS.applications, apps)
  return a
}

// Seats
export function listSeats(filter = {}) {
  let seats = read(KEYS.seats, [])
  if (filter.hallId) seats = seats.filter(s => s.hallId === filter.hallId)
  return seats
}
export function updateSeat(id, patch) {
  const seats = read(KEYS.seats, [])
  const s = seats.find(x => x.id === id)
  if (s) Object.assign(s, patch)
  write(KEYS.seats, seats)
  return s
}
export function assignSeatToStudent(seatId, studentId) {
  return updateSeat(seatId, { status: 'Occupied', studentId })
}

// Waitlist: derived from apps not paid after approved
export function listWaitlist(filter = {}) {
  let apps = read(KEYS.applications, [])
  apps = apps.filter(a => a.status === 'Approved' && !a.paymentDone)
  if (filter.hallId) apps = apps.filter(a => a.hallId === filter.hallId)
  return apps
}

// Renewals
export function requestRenewal({ userId, reason, proofDocuments }) {
  const renewals = read(KEYS.renewals, [])
  const users = read(KEYS.users, [])
  const user = users.find(u => u.id === userId)
  if (!user || user.role !== 'student') throw new Error('Only students can request renewals')

  const now = Date.now()
  const entry = {
    id: `r-${now}`,
    userId,
    hallId: user.hallId || null,
    status: 'Pending',
    reason: reason?.trim() || 'No reason provided.',
    proofDocuments: Array.isArray(proofDocuments) ? proofDocuments : [],
    requestedAt: now,
    updatedAt: now,
    reviewedAt: null,
    reviewedBy: null,
    reviewNotes: ''
  }
  renewals.push(entry)
  write(KEYS.renewals, renewals)
  return entry
}
export function listRenewals(filter = {}) {
  let renewals = read(KEYS.renewals, [])
  let changed = false
  const statusAliases = {
    Requested: 'Pending'
  }

  renewals = renewals.map(item => {
    const next = { ...item }
    if (statusAliases[next.status]) { next.status = statusAliases[next.status]; changed = true }
    if (!next.status) { next.status = 'Pending'; changed = true }
    if (!next.reason) { next.reason = 'No reason provided.'; changed = true }
    if (!Array.isArray(next.proofDocuments)) { next.proofDocuments = []; changed = true }
    if (!next.requestedAt) { next.requestedAt = next.createdAt || Date.now(); changed = true }
    if (!next.updatedAt) { next.updatedAt = next.reviewedAt || next.requestedAt; changed = true }
    if (next.hallId === undefined) { next.hallId = null; changed = true }
    if (next.reviewNotes === undefined) { next.reviewNotes = ''; changed = true }
    return next
  })

  if (changed) {
    write(KEYS.renewals, renewals)
  }

  if (filter.userId) renewals = renewals.filter(r => r.userId === filter.userId)
  if (filter.hallId) renewals = renewals.filter(r => r.hallId === filter.hallId)

  return renewals
}
export function updateRenewal(id, status, reviewerId, reviewNotes) {
  const renewals = read(KEYS.renewals, [])
  const entry = renewals.find(x => x.id === id)
  if (entry) {
    entry.status = status
    entry.reviewedBy = reviewerId || entry.reviewedBy || null
    entry.reviewNotes = reviewNotes !== undefined ? reviewNotes : entry.reviewNotes
    entry.reviewedAt = Date.now()
    entry.updatedAt = entry.reviewedAt
  }
  write(KEYS.renewals, renewals)
  return entry
}

// Notifications
export function listNotifications(filter = {}) {
  const stored = read(KEYS.notifications, [])
  let changed = false

  const normalized = stored.map(item => {
    const next = { ...item }
    if (next.createdAt === undefined) { next.createdAt = next.date || Date.now(); changed = true }
    if (next.body === undefined && next.message !== undefined) { next.body = next.message; changed = true }
    if (next.read === undefined) { next.read = false; changed = true }
    return next
  })

  if (changed) {
    write(KEYS.notifications, normalized)
  }

  let list = normalized

  const includeGlobal = filter.includeGlobal !== undefined ? filter.includeGlobal : true
  if (filter.hallId) {
    list = list.filter(n => n.hallId === filter.hallId || (includeGlobal && (n.hallId === null || n.hallId === undefined)))
  } else if (!includeGlobal) {
    list = list.filter(n => n.hallId)
  }

  if (filter.userId) {
    list = list.filter(n => n.userId === filter.userId)
  }

  list = list.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  if (filter.limit) {
    list = list.slice(0, filter.limit)
  }

  return list
}
export function createNotification(title, body, hallId) {
  const list = read(KEYS.notifications, [])
  const now = Date.now()
  const n = { id: `n-${now}`, title, body, hallId: hallId || null, createdAt: now, read: false }
  list.push(n)
  write(KEYS.notifications, list)
  return n
}
export function markNotificationRead(id) {
  const list = read(KEYS.notifications, [])
  const entry = list.find(n => n.id === id)
  if (entry) {
    entry.read = true
    entry.updatedAt = Date.now()
  }
  write(KEYS.notifications, list)
  return entry
}

// Complaints (hall-specific, only students can file)
export function createComplaint({ userId, title, body, attachments }) {
  const users = read(KEYS.users, [])
  const user = users.find(u => u.id === userId)
  if (!user || user.role !== 'student') throw new Error('Only students can file complaints')
  // Determine authoritative hallId: prefer user.hallId, then student profile, then any active seat allocation
  let hallId = user.hallId || null
  if (!hallId) {
    const profiles = read(KEYS.studentProfiles, [])
    const profile = profiles.find(p => p.userId === userId)
    if (profile && profile.hallId) hallId = profile.hallId
  }
  if (!hallId) {
    const allocations = read(KEYS.seatAllocations, [])
    const alloc = allocations.find(a => a.userId === userId && a.status && a.status !== 'Vacant' && a.status !== 'Vacated')
    if (alloc && alloc.hallId) hallId = alloc.hallId
  }

  if (!hallId) {
    throw new Error('You are not assigned to any hall. Complaints can only be filed by students with an active allocation.')
  }

  const list = read(KEYS.complaints, [])
  const now = Date.now()
  const c = {
    id: `c-${Date.now()}`,
    userId,
    hallId, // Complaint tied to student's hall
    title,
    body,
    attachments: attachments || [], // Array of file names/URLs
    status: 'Pending',
    createdAt: now,
    updatedAt: now,
    reviewedBy: null,
    reviewNotes: '',
    history: [
      { status: 'Pending', timestamp: now, actorId: userId, notes: 'Complaint submitted by student.' }
    ]
  }
  list.push(c)
  write(KEYS.complaints, list)
  return c
}

export function listComplaints(filter = {}) {
  const statusMap = {
    Open: 'Pending',
    'In Progress': 'Working',
    Closed: 'Resolved'
  }

  let list = read(KEYS.complaints, [])
  let changed = false

  list = list.map(item => {
    const next = { ...item }

    if (statusMap[next.status]) {
      next.status = statusMap[next.status]
      changed = true
    }

    if (!next.title && next.subject) {
      next.title = next.subject
      changed = true
    }

    if (!next.body && next.description) {
      next.body = next.description
      changed = true
    }

    if ((next.reviewNotes === undefined || next.reviewNotes === null) && next.response) {
      next.reviewNotes = next.response
      changed = true
    }

    if (!Array.isArray(next.attachments)) {
      next.attachments = []
      changed = true
    }

    if (!Array.isArray(next.history)) {
      next.history = []
      changed = true
    }

    if (!next.createdAt) {
      next.createdAt = Date.now()
      changed = true
    }

    if (!next.updatedAt) {
      next.updatedAt = next.resolvedAt || next.createdAt
      changed = true
    }

    return next
  })

  if (changed) {
    write(KEYS.complaints, list)
  }

  if (filter.userId) list = list.filter(c => c.userId === filter.userId)
  if (filter.hallId) list = list.filter(c => c.hallId === filter.hallId)
  return list
}

export function updateComplaintStatus(id, status, reviewedBy, reviewNotes) {
  const list = read(KEYS.complaints, [])
  const c = list.find(x => x.id === id)
  if (c) {
    const now = Date.now()
    c.status = status
    if (reviewedBy !== undefined) c.reviewedBy = reviewedBy
    if (reviewNotes !== undefined) c.reviewNotes = reviewNotes
    c.updatedAt = now

    if (!Array.isArray(c.history)) c.history = []
    c.history.push({ status, timestamp: now, actorId: reviewedBy || null, notes: reviewNotes || '' })
  }
  write(KEYS.complaints, list)
  return c
}

// Halls
export function listHalls() { return read(KEYS.halls, []) }
export function getHallById(id) { return read(KEYS.halls, []).find(h => h.id === id) }
export function updateUserHall(userId, hallId) {
  const users = read(KEYS.users, [])
  const u = users.find(x => x.id === userId)
  if (u) u.hallId = hallId
  write(KEYS.users, users)
  const sess = getSessionUser()
  if (sess?.id === userId) write(KEYS.session, { ...sess, hallId })
  return u
}

// Results upload (by exam controller)
export function createResultUpload({ hallId, name, fileName, fileType = 'PDF' }) {
  const list = read(KEYS.results, [])
  const item = { id: `res-${Date.now()}`, hallId, name, fileName, fileType, createdAt: Date.now() }
  list.push(item)
  write(KEYS.results, list)
  return item
}
export function listResults(filter = {}) {
  let list = read(KEYS.results, [])
  if (filter.hallId) list = list.filter(i => i.hallId === filter.hallId)
  return list
}

// Seat plan upload (by exam controller)
export function createSeatPlanUpload({ hallId, name, fileName, fileType = 'PDF' }) {
  const list = read(KEYS.seatPlanUploads, [])
  const item = { id: `sp-${Date.now()}`, hallId, name, fileName, fileType, createdAt: Date.now() }
  list.push(item)
  write(KEYS.seatPlanUploads, list)
  return item
}
export function listSeatPlanUploads(filter = {}) {
  let list = read(KEYS.seatPlanUploads, [])
  if (filter.hallId) list = list.filter(i => i.hallId === filter.hallId)
  return list
}

// Registration handoff (simple temp storage to pass studentId from UI to register call)
const PENDING_REG_KEY = 'uh_pending_registration'
export function setPendingRegistration(data) { write(PENDING_REG_KEY, data) }
export function pendingRegistration() { return read(PENDING_REG_KEY, {}) }
export function clearPendingRegistration() { localStorage.removeItem(PENDING_REG_KEY) }

// Map student ID prefixes to halls
const HALL_PREFIX_MAP = {
  MUH: 'hall-muh', // Bir Muktijuddha Abdul Malek Ukil Hall
  ASH: 'hall-ash', // Basha Shaheed Abdus Salam Hall
  BKH: 'hall-bkh', // Hazrat Bibi Khadiza Hall
  JSH: 'hall-jsh', // July Shaheed Smriti Chhatri Hall
  NFH: 'hall-nfh'  // Nabab Foyzunnessa Choudhurani Hall
}
export function deriveHallFromStudentId(studentId) {
  if (!studentId) return null
  const prefix = String(studentId).trim().slice(0,3).toUpperCase()
  return HALL_PREFIX_MAP[prefix] || null
}

// Helper: Get effective hallId for a user (allocated hall or inferred from studentId)
export function getEffectiveHallId(user) {
  if (!user) return null
  // If already allocated to a hall, use that
  if (user.hallId) return user.hallId
  // Otherwise infer from studentId for unallocated students
  if (user.studentId) return deriveHallFromStudentId(user.studentId)
  return null
}

// ============================================
// INTERVIEW MANAGEMENT
// ============================================

// Calculate total score for an application
export function calculateApplicationScore(application) {
  const form = getFormById(application.formId)
  if (!form || !form.fields) return 0
  
  let totalScore = 0
  form.fields.forEach(field => {
    if (field.score && application.data[field.id]) {
      totalScore += field.score
    }
  })
  return totalScore
}

// Select applications for interview
export function selectForInterview({ applicationIds, interviewDate, interviewTime, venue, hallId }) {
  const interviews = read(KEYS.interviews, [])
  const notifications = read(KEYS.notifications, [])
  const applications = read(KEYS.applications, [])
  
  applicationIds.forEach(appId => {
    const app = applications.find(a => a.id === appId)
    if (!app) return
    
    // Create interview entry
    const interview = {
      id: `interview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      applicationId: appId,
      userId: app.userId,
      hallId: hallId,
      interviewDate,
      interviewTime,
      venue,
      status: 'Scheduled', // Scheduled, Completed, Cancelled
      result: null, // Selected, NotSelected
      remarks: '',
      createdAt: new Date().toISOString()
    }
    interviews.push(interview)
    
    // Update application status
    const appIndex = applications.findIndex(a => a.id === appId)
    if (appIndex !== -1) {
      applications[appIndex].status = 'Interview Scheduled'
      applications[appIndex].interviewScheduled = true
    }
    
    // Create notification for student
    const notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: app.userId,
      hallId: hallId,
      type: 'interview',
      title: 'Interview Scheduled',
      message: `Your interview has been scheduled for ${interviewDate} at ${interviewTime}. Venue: ${venue}`,
      read: false,
      createdAt: new Date().toISOString()
    }
    notifications.push(notification)
  })
  
  write(KEYS.interviews, interviews)
  write(KEYS.applications, applications)
  write(KEYS.notifications, notifications)
  
  return interviews
}

// Get interviews
export function listInterviews({ hallId, userId, status }) {
  let interviews = read(KEYS.interviews, [])
  
  if (hallId) interviews = interviews.filter(i => i.hallId === hallId)
  if (userId) interviews = interviews.filter(i => i.userId === userId)
  if (status) interviews = interviews.filter(i => i.status === status)
  
  return interviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// Update interview
export function updateInterview(interviewId, updates) {
  const interviews = read(KEYS.interviews, [])
  const index = interviews.findIndex(i => i.id === interviewId)
  
  if (index !== -1) {
    interviews[index] = { ...interviews[index], ...updates }
    write(KEYS.interviews, interviews)
    
    // If interview result is updated, update application status
    if (updates.result) {
      const applications = read(KEYS.applications, [])
      const appIndex = applications.findIndex(a => a.id === interviews[index].applicationId)
      if (appIndex !== -1) {
        if (updates.result === 'Selected') {
          applications[appIndex].status = 'Interview Passed'
        } else if (updates.result === 'NotSelected') {
          applications[appIndex].status = 'Interview Failed'
        }
        write(KEYS.applications, applications)
      }
    }
    
    return interviews[index]
  }
  
  throw new Error('Interview not found')
}

// ============================================
// SEAT ALLOCATION
// ============================================

function toTitleCase(phrase) {
  return phrase
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function inferStudentNameFromId(userId, hall) {
  if (!userId) {
    return hall?.shortName ? `${hall.shortName} Student` : 'New Student'
  }
  const stripped = String(userId)
    .replace(/student|admin|staff|exam|user/gi, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  if (!stripped) {
    return hall?.shortName ? `${hall.shortName} Student` : 'New Student'
  }
  return toTitleCase(stripped)
}

function buildStudentEmail(userId, hallShortName, existingUsers) {
  const base = String(userId || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const prefix = base || `${(hallShortName || 'student').toLowerCase()}${Date.now()}`
  let candidate = `${prefix}@student.nstu.edu.bd`
  let counter = 1
  while (existingUsers.some(u => u.email === candidate)) {
    candidate = `${prefix}${counter}@student.nstu.edu.bd`
    counter += 1
  }
  return candidate
}

function generateStudentIdForHall(hall) {
  const prefix = hall?.shortName || 'STD'
  const now = new Date()
  const yearFragment = now.getFullYear().toString().slice(-2)
  const unique = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}${yearFragment}${unique}`
}

function ensureStudentProfile(userId, hallId, studentId, department, session) {
  const profiles = read(KEYS.studentProfiles, [])
  const normalized = Array.isArray(profiles) ? profiles : []
  if (!normalized.some(p => p.userId === userId)) {
    normalized.push({
      userId,
      hallId,
      universityId: studentId,
      department: department || null,
      session: session || null,
      additionalInfo: 'Profile auto-created during room allocation',
      createdAt: new Date().toISOString()
    })
    write(KEYS.studentProfiles, normalized)
  }
}

// Allocate room to student (room-based, no seat number - max 5 per room)
export function allocateSeat({ userId, hallId, floor, roomNumber, session, department }) {
  const allocations = read(KEYS.seatAllocations, [])
  const users = read(KEYS.users, [])
  const notifications = read(KEYS.notifications, [])
  const applications = read(KEYS.applications, [])
  const halls = read(KEYS.halls, [])
  
  // Validate user exists and create if missing
  const hall = halls.find(h => h.id === hallId)
  let user = users.find(u => u.id === userId)

  if (!user) {
    const name = inferStudentNameFromId(userId, hall)
    const email = buildStudentEmail(userId, hall?.shortName, users)
    const generatedStudentId = generateStudentIdForHall(hall)
    const nowIso = new Date().toISOString()
    user = {
      id: userId,
      name,
      email,
      role: 'student',
      hallId,
      studentId: generatedStudentId,
      password: 'student123',
      department: department || null,
      session: session || null,
      seatAllocated: false,
      createdAt: nowIso
    }
    users.push(user)
    write(KEYS.users, users)
    ensureStudentProfile(userId, hallId, generatedStudentId, department, session)
  }
  
  if (hall && user.studentId) {
    const hallPrefix = hall.shortName // e.g., "MUH", "ASH"
    const studentIdPrefix = user.studentId.substring(0, 3) // Extract first 3 letters
    
    if (hallPrefix !== studentIdPrefix) {
      throw new Error(`Only students with ${hallPrefix} prefix can be allocated to ${hall.shortName}`)
    }
  }
  
  // Check room capacity (max 5 students per room)
  const roomOccupancy = allocations.filter(a => 
    a.hallId === hallId && 
    a.roomNumber === roomNumber && 
    a.status === 'Active'
  ).length
  
  if (roomOccupancy >= 5) {
    throw new Error('Room is full (maximum 5 students per room)')
  }
  
  // Check if user already has an active allocation
  const userAllocation = allocations.find(a => a.userId === userId && a.status === 'Active')
  if (userAllocation) {
    throw new Error('User already has a room allocated')
  }
  
  const allocation = {
    id: `alloc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    hallId,
    floor,
    roomNumber,
    session,
    department,
    status: 'Active', // Active, Vacated
    allocatedAt: new Date().toISOString(),
    vacatedAt: null
  }
  
  allocations.push(allocation)
  write(KEYS.seatAllocations, allocations)
  
  // Update user hallId if student
  const userIndex = users.findIndex(u => u.id === userId)
  if (userIndex !== -1 && users[userIndex].role === 'student') {
    users[userIndex].hallId = hallId
    users[userIndex].roomNumber = roomNumber
    users[userIndex].floor = floor
    users[userIndex].department = department || users[userIndex].department || null
    users[userIndex].session = session || users[userIndex].session || null
    users[userIndex].seatAllocated = true
    write(KEYS.users, users)
  }
  
  // Update application status
  const appIndex = applications.findIndex(a => a.userId === userId && a.hallId === hallId)
  if (appIndex !== -1) {
    applications[appIndex].status = 'Admitted'
    applications[appIndex].seatAllocated = true
    write(KEYS.applications, applications)
  }
  
  // Create notification
  const notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    hallId,
    type: 'room_allocation',
    title: 'Room Allocated',
    message: `You have been allocated Room ${roomNumber} on Floor ${floor}`,
    read: false,
    createdAt: new Date().toISOString()
  }
  notifications.push(notification)
  write(KEYS.notifications, notifications)
  
  return allocation
}

// List seat allocations
export function listSeatAllocations({ hallId, session, department, status, userId }) {
  let allocations = read(KEYS.seatAllocations, [])
  
  if (hallId) allocations = allocations.filter(a => a.hallId === hallId)
  if (session) allocations = allocations.filter(a => a.session === session)
  if (department) allocations = allocations.filter(a => a.department === department)
  if (status) allocations = allocations.filter(a => a.status === status)
  if (userId) allocations = allocations.filter(a => a.userId === userId)
  
  return allocations.sort((a, b) => {
    // Sort by floor first, then room number
    if (a.floor !== b.floor) {
      return parseInt(a.floor) - parseInt(b.floor)
    }
    return parseInt(a.roomNumber) - parseInt(b.roomNumber)
  })
}

// Vacate seat
export function vacateSeat(allocationId, reason = 'Removed by administrator') {
  const allocations = read(KEYS.seatAllocations, [])
  const users = read(KEYS.users, [])
  const notifications = read(KEYS.notifications, [])
  const applications = read(KEYS.applications, [])
  
  const index = allocations.findIndex(a => a.id === allocationId)
  if (index === -1) {
    throw new Error('Seat allocation not found')
  }
  
  const allocation = allocations[index]
  
  // Update allocation status
  allocations[index] = {
    ...allocation,
    status: 'Vacated',
    vacatedAt: new Date().toISOString(),
    removalReason: reason
  }
  write(KEYS.seatAllocations, allocations)
  
  // Update user
  const userIndex = users.findIndex(u => u.id === allocation.userId)
  if (userIndex !== -1) {
    users[userIndex].seatAllocated = false
    users[userIndex].roomNumber = null
    users[userIndex].floor = null
    users[userIndex].hallId = null
    write(KEYS.users, users)
  }

  // Update related application (if any) to reflect vacancy
  const appIndex = applications.findIndex(a => a.userId === allocation.userId && a.hallId === allocation.hallId)
  if (appIndex !== -1) {
    applications[appIndex].seatAllocated = false
    applications[appIndex].status = 'Seat Vacated'
    write(KEYS.applications, applications)
  }
  
  // Create notification
  const notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: allocation.userId,
    hallId: allocation.hallId,
    type: 'seat_vacated',
    title: 'Seat Vacated',
    message: `Your allocation for Room ${allocation.roomNumber} has been vacated`,
    read: false,
    createdAt: new Date().toISOString()
  }
  notifications.push(notification)
  write(KEYS.notifications, notifications)
  
  return allocations[index]
}

// ============================================
// DISCIPLINARY RECORDS
// ============================================

// Add disciplinary record
export function addDisciplinaryRecord({ userId, hallId, offenseType, description, actionTaken, severity, recordedBy }) {
  const records = read(KEYS.disciplinaryRecords, [])
  const notifications = read(KEYS.notifications, [])
  
  const record = {
    id: `disc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    hallId,
    offenseType,
    description,
    actionTaken,
    severity, // Minor, Major, Severe
    recordedBy,
    recordedAt: new Date().toISOString()
  }
  
  records.push(record)
  write(KEYS.disciplinaryRecords, records)
  
  // Create notification
  const notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    hallId,
    type: 'disciplinary',
    title: 'Disciplinary Record Added',
    message: `A disciplinary record has been added to your profile. Offense: ${offenseType}`,
    read: false,
    createdAt: new Date().toISOString()
  }
  notifications.push(notification)
  write(KEYS.notifications, notifications)
  
  return record
}

// List disciplinary records
export function listDisciplinaryRecords({ hallId, userId, severity }) {
  let records = read(KEYS.disciplinaryRecords, [])
  
  if (hallId) records = records.filter(r => r.hallId === hallId)
  if (userId) records = records.filter(r => r.userId === userId)
  if (severity) records = records.filter(r => r.severity === severity)
  
  return records.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
}

// Update disciplinary record
export function updateDisciplinaryRecord(recordId, updates) {
  const records = read(KEYS.disciplinaryRecords, [])
  const index = records.findIndex(r => r.id === recordId)
  
  if (index !== -1) {
    records[index] = { ...records[index], ...updates }
    write(KEYS.disciplinaryRecords, records)
    return records[index]
  }
  
  throw new Error('Record not found')
}

// Delete disciplinary record
export function deleteDisciplinaryRecord(recordId) {
  const records = read(KEYS.disciplinaryRecords, [])
  const filtered = records.filter(r => r.id !== recordId)
  write(KEYS.disciplinaryRecords, filtered)
  return true
}

// ============================================
// PUBLISH INTERVIEW LIST
// ============================================

export function publishInterviewList({ hallId, selectedApplicationIds, interviewDate, interviewTime, venue }) {
  return selectForInterview({
    applicationIds: selectedApplicationIds,
    interviewDate,
    interviewTime,
    venue,
    hallId
  })
  return HALL_PREFIX_MAP[prefix] || null
}

// ============================================
// PROFILE LOOKUPS
// ============================================

export function getStudentProfile(userId) {
  const profiles = read(KEYS.studentProfiles, [])
  return profiles.find(profile => profile.userId === userId) || null
}

export function getAdminProfile(userId) {
  const profiles = read(KEYS.adminProfiles, [])
  return profiles.find(profile => profile.userId === userId) || null
}

export function getStaffProfile(userId) {
  const profiles = read(KEYS.staffProfiles, [])
  return profiles.find(profile => profile.userId === userId) || null
}

export function getExamControllerProfile(userId) {
  const profiles = read(KEYS.examProfiles, [])
  return profiles.find(profile => profile.userId === userId) || null
}

export function getProfileForUser(user) {
  if (!user || !user.role) return null
  switch (user.role) {
    case 'student':
      return getStudentProfile(user.id)
    case 'admin':
      return getAdminProfile(user.id)
    case 'staff':
      return getStaffProfile(user.id)
    case 'examcontroller':
      return getExamControllerProfile(user.id)
    default:
      return null
  }
}
