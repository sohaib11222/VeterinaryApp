import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      common: {
        cancel: 'Cancel',
        save: 'Save',
        saveChanges: 'Save Changes',
        remove: 'Remove',
        delete: 'Delete',
        close: 'Close',
        retry: 'Retry',
        all: 'All',
        select: 'Select',
        validation: 'Validation',
        success: 'Success',
        error: 'Error',
        logout: 'Logout',
        language: 'Language',
        view: 'View',
        edit: 'Edit',
        chat: 'Chat',
        veterinarian: 'Veterinarian',
        petOwner: 'Pet Owner',
        pet: 'Pet',
        yesterday: 'Yesterday',
        na: 'N/A',
        done: 'Done',
        back: 'Back',
        send: 'Send',
        file: 'File',
      },
      vetClinicHours: {
        loading: 'Loading clinic hours...',
        addSlot: 'Add slot',
        noSlots: 'No slots. Add slots to set availability.',
        unavailable: 'Unavailable',
        toasts: {
          slotAdded: 'Time slot added',
          slotDeleted: 'Time slot deleted',
          durationUpdated: 'Appointment duration updated',
        },
        duration: {
          title: 'Appointment duration (minutes)',
          minutes: '{{count}} min',
          current: 'Current: {{count}} minutes per appointment',
          updating: 'Updating...',
          update: 'Update Duration',
        },
        modal: {
          title: 'Add time slot',
          startLabel: 'Start time (e.g. 09:00)',
          endLabel: 'End time (e.g. 17:00)',
          startPlaceholder: '09:00',
          endPlaceholder: '17:00',
          saving: 'Saving...',
          save: 'Save slot',
        },
      },
      vetPetRequests: {
        summaryTitle: 'Pending Pet Requests',
        loading: 'Loading requests...',
        empty: 'No pending appointment requests',
        defaultReason: 'Consultation',
        badges: {
          new: 'New',
        },
        labels: {
          owner: 'Owner',
        },
        booking: {
          videoCall: 'Video Call',
          clinicVisit: 'Clinic Visit',
        },
        actions: {
          processing: 'Processing...',
          accept: 'Accept',
          reject: 'Reject',
        },
        toasts: {
          accepted: 'Appointment accepted successfully!',
          rejected: 'Appointment rejected successfully!',
        },
        rejectModal: {
          title: 'Reject Appointment',
          reasonLabel: 'Reason for Rejection (Optional)',
          reasonPlaceholder: 'Enter reason...',
          rejecting: 'Rejecting...',
          rejectAppointment: 'Reject Appointment',
        },
      },
      vetInvoices: {
        searchPlaceholder: 'Search by invoice #, pet or owner...',
        filters: {
          all: 'All',
        },
        labels: {
          consultation: 'Consultation',
          pet: 'Pet',
          owner: 'Owner',
        },
        empty: 'No invoices match',
        errors: {
          loadFailed: 'Failed to load invoices',
        },
      },
      vetInvoiceView: {
        notFound: 'Invoice not found',
        labels: {
          invoiceTransaction: 'Invoice / Transaction',
          amount: 'Amount',
          status: 'Status',
          date: 'Date',
          appointment: 'Appointment',
          pet: 'Pet',
          owner: 'Owner',
        },
      },
      vetPaymentSettings: {
        status: {
          approved: 'Approved',
          pending: 'Pending',
          rejected: 'Rejected',
        },
        paymentMethods: {
          stripe: 'Stripe',
          bankTransfer: 'Bank Transfer',
          paypal: 'PayPal',
        },
        actions: {
          configure: 'Configure',
          requestWithdrawal: 'Request Withdrawal',
        },
        preferredPayoutMethod: {
          title: 'Preferred payout method',
          subtitle: 'Your earnings will be paid out using the method you provide when requesting a withdrawal.',
        },
        availableBalance: 'Available Balance',
        withdrawalRequests: {
          title: 'Withdrawal Requests',
          empty: 'No withdrawal requests found',
          paymentMethod: 'Payment Method',
          amount: 'Amount',
          youReceive: 'You receive',
          fee: 'Fee',
          noFee: 'No fee',
          totalDeducted: 'Total Deducted',
        },
        withdrawModal: {
          title: 'Request Withdrawal',
          availableBalance: 'Available Balance',
          amountToWithdraw: 'Amount to Withdraw',
          amountPlaceholder: 'Enter amount',
          paymentMethod: 'Payment Method',
          payoutDetails: 'Payout Details',
          payoutDetailsHint: 'IBAN / account no / PayPal email / Stripe email',
          payoutDetailsPlaceholder: 'Enter IBAN, account number, or email',
          submitting: 'Submitting…',
          submitRequest: 'Submit Request',
        },
      },
      vetRescheduleRequests: {
        loading: 'Loading requests...',
        empty: 'No pending reschedule requests.',
        errors: {
          loadFailed: 'Failed to load requests',
          approveFailed: 'Failed to approve request',
          rejectFailed: 'Failed to reject request',
        },
        actions: {
          approve: 'Approve',
          reject: 'Reject',
        },
        toasts: {
          selectDateTime: 'Please select new date and time',
          approved: 'Reschedule request approved',
          rejected: 'Reschedule request rejected',
          reasonMinChars: 'Rejection reason must be at least {{count}} characters',
        },
        card: {
          requestFrom: 'Request from {{name}}',
          original: 'Original: {{value}}',
          preferredDate: 'Preferred date: {{value}}',
          preferredTime: 'Preferred time: {{value}}',
        },
        approveModal: {
          title: 'Approve Reschedule Request',
          newDate: 'New Date *',
          selectDate: 'Select date',
          newTime: 'New Time *',
          selectTime: 'Select time',
          feePercentage: 'Fee Percentage',
          feePercentagePlaceholder: '50',
          fixedFeeOptional: 'Or Fixed Fee (optional)',
          fixedFeePlaceholder: '',
          notesOptional: 'Notes (optional)',
          notesPlaceholder: 'Enter notes...',
          approving: 'Approving...',
        },
        rejectModal: {
          title: 'Reject Reschedule Request',
          reasonLabel: 'Reason *',
          reasonPlaceholder: 'Enter rejection reason (min {{count}} characters)',
          rejecting: 'Rejecting...',
        },
        timePicker: {
          title: 'Select time',
          hour: 'Hour',
          minute: 'Minute',
          period: 'AM/PM',
          selected: 'Selected: {{value}}',
          select: 'Select',
        },
      },
      vetVaccinations: {
        searchPlaceholder: 'Search by pet or owner...',
        filters: {
          all: 'All',
        },
        labels: {
          owner: 'Owner',
          vaccination: 'Vaccination',
          given: 'Given',
          nextDue: 'Next due',
          note: 'Note',
        },
        status: {
          upToDate: 'Up to date',
          overdue: 'Overdue',
          dueSoon: 'Due soon',
        },
        empty: 'No vaccination records',
        errors: {
          loadFailed: 'Failed to load vaccinations',
        },
      },
      vetReviews: {
        searchPlaceholder: 'Search by owner or pet...',
        count_one: '{{count}} review',
        count_other: '{{count}} reviews',
        ratingLabel: '{{count}} star',
        filters: {
          all: 'All',
        },
        labels: {
          pet: 'Pet',
        },
        replied: '✓ Replied',
        reply: 'Reply',
        empty: 'No reviews match',
        errors: {
          loadFailed: 'Failed to load reviews',
        },
      },
      vetNotifications: {
        title: 'Notifications',
        subtitle: 'Alerts & updates',
        actions: {
          markAll: 'Mark all',
          marking: 'Marking...',
        },
        tabs: {
          all: 'All',
          unread: 'Unread',
          read: 'Read',
        },
        empty: 'No notifications found.',
        fallbackTitle: 'Notification',
        toasts: {
          markAllSuccess: 'All notifications marked as read',
        },
        errors: {
          markAllFailed: 'Failed to mark all as read',
          markReadFailed: 'Failed to mark as read',
        },
        timeAgo: {
          justNow: 'Just now',
          minutesAgo_one: '{{count}} minute ago',
          minutesAgo_other: '{{count}} minutes ago',
          hoursAgo_one: '{{count}} hour ago',
          hoursAgo_other: '{{count}} hours ago',
          daysAgo_one: '{{count}} day ago',
          daysAgo_other: '{{count}} days ago',
        },
      },
      vetPrescription: {
        title: 'Prescription',
        loading: 'Loading appointment...',
        meta: {
          appointment: 'Appointment {{number}}',
          veterinarian: 'Veterinarian: {{name}}',
          petOwner: 'Pet owner: {{name}}',
          pet: 'Pet: {{name}}',
        },
        actions: {
          downloadPdf: 'Download PDF',
          savePrescription: 'Save prescription',
          saving: 'Saving...',
          addMedication: '+ Add medication',
        },
        fields: {
          diagnosis: 'Diagnosis',
          allergies: 'Allergies',
          clinicalNotes: 'Clinical notes',
          medications: 'Medications',
          recommendedTests: 'Recommended tests (one per line)',
          followUp: 'Follow-up',
          advice: 'Advice',
          status: 'Status',
        },
        placeholders: {
          diagnosis: 'Diagnosis',
          allergies: 'Allergies',
          clinicalNotes: 'Clinical notes',
          medicationNameRequired: 'Name *',
          strength: 'Strength',
          dosage: 'Dosage',
          frequency: 'Frequency',
          duration: 'Duration',
          quantity: 'Qty',
          refills: 'Refills',
          instructions: 'Instructions',
          onePerLine: 'One per line',
          followUp: 'Follow-up',
          advice: 'Advice',
        },
        status: {
          issued: 'ISSUED',
          draft: 'DRAFT',
        },
        toasts: {
          saved: 'Prescription saved',
        },
        info: {
          pdfNotSupported: 'PDF download not supported in-app yet. Use web for PDF.',
        },
        errors: {
          appointmentIdRequired: 'Appointment ID is required',
          appointmentIdRequiredInline: 'Appointment ID is required.',
          appointmentNotFound: 'Appointment not found.',
          onlyAfterCompleted: 'Prescription can only be created after the appointment is completed.',
          saveFirstToDownload: 'Save prescription first to download PDF',
        },
      },
      vetProfileSettings: {
        loading: 'Loading profile...',
        tabs: {
          basicDetails: 'Basic Details',
          specialtiesServices: 'Specialties & Services',
          experience: 'Experience',
          education: 'Education',
          awards: 'Awards',
          insurances: 'Insurances',
          clinics: 'Clinics',
          businessHours: 'Business Hours',
        },
        sections: {
          profileImage: 'Profile Image',
          basicInformation: 'Basic Information',
          consultationFees: 'Consultation Fees',
          professionalMemberships: 'Professional Memberships',
        },
        fields: {
          firstName: 'First Name *',
          lastName: 'Last Name *',
          displayName: 'Display Name *',
          professionalTitle: 'Professional Title *',
          phone: 'Phone Number *',
          email: 'Email Address *',
          biography: 'Biography',
          inClinicFee: 'In-Clinic Consultation Fee',
          onlineFee: 'Online Consultation Fee',
          organization: 'Organization',
        },
        placeholders: {
          firstName: 'First name',
          lastName: 'Last name',
          displayName: 'How you want to be known',
          professionalTitle: 'e.g. DVM, Veterinarian',
          phone: 'Phone',
          email: 'Email',
          biography: 'Describe your veterinary background, expertise...',
          feeExample: 'e.g. {{value}}',
          organizationExample: 'e.g. {{value}}',
        },
        actions: {
          uploadPhoto: 'Upload Photo',
          uploading: 'Uploading...',
          addMembership: '+ Add Membership',
          saving: 'Saving...',
        },
        photoHint: 'Below 4MB, JPG, PNG, SVG',
        toasts: {
          uploadFailed: 'Upload failed',
          uploadFailedGeneric: 'Failed to upload',
          profileImageUpdated: 'Profile image updated',
          profileImageRemoved: 'Profile image removed',
          removeFailedGeneric: 'Failed to remove',
          profileUpdated: 'Profile updated successfully',
          updateFailedGeneric: 'Failed to update profile',
        },
      },
      vetChatDetail: {
        empty: 'No messages yet',
        placeholders: {
          message: 'Type a message...',
        },
        errors: {
          missingConversation: 'Missing conversation',
          invalidConversation: 'Invalid conversation',
          invalidAdminConversation: 'Invalid admin conversation',
          invalidConversationDetails: 'Invalid conversation details',
          failedToSend: 'Failed to send',
          failedToSendFile: 'Failed to send file',
          uploadFailed: 'Upload failed',
          couldNotOpenFile: 'Could not open file',
        },
      },
      vetAdminChat: {
        loading: 'Opening admin chat...',
        empty: 'No messages yet. Say hello to support.',
        placeholders: {
          message: 'Message support...',
        },
        errors: {
          signInRequired: 'Please sign in',
          failedToOpen: 'Failed to open admin chat',
          failedToSend: 'Failed to send',
          failedToSendFile: 'Failed to send file',
          uploadFailed: 'Upload failed',
          couldNotOpenFile: 'Could not open file',
        },
      },
      vetAnnouncements: {
        at: 'at',
        new: 'New',
        stats: {
          unread_one: '{{count}} Unread',
          unread_other: '{{count}} Unread',
          pinned_one: '{{count}} Pinned',
          pinned_other: '{{count}} Pinned',
        },
        filters: {
          all: 'All ({{count}})',
          unread: 'Unread ({{count}})',
          pinned: 'Pinned ({{count}})',
        },
        empty: {
          title: 'No announcements found',
          subtitle: "You're all caught up!",
        },
        priority: {
          urgent: 'URGENT',
          important: 'IMPORTANT',
          normal: 'NORMAL',
        },
        actions: {
          viewAttachment: '📎 View Attachment',
          viewLink: '🔗 View Link',
          markAsRead: 'Mark as Read',
        },
        pagination: {
          previous: '‹ Previous',
          next: 'Next ›',
          pageOf: 'Page {{page}} of {{pages}}',
        },
        info: {
          title: 'About Announcements',
          body: 'Important announcements from the platform appear here. Pinned announcements stay at the top. Read all to stay updated.',
        },
        toasts: {
          markedAsRead: 'Announcement marked as read',
        },
        errors: {
          markReadFailed: 'Failed to mark as read',
          couldNotOpenLink: 'Could not open link',
          couldNotOpenFile: 'Could not open file',
        },
      },
      vetSubscription: {
        sectionTitle: 'Subscription Plans',
        currentPlan: 'Current Plan: {{plan}}',
        noActivePlan: 'No active plan',
        renewsOn: 'Renews on: {{date}}',
        subscribeToUnlock: 'Subscribe to unlock booking & chat',
        unlimited: 'Unlimited',
        usage: 'Usage: Private {{privateUsed}} / {{privateTotal}}, Video {{videoUsed}} / {{videoTotal}}, Chat {{chatUsed}} / {{chatTotal}}',
        status: {
          active: 'Active',
          inactive: 'Inactive',
        },
        badges: {
          mostPopular: 'Most Popular',
          currentPlan: 'Current Plan',
        },
        planFallback: 'Plan',
        planName: '{{name}} PLAN',
        perMonth: 'per month',
        actions: {
          choosePlan: 'Choose Plan',
          processing: 'Processing...',
          payNow: 'Pay Now',
        },
        modal: {
          title: 'Upgrade Veterinary Subscription',
          selectedPlan: 'Selected Plan: {{name}} PLAN',
          pricePerMonth: 'Price: €{{price}} per month',
          hint: 'Tap Pay Now to confirm. Payment will be processed.',
        },
        info: {
          title: 'Veterinary Subscription Information',
          body: 'You can upgrade or downgrade your plan at any time. Changes will be reflected immediately. Cancel anytime with no long-term commitment.',
        },
        toasts: {
          updated: 'Subscription updated',
        },
        errors: {
          purchaseFailed: 'Failed to purchase subscription',
        },
      },
      vetChangePassword: {
        title: 'Change Password',
        subtitle: 'Enter your current password and choose a new password.',
        fields: {
          currentPassword: 'Current password *',
          newPassword: 'New password *',
          confirmNewPassword: 'Confirm new password *',
        },
        placeholders: {
          currentPassword: 'Enter current password',
          newPassword: 'Enter new password (min {{count}} characters)',
          confirmNewPassword: 'Confirm new password',
        },
        actions: {
          updating: 'Updating...',
        },
        toasts: {
          updated: 'Password updated successfully',
        },
        errors: {
          currentRequired: 'Enter your current password',
          newRequired: 'Enter a new password',
          minLength: 'New password must be at least {{count}} characters',
          mismatch: 'New password and confirm password do not match',
          updateFailedGeneric: 'Failed to update password',
        },
      },
      vetBusinessSettings: {
        title: 'Business Hours',
        subtitle: 'Set your clinic availability by day',
        placeholders: {
          startTime: '09:00',
          endTime: '17:00',
        },
        alerts: {
          updated: 'Business hours updated successfully.',
        },
        errors: {
          updateFailed: 'Failed to update business hours.',
        },
      },
      vetClinicsSettings: {
        title: 'Clinics',
        fields: {
          clinicName: 'Clinic Name',
          address: 'Address',
          city: 'City',
          state: 'State',
          country: 'Country',
          phone: 'Phone',
        },
        placeholders: {
          name: 'Name',
          address: 'Full address',
          city: 'City',
          state: 'State',
          country: 'Country',
          phone: 'Clinic phone',
        },
        actions: {
          addClinic: '+ Add Clinic',
          removeClinic: 'Remove Clinic',
        },
        validation: {
          addAtLeastOne: 'Add at least one clinic with name or address.',
        },
        alerts: {
          updated: 'Clinics updated successfully.',
        },
        errors: {
          updateFailed: 'Failed to update clinics.',
        },
      },
      vetExperienceSettings: {
        title: 'Experience',
        fields: {
          hospitalClinic: 'Hospital / Clinic',
          designation: 'Designation',
          fromYear: 'From Year',
          toYear: 'To Year',
        },
        placeholders: {
          name: 'Name',
          designationExample: 'e.g. {{value}}',
          year: 'YYYY',
        },
        actions: {
          addExperience: '+ Add Experience',
        },
        alerts: {
          updated: 'Experience updated successfully.',
        },
        errors: {
          updateFailed: 'Failed to update experience.',
        },
      },
      vetEducationSettings: {
        title: 'Education',
        fields: {
          degree: 'Degree',
          collegeUniversity: 'College / University',
          year: 'Year',
        },
        placeholders: {
          degreeExample: 'e.g. {{value}}',
          name: 'Name',
          year: 'YYYY',
        },
        actions: {
          addEducation: '+ Add Education',
        },
        alerts: {
          updated: 'Education updated successfully.',
        },
        errors: {
          updateFailed: 'Failed to update education.',
        },
      },
      vetAwardsSettings: {
        title: 'Awards',
        fields: {
          awardTitle: 'Award Title',
          year: 'Year',
        },
        placeholders: {
          awardTitleExample: 'e.g. {{value}}',
          year: 'YYYY',
        },
        actions: {
          addAward: '+ Add Award',
        },
        alerts: {
          updated: 'Awards updated successfully.',
        },
        errors: {
          updateFailed: 'Failed to update awards.',
        },
      },
      vetInsuranceSettings: {
        title: 'Insurances',
        subtitle: 'Select the insurance companies you accept',
        empty: 'No insurance companies available.',
        alerts: {
          updated: 'Insurance companies updated successfully.',
        },
        errors: {
          updateFailed: 'Failed to update insurance.',
        },
      },
      vetSpecialitiesSettings: {
        title: 'Specialties & Services',
        fields: {
          specialization: 'Specialization',
          services: 'Services',
        },
        placeholders: {
          serviceName: 'Service name',
          price: 'Price',
          description: 'Description',
        },
        actions: {
          addService: '+ Add Service',
        },
        empty: 'No specializations available.',
        validation: {
          selectSpecialization: 'Please select a specialization.',
          addService: 'Please add at least one service with a name.',
        },
        alerts: {
          updated: 'Specialties & services updated successfully.',
        },
        errors: {
          updateFailed: 'Failed to update.',
        },
      },
      vetAddVaccinations: {
        loading: 'Loading...',
        title: 'Add vaccinations',
        weightIncluded: 'Weight record will be included: {{value}} {{unit}}',
        fields: {
          vaccine: 'Vaccine *',
          date: 'Date',
          nextDueOptional: 'Next due (optional)',
          batchNotesOptional: 'Batch / Notes (optional)',
        },
        placeholders: {
          vaccineIdOrName: 'Vaccine ID or name',
          date: 'YYYY-MM-DD',
          batchNumber: 'Batch number',
          notes: 'Notes',
        },
        actions: {
          addAnother: '+ Add another vaccination',
          completing: 'Completing...',
          completeAppointment: 'Complete appointment',
        },
        toasts: {
          addAtLeastOneOrGoBack: 'Add at least one vaccination or go back to add weight only',
          completed: 'Appointment completed',
        },
        errors: {
          appointmentNotFound: 'Appointment not found.',
        },
      },
      vetAddWeightRecord: {
        loading: 'Loading...',
        title: 'Add weight record',
        lastRecorded: 'Last recorded:',
        fields: {
          weightValue: 'Weight value *',
          unit: 'Unit',
          notesOptional: 'Notes (optional)',
        },
        placeholders: {
          weightExample: 'e.g. {{value}}',
          notes: 'Notes...',
        },
        actions: {
          nextAddVaccinations: 'Next: Add vaccinations',
          completing: 'Completing...',
          completeWithThisWeight: 'Complete appointment with this weight',
        },
        toasts: {
          validWeightRequired: 'Please enter a valid weight value',
          weightMustBeGreaterThanZero: 'Weight must be greater than 0',
          completedWithWeight: 'Appointment completed with weight record',
        },
        errors: {
          appointmentNotFound: 'Appointment not found.',
        },
      },
      vetStartAppointment: {
        title: 'Video Session',
        subtitle: 'Start consultation for appointment {{appointmentId}}. Video call integration will be added during API integration.',
        actions: {
          endSession: 'End Session (placeholder)',
        },
      },
      vetBlog: {
        actions: {
          createNewPost: 'Create new post',
        },
        mockPosts: {
          post1: {
            title: '5 Tips for Pet Dental Care',
            excerpt: "Keeping your pet's teeth healthy...",
            body: "Keeping your pet's teeth healthy is essential for their overall wellbeing. Here are five simple tips you can follow at home: brush regularly, provide dental chews, schedule checkups, watch for bad breath, and choose a balanced diet.",
          },
          post2: {
            title: 'Vaccination Schedule for Dogs',
            excerpt: 'A complete guide to vaccination timing...',
            body: 'Vaccinations help protect dogs from serious diseases. Your vet will recommend a schedule based on age, lifestyle, and local risks. Always keep records updated and ask about boosters and optional vaccines.',
          },
        },
      },
      vetBlogCreate: {
        fields: {
          title: 'Title',
          content: 'Content',
        },
        placeholders: {
          title: 'Post title',
          content: 'Write your post...',
        },
        actions: {
          publish: 'Publish',
        },
      },
      vetSocialMedia: {
        title: 'Social links',
        fields: {
          facebook: 'Facebook',
          instagram: 'Instagram',
          twitter: 'Twitter',
          linkedin: 'LinkedIn',
        },
        placeholders: {
          url: 'URL',
        },
      },
      languageScreen: {
        english: 'English',
        italian: 'Italian',
      },
      days: {
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday',
      },
      tabs: {
        home: 'Home',
        appointments: 'Appointments',
        messages: 'Messages',
        more: 'More',
        pharmacy: 'Pharmacy',
      },
      screens: {
        dashboard: 'Dashboard',
        products: 'Products',
        orders: 'Orders',
      },
      appointments: {
        tabs: {
          all: 'All',
          upcoming: 'Upcoming',
          cancelled: 'Cancelled',
          completed: 'Completed',
        },
        searchPlaceholderVet: 'Search pets or owners...',
        searchPlaceholderPetOwner: 'Search by vet or pet...',
        loading: 'Loading appointments...',
        actions: {
          chat: 'Chat',
          view: 'View',
        },
        errors: {
          cannotOpenChat: 'Cannot open chat for this appointment',
          couldNotOpenChat: 'Could not open chat',
        },
        empty: {
          all: "You don't have any appointments.",
          upcoming: "You don't have any upcoming appointments.",
          cancelled: "You don't have any cancelled appointments at the moment.",
          completed: "You don't have any completed appointments yet.",
          petOwnerAll: 'No appointments found',
          petOwnerUpcoming: 'No upcoming appointments',
          petOwnerCancelled: 'No cancelled appointments',
          petOwnerCompleted: 'No completed appointments',
        },
        labels: {
          owner: 'Owner',
          pet: 'Pet',
        },
      },
      pets: {
        searchPlaceholder: 'Search by pet or owner name...',
        tabs: {
          active: 'Active',
          inactive: 'Inactive',
        },
        filters: {
          all: 'All',
        },
        labels: {
          owner: 'Owner',
          lastVisit: 'Last visit',
          added: 'Added',
        },
        empty: 'No pets in this list',
        errors: {
          loadFailed: 'Failed to load pets',
        },
      },
      simpleScreens: {
        appointment: {
          title: 'Appointment Screen',
          subtitle: 'Your upcoming appointments will appear here.',
        },
      },
      vetDashboard: {
        welcomeBack: 'Welcome back',
        loading: 'Loading dashboard…',
        updates: {
          title: 'You have updates',
          unreadMessages_one: '{{count}} unread message',
          unreadMessages_other: '{{count}} unread messages',
          unreadNotifications_one: '{{count}} notification',
          unreadNotifications_other: '{{count}} notifications',
        },
        subscription: {
          upgradeTitle: 'Upgrade for more bookings',
          upgradeSubtitle: 'Activate your subscription to unlock features',
          activeTitle: 'Subscription Active',
          expiresIn_one: 'Expires in {{count}} day',
          expiresIn_other: 'Expires in {{count}} days',
        },
        stats: {
          todayAppointments: "Today's Appointments",
          thisWeek: 'This Week',
          earnings: 'Earnings',
          patients: 'Patients',
        },
        profile: {
          strengthTitle: 'Profile Strength',
          strengthSubtitle: 'Complete your profile to earn more trust',
          viewReviews: 'View reviews',
        },
        today: {
          title: "Today's Appointments",
          seeAll: 'See all',
          empty: 'No appointments scheduled for today',
        },
        quick: {
          title: 'Quick access',
        },
      },
      messages: {
        searchPlaceholder: 'Search conversations...',
        adminMessages: 'Admin Messages',
        empty: 'No conversations yet',
        unreadOverflow: '99+',
        errors: {
          loadFailed: 'Failed to load conversations',
        },
      },
      vetAppointmentDetail: {
        loading: 'Loading appointment...',
        notFound: {
          title: 'Appointment not found',
          subtitle: 'Please go back to appointments and select one.',
        },
        badges: {
          new: 'New',
        },
        labels: {
          owner: 'Owner',
          typeOfAppointment: 'Type of Appointment',
          videoCall: '📹 Video Call',
          clinicVisit: '🏥 Clinic Visit',
          consultationFee: 'Consultation: €50',
        },
        details: {
          dateTime: 'Appointment Date & Time',
          reason: 'Visit Reason',
          defaultReason: 'Consultation',
          petSymptoms: 'Pet Symptoms',
          notes: 'Notes',
        },
        actions: {
          accepting: 'Accepting...',
          acceptAppointment: 'Accept Appointment',
          reject: 'Reject',
          markCompleted: 'Mark as Completed',
          updating: 'Updating...',
          markNoShow: 'Mark as No-Show',
          startVideo: 'Start Video Session',
          chatWithPetOwner: '💬 Chat with pet owner',
          prescription: 'Prescription',
        },
        completeModal: {
          title: 'Complete Appointment & Record Vaccinations',
          weightOptional: 'Weight (optional)',
          valuePlaceholder: 'Value',
          weightNotesPlaceholder: 'Weight notes (optional)',
          vaccinationsOptional: 'Vaccinations (optional)',
          datePlaceholder: 'Date (YYYY-MM-DD)',
          nextDuePlaceholder: 'Next due (YYYY-MM-DD)',
          batchNumberPlaceholder: 'Batch number (optional)',
          notesPlaceholder: 'Notes (optional)',
          addAnotherVaccine: '+ Add another vaccine',
          completing: 'Completing...',
          completeAppointment: 'Complete Appointment',
        },
        rejectModal: {
          title: 'Reject Appointment',
          confirmText: 'Are you sure you want to reject this appointment?',
          reasonLabel: 'Reason (optional)',
          reasonPlaceholder: 'Enter reason...',
          rejecting: 'Rejecting...',
          rejectAppointment: 'Reject Appointment',
        },
        toasts: {
          accepted: 'Appointment accepted',
          rejected: 'Appointment rejected',
          completed: 'Appointment marked as completed',
          noShow: 'Appointment marked as no-show',
        },
        errors: {
          couldNotOpenChat: 'Could not open chat',
        },
      },
      vetStack: {
        VetAppointmentDetails: { title: 'Appointment Details', subtitle: 'Pet appointment' },
        VetStartAppointment: { title: 'Video Session', subtitle: 'Start consultation' },
        VetPetRequests: { title: 'Pet Requests', subtitle: 'Manage appointment requests' },
        VetClinicHours: { title: 'Clinic Hours', subtitle: 'Available timings' },
        VetMyPets: { title: 'My Pets', subtitle: 'Patients & owners' },
        VetVaccinations: { title: 'Vaccinations', subtitle: 'Vaccination records' },
        VetReviews: { title: 'Pet Owner Reviews', subtitle: 'Reviews & ratings' },
        VetInvoices: { title: 'Invoices', subtitle: 'Transaction history' },
        VetInvoiceView: { title: 'Invoice', subtitle: 'Transaction details' },
        VetPaymentSettings: { title: 'Payment Settings', subtitle: 'Payout & bank info' },
        VetRescheduleRequests: { title: 'Reschedule Requests', subtitle: 'Manage requests' },
        Language: { title: 'Language', subtitle: 'Choose language' },
        VetChatDetail: { title: 'Chat', subtitle: 'Conversation' },
        VetAdminChat: { title: 'Admin Messages', subtitle: 'Support' },
        VetNotifications: { title: 'Notifications', subtitle: 'Alerts & updates' },
        VetBlogList: { title: 'Blog Posts', subtitle: 'Your articles' },
        VetBlogCreate: { title: 'New Blog Post', subtitle: 'Create article' },
        VetBlogDetail: { title: 'Blog Post', subtitle: 'Article details' },
        VetAnnouncements: { title: 'Announcements', subtitle: 'Clinic announcements' },
        VetSubscription: { title: 'Subscription', subtitle: 'Your plan' },
        VetProfileSettings: { title: 'Profile Settings', subtitle: 'Edit your profile' },
        VetSpecialities: { title: 'Specialties & Services', subtitle: 'Services you offer' },
        VetExperienceSettings: { title: 'Experience', subtitle: 'Work history' },
        VetEducationSettings: { title: 'Education', subtitle: 'Qualifications' },
        VetAwardsSettings: { title: 'Awards', subtitle: 'Recognition' },
        VetInsuranceSettings: { title: 'Insurances', subtitle: 'Accepted insurances' },
        VetClinicsSettings: { title: 'Clinics', subtitle: 'Your clinic locations' },
        VetBusinessSettings: { title: 'Business Hours', subtitle: 'Availability' },
        VetSocialMedia: { title: 'Social Media', subtitle: 'Your social links' },
        VetChangePassword: { title: 'Change Password', subtitle: 'Update password' },
        VetPrescription: { title: 'Prescription', subtitle: 'Create or view' },
        VetAddWeightRecord: { title: 'Add weight record', subtitle: 'Record weight & complete' },
        VetAddVaccinations: { title: 'Add vaccinations', subtitle: 'Record vaccinations & complete' },
      },
      petOwnerStack: {
        PetOwnerAppointmentDetails: { title: 'Appointment Details', subtitle: 'Pet appointment' },
        PetOwnerRequestReschedule: { title: 'Request Reschedule', subtitle: 'Choose new date/time' },
        PetOwnerRescheduleRequests: { title: 'Reschedule Requests', subtitle: 'Track requests' },
        PetOwnerPrescription: { title: 'Prescription', subtitle: 'View prescription' },
        PetOwnerVideoCall: { title: 'Video Call', subtitle: 'Join consultation' },
        PetOwnerFavourites: { title: 'Favorite Veterinarians', subtitle: 'Your saved vets' },
        PetOwnerMyPets: { title: 'My Pets', subtitle: 'Manage your pets' },
        PetOwnerAddPet: { title: 'Add Pet', subtitle: 'Register a new pet' },
        PetOwnerEditPet: { title: 'Edit Pet', subtitle: 'Update pet details' },
        PetOwnerMedicalRecords: { title: 'Pet Medical Records', subtitle: 'Health history' },
        PetOwnerMedicalDetails: { title: 'Pet Vitals', subtitle: 'Vitals & weight' },
        PetOwnerWeightRecords: { title: 'Weight Records', subtitle: 'Weight history' },
        PetOwnerWallet: { title: 'Wallet', subtitle: 'Balance & top-up' },
        PetOwnerInvoices: { title: 'Veterinary Invoices', subtitle: 'Transaction history' },
        PetOwnerInvoiceView: { title: 'Invoice', subtitle: 'Transaction details' },
        PetOwnerOrderHistory: { title: 'Pet Supply Orders', subtitle: 'Order history' },
        PetOwnerOrderDetails: { title: 'Order Details', subtitle: 'Order info' },
        PetOwnerDocuments: { title: 'Pet Documents', subtitle: 'Downloads & receipts' },
        PetOwnerNotifications: { title: 'Notifications', subtitle: 'Alerts & updates' },
        PetOwnerChatDetail: { title: 'Chat', subtitle: 'Conversation' },
        PetOwnerClinicMap: { title: 'Nearby Clinics', subtitle: 'Find clinics' },
        PetOwnerClinicNavigation: { title: 'Clinic Navigation', subtitle: 'Directions' },
        PetOwnerProfileSettings: { title: 'Account Settings', subtitle: 'Edit profile' },
        PetOwnerChangePassword: { title: 'Change Password', subtitle: 'Update password' },
        Language: { title: 'Language', subtitle: 'Choose language' },
        PetOwnerSearch: { title: 'Find Veterinarian', subtitle: 'Search' },
        PetOwnerVetProfile: { title: 'Veterinarian', subtitle: 'Profile & book' },
        PetOwnerBooking: { title: 'Book Appointment', subtitle: 'Select date & time' },
        PetOwnerBookingCheckout: { title: 'Confirm Booking', subtitle: 'Review & pay' },
        PetOwnerBookingSuccess: { title: 'Booked', subtitle: 'Appointment confirmed' },
        PetOwnerCart: { title: 'Cart', subtitle: 'Pet supplies' },
        PetOwnerCheckout: { title: 'Checkout', subtitle: 'Review & pay' },
        PetOwnerPaymentSuccess: { title: 'Payment Success', subtitle: 'Order confirmed' },
      },
      petOwnerTabs: {
        PetOwnerHome: { subtitle: "Your pets' health at a glance" },
        PetOwnerAppointments: { subtitle: 'Schedule & manage' },
        PetOwnerPharmacy: { subtitle: 'Pet supplies' },
        PetOwnerMessages: { subtitle: 'Chat with veterinarians' },
        PetOwnerMore: { subtitle: 'Settings & more' },
      },
      petOwnerPharmacyStack: {
        PharmacyHome: { title: 'Pharmacy & Shop', subtitle: 'Pet supplies' },
        PharmacySearch: { title: 'Find Pharmacies', subtitle: 'Search' },
        PharmacyDetails: { title: 'Pharmacy', subtitle: 'Details' },
        ProductCatalog: { title: 'Products', subtitle: 'Browse' },
        ProductDetails: { title: 'Product', subtitle: 'Details' },
        Cart: { title: 'Cart', subtitle: 'Your items' },
        Checkout: { title: 'Checkout', subtitle: 'Review & pay' },
        PaymentSuccess: { title: 'Success', subtitle: 'Order placed' },
      },
      petOwnerPlaceholders: {
        calendar: {
          weekdays: {
            sundayShort: 'S',
            mondayShort: 'M',
            tuesdayShort: 'T',
            wednesdayShort: 'W',
            thursdayShort: 'T',
            fridayShort: 'F',
            saturdayShort: 'S',
          },
        },
        timePicker: {
          title: 'Select time',
          hour: 'Hour',
          minute: 'Minute',
          amPm: 'AM/PM',
          selected: 'Selected: {{value}}',
          select: 'Select',
        },
        requestReschedule: {
          title: 'Request Reschedule',
          subtitle: 'Select a missed online appointment and submit your request.',
          loadingEligible: 'Loading eligible appointments...',
          empty: 'No appointments are eligible for reschedule.',
          fields: {
            selectAppointment: 'Select missed appointment *',
            preferredDateOptional: 'Preferred new date (optional)',
            preferredTimeOptional: 'Preferred new time (optional)',
            reason: 'Reason *',
          },
          placeholders: {
            selectDate: 'Select date',
            selectTime: 'Select time',
            reason: 'Explain why you missed the appointment (min 10 characters)',
          },
          labels: {
            appointmentNumber: 'Appointment: {{value}}',
          },
          hint: {
            feeAfterApproval: 'After approval, you may need to pay a reschedule fee to confirm the new appointment.',
          },
          actions: {
            submitting: 'Submitting...',
            submit: 'Submit Request',
          },
          toasts: {
            selectAppointment: 'Please select an appointment',
            reasonMinChars: 'Reason must be at least {{count}} characters',
            submitted: 'Reschedule request submitted successfully',
          },
          errors: {
            loadEligibleFailed: 'Failed to load eligible appointments',
            submitFailed: 'Failed to submit reschedule request',
          },
        },
        rescheduleRequests: {
          title: 'Reschedule Requests',
          subtitle: 'Track your requests and pay fees after approval.',
          loading: 'Loading requests...',
          empty: 'No reschedule requests found.',
          labels: {
            original: 'Original',
            fee: 'Fee',
            newAppointment: 'New appointment',
          },
          status: {
            approved: 'APPROVED',
            pending: 'PENDING',
            rejected: 'REJECTED',
            cancelled: 'CANCELLED',
            unknown: '—',
          },
          actions: {
            request: 'Request',
            viewRejectionReason: 'View rejection reason',
            processing: 'Processing...',
            payFee: 'Pay Fee',
          },
          payModal: {
            title: 'Pay Reschedule Fee',
            feeLabel: 'Fee:',
            hint: 'Click confirm to proceed.',
            confirm: 'Confirm Payment',
          },
          toasts: {
            paid: 'Reschedule fee paid successfully. Appointment confirmed.',
          },
          errors: {
            loadFailed: 'Failed to load requests',
            paymentFailed: 'Payment failed',
          },
        },
        clinicNavigation: {
          defaults: {
            clinic: 'Clinic',
          },
          map: {
            yourLocation: 'Your Location',
          },
          missing: {
            title: 'Clinic Navigation',
            message: 'Clinic coordinates are missing.',
          },
          locationDisabled: 'Location disabled: route info may be limited',
          directions: {
            title: 'Directions',
            calculating: 'Calculating route...',
            distance: 'Distance',
            eta: 'ETA',
            continue: 'Continue',
            openInGoogleMaps: 'Open directions in Google Maps for turn-by-turn navigation.',
          },
          actions: {
            getDirections: 'Get Directions',
            call: 'Call',
          },
          errors: {
            routeInfoFailed: 'Failed to load route info',
            couldNotOpenMaps: 'Could not open maps',
            couldNotStartCall: 'Could not start phone call',
          },
        },
        simpleScreens: {
          prescription: { title: 'Prescription', subtitle: 'View prescription from veterinarian' },
          videoCall: { title: 'Video Call', subtitle: 'Join consultation' },
          search: { title: 'Find Veterinarian', subtitle: 'Search by location, specialty' },
          vetProfile: { title: 'Veterinarian Profile', subtitle: 'View profile and book' },
          booking: { title: 'Book Appointment', subtitle: 'Select date, time, pet' },
          cart: { title: 'Cart', subtitle: 'Pet supply cart' },
          checkout: { title: 'Checkout', subtitle: 'Review and pay' },
          paymentSuccess: { title: 'Payment Success', subtitle: 'Order confirmed' },
        },
      },
      petOwnerMedicalRecords: {
        tabs: {
          medical: 'Medical Records',
          vaccinations: 'Vaccinations',
          prescriptions: 'Prescriptions',
        },
        searchPlaceholder: 'Search pet records...',
        empty: 'No records found',
        actions: {
          addRecord: 'Add Record',
        },
        upcoming: {
          title: 'Upcoming (next 30 days)',
        },
        labels: {
          pet: 'Pet:',
          date: 'Date:',
          file: 'File:',
          type: 'Type:',
          nextDue: 'Next due:',
          veterinarian: 'Veterinarian:',
        },
        recordTypes: {
          GENERAL: 'General',
          LAB_REPORT: 'Lab report',
          XRAY: 'X-ray',
          VACCINATION: 'Vaccination',
          SURGERY: 'Surgery',
          WEIGHT: 'Weight',
          PRESCRIPTION: 'Prescription',
          OTHER: 'Other',
        },
        prescriptions: {
          title: 'Prescription #{{id}}',
          view: 'View prescription',
        },
        addModal: {
          title: 'Add Medical Record',
          fields: {
            pet: 'Pet *',
            title: 'Title *',
            description: 'Description',
            recordType: 'Record type',
          },
          placeholders: {
            title: 'e.g. Lab result',
            description: 'Optional',
            selectFile: 'Select file (image/PDF) *',
          },
        },
        validation: {
          selectPet: 'Please select a pet',
          titleRequired: 'Title is required',
          selectFile: 'Please select a file',
        },
        deleteConfirm: {
          title: 'Delete record',
          message: 'Delete this medical record?',
        },
        alerts: {
          added: 'Medical record added',
          deleted: 'Record deleted',
          updated: 'Updated',
        },
        errors: {
          addFailed: 'Failed to add record',
          deleteFailed: 'Failed to delete',
        },
      },
      petOwnerClinicMap: {
        defaults: {
          clinic: 'Clinic',
        },
        map: {
          yourLocation: 'Your Location',
          kmAwaySuffix: 'km away',
          loading: 'Loading map...',
          gettingLocation: 'Getting location...',
        },
        radiusLabel: 'Search radius: {{value}} km',
        distanceAway: '{{value}} km away',
        loading: {
          findingNearby: 'Finding nearby clinics...',
          loadingClinics: 'Loading clinics...',
        },
        errors: {
          loadFailed: 'Failed to load clinics',
          vetInfoNotAvailable: 'Veterinarian information not available',
          clinicCoordsNotAvailable: 'Clinic coordinates not available',
        },
        toasts: {
          permissionDenied: {
            title: 'Location permission denied',
            subtitle: 'Using a default location for clinic search.',
          },
          couldNotGetLocation: {
            title: 'Could not get location',
            subtitle: 'Using a default location for clinic search.',
          },
          locationUpdated: 'Location updated',
          couldNotUpdateLocation: 'Could not update location',
        },
        list: {
          nearbyClinics: 'Nearby Clinics',
          locationDisabled: 'Location disabled',
        },
        empty: {
          title: 'No clinics found nearby',
          subtitle: 'Try increasing the search radius',
        },
        modal: {
          labels: {
            veterinarian: 'Veterinarian',
            address: 'Address',
            phone: 'Phone',
            distance: 'Distance',
          },
          actions: {
            viewVeterinarian: 'View Veterinarian',
            bookAppointment: 'Book Appointment',
            navigate: 'Navigate',
          },
        },
      },
      petOwnerProfileSettings: {
        title: 'Profile Settings',
        photo: {
          placeholder: 'Photo',
        },
        genders: {
          select: 'Select',
          male: 'Male',
          female: 'Female',
          other: 'Other',
        },
        settingsNav: {
          profile: 'Profile',
          changePassword: 'Change Password',
          twoFactor: '2 Factor Authentication',
          deleteAccount: 'Delete Account',
        },
        sections: {
          address: 'Address Information',
          emergency: 'Emergency Contact',
        },
        fields: {
          name: { label: 'First Name *', placeholder: 'Enter your name' },
          gender: { label: 'Gender' },
          dob: { label: 'Date of Birth', placeholder: 'YYYY-MM-DD' },
          phone: { label: 'Phone Number', placeholder: 'Enter phone' },
          email: { label: 'Email Address', placeholder: 'Email' },
          bloodGroup: { label: 'Blood Group', placeholder: 'e.g. O+' },
          addressLine1: { label: 'Address *', placeholder: 'Enter your address' },
          addressLine2: { label: 'Address Line 2', placeholder: 'Apartment, suite, etc.' },
          city: { label: 'City', placeholder: 'City' },
          state: { label: 'State', placeholder: 'State' },
          country: { label: 'Country', placeholder: 'Country' },
          zip: { label: 'Pincode', placeholder: 'Pincode' },
          emergencyName: { label: 'Name', placeholder: 'Emergency contact name' },
          emergencyPhone: { label: 'Phone', placeholder: 'Emergency contact phone' },
          emergencyRelation: { label: 'Relation', placeholder: 'Relation' },
        },
        alerts: {
          updated: 'Profile updated successfully',
        },
        errors: {
          uploadImageFailed: 'Failed to upload image',
          removeImageFailed: 'Failed to remove image',
          uploadFailed: 'Upload failed',
          updateFailed: 'Failed to update profile',
        },
      },
      petOwnerHome: {
        welcomeBack: 'Welcome back',
        loading: 'Loading your dashboard…',
        defaults: {
          specialty: 'Veterinary',
        },
        notifications: {
          title_one: 'You have {{count}} new notification',
          title_other: 'You have {{count}} new notifications',
          subtitle: 'Tap to view updates',
        },
        cta: {
          bookAppointmentTitle: 'Book an appointment',
          bookAppointmentSubtitle: 'Find a veterinarian near you',
        },
        stats: {
          clinicsVisited: 'Clinics Visited',
        },
        sections: {
          favorites: {
            title: 'Favorite Veterinarians',
            empty: 'No favorite vets. Find one from search.',
          },
          upcoming: {
            title: 'Upcoming Appointments',
            empty: 'No upcoming appointments',
          },
        },
        actions: {
          viewAll: 'View All',
          seeAll: 'See all',
        },
        activity: {
          title: 'Your Activity',
          subtitle: 'A quick snapshot of your care journey',
          completed: 'Completed',
          newAlerts: 'New Alerts',
        },
      },
      petOwnerAppointmentDetail: {
        loading: 'Loading appointment...',
        notFound: 'Appointment not found',
        labels: {
          dateTime: 'Date & Time',
          type: 'Type',
          reason: 'Reason',
          consultationFee: 'Consultation fee',
          petSymptoms: 'Pet symptoms',
          notes: 'Notes',
        },
        defaults: {
          consultation: 'Consultation',
          vetAvatarLetter: 'V',
        },
        bookingTypes: {
          videoCall: 'Video Call',
          clinicVisit: 'Clinic Visit',
        },
        actions: {
          joinVideoCall: 'Join Video Call',
          chatWithVet: '💬 Chat with veterinarian',
          viewPrescription: 'View / Download prescription',
          cancelAppointment: 'Cancel appointment',
        },
        reschedule: {
          title: 'Missed Appointment?',
          subtitle: 'If no video call was initiated, you can request a reschedule.',
          action: 'Request Reschedule',
        },
        review: {
          submitted: 'Review submitted',
          write: 'Write a review',
        },
        reviewModal: {
          title: 'Write a review',
          ratingLabel: 'Rating (1-5)',
          reviewLabel: 'Your review *',
          reviewPlaceholder: 'Write your review...',
          submitting: 'Submitting...',
          submit: 'Submit review',
        },
        cancelModal: {
          title: 'Cancel appointment',
          message: 'Are you sure you want to cancel this appointment?',
          reasonLabel: 'Reason (optional)',
          reasonPlaceholder: 'Enter reason...',
          keep: 'Keep appointment',
          cancelling: 'Cancelling...',
        },
        errors: {
          couldNotOpenChat: 'Could not open chat',
        },
        toasts: {
          cancelled: 'Appointment cancelled successfully',
          reviewRequired: 'Please provide a review',
          vetNotFound: 'Veterinarian not found',
          reviewSubmitted: 'Review submitted',
        },
      },
      petOwnerSearch: {
        defaults: {
          specialty: 'Veterinary',
        },
        placeholders: {
          searchByName: 'Search by name',
          city: 'City',
        },
        filters: {
          onlineNow: 'Online now',
        },
        actions: {
          clearFilters: 'Clear filters',
          viewProfile: 'View Profile',
          book: 'Book',
        },
        results: {
          showing: 'Showing {{total}} veterinarians',
        },
        status: {
          available: 'Available',
          unavailable: 'Unavailable',
        },
        pagination: {
          previous: 'Previous',
          next: 'Next',
          pageOf: 'Page {{page}} of {{pages}}',
        },
        empty: 'No veterinarians found. Try different filters.',
        errors: {
          loadFailed: 'Failed to load veterinarians',
          addFavoriteFailed: 'Failed to add',
          removeFavoriteFailed: 'Failed to remove',
        },
        toasts: {
          loginRequired: 'Please log in as a pet owner to add favorites',
          addedToFavorites: 'Added to favorites',
          removedFromFavorites: 'Removed from favorites',
        },
      },
      petOwnerVetProfile: {
        defaults: {
          title: 'Veterinary Professional',
          specialty: 'Veterinary',
          service: 'Service',
          hospital: 'Hospital',
          degree: 'Degree',
          award: 'Award',
          clinic: 'Clinic',
        },
        status: {
          available: 'Available',
          unavailable: 'Unavailable',
        },
        fees: {
          online: 'Online: €{{amount}}',
          clinic: 'Clinic: €{{amount}}',
        },
        stats: {
          reviews: 'Reviews',
          yearsExperience: 'Years experience',
          recommend: 'Recommend',
        },
        sections: {
          bio: 'Short Bio',
          services: 'Services & price list',
          experience: 'Experience',
          education: 'Education',
          awards: 'Awards',
          speciality: 'Speciality',
          clinics: 'Clinics',
          memberships: 'Memberships',
          reviews: 'Reviews',
        },
        reviews: {
          empty: 'No reviews yet.',
        },
        since: 'Since {{year}}',
        actions: {
          bookAppointment: 'Book Appointment',
        },
        errors: {
          addFavoriteFailed: 'Failed to add',
          removeFavoriteFailed: 'Failed to remove',
        },
        toasts: {
          loginRequired: 'Please log in as a pet owner to add favorites',
          addedToFavorites: 'Added to favorites',
          removedFromFavorites: 'Removed from favorites',
        },
      },
      petOwnerBooking: {
        loading: 'Loading...',
        subtitle: 'Book a veterinary appointment',
        labels: {
          appointmentType: 'Appointment Type',
          pet: 'Pet',
          date: 'Date',
          timeSlot: 'Time Slot',
          reason: 'Reason',
          petSymptomsOptional: 'Pet Symptoms (optional)',
        },
        placeholders: {
          selectDate: 'Select date',
          reason: 'e.g. Vaccination, fever, checkup',
          petSymptoms: 'Describe symptoms...',
        },
        datePicker: {
          title: 'Select date',
        },
        hints: {
          noPets: 'You have no pets. Add a pet first from My Pets.',
          selectDateFirst: 'Select a date first',
          noSlots: 'No slots available for this date',
        },
        validation: {
          selectVeterinarian: 'Please select a veterinarian first',
          loginRequired: 'Please log in to book',
          selectPet: 'Please select a pet',
          selectDate: 'Please select a date',
          selectTimeSlot: 'Please select a time slot',
          enterReason: 'Please enter a reason',
        },
        empty: {
          noVeterinarian: 'Please select a veterinarian from search to book.',
        },
        actions: {
          findVeterinarians: 'Find Veterinarians',
          proceedToCheckout: 'Proceed to Checkout',
        },
      },
      petOwnerBookingCheckout: {
        loading: 'Loading...',
        sections: {
          summary: 'Booking Summary',
          payment: 'Payment',
        },
        summary: {
          date: 'Date: {{value}}',
          time: 'Time: {{value}}',
          type: 'Type: {{value}}',
          pet: 'Pet: {{value}}',
          reason: 'Reason: {{value}}',
          consultation: 'Consultation: {{value}}',
          total: 'Total: {{value}}',
        },
        types: {
          video: 'Video',
          clinic: 'Clinic',
        },
        paymentMethods: {
          card: 'Card',
          demo: 'Test (Demo)',
        },
        terms: {
          accept: 'I accept the terms',
        },
        actions: {
          findVeterinarian: 'Find Veterinarian',
          processing: 'Processing...',
          payAmount: 'Pay €{{amount}}',
          confirm: 'Confirm',
        },
        validation: {
          acceptTerms: 'Please accept the terms',
          consultationFeeNotSet: 'Consultation fee not set',
          invalidBooking: 'Invalid booking',
        },
        errors: {
          createAppointmentFailed: 'Failed to create appointment',
        },
        toasts: {
          booked: 'Appointment booked!',
        },
        empty: {
          noDetails: 'No booking details.',
        },
      },
      petOwnerBookingSuccess: {
        title: 'Appointment Booked',
        message: 'Your appointment has been confirmed.',
        reference: 'Ref: {{id}}',
        actions: {
          viewAppointments: 'View Appointments',
          backToHome: 'Back to Home',
        },
      },
      petOwnerChatDetail: {
        missingConversation: 'Missing conversation',
        empty: 'No messages yet',
        placeholders: {
          typeMessage: 'Type a message...',
        },
        errors: {
          invalidConversation: 'Invalid conversation',
          failedToSend: 'Failed to send',
          uploadFailed: 'Upload failed',
          failedToSendFile: 'Failed to send file',
          couldNotOpenFile: 'Could not open file',
        },
      },
      petOwnerFavourites: {
        searchPlaceholder: 'Search favourites...',
        defaults: {
          specialty: 'Veterinary',
          vetAvatarLetter: 'V',
        },
        empty: {
          title: 'No favourites yet',
          subtitle: 'Add veterinarians from the search page to see them here.',
        },
        feeConsultation: '€{{amount}} consultation',
        actions: {
          bookNow: 'Book now',
        },
        errors: {
          loadFailed: 'Failed to load favorites.',
          removeFailed: 'Failed to remove',
        },
        toasts: {
          removedFromFavorites: 'Removed from favorites',
        },
      },
      petOwnerAddPet: {
        title: 'Add Pet',
        hint: 'All fields as in VeterinaryFrontend. Name and species required.',
        fields: {
          name: { label: 'Name *', placeholder: 'Enter pet name' },
          species: { label: 'Species *' },
          breed: { label: 'Breed', placeholder: 'Enter breed' },
          gender: { label: 'Gender' },
          ageMonths: { label: 'Age (months)', placeholder: 'e.g. 24' },
          weightKg: { label: 'Weight (kg)', placeholder: 'Optional' },
          microchipNumber: { label: 'Microchip number', placeholder: 'Optional' },
          photo: { label: 'Photo', placeholder: '📷 Add photo (optional)' },
        },
        validation: {
          nameRequired: 'Name is required',
        },
        actions: {
          saving: 'Saving...',
          savePet: 'Save Pet',
        },
        toasts: {
          created: 'Pet created',
        },
        errors: {
          createFailed: 'Failed to create pet',
        },
      },
      petOwnerPets: {
        species: {
          DOG: 'Dog',
          CAT: 'Cat',
          BIRD: 'Bird',
          RABBIT: 'Rabbit',
          REPTILE: 'Reptile',
          FISH: 'Fish',
          HAMSTER: 'Hamster',
          GUINEA_PIG: 'Guinea pig',
          FERRET: 'Ferret',
          HORSE: 'Horse',
          OTHER: 'Other',
        },
        gender: {
          MALE: 'Male',
          FEMALE: 'Female',
          NEUTERED: 'Neutered',
          SPAYED: 'Spayed',
          UNKNOWN: 'Unknown',
        },
      },
      petOwnerEditPet: {
        title: 'Edit Pet',
        photo: {
          changePhoto: '📷 Change photo',
        },
        actions: {
          saving: 'Saving...',
          deletePet: 'Delete Pet',
        },
        validation: {
          nameRequired: 'Name is required',
        },
        deleteConfirm: {
          title: 'Delete pet',
          message: 'Are you sure you want to delete this pet?',
        },
        toasts: {
          updated: 'Pet updated',
          deleted: 'Pet deleted',
        },
        errors: {
          updateFailed: 'Failed to update pet',
          deleteFailed: 'Failed to delete pet',
        },
      },
      petOwnerInvoices: {
        searchPlaceholder: 'Search invoices...',
        empty: 'No invoices found',
        defaults: {
          appointment: 'Appointment',
        },
        status: {
          paid: 'Paid',
          pending: 'Pending',
          failed: 'Failed',
          refunded: 'Refunded',
        },
        labels: {
          date: 'Date',
          appointment: 'Appointment',
          veterinarian: 'Veterinarian',
        },
        pagination: {
          prev: 'Prev',
          next: 'Next',
          pageOf: 'Page {{page}} of {{totalPages}}',
        },
      },
      petOwnerInvoiceView: {
        title: 'Invoice',
        notFound: 'Invoice not found.',
        meta: {
          order: 'Order:',
          issued: 'Issued:',
        },
        sections: {
          from: 'Invoice From',
          to: 'Invoice To',
          paymentMethod: 'Payment Method',
        },
        table: {
          description: 'Description',
          quantity: 'Quantity',
          vat: 'VAT',
          total: 'Total',
        },
        totals: {
          subtotal: 'Subtotal:',
          discount: 'Discount:',
          totalAmount: 'Total Amount:',
        },
      },
      petOwnerMedicalDetails: {
        mock: {
          recordType: 'Vaccination',
          title: 'Rabies vaccine',
          description: 'Annual booster. Batch #12345. No adverse reaction.',
        },
        sections: {
          details: 'Details',
          latestVitals: 'Latest vitals (as in VeterinaryFrontend)',
        },
        labels: {
          pet: 'Pet',
          date: 'Date',
          veterinarian: 'Veterinarian',
          attachment: 'Attachment',
        },
        vitals: {
          weight: 'Weight',
          temperature: 'Temperature',
          heartRate: 'Heart Rate',
        },
      },
      petOwnerChangePassword: {
        fields: {
          currentPassword: { label: 'Current password *', placeholder: 'Enter current password' },
          newPassword: { label: 'New password *', placeholder: 'Enter new password' },
          confirmPassword: { label: 'Confirm new password *', placeholder: 'Confirm new password' },
        },
        actions: {
          update: 'Update password',
        },
        validation: {
          currentPasswordRequired: 'Current password is required',
          newPasswordRequired: 'New password is required',
          passwordsDoNotMatch: 'New password and confirm password do not match',
          minLength: 'New password must be at least {{min}} characters',
        },
        toasts: {
          changed: 'Password changed successfully',
        },
        errors: {
          changeFailed: 'Failed to change password',
        },
      },
      petOwnerMyPets: {
        searchPlaceholder: 'Search pets',
        empty: 'No pets found',
        labels: {
          breed: 'Breed',
          microchip: 'Microchip',
        },
        actions: {
          addPet: 'Add Pet',
        },
        age: {
          years: '{{count}} years',
          months: '{{count}} months',
        },
        deleteConfirm: {
          title: 'Delete pet',
          message: 'Delete "{{name}}"?',
        },
        toasts: {
          deleted: 'Pet deleted',
        },
        errors: {
          deleteFailed: 'Failed to delete pet',
        },
      },
      petOwnerOrders: {
        defaults: {
          pharmacy: 'Pharmacy',
        },
        empty: 'No orders found',
        status: {
          pending: 'Pending',
          confirmed: 'Confirmed',
          processing: 'Processing',
          shipped: 'Shipped',
          delivered: 'Delivered',
          cancelled: 'Cancelled',
        },
        labels: {
          status: 'Status',
          orderedOn: 'Ordered on {{date}}',
          payment: 'Payment: {{status}}',
          paid: '✓ Paid',
        },
        itemsCount_one: '{{count}} item',
        itemsCount_other: '{{count}} items',
        actions: {
          viewDetails: 'View details',
          payNow: 'Pay now',
          cancel: 'Cancel',
          startShopping: 'Start shopping',
        },
        cancelConfirm: {
          title: 'Cancel order',
          message: 'Are you sure you want to cancel this order?',
          confirm: 'Yes',
        },
        toasts: {
          paymentSuccessful: 'Payment successful',
          orderCancelled: 'Order cancelled',
        },
        errors: {
          paymentFailed: 'Payment failed',
          cancelFailed: 'Cancel failed',
        },
        details: {
          title: 'Order Details',
          notFound: 'Order not found.',
          backToOrders: '← Back to Orders',
          summary: {
            orderNumber: 'Order Number',
            orderDate: 'Order Date: {{date}}',
          },
          alerts: {
            waitingShippingFee: 'Waiting for pharmacy owner to set shipping fee. You will be able to pay once the shipping fee is set.',
            shippingFeeSet: 'Shipping fee has been set. Please complete payment to confirm your order.',
            paymentCompleted: 'Payment completed. Your order is being processed.',
          },
          sections: {
            items: 'Order Items',
            shippingAddress: 'Shipping Address',
            summary: 'Order Summary',
          },
          defaults: {
            product: 'Product',
          },
          item: {
            quantity: 'Quantity: {{qty}}',
            eachPrice: '€{{price}} each',
          },
          totals: {
            subtotal: 'Subtotal',
            shipping: 'Shipping',
            total: 'Total',
          },
          actions: {
            processing: 'Processing...',
            payAmount: 'Pay €{{amount}}',
            cancelOrder: 'Cancel Order',
          },
          cancelModal: {
            title: 'Cancel Order',
            body: 'Are you sure you want to cancel order #{{orderNumber}}?',
            hint: 'This action cannot be undone.',
            keep: 'No, Keep Order',
            cancelling: 'Cancelling...',
            confirm: 'Yes, Cancel Order',
          },
        },
      },
      petOwnerPharmacyCatalog: {
        searchPlaceholder: 'Search products...',
        fromThisPharmacySuffix: ' from this pharmacy',
        results: 'Showing {{count}} products{{suffix}}',
        empty: 'No products found. Try adjusting your search or category.',
        defaults: {
          product: 'Product',
        },
      },
      petOwnerPharmacySearch: {
        kinds: {
          pharmacies: 'Pharmacies',
          parapharmacies: 'Parapharmacies',
          pharmaciesLower: 'pharmacies',
          parapharmaciesLower: 'parapharmacies',
        },
        placeholders: {
          searchPharmacies: 'Search pharmacies...',
          searchParapharmacies: 'Search parapharmacies...',
          cityOrLocation: 'Enter city or location...',
        },
        actions: {
          clearFilters: 'Clear filters',
          browseProducts: 'Browse Products',
          call: 'Call',
        },
        results: 'Showing {{count}} {{kind}}',
        empty: {
          title: 'No pharmacies found',
          subtitle: 'Try adjusting your search or filters',
        },
        defaults: {
          pharmacy: 'Pharmacy',
        },
        popularCities: ['City', 'Town', 'Village', 'Downtown', 'Central'],
      },
      petOwnerPharmacyCheckout: {
        redirecting: 'Redirecting...',
        sections: {
          billingDetails: 'Billing details',
          personalInfo: 'Personal information',
          shippingDetails: 'Shipping details',
          paymentMethod: 'Payment method',
          yourOrder: 'Your order',
        },
        fields: {
          firstName: { label: 'First name', placeholder: 'First name' },
          lastName: { label: 'Last name', placeholder: 'Last name' },
          email: { label: 'Email', placeholder: 'Email' },
          phone: { label: 'Phone', placeholder: 'Phone' },
          shipToDifferentAddress: 'Ship to a different address?',
          shippingLine1: { label: 'Address line 1', placeholder: 'Street address' },
          shippingLine2: { label: 'Address line 2 (optional)', placeholder: 'Apartment, suite...' },
          shippingCity: { label: 'City', placeholder: 'City' },
          shippingState: { label: 'State', placeholder: 'State' },
          shippingCountry: { label: 'Country', placeholder: 'Country' },
          shippingZip: { label: 'ZIP code', placeholder: 'ZIP' },
          orderNotes: { label: 'Order notes (optional)', placeholder: 'Notes about your order...' },
        },
        paymentMethods: {
          cardStripe: 'Card / Stripe',
        },
        terms: {
          prefix: 'I have read and accept the',
          link: 'Terms & Conditions',
        },
        totals: {
          subtotal: 'Subtotal',
          shipping: 'Shipping',
          free: 'Free',
          total: 'Total',
        },
        actions: {
          placingOrder: 'Placing order...',
          placeOrder: 'Place order',
        },
        validation: {
          loginRequired: 'Please log in to place an order.',
          acceptTerms: 'Please accept the Terms & Conditions.',
          cartEmpty: 'Your cart is empty.',
          shippingRequired: 'Please fill all required shipping fields.',
        },
        errors: {
          placeOrderFailed: 'Failed to place order',
          orderFailedTitle: 'Order failed',
        },
        toasts: {
          cartEmpty: { title: 'Cart is empty', subtitle: 'Add products to checkout.' },
          orderPlaced: { title: 'Order placed', subtitle: 'You can pay when shipping is set.' },
        },
      },
      petOwnerNotifications: {
        title: 'Notifications',
        subtitle: 'Alerts & updates',
        empty: 'No notifications found.',
        tabs: {
          unread: 'Unread',
          unreadWithCount: 'Unread ({{count}})',
          read: 'Read',
        },
        actions: {
          markAll: 'Mark all',
          marking: 'Marking...',
        },
        toasts: {
          markAllRead: 'All notifications marked as read',
        },
        errors: {
          markAllFailed: 'Failed to mark all as read',
          markReadFailed: 'Failed to mark as read',
        },
        defaults: {
          notification: 'Notification',
        },
      },
      petOwnerPharmacyHome: {
        header: {
          title: 'Pharmacy & Shop',
          subtitle: 'Pet supplies and medications',
        },
        banner: {
          title: 'Pet Pharmacy & Shop',
          subtitle: 'Everything your pet needs',
          description: 'Essentials, nutrition, medications and more from trusted pet pharmacies.',
        },
        sections: {
          featuredProducts: 'Featured products',
        },
        actions: {
          shopNow: 'Shop Now',
          findPharmacies: 'Find Pharmacies',
          viewAll: 'View all',
        },
        emptyProducts: 'No products yet. Browse all products or find a pharmacy.',
        defaults: {
          product: 'Product',
        },
      },
      petOwnerPharmacyCart: {
        empty: {
          title: 'Your cart is empty',
          subtitle: 'Add some products to your cart to continue shopping.',
        },
        labels: {
          sku: 'SKU: {{sku}}',
        },
        totals: {
          subtotal: 'Subtotal',
          shipping: 'Shipping',
          free: 'Free',
          total: 'Total',
        },
        actions: {
          startShopping: 'Start Shopping',
          clearCart: 'Clear cart',
          proceedToCheckout: 'Proceed to Checkout',
        },
      },
      petOwnerPharmacyPaymentSuccess: {
        title: 'Payment Successful!',
        subtitle: 'Your order has been placed. You can pay when the pharmacy sets shipping.',
        actions: {
          backToShop: 'Back to shop',
          viewOrders: 'View orders',
        },
      },
      petOwnerPharmacyDetails: {
        tabs: {
          overview: 'Overview',
          locations: 'Locations',
          products: 'Products',
        },
        actions: {
          browseProducts: 'Browse Products',
          callNow: 'Call Now',
          viewAllProducts: 'View All Products',
        },
        overview: {
          aboutTitle: 'About Pharmacy',
          aboutBody: '{{storeName}} provides quality pet healthcare products and services.',
          locatedAtSuffix: ' Located at {{storeAddress}}.',
        },
        locations: {
          title: 'Location Details',
        },
        errors: {
          notFound: 'Pharmacy not found.',
        },
        defaults: {
          pharmacy: 'Pharmacy',
          product: 'Product',
        },
      },
      petOwnerProductDetails: {
        soldBy: 'Sold by {{soldByName}}',
        sections: {
          productDetails: 'Product details',
        },
        labels: {
          description: 'Description',
          category: 'Category',
          quantity: 'Quantity',
        },
        actions: {
          addToCart: 'Add to cart',
          buyNow: 'Buy now',
        },
        defaults: {
          pharmacy: 'Pharmacy',
          product: 'Product',
          noDescription: 'No description.',
        },
        discountOff: '{{percent}}% off',
        stock: {
          inStock: 'In stock',
          inStockWithCount: 'In stock ({{count}})',
          outOfStock: 'Out of stock',
        },
        specs: {
          sku: 'SKU',
          stock: 'Stock',
          category: 'Category',
          stockUnits: '{{count}} units',
        },
        errors: {
          notFound: 'Product not found.',
        },
      },
      petOwnerPrescription: {
        title: 'Prescription',
        loadingPrescription: 'Loading prescription...',
        onlyAfterCompleted: 'Prescription is available only after the appointment is completed.',
        noPrescriptionYet: 'No prescription has been issued for this appointment yet.',
        meta: {
          appointment: 'Appointment {{appointmentNumber}}',
          veterinarian: 'Veterinarian: {{name}}',
          pet: 'Pet: {{name}}',
        },
        sections: {
          diagnosis: 'Diagnosis',
          allergies: 'Allergies',
          clinicalNotes: 'Clinical notes',
          medications: 'Medications',
          recommendedTests: 'Recommended tests',
          followUp: 'Follow-up',
          advice: 'Advice',
        },
        medFields: {
          strength: 'Strength: {{value}}',
          dosage: 'Dosage: {{value}}',
          frequency: 'Frequency: {{value}}',
          duration: 'Duration: {{value}}',
          quantity: 'Qty: {{value}}',
          refills: 'Refills: {{value}}',
        },
        errors: {
          appointmentIdRequired: 'Appointment ID is required.',
          appointmentNotFound: 'Appointment not found.',
        },
      },
      petOwnerWallet: {
        availableBalance: 'Available balance',
        actions: {
          topUp: 'Top up',
        },
      },
      petOwnerMore: {
        role: 'Pet Owner',
        defaults: {
          avatarLetter: 'P',
          petOwnerName: 'Pet Owner',
        },
      },
      petOwnerDocuments: {
        actions: {
          download: 'Download',
        },
        mockDocs: {
          vaccinationCertificateMax: 'Vaccination certificate - Max',
          invoiceTx1: 'Invoice #tx-1',
          date1: 'Feb 10, 2024',
        },
      },
      petOwnerWeightRecords: {
        title: 'Weight Records',
        subtitle: "Track your pet's weight history recorded during appointments",
        filters: {
          pet: 'Pet',
          allPets: 'All Pets',
        },
        latest: {
          title: 'Latest Weight',
        },
        history: {
          title: 'History',
        },
        empty: {
          latest: 'No weight records yet',
          history: 'No weight records found',
        },
        pagination: {
          pageOf: 'Page {{page}} of {{pages}}',
        },
        defaults: {
          pet: 'Pet',
          unitKg: ' kg',
        },
      },
      more: {
        petOwner: {
          myPetsHealth: 'My Pets & Health',
          appointmentsFavourites: 'Appointments & Favourites',
          financeOrders: 'Finance & Orders',
          settingsMore: 'Settings & More',
          petOwner: 'Pet Owner',
        },
        vet: {
          practice: 'Practice',
          financeInvoices: 'Finance & Invoices',
          contentSettings: 'Content & Settings',
          veterinarian: 'Veterinarian',
        },
        pharmacy: {
          pharmacy: 'Pharmacy',
          parapharmacy: 'Parapharmacy',
        },
      },
      menu: {
        myPets: 'My Pets',
        petMedicalRecords: 'Pet Medical Records',
        weightRecords: 'Weight Records',
        favoriteVets: 'Favorite Veterinarians',
        requestReschedule: 'Request Reschedule',
        rescheduleRequests: 'Reschedule Requests',
        veterinaryInvoices: 'Veterinary Invoices',
        petSupplyOrders: 'Pet Supply Orders',
        nearbyClinics: 'Nearby Clinics',
        notifications: 'Notifications',
        accountSettings: 'Account Settings',
        changePassword: 'Change Password',
        language: 'Language',

        petRequests: 'Pet Requests',
        clinicHours: 'Clinic Hours',
        myPetsPatients: 'My Pets (Patients)',
        vaccinations: 'Vaccinations',
        reviews: 'Reviews',
        invoices: 'Invoices',
        paymentSettings: 'Payment Settings',
        clinicAnnouncements: 'Clinic Announcements',
        subscription: 'Subscription',
        profileSettings: 'Profile Settings',

        profile: 'Profile',
        payouts: 'Payouts',
      },
      profileSettings: {
        petOwnerTitle: 'Profile Settings',
        vetProfileImage: 'Profile Image',
        vetBasicInformation: 'Basic Information',
        vetConsultationFees: 'Consultation Fees',
        vetProfessionalMemberships: 'Professional Memberships',
        choosePhoto: 'Choose Photo',
        uploadPhoto: 'Upload Photo',
        uploading: 'Uploading...',
        photoHintPetOwner: 'Image below 4 MB, jpg, png, svg',
        photoHintVet: 'Below 4MB, JPG, PNG, SVG',
      },
    },
  },
  it: {
    translation: {
      common: {
        cancel: 'Annulla',
        save: 'Salva',
        saveChanges: 'Salva modifiche',
        remove: 'Rimuovi',
        delete: 'Elimina',
        close: 'Chiudi',
        retry: 'Riprova',
        all: 'Tutti',
        select: 'Seleziona',
        validation: 'Validazione',
        success: 'Successo',
        error: 'Errore',
        logout: 'Disconnetti',
        language: 'Lingua',
        view: 'Vedi',
        edit: 'Modifica',
        chat: 'Chat',
        veterinarian: 'Veterinario',
        petOwner: 'Proprietario',
        pet: 'Animale',
        yesterday: 'Ieri',
        na: 'N/D',
        done: 'Fine',
        back: 'Indietro',
        send: 'Invia',
        file: 'File',
      },
      vetClinicHours: {
        loading: 'Caricamento orari clinica...',
        addSlot: 'Aggiungi fascia',
        noSlots: 'Nessuna fascia. Aggiungi fasce per impostare la disponibilità.',
        unavailable: 'Non disponibile',
        toasts: {
          slotAdded: 'Fascia oraria aggiunta',
          slotDeleted: 'Fascia oraria eliminata',
          durationUpdated: 'Durata appuntamento aggiornata',
        },
        duration: {
          title: 'Durata appuntamento (minuti)',
          minutes: '{{count}} min',
          current: 'Attuale: {{count}} minuti per appuntamento',
          updating: 'Aggiornamento...',
          update: 'Aggiorna durata',
        },
        modal: {
          title: 'Aggiungi fascia oraria',
          startLabel: 'Ora inizio (es. 09:00)',
          endLabel: 'Ora fine (es. 17:00)',
          startPlaceholder: '09:00',
          endPlaceholder: '17:00',
          saving: 'Salvataggio...',
          save: 'Salva fascia',
        },
      },
      vetVaccinations: {
        searchPlaceholder: 'Cerca per animale o proprietario...',
        filters: {
          all: 'Tutti',
        },
        labels: {
          owner: 'Proprietario',
          vaccination: 'Vaccinazione',
          given: 'Somministrato',
          nextDue: 'Prossima scadenza',
          note: 'Nota',
        },
        status: {
          upToDate: 'Aggiornato',
          overdue: 'Scaduto',
          dueSoon: 'In scadenza',
        },
        empty: 'Nessun record vaccinale',
        errors: {
          loadFailed: 'Impossibile caricare le vaccinazioni',
        },
      },
      vetReviews: {
        searchPlaceholder: 'Cerca per proprietario o animale...',
        count_one: '{{count}} recensione',
        count_other: '{{count}} recensioni',
        ratingLabel: '{{count}} stella',
        filters: {
          all: 'Tutti',
        },
        labels: {
          pet: 'Animale',
        },
        replied: '✓ Risposto',
        reply: 'Rispondi',
        empty: 'Nessuna recensione corrisponde',
        errors: {
          loadFailed: 'Impossibile caricare le recensioni',
        },
      },
      vetPetRequests: {
        summaryTitle: 'Richieste in sospeso',
        loading: 'Caricamento richieste...',
        empty: 'Nessuna richiesta di appuntamento in sospeso',
        defaultReason: 'Consulenza',
        badges: {
          new: 'Nuovo',
        },
        labels: {
          owner: 'Proprietario',
        },
        booking: {
          videoCall: 'Videochiamata',
          clinicVisit: 'Visita in clinica',
        },
        actions: {
          processing: 'Elaborazione...',
          accept: 'Accetta',
          reject: 'Rifiuta',
        },
        toasts: {
          accepted: 'Appuntamento accettato!',
          rejected: 'Appuntamento rifiutato!',
        },
        rejectModal: {
          title: 'Rifiuta appuntamento',
          reasonLabel: 'Motivo (opzionale)',
          reasonPlaceholder: 'Inserisci motivo...',
          rejecting: 'Rifiuto...',
          rejectAppointment: 'Rifiuta appuntamento',
        },
      },
      vetInvoices: {
        searchPlaceholder: 'Cerca per fattura, animale o proprietario...',
        filters: {
          all: 'Tutti',
        },
        labels: {
          consultation: 'Consulenza',
          pet: 'Animale',
          owner: 'Proprietario',
        },
        empty: 'Nessuna fattura corrisponde',
        errors: {
          loadFailed: 'Impossibile caricare le fatture',
        },
      },
      vetInvoiceView: {
        notFound: 'Fattura non trovata',
        labels: {
          invoiceTransaction: 'Fattura / Transazione',
          amount: 'Importo',
          status: 'Stato',
          date: 'Data',
          appointment: 'Appuntamento',
          pet: 'Animale',
          owner: 'Proprietario',
        },
      },
      vetPaymentSettings: {
        status: {
          approved: 'Approvato',
          pending: 'In attesa',
          rejected: 'Rifiutato',
        },
        paymentMethods: {
          stripe: 'Stripe',
          bankTransfer: 'Bonifico bancario',
          paypal: 'PayPal',
        },
        actions: {
          configure: 'Configura',
          requestWithdrawal: 'Richiedi prelievo',
        },
        preferredPayoutMethod: {
          title: 'Metodo di pagamento preferito',
          subtitle: 'I tuoi guadagni verranno pagati usando il metodo fornito quando richiedi un prelievo.',
        },
        availableBalance: 'Saldo disponibile',
        withdrawalRequests: {
          title: 'Richieste di prelievo',
          empty: 'Nessuna richiesta di prelievo trovata',
          paymentMethod: 'Metodo di pagamento',
          amount: 'Importo',
          youReceive: 'Ricevi',
          fee: 'Commissione',
          noFee: 'Nessuna commissione',
          totalDeducted: 'Totale trattenuto',
        },
        withdrawModal: {
          title: 'Richiedi prelievo',
          availableBalance: 'Saldo disponibile',
          amountToWithdraw: 'Importo da prelevare',
          amountPlaceholder: 'Inserisci importo',
          paymentMethod: 'Metodo di pagamento',
          payoutDetails: 'Dettagli pagamento',
          payoutDetailsHint: 'IBAN / numero conto / email PayPal / email Stripe',
          payoutDetailsPlaceholder: 'Inserisci IBAN, numero conto o email',
          submitting: 'Invio…',
          submitRequest: 'Invia richiesta',
        },
      },
      vetRescheduleRequests: {
        loading: 'Caricamento richieste...',
        empty: 'Nessuna richiesta di riprogrammazione in sospeso.',
        errors: {
          loadFailed: 'Impossibile caricare le richieste',
          approveFailed: 'Impossibile approvare la richiesta',
          rejectFailed: 'Impossibile rifiutare la richiesta',
        },
        actions: {
          approve: 'Approva',
          reject: 'Rifiuta',
        },
        toasts: {
          selectDateTime: 'Seleziona nuova data e ora',
          approved: 'Richiesta approvata',
          rejected: 'Richiesta rifiutata',
          reasonMinChars: 'Il motivo deve essere almeno di {{count}} caratteri',
        },
        card: {
          requestFrom: 'Richiesta da {{name}}',
          original: 'Originale: {{value}}',
          preferredDate: 'Data preferita: {{value}}',
          preferredTime: 'Ora preferita: {{value}}',
        },
        approveModal: {
          title: 'Approva richiesta di riprogrammazione',
          newDate: 'Nuova data *',
          selectDate: 'Seleziona data',
          newTime: 'Nuova ora *',
          selectTime: 'Seleziona ora',
          feePercentage: 'Percentuale commissione',
          feePercentagePlaceholder: '50',
          fixedFeeOptional: 'Oppure commissione fissa (opzionale)',
          fixedFeePlaceholder: '',
          notesOptional: 'Note (opzionale)',
          notesPlaceholder: 'Inserisci note...',
          approving: 'Approvazione...',
        },
        rejectModal: {
          title: 'Rifiuta richiesta di riprogrammazione',
          reasonLabel: 'Motivo *',
          reasonPlaceholder: 'Inserisci motivo (min {{count}} caratteri)',
          rejecting: 'Rifiuto...',
        },
        timePicker: {
          title: 'Seleziona ora',
          hour: 'Ora',
          minute: 'Minuto',
          period: 'AM/PM',
          selected: 'Selezionato: {{value}}',
          select: 'Seleziona',
        },
      },
      vetNotifications: {
        title: 'Notifiche',
        subtitle: 'Avvisi e aggiornamenti',
        actions: {
          markAll: 'Segna tutte',
          marking: 'Segno...',
        },
        tabs: {
          all: 'Tutte',
          unread: 'Non lette',
          read: 'Lette',
        },
        empty: 'Nessuna notifica trovata.',
        fallbackTitle: 'Notifica',
        toasts: {
          markAllSuccess: 'Tutte le notifiche segnate come lette',
        },
        errors: {
          markAllFailed: 'Impossibile segnare tutte come lette',
          markReadFailed: 'Impossibile segnare come letta',
        },
        timeAgo: {
          justNow: 'Proprio ora',
          minutesAgo_one: '{{count}} minuto fa',
          minutesAgo_other: '{{count}} minuti fa',
          hoursAgo_one: '{{count}} ora fa',
          hoursAgo_other: '{{count}} ore fa',
          daysAgo_one: '{{count}} giorno fa',
          daysAgo_other: '{{count}} giorni fa',
        },
      },
      vetPrescription: {
        title: 'Prescrizione',
        loading: 'Caricamento appuntamento...',
        meta: {
          appointment: 'Appuntamento {{number}}',
          veterinarian: 'Veterinario: {{name}}',
          petOwner: 'Proprietario: {{name}}',
          pet: 'Animale: {{name}}',
        },
        actions: {
          downloadPdf: 'Scarica PDF',
          savePrescription: 'Salva prescrizione',
          saving: 'Salvataggio...',
          addMedication: '+ Aggiungi farmaco',
        },
        fields: {
          diagnosis: 'Diagnosi',
          allergies: 'Allergie',
          clinicalNotes: 'Note cliniche',
          medications: 'Farmaci',
          recommendedTests: 'Esami consigliati (uno per riga)',
          followUp: 'Follow-up',
          advice: 'Consigli',
          status: 'Stato',
        },
        placeholders: {
          diagnosis: 'Diagnosi',
          allergies: 'Allergie',
          clinicalNotes: 'Note cliniche',
          medicationNameRequired: 'Nome *',
          strength: 'Dosaggio',
          dosage: 'Dose',
          frequency: 'Frequenza',
          duration: 'Durata',
          quantity: 'Qtà',
          refills: 'Ricariche',
          instructions: 'Istruzioni',
          onePerLine: 'Uno per riga',
          followUp: 'Follow-up',
          advice: 'Consigli',
        },
        status: {
          issued: 'EMESSA',
          draft: 'BOZZA',
        },
        toasts: {
          saved: 'Prescrizione salvata',
        },
        info: {
          pdfNotSupported: 'Download PDF non supportato ancora in-app. Usa il web per il PDF.',
        },
        errors: {
          appointmentIdRequired: "L'ID appuntamento è obbligatorio",
          appointmentIdRequiredInline: "L'ID appuntamento è obbligatorio.",
          appointmentNotFound: 'Appuntamento non trovato.',
          onlyAfterCompleted: "La prescrizione può essere creata solo dopo che l'appuntamento è completato.",
          saveFirstToDownload: 'Salva la prescrizione prima di scaricare il PDF',
        },
      },
      vetProfileSettings: {
        loading: 'Caricamento profilo...',
        tabs: {
          basicDetails: 'Dati di base',
          specialtiesServices: 'Specialità e servizi',
          experience: 'Esperienza',
          education: 'Formazione',
          awards: 'Riconoscimenti',
          insurances: 'Assicurazioni',
          clinics: 'Cliniche',
          businessHours: 'Orari lavoro',
        },
        sections: {
          profileImage: 'Immagine profilo',
          basicInformation: 'Informazioni di base',
          consultationFees: 'Tariffe consulenza',
          professionalMemberships: 'Iscrizioni professionali',
        },
        fields: {
          firstName: 'Nome *',
          lastName: 'Cognome *',
          displayName: 'Nome visualizzato *',
          professionalTitle: 'Titolo professionale *',
          phone: 'Telefono *',
          email: 'Email *',
          biography: 'Biografia',
          inClinicFee: 'Tariffa consulenza in clinica',
          onlineFee: 'Tariffa consulenza online',
          organization: 'Organizzazione',
        },
        placeholders: {
          firstName: 'Nome',
          lastName: 'Cognome',
          displayName: 'Come vuoi essere chiamato',
          professionalTitle: 'es. DVM, Veterinario',
          phone: 'Telefono',
          email: 'Email',
          biography: 'Descrivi la tua esperienza e competenze...',
          feeExample: 'es. {{value}}',
          organizationExample: 'es. {{value}}',
        },
        actions: {
          uploadPhoto: 'Carica foto',
          uploading: 'Caricamento...',
          addMembership: '+ Aggiungi iscrizione',
          saving: 'Salvataggio...',
        },
        photoHint: 'Sotto 4MB, JPG, PNG, SVG',
        toasts: {
          uploadFailed: 'Caricamento non riuscito',
          uploadFailedGeneric: 'Impossibile caricare',
          profileImageUpdated: 'Immagine profilo aggiornata',
          profileImageRemoved: 'Immagine profilo rimossa',
          removeFailedGeneric: 'Impossibile rimuovere',
          profileUpdated: 'Profilo aggiornato',
          updateFailedGeneric: 'Impossibile aggiornare il profilo',
        },
      },
      vetChatDetail: {
        empty: 'Nessun messaggio',
        placeholders: {
          message: 'Scrivi un messaggio...',
        },
        errors: {
          missingConversation: 'Conversazione mancante',
          invalidConversation: 'Conversazione non valida',
          invalidAdminConversation: 'Chat admin non valida',
          invalidConversationDetails: 'Dettagli conversazione non validi',
          failedToSend: 'Impossibile inviare',
          failedToSendFile: 'Impossibile inviare il file',
          uploadFailed: 'Caricamento non riuscito',
          couldNotOpenFile: 'Impossibile aprire il file',
        },
      },
      vetAdminChat: {
        loading: 'Apertura chat admin...',
        empty: 'Nessun messaggio. Scrivi al supporto.',
        placeholders: {
          message: 'Scrivi al supporto...',
        },
        errors: {
          signInRequired: 'Effettua l’accesso',
          failedToOpen: 'Impossibile aprire la chat admin',
          failedToSend: 'Impossibile inviare',
          failedToSendFile: 'Impossibile inviare il file',
          uploadFailed: 'Caricamento non riuscito',
          couldNotOpenFile: 'Impossibile aprire il file',
        },
      },
      vetAnnouncements: {
        at: 'alle',
        new: 'Nuovo',
        stats: {
          unread_one: '{{count}} non letto',
          unread_other: '{{count}} non letti',
          pinned_one: '{{count}} in evidenza',
          pinned_other: '{{count}} in evidenza',
        },
        filters: {
          all: 'Tutti ({{count}})',
          unread: 'Non letti ({{count}})',
          pinned: 'In evidenza ({{count}})',
        },
        empty: {
          title: 'Nessun annuncio',
          subtitle: 'Sei aggiornato!',
        },
        priority: {
          urgent: 'URGENTE',
          important: 'IMPORTANTE',
          normal: 'NORMALE',
        },
        actions: {
          viewAttachment: '📎 Vedi allegato',
          viewLink: '🔗 Vedi link',
          markAsRead: 'Segna come letto',
        },
        pagination: {
          previous: '‹ Precedente',
          next: 'Successivo ›',
          pageOf: 'Pagina {{page}} di {{pages}}',
        },
        info: {
          title: 'Informazioni',
          body: 'Qui trovi gli annunci importanti della piattaforma. Quelli in evidenza restano in alto. Segna come letti per restare aggiornato.',
        },
        toasts: {
          markedAsRead: 'Annuncio segnato come letto',
        },
        errors: {
          markReadFailed: 'Impossibile segnare come letto',
          couldNotOpenLink: 'Impossibile aprire il link',
          couldNotOpenFile: 'Impossibile aprire il file',
        },
      },
      vetSubscription: {
        sectionTitle: 'Piani di abbonamento',
        currentPlan: 'Piano attuale: {{plan}}',
        noActivePlan: 'Nessun piano attivo',
        renewsOn: 'Rinnovo il: {{date}}',
        subscribeToUnlock: 'Abbonati per sbloccare prenotazioni e chat',
        unlimited: 'Illimitato',
        usage: 'Utilizzo: Privato {{privateUsed}} / {{privateTotal}}, Video {{videoUsed}} / {{videoTotal}}, Chat {{chatUsed}} / {{chatTotal}}',
        status: {
          active: 'Attivo',
          inactive: 'Inattivo',
        },
        badges: {
          mostPopular: 'Più popolare',
          currentPlan: 'Piano attuale',
        },
        planFallback: 'Piano',
        planName: 'PIANO {{name}}',
        perMonth: 'al mese',
        actions: {
          choosePlan: 'Scegli piano',
          processing: 'Elaborazione...',
          payNow: 'Paga ora',
        },
        modal: {
          title: 'Aggiorna abbonamento',
          selectedPlan: 'Piano selezionato: {{name}}',
          pricePerMonth: 'Prezzo: €{{price}} al mese',
          hint: 'Tocca Paga ora per confermare. Il pagamento verrà elaborato.',
        },
        info: {
          title: 'Informazioni abbonamento',
          body: 'Puoi cambiare piano in qualsiasi momento. Le modifiche sono immediate. Annulla quando vuoi senza vincoli.',
        },
        toasts: {
          updated: 'Abbonamento aggiornato',
        },
        errors: {
          purchaseFailed: 'Impossibile acquistare l’abbonamento',
        },
      },
      vetChangePassword: {
        title: 'Cambia password',
        subtitle: 'Inserisci la password attuale e scegli una nuova password.',
        fields: {
          currentPassword: 'Password attuale *',
          newPassword: 'Nuova password *',
          confirmNewPassword: 'Conferma nuova password *',
        },
        placeholders: {
          currentPassword: 'Inserisci password attuale',
          newPassword: 'Inserisci nuova password (min {{count}} caratteri)',
          confirmNewPassword: 'Conferma nuova password',
        },
        actions: {
          updating: 'Aggiornamento...',
        },
        toasts: {
          updated: 'Password aggiornata',
        },
        errors: {
          currentRequired: 'Inserisci la password attuale',
          newRequired: 'Inserisci una nuova password',
          minLength: 'La nuova password deve avere almeno {{count}} caratteri',
          mismatch: 'Le password non corrispondono',
          updateFailedGeneric: 'Impossibile aggiornare la password',
        },
      },
      vetBusinessSettings: {
        title: 'Orari lavoro',
        subtitle: 'Imposta la disponibilità della clinica per giorno',
        placeholders: {
          startTime: '09:00',
          endTime: '17:00',
        },
        alerts: {
          updated: 'Orari aggiornati.',
        },
        errors: {
          updateFailed: 'Impossibile aggiornare gli orari.',
        },
      },
      vetClinicsSettings: {
        title: 'Cliniche',
        fields: {
          clinicName: 'Nome clinica',
          address: 'Indirizzo',
          city: 'Città',
          state: 'Provincia/Stato',
          country: 'Paese',
          phone: 'Telefono',
        },
        placeholders: {
          name: 'Nome',
          address: 'Indirizzo completo',
          city: 'Città',
          state: 'Provincia/Stato',
          country: 'Paese',
          phone: 'Telefono clinica',
        },
        actions: {
          addClinic: '+ Aggiungi clinica',
          removeClinic: 'Rimuovi clinica',
        },
        validation: {
          addAtLeastOne: 'Aggiungi almeno una clinica con nome o indirizzo.',
        },
        alerts: {
          updated: 'Cliniche aggiornate.',
        },
        errors: {
          updateFailed: 'Impossibile aggiornare le cliniche.',
        },
      },
      vetExperienceSettings: {
        title: 'Esperienza',
        fields: {
          hospitalClinic: 'Ospedale / Clinica',
          designation: 'Ruolo',
          fromYear: 'Dal',
          toYear: 'Al',
        },
        placeholders: {
          name: 'Nome',
          designationExample: 'es. {{value}}',
          year: 'AAAA',
        },
        actions: {
          addExperience: '+ Aggiungi esperienza',
        },
        alerts: {
          updated: 'Esperienza aggiornata.',
        },
        errors: {
          updateFailed: 'Impossibile aggiornare l’esperienza.',
        },
      },
      vetEducationSettings: {
        title: 'Formazione',
        fields: {
          degree: 'Titolo',
          collegeUniversity: 'Università',
          year: 'Anno',
        },
        placeholders: {
          degreeExample: 'es. {{value}}',
          name: 'Nome',
          year: 'AAAA',
        },
        actions: {
          addEducation: '+ Aggiungi formazione',
        },
        alerts: {
          updated: 'Formazione aggiornata.',
        },
        errors: {
          updateFailed: 'Impossibile aggiornare la formazione.',
        },
      },
      vetAwardsSettings: {
        title: 'Riconoscimenti',
        fields: {
          awardTitle: 'Titolo riconoscimento',
          year: 'Anno',
        },
        placeholders: {
          awardTitleExample: 'es. {{value}}',
          year: 'AAAA',
        },
        actions: {
          addAward: '+ Aggiungi riconoscimento',
        },
        alerts: {
          updated: 'Riconoscimenti aggiornati.',
        },
        errors: {
          updateFailed: 'Impossibile aggiornare i riconoscimenti.',
        },
      },
      vetInsuranceSettings: {
        title: 'Assicurazioni',
        subtitle: 'Seleziona le assicurazioni accettate',
        empty: 'Nessuna assicurazione disponibile.',
        alerts: {
          updated: 'Assicurazioni aggiornate.',
        },
        errors: {
          updateFailed: 'Impossibile aggiornare le assicurazioni.',
        },
      },
      vetSpecialitiesSettings: {
        title: 'Specialità e servizi',
        fields: {
          specialization: 'Specialità',
          services: 'Servizi',
        },
        placeholders: {
          serviceName: 'Nome servizio',
          price: 'Prezzo',
          description: 'Descrizione',
        },
        actions: {
          addService: '+ Aggiungi servizio',
        },
        empty: 'Nessuna specialità disponibile.',
        validation: {
          selectSpecialization: 'Seleziona una specialità.',
          addService: 'Aggiungi almeno un servizio con un nome.',
        },
        alerts: {
          updated: 'Specialità e servizi aggiornati.',
        },
        errors: {
          updateFailed: 'Impossibile aggiornare.',
        },
      },
      vetAddVaccinations: {
        loading: 'Caricamento...',
        title: 'Aggiungi vaccini',
        weightIncluded: 'Il peso verrà incluso: {{value}} {{unit}}',
        fields: {
          vaccine: 'Vaccino *',
          date: 'Data',
          nextDueOptional: 'Prossima scadenza (opzionale)',
          batchNotesOptional: 'Lotto / Note (opzionale)',
        },
        placeholders: {
          vaccineIdOrName: 'ID vaccino o nome',
          date: 'AAAA-MM-GG',
          batchNumber: 'Numero lotto',
          notes: 'Note',
        },
        actions: {
          addAnother: '+ Aggiungi un altro vaccino',
          completing: 'Completamento...',
          completeAppointment: 'Completa appuntamento',
        },
        toasts: {
          addAtLeastOneOrGoBack: 'Aggiungi almeno un vaccino oppure torna indietro per aggiungere solo il peso',
          completed: 'Appuntamento completato',
        },
        errors: {
          appointmentNotFound: 'Appuntamento non trovato.',
        },
      },
      vetAddWeightRecord: {
        loading: 'Caricamento...',
        title: 'Registra peso',
        lastRecorded: 'Ultima registrazione:',
        fields: {
          weightValue: 'Valore peso *',
          unit: 'Unità',
          notesOptional: 'Note (opzionale)',
        },
        placeholders: {
          weightExample: 'es. {{value}}',
          notes: 'Note...',
        },
        actions: {
          nextAddVaccinations: 'Avanti: aggiungi vaccini',
          completing: 'Completamento...',
          completeWithThisWeight: 'Completa l’appuntamento con questo peso',
        },
        toasts: {
          validWeightRequired: 'Inserisci un valore di peso valido',
          weightMustBeGreaterThanZero: 'Il peso deve essere maggiore di 0',
          completedWithWeight: 'Appuntamento completato con registrazione peso',
        },
        errors: {
          appointmentNotFound: 'Appuntamento non trovato.',
        },
      },
      vetStartAppointment: {
        title: 'Sessione video',
        subtitle: 'Avvia la consulenza per l’appuntamento {{appointmentId}}. L’integrazione della videochiamata sarà aggiunta durante l’integrazione API.',
        actions: {
          endSession: 'Termina sessione (placeholder)',
        },
      },
      vetBlog: {
        actions: {
          createNewPost: 'Crea nuovo post',
        },
        mockPosts: {
          post1: {
            title: '5 consigli per la cura dentale',
            excerpt: 'Mantenere sani i denti del tuo animale...',
            body: 'Mantenere sani i denti del tuo animale è fondamentale per il suo benessere. Ecco cinque semplici consigli: spazzolare regolarmente, usare snack dentali, fare controlli periodici, monitorare l’alito e scegliere un’alimentazione equilibrata.',
          },
          post2: {
            title: 'Calendario vaccinale per cani',
            excerpt: 'Una guida completa alle tempistiche vaccinali...',
            body: 'I vaccini proteggono i cani da malattie importanti. Il veterinario consiglierà un calendario in base a età, stile di vita e rischi locali. Tieni aggiornati i documenti e chiedi informazioni su richiami e vaccini opzionali.',
          },
        },
      },
      vetBlogCreate: {
        fields: {
          title: 'Titolo',
          content: 'Contenuto',
        },
        placeholders: {
          title: 'Titolo del post',
          content: 'Scrivi il tuo post...',
        },
        actions: {
          publish: 'Pubblica',
        },
      },
      vetSocialMedia: {
        title: 'Link social',
        fields: {
          facebook: 'Facebook',
          instagram: 'Instagram',
          twitter: 'Twitter',
          linkedin: 'LinkedIn',
        },
        placeholders: {
          url: 'URL',
        },
      },
      languageScreen: {
        english: 'Inglese',
        italian: 'Italiano',
      },
      days: {
        monday: 'Lunedì',
        tuesday: 'Martedì',
        wednesday: 'Mercoledì',
        thursday: 'Giovedì',
        friday: 'Venerdì',
        saturday: 'Sabato',
        sunday: 'Domenica',
      },
      tabs: {
        home: 'Home',
        appointments: 'Appuntamenti',
        messages: 'Messaggi',
        more: 'Altro',
        pharmacy: 'Farmacia',
      },
      screens: {
        dashboard: 'Dashboard',
        products: 'Prodotti',
        orders: 'Ordini',
      },
      appointments: {
        tabs: {
          all: 'Tutti',
          upcoming: 'In arrivo',
          cancelled: 'Annullati',
          completed: 'Completati',
        },
        searchPlaceholderVet: 'Cerca animali o proprietari...',
        searchPlaceholderPetOwner: 'Cerca per veterinario o animale...',
        loading: 'Caricamento appuntamenti...',
        actions: {
          chat: 'Chat',
          view: 'Vedi',
        },
        errors: {
          cannotOpenChat: 'Impossibile aprire la chat per questo appuntamento',
          couldNotOpenChat: 'Impossibile aprire la chat',
        },
        empty: {
          all: 'Non hai appuntamenti.',
          upcoming: 'Non hai appuntamenti in arrivo.',
          cancelled: 'Non hai appuntamenti annullati al momento.',
          completed: 'Non hai ancora appuntamenti completati.',
          petOwnerAll: 'Nessun appuntamento trovato',
          petOwnerUpcoming: 'Nessun appuntamento in arrivo',
          petOwnerCancelled: 'Nessun appuntamento annullato',
          petOwnerCompleted: 'Nessun appuntamento completato',
        },
        labels: {
          owner: 'Proprietario',
          pet: 'Animale',
        },
      },
      pets: {
        searchPlaceholder: 'Cerca per animale o proprietario...',
        tabs: {
          active: 'Attivi',
          inactive: 'Inattivi',
        },
        filters: {
          all: 'Tutti',
        },
        labels: {
          owner: 'Proprietario',
          lastVisit: 'Ultima visita',
          added: 'Aggiunto',
        },
        empty: 'Nessun animale in questa lista',
        errors: {
          loadFailed: 'Impossibile caricare gli animali',
        },
      },
      simpleScreens: {
        appointment: {
          title: 'Schermata appuntamenti',
          subtitle: 'I tuoi prossimi appuntamenti appariranno qui.',
        },
      },
      vetDashboard: {
        welcomeBack: 'Bentornato',
        loading: 'Caricamento dashboard…',
        updates: {
          title: 'Hai aggiornamenti',
          unreadMessages_one: '{{count}} messaggio non letto',
          unreadMessages_other: '{{count}} messaggi non letti',
          unreadNotifications_one: '{{count}} notifica',
          unreadNotifications_other: '{{count}} notifiche',
        },
        subscription: {
          upgradeTitle: 'Aggiorna per più prenotazioni',
          upgradeSubtitle: "Attiva l'abbonamento per sbloccare le funzionalità",
          activeTitle: 'Abbonamento attivo',
          expiresIn_one: 'Scade tra {{count}} giorno',
          expiresIn_other: 'Scade tra {{count}} giorni',
        },
        stats: {
          todayAppointments: "Appuntamenti di oggi",
          thisWeek: 'Questa settimana',
          earnings: 'Guadagni',
          patients: 'Pazienti',
        },
        profile: {
          strengthTitle: 'Completamento profilo',
          strengthSubtitle: 'Completa il profilo per aumentare la fiducia',
          viewReviews: 'Vedi recensioni',
        },
        today: {
          title: 'Appuntamenti di oggi',
          seeAll: 'Vedi tutti',
          empty: 'Nessun appuntamento programmato per oggi',
        },
        quick: {
          title: 'Accesso rapido',
        },
      },
      messages: {
        searchPlaceholder: 'Cerca conversazioni...',
        adminMessages: 'Messaggi admin',
        empty: 'Ancora nessuna conversazione',
        unreadOverflow: '99+',
        errors: {
          loadFailed: 'Impossibile caricare le conversazioni',
        },
      },
      vetAppointmentDetail: {
        loading: 'Caricamento appuntamento...',
        notFound: {
          title: 'Appuntamento non trovato',
          subtitle: "Torna agli appuntamenti e selezionane uno.",
        },
        badges: {
          new: 'Nuovo',
        },
        labels: {
          owner: 'Proprietario',
          typeOfAppointment: 'Tipo di appuntamento',
          videoCall: '📹 Videochiamata',
          clinicVisit: '🏥 Visita in clinica',
          consultationFee: 'Consulenza: €50',
        },
        details: {
          dateTime: 'Data e ora',
          reason: 'Motivo visita',
          defaultReason: 'Consulenza',
          petSymptoms: 'Sintomi',
          notes: 'Note',
        },
        actions: {
          accepting: 'Accettazione...',
          acceptAppointment: 'Accetta appuntamento',
          reject: 'Rifiuta',
          markCompleted: 'Segna come completato',
          updating: 'Aggiornamento...',
          markNoShow: 'Segna come assente',
          startVideo: 'Avvia sessione video',
          chatWithPetOwner: '💬 Chat con proprietario',
          prescription: 'Prescrizione',
        },
        completeModal: {
          title: 'Completa appuntamento e registra vaccinazioni',
          weightOptional: 'Peso (opzionale)',
          valuePlaceholder: 'Valore',
          weightNotesPlaceholder: 'Note sul peso (opzionale)',
          vaccinationsOptional: 'Vaccinazioni (opzionale)',
          datePlaceholder: 'Data (AAAA-MM-GG)',
          nextDuePlaceholder: 'Prossima scadenza (AAAA-MM-GG)',
          batchNumberPlaceholder: 'Numero lotto (opzionale)',
          notesPlaceholder: 'Note (opzionale)',
          addAnotherVaccine: '+ Aggiungi un altro vaccino',
          completing: 'Completamento...',
          completeAppointment: 'Completa appuntamento',
        },
        rejectModal: {
          title: 'Rifiuta appuntamento',
          confirmText: 'Vuoi rifiutare questo appuntamento?',
          reasonLabel: 'Motivo (opzionale)',
          reasonPlaceholder: 'Inserisci motivo...',
          rejecting: 'Rifiuto...',
          rejectAppointment: 'Rifiuta appuntamento',
        },
        toasts: {
          accepted: 'Appuntamento accettato',
          rejected: 'Appuntamento rifiutato',
          completed: 'Appuntamento completato',
          noShow: 'Appuntamento segnato come assente',
        },
        errors: {
          couldNotOpenChat: 'Impossibile aprire la chat',
        },
      },
      vetStack: {
        VetAppointmentDetails: { title: 'Dettagli appuntamento', subtitle: 'Appuntamento' },
        VetStartAppointment: { title: 'Sessione video', subtitle: 'Avvia consulenza' },
        VetPetRequests: { title: 'Richieste', subtitle: 'Gestisci richieste' },
        VetClinicHours: { title: 'Orari clinica', subtitle: 'Disponibilità' },
        VetMyPets: { title: 'I miei animali', subtitle: 'Pazienti e proprietari' },
        VetVaccinations: { title: 'Vaccinazioni', subtitle: 'Registro vaccini' },
        VetReviews: { title: 'Recensioni', subtitle: 'Valutazioni' },
        VetInvoices: { title: 'Fatture', subtitle: 'Storico transazioni' },
        VetInvoiceView: { title: 'Fattura', subtitle: 'Dettagli transazione' },
        VetPaymentSettings: { title: 'Pagamenti', subtitle: 'Payout e banca' },
        VetRescheduleRequests: { title: 'Riprogrammazioni', subtitle: 'Gestisci richieste' },
        Language: { title: 'Lingua', subtitle: 'Scegli lingua' },
        VetChatDetail: { title: 'Chat', subtitle: 'Conversazione' },
        VetAdminChat: { title: 'Messaggi admin', subtitle: 'Supporto' },
        VetNotifications: { title: 'Notifiche', subtitle: 'Avvisi e aggiornamenti' },
        VetBlogList: { title: 'Articoli', subtitle: 'I tuoi post' },
        VetBlogCreate: { title: 'Nuovo articolo', subtitle: 'Crea post' },
        VetBlogDetail: { title: 'Articolo', subtitle: 'Dettagli' },
        VetAnnouncements: { title: 'Annunci', subtitle: 'Annunci clinica' },
        VetSubscription: { title: 'Abbonamento', subtitle: 'Il tuo piano' },
        VetProfileSettings: { title: 'Profilo', subtitle: 'Modifica profilo' },
        VetSpecialities: { title: 'Specialità', subtitle: 'Servizi offerti' },
        VetExperienceSettings: { title: 'Esperienza', subtitle: 'Storia lavorativa' },
        VetEducationSettings: { title: 'Formazione', subtitle: 'Qualifiche' },
        VetAwardsSettings: { title: 'Premi', subtitle: 'Riconoscimenti' },
        VetInsuranceSettings: { title: 'Assicurazioni', subtitle: 'Assicurazioni accettate' },
        VetClinicsSettings: { title: 'Cliniche', subtitle: 'Sedi' },
        VetBusinessSettings: { title: 'Orari lavoro', subtitle: 'Disponibilità' },
        VetSocialMedia: { title: 'Social', subtitle: 'Link social' },
        VetChangePassword: { title: 'Cambia password', subtitle: 'Aggiorna password' },
        VetPrescription: { title: 'Prescrizione', subtitle: 'Crea o visualizza' },
        VetAddWeightRecord: { title: 'Registra peso', subtitle: 'Aggiungi peso e completa' },
        VetAddVaccinations: { title: 'Aggiungi vaccini', subtitle: 'Registra vaccini e completa' },
      },
      petOwnerStack: {
        PetOwnerAppointmentDetails: { title: 'Dettagli appuntamento', subtitle: 'Appuntamento animale' },
        PetOwnerRequestReschedule: { title: 'Richiedi riprogrammazione', subtitle: 'Scegli nuova data/ora' },
        PetOwnerRescheduleRequests: { title: 'Riprogrammazioni', subtitle: 'Traccia richieste' },
        PetOwnerPrescription: { title: 'Prescrizione', subtitle: 'Vedi prescrizione' },
        PetOwnerVideoCall: { title: 'Videochiamata', subtitle: 'Entra in consulenza' },
        PetOwnerFavourites: { title: 'Veterinari preferiti', subtitle: 'I tuoi preferiti' },
        PetOwnerMyPets: { title: 'I miei animali', subtitle: 'Gestisci i tuoi animali' },
        PetOwnerAddPet: { title: 'Aggiungi animale', subtitle: 'Registra un nuovo animale' },
        PetOwnerEditPet: { title: 'Modifica animale', subtitle: 'Aggiorna dettagli' },
        PetOwnerMedicalRecords: { title: 'Cartelle cliniche', subtitle: 'Storia salute' },
        PetOwnerMedicalDetails: { title: 'Parametri animali', subtitle: 'Parametri e peso' },
        PetOwnerWeightRecords: { title: 'Registro peso', subtitle: 'Storico peso' },
        PetOwnerWallet: { title: 'Portafoglio', subtitle: 'Saldo e ricarica' },
        PetOwnerInvoices: { title: 'Fatture', subtitle: 'Storico transazioni' },
        PetOwnerInvoiceView: { title: 'Fattura', subtitle: 'Dettagli transazione' },
        PetOwnerOrderHistory: { title: 'Ordini prodotti', subtitle: 'Storico ordini' },
        PetOwnerOrderDetails: { title: 'Dettagli ordine', subtitle: 'Info ordine' },
        PetOwnerDocuments: { title: 'Documenti', subtitle: 'Download e ricevute' },
        PetOwnerNotifications: { title: 'Notifiche', subtitle: 'Avvisi e aggiornamenti' },
        PetOwnerChatDetail: { title: 'Chat', subtitle: 'Conversazione' },
        PetOwnerClinicMap: { title: 'Cliniche vicine', subtitle: 'Trova cliniche' },
        PetOwnerClinicNavigation: { title: 'Navigazione clinica', subtitle: 'Indicazioni' },
        PetOwnerProfileSettings: { title: 'Impostazioni account', subtitle: 'Modifica profilo' },
        PetOwnerChangePassword: { title: 'Cambia password', subtitle: 'Aggiorna password' },
        Language: { title: 'Lingua', subtitle: 'Scegli lingua' },
        PetOwnerSearch: { title: 'Trova veterinario', subtitle: 'Cerca' },
        PetOwnerVetProfile: { title: 'Veterinario', subtitle: 'Profilo e prenota' },
        PetOwnerBooking: { title: 'Prenota', subtitle: 'Seleziona data e ora' },
        PetOwnerBookingCheckout: { title: 'Conferma prenotazione', subtitle: 'Riepilogo e paga' },
        PetOwnerBookingSuccess: { title: 'Prenotato', subtitle: 'Appuntamento confermato' },
        PetOwnerCart: { title: 'Carrello', subtitle: 'Prodotti per animali' },
        PetOwnerCheckout: { title: 'Checkout', subtitle: 'Riepilogo e paga' },
        PetOwnerPaymentSuccess: { title: 'Pagamento riuscito', subtitle: 'Ordine confermato' },
      },
      petOwnerTabs: {
        PetOwnerHome: { subtitle: 'La salute dei tuoi animali a colpo d’occhio' },
        PetOwnerAppointments: { subtitle: 'Pianifica e gestisci' },
        PetOwnerPharmacy: { subtitle: 'Prodotti per animali' },
        PetOwnerMessages: { subtitle: 'Chat con veterinari' },
        PetOwnerMore: { subtitle: 'Impostazioni e altro' },
      },
      petOwnerPharmacyStack: {
        PharmacyHome: { title: 'Farmacia e shop', subtitle: 'Prodotti per animali' },
        PharmacySearch: { title: 'Trova farmacie', subtitle: 'Cerca' },
        PharmacyDetails: { title: 'Farmacia', subtitle: 'Dettagli' },
        ProductCatalog: { title: 'Prodotti', subtitle: 'Sfoglia' },
        ProductDetails: { title: 'Prodotto', subtitle: 'Dettagli' },
        Cart: { title: 'Carrello', subtitle: 'I tuoi articoli' },
        Checkout: { title: 'Checkout', subtitle: 'Riepilogo e paga' },
        PaymentSuccess: { title: 'Successo', subtitle: 'Ordine effettuato' },
      },
      petOwnerPlaceholders: {
        calendar: {
          weekdays: {
            sundayShort: 'D',
            mondayShort: 'L',
            tuesdayShort: 'M',
            wednesdayShort: 'M',
            thursdayShort: 'G',
            fridayShort: 'V',
            saturdayShort: 'S',
          },
        },
        timePicker: {
          title: 'Seleziona ora',
          hour: 'Ora',
          minute: 'Minuti',
          amPm: 'AM/PM',
          selected: 'Selezionato: {{value}}',
          select: 'Seleziona',
        },
        requestReschedule: {
          title: 'Richiedi riprogrammazione',
          subtitle: 'Seleziona un appuntamento online perso e invia la richiesta.',
          loadingEligible: 'Caricamento appuntamenti idonei...',
          empty: 'Nessun appuntamento è idoneo alla riprogrammazione.',
          fields: {
            selectAppointment: 'Seleziona appuntamento perso *',
            preferredDateOptional: 'Nuova data preferita (opzionale)',
            preferredTimeOptional: 'Nuova ora preferita (opzionale)',
            reason: 'Motivo *',
          },
          placeholders: {
            selectDate: 'Seleziona data',
            selectTime: 'Seleziona ora',
            reason: 'Spiega perché hai perso l’appuntamento (min 10 caratteri)',
          },
          labels: {
            appointmentNumber: 'Appuntamento: {{value}}',
          },
          hint: {
            feeAfterApproval: 'Dopo l’approvazione, potrebbe essere necessario pagare una tariffa per confermare il nuovo appuntamento.',
          },
          actions: {
            submitting: 'Invio...',
            submit: 'Invia richiesta',
          },
          toasts: {
            selectAppointment: 'Seleziona un appuntamento',
            reasonMinChars: 'Il motivo deve essere di almeno {{count}} caratteri',
            submitted: 'Richiesta di riprogrammazione inviata',
          },
          errors: {
            loadEligibleFailed: 'Impossibile caricare gli appuntamenti idonei',
            submitFailed: 'Impossibile inviare la richiesta di riprogrammazione',
          },
        },
        rescheduleRequests: {
          title: 'Riprogrammazioni',
          subtitle: 'Traccia le richieste e paga le tariffe dopo l’approvazione.',
          loading: 'Caricamento richieste...',
          empty: 'Nessuna richiesta di riprogrammazione trovata.',
          labels: {
            original: 'Originale',
            fee: 'Tariffa',
            newAppointment: 'Nuovo appuntamento',
          },
          status: {
            approved: 'APPROVATO',
            pending: 'IN ATTESA',
            rejected: 'RIFIUTATO',
            cancelled: 'ANNULLATO',
            unknown: '—',
          },
          actions: {
            request: 'Richiedi',
            viewRejectionReason: 'Vedi motivo rifiuto',
            processing: 'Elaborazione...',
            payFee: 'Paga tariffa',
          },
          payModal: {
            title: 'Paga tariffa riprogrammazione',
            feeLabel: 'Tariffa:',
            hint: 'Clicca conferma per procedere.',
            confirm: 'Conferma pagamento',
          },
          toasts: {
            paid: 'Tariffa pagata. Appuntamento confermato.',
          },
          errors: {
            loadFailed: 'Impossibile caricare le richieste',
            paymentFailed: 'Pagamento non riuscito',
          },
        },
        clinicNavigation: {
          defaults: {
            clinic: 'Clinica',
          },
          map: {
            yourLocation: 'La tua posizione',
          },
          missing: {
            title: 'Navigazione clinica',
            message: 'Coordinate della clinica mancanti.',
          },
          locationDisabled: 'Posizione disattivata: le informazioni sul percorso potrebbero essere limitate',
          directions: {
            title: 'Indicazioni',
            calculating: 'Calcolo percorso...',
            distance: 'Distanza',
            eta: 'Tempo stimato',
            continue: 'Continua',
            openInGoogleMaps: 'Apri le indicazioni in Google Maps per la navigazione passo-passo.',
          },
          actions: {
            getDirections: 'Ottieni indicazioni',
            call: 'Chiama',
          },
          errors: {
            routeInfoFailed: 'Impossibile caricare le informazioni sul percorso',
            couldNotOpenMaps: 'Impossibile aprire le mappe',
            couldNotStartCall: 'Impossibile avviare la chiamata',
          },
        },
        simpleScreens: {
          prescription: { title: 'Prescrizione', subtitle: 'Vedi prescrizione del veterinario' },
          videoCall: { title: 'Videochiamata', subtitle: 'Entra in consulenza' },
          search: { title: 'Trova veterinario', subtitle: 'Cerca per posizione o specialità' },
          vetProfile: { title: 'Profilo veterinario', subtitle: 'Vedi profilo e prenota' },
          booking: { title: 'Prenota', subtitle: 'Seleziona data, ora, animale' },
          cart: { title: 'Carrello', subtitle: 'Carrello prodotti' },
          checkout: { title: 'Checkout', subtitle: 'Riepilogo e paga' },
          paymentSuccess: { title: 'Pagamento riuscito', subtitle: 'Ordine confermato' },
        },
      },
      petOwnerMedicalRecords: {
        tabs: {
          medical: 'Cartelle cliniche',
          vaccinations: 'Vaccinazioni',
          prescriptions: 'Prescrizioni',
        },
        searchPlaceholder: 'Cerca documenti...',
        empty: 'Nessun record trovato',
        actions: {
          addRecord: 'Aggiungi record',
        },
        upcoming: {
          title: 'In arrivo (prossimi 30 giorni)',
        },
        labels: {
          pet: 'Animale:',
          date: 'Data:',
          file: 'File:',
          type: 'Tipo:',
          nextDue: 'Prossima scadenza:',
          veterinarian: 'Veterinario:',
        },
        recordTypes: {
          GENERAL: 'Generale',
          LAB_REPORT: 'Referto laboratorio',
          XRAY: 'Radiografia',
          VACCINATION: 'Vaccinazione',
          SURGERY: 'Chirurgia',
          WEIGHT: 'Peso',
          PRESCRIPTION: 'Prescrizione',
          OTHER: 'Altro',
        },
        prescriptions: {
          title: 'Prescrizione #{{id}}',
          view: 'Vedi prescrizione',
        },
        addModal: {
          title: 'Aggiungi record medico',
          fields: {
            pet: 'Animale *',
            title: 'Titolo *',
            description: 'Descrizione',
            recordType: 'Tipo record',
          },
          placeholders: {
            title: 'es. Risultato analisi',
            description: 'Opzionale',
            selectFile: 'Seleziona file (immagine/PDF) *',
          },
        },
        validation: {
          selectPet: 'Seleziona un animale',
          titleRequired: 'Il titolo è obbligatorio',
          selectFile: 'Seleziona un file',
        },
        deleteConfirm: {
          title: 'Elimina record',
          message: 'Eliminare questo record medico?',
        },
        alerts: {
          added: 'Record medico aggiunto',
          deleted: 'Record eliminato',
          updated: 'Aggiornato',
        },
        errors: {
          addFailed: 'Impossibile aggiungere il record',
          deleteFailed: 'Impossibile eliminare',
        },
      },
      petOwnerClinicMap: {
        defaults: {
          clinic: 'Clinica',
        },
        map: {
          yourLocation: 'La tua posizione',
          kmAwaySuffix: 'km di distanza',
          loading: 'Caricamento mappa...',
          gettingLocation: 'Rilevamento posizione...',
        },
        radiusLabel: 'Raggio ricerca: {{value}} km',
        distanceAway: '{{value}} km di distanza',
        loading: {
          findingNearby: 'Ricerca cliniche vicine...',
          loadingClinics: 'Caricamento cliniche...',
        },
        errors: {
          loadFailed: 'Impossibile caricare le cliniche',
          vetInfoNotAvailable: 'Informazioni veterinario non disponibili',
          clinicCoordsNotAvailable: 'Coordinate clinica non disponibili',
        },
        toasts: {
          permissionDenied: {
            title: 'Permesso posizione negato',
            subtitle: 'Uso una posizione predefinita per la ricerca.',
          },
          couldNotGetLocation: {
            title: 'Impossibile ottenere la posizione',
            subtitle: 'Uso una posizione predefinita per la ricerca.',
          },
          locationUpdated: 'Posizione aggiornata',
          couldNotUpdateLocation: 'Impossibile aggiornare la posizione',
        },
        list: {
          nearbyClinics: 'Cliniche vicine',
          locationDisabled: 'Posizione disattivata',
        },
        empty: {
          title: 'Nessuna clinica trovata nelle vicinanze',
          subtitle: 'Prova ad aumentare il raggio di ricerca',
        },
        modal: {
          labels: {
            veterinarian: 'Veterinario',
            address: 'Indirizzo',
            phone: 'Telefono',
            distance: 'Distanza',
          },
          actions: {
            viewVeterinarian: 'Vedi veterinario',
            bookAppointment: 'Prenota',
            navigate: 'Naviga',
          },
        },
      },
      petOwnerProfileSettings: {
        title: 'Impostazioni profilo',
        photo: {
          placeholder: 'Foto',
        },
        genders: {
          select: 'Seleziona',
          male: 'Maschio',
          female: 'Femmina',
          other: 'Altro',
        },
        settingsNav: {
          profile: 'Profilo',
          changePassword: 'Cambia password',
          twoFactor: 'Autenticazione 2 fattori',
          deleteAccount: 'Elimina account',
        },
        sections: {
          address: 'Indirizzo',
          emergency: 'Contatto emergenza',
        },
        fields: {
          name: { label: 'Nome *', placeholder: 'Inserisci il tuo nome' },
          gender: { label: 'Genere' },
          dob: { label: 'Data di nascita', placeholder: 'AAAA-MM-GG' },
          phone: { label: 'Telefono', placeholder: 'Inserisci telefono' },
          email: { label: 'Email', placeholder: 'Email' },
          bloodGroup: { label: 'Gruppo sanguigno', placeholder: 'es. O+' },
          addressLine1: { label: 'Indirizzo *', placeholder: 'Inserisci indirizzo' },
          addressLine2: { label: 'Indirizzo (riga 2)', placeholder: 'Appartamento, interno, ecc.' },
          city: { label: 'Città', placeholder: 'Città' },
          state: { label: 'Provincia', placeholder: 'Provincia' },
          country: { label: 'Paese', placeholder: 'Paese' },
          zip: { label: 'CAP', placeholder: 'CAP' },
          emergencyName: { label: 'Nome', placeholder: 'Nome contatto emergenza' },
          emergencyPhone: { label: 'Telefono', placeholder: 'Telefono contatto emergenza' },
          emergencyRelation: { label: 'Relazione', placeholder: 'Relazione' },
        },
        alerts: {
          updated: 'Profilo aggiornato con successo',
        },
        errors: {
          uploadImageFailed: 'Impossibile caricare l’immagine',
          removeImageFailed: 'Impossibile rimuovere l’immagine',
          uploadFailed: 'Caricamento non riuscito',
          updateFailed: 'Impossibile aggiornare il profilo',
        },
      },
      petOwnerHome: {
        welcomeBack: 'Bentornato',
        loading: 'Caricamento dashboard…',
        defaults: {
          specialty: 'Veterinaria',
        },
        notifications: {
          title_one: 'Hai {{count}} nuova notifica',
          title_other: 'Hai {{count}} nuove notifiche',
          subtitle: 'Tocca per vedere gli aggiornamenti',
        },
        cta: {
          bookAppointmentTitle: 'Prenota un appuntamento',
          bookAppointmentSubtitle: 'Trova un veterinario vicino a te',
        },
        stats: {
          clinicsVisited: 'Cliniche visitate',
        },
        sections: {
          favorites: {
            title: 'Veterinari preferiti',
            empty: 'Nessun veterinario preferito. Cercane uno dalla ricerca.',
          },
          upcoming: {
            title: 'Appuntamenti in arrivo',
            empty: 'Nessun appuntamento in arrivo',
          },
        },
        actions: {
          viewAll: 'Vedi tutti',
          seeAll: 'Vedi tutto',
        },
        activity: {
          title: 'La tua attività',
          subtitle: 'Una rapida panoramica del tuo percorso di cura',
          completed: 'Completati',
          newAlerts: 'Nuovi avvisi',
        },
      },
      petOwnerAppointmentDetail: {
        loading: 'Caricamento appuntamento...',
        notFound: 'Appuntamento non trovato',
        labels: {
          dateTime: 'Data e ora',
          type: 'Tipo',
          reason: 'Motivo',
          consultationFee: 'Tariffa consulenza',
          petSymptoms: 'Sintomi animale',
          notes: 'Note',
        },
        defaults: {
          consultation: 'Consulenza',
          vetAvatarLetter: 'V',
        },
        bookingTypes: {
          videoCall: 'Videochiamata',
          clinicVisit: 'Visita in clinica',
        },
        actions: {
          joinVideoCall: 'Entra in videochiamata',
          chatWithVet: '💬 Chat con veterinario',
          viewPrescription: 'Vedi / Scarica prescrizione',
          cancelAppointment: 'Annulla appuntamento',
        },
        reschedule: {
          title: 'Appuntamento perso?',
          subtitle: 'Se non è stata avviata alcuna videochiamata, puoi richiedere una riprogrammazione.',
          action: 'Richiedi riprogrammazione',
        },
        review: {
          submitted: 'Recensione inviata',
          write: 'Scrivi una recensione',
        },
        reviewModal: {
          title: 'Scrivi una recensione',
          ratingLabel: 'Valutazione (1-5)',
          reviewLabel: 'La tua recensione *',
          reviewPlaceholder: 'Scrivi la tua recensione...',
          submitting: 'Invio...',
          submit: 'Invia recensione',
        },
        cancelModal: {
          title: 'Annulla appuntamento',
          message: 'Sei sicuro di voler annullare questo appuntamento?',
          reasonLabel: 'Motivo (opzionale)',
          reasonPlaceholder: 'Inserisci motivo...',
          keep: 'Mantieni appuntamento',
          cancelling: 'Annullamento...',
        },
        errors: {
          couldNotOpenChat: 'Impossibile aprire la chat',
        },
        toasts: {
          cancelled: 'Appuntamento annullato con successo',
          reviewRequired: 'Inserisci una recensione',
          vetNotFound: 'Veterinario non trovato',
          reviewSubmitted: 'Recensione inviata',
        },
      },
      petOwnerSearch: {
        defaults: {
          specialty: 'Veterinaria',
        },
        placeholders: {
          searchByName: 'Cerca per nome',
          city: 'Città',
        },
        filters: {
          onlineNow: 'Online ora',
        },
        actions: {
          clearFilters: 'Azzera filtri',
          viewProfile: 'Vedi profilo',
          book: 'Prenota',
        },
        results: {
          showing: 'Mostrati {{total}} veterinari',
        },
        status: {
          available: 'Disponibile',
          unavailable: 'Non disponibile',
        },
        pagination: {
          previous: 'Precedente',
          next: 'Successivo',
          pageOf: 'Pagina {{page}} di {{pages}}',
        },
        empty: 'Nessun veterinario trovato. Prova filtri diversi.',
        errors: {
          loadFailed: 'Impossibile caricare i veterinari',
          addFavoriteFailed: 'Impossibile aggiungere',
          removeFavoriteFailed: 'Impossibile rimuovere',
        },
        toasts: {
          loginRequired: 'Accedi come proprietario per aggiungere preferiti',
          addedToFavorites: 'Aggiunto ai preferiti',
          removedFromFavorites: 'Rimosso dai preferiti',
        },
      },
      petOwnerVetProfile: {
        defaults: {
          title: 'Professionista veterinario',
          specialty: 'Veterinaria',
          service: 'Servizio',
          hospital: 'Ospedale',
          degree: 'Titolo',
          award: 'Premio',
          clinic: 'Clinica',
        },
        status: {
          available: 'Disponibile',
          unavailable: 'Non disponibile',
        },
        fees: {
          online: 'Online: €{{amount}}',
          clinic: 'Clinica: €{{amount}}',
        },
        stats: {
          reviews: 'Recensioni',
          yearsExperience: 'Anni di esperienza',
          recommend: 'Consiglia',
        },
        sections: {
          bio: 'Breve bio',
          services: 'Servizi e prezzi',
          experience: 'Esperienza',
          education: 'Formazione',
          awards: 'Premi',
          speciality: 'Specialità',
          clinics: 'Cliniche',
          memberships: 'Iscrizioni',
          reviews: 'Recensioni',
        },
        reviews: {
          empty: 'Nessuna recensione ancora.',
        },
        since: 'Dal {{year}}',
        actions: {
          bookAppointment: 'Prenota appuntamento',
        },
        errors: {
          addFavoriteFailed: 'Impossibile aggiungere',
          removeFavoriteFailed: 'Impossibile rimuovere',
        },
        toasts: {
          loginRequired: 'Accedi come proprietario per aggiungere preferiti',
          addedToFavorites: 'Aggiunto ai preferiti',
          removedFromFavorites: 'Rimosso dai preferiti',
        },
      },
      petOwnerBooking: {
        loading: 'Caricamento...',
        subtitle: 'Prenota un appuntamento veterinario',
        labels: {
          appointmentType: 'Tipo di appuntamento',
          pet: 'Animale',
          date: 'Data',
          timeSlot: 'Fascia oraria',
          reason: 'Motivo',
          petSymptomsOptional: 'Sintomi animale (opzionale)',
        },
        placeholders: {
          selectDate: 'Seleziona data',
          reason: 'es. Vaccinazione, febbre, controllo',
          petSymptoms: 'Descrivi i sintomi...',
        },
        datePicker: {
          title: 'Seleziona data',
        },
        hints: {
          noPets: 'Non hai animali. Aggiungi prima un animale da I miei animali.',
          selectDateFirst: 'Seleziona prima una data',
          noSlots: 'Nessuna fascia disponibile per questa data',
        },
        validation: {
          selectVeterinarian: 'Seleziona prima un veterinario',
          loginRequired: 'Accedi per prenotare',
          selectPet: 'Seleziona un animale',
          selectDate: 'Seleziona una data',
          selectTimeSlot: 'Seleziona una fascia oraria',
          enterReason: 'Inserisci un motivo',
        },
        empty: {
          noVeterinarian: 'Seleziona un veterinario dalla ricerca per prenotare.',
        },
        actions: {
          findVeterinarians: 'Trova veterinari',
          proceedToCheckout: 'Procedi al pagamento',
        },
      },
      petOwnerBookingCheckout: {
        loading: 'Caricamento...',
        sections: {
          summary: 'Riepilogo prenotazione',
          payment: 'Pagamento',
        },
        summary: {
          date: 'Data: {{value}}',
          time: 'Ora: {{value}}',
          type: 'Tipo: {{value}}',
          pet: 'Animale: {{value}}',
          reason: 'Motivo: {{value}}',
          consultation: 'Consulenza: {{value}}',
          total: 'Totale: {{value}}',
        },
        types: {
          video: 'Video',
          clinic: 'Clinica',
        },
        paymentMethods: {
          card: 'Carta',
          demo: 'Test (Demo)',
        },
        terms: {
          accept: 'Accetto i termini',
        },
        actions: {
          findVeterinarian: 'Trova veterinario',
          processing: 'Elaborazione...',
          payAmount: 'Paga €{{amount}}',
          confirm: 'Conferma',
        },
        validation: {
          acceptTerms: 'Accetta i termini',
          consultationFeeNotSet: 'Tariffa consulenza non impostata',
          invalidBooking: 'Prenotazione non valida',
        },
        errors: {
          createAppointmentFailed: 'Impossibile creare l’appuntamento',
        },
        toasts: {
          booked: 'Appuntamento prenotato!',
        },
        empty: {
          noDetails: 'Nessun dettaglio di prenotazione.',
        },
      },
      petOwnerBookingSuccess: {
        title: 'Appuntamento prenotato',
        message: 'Il tuo appuntamento è stato confermato.',
        reference: 'Ref: {{id}}',
        actions: {
          viewAppointments: 'Vedi appuntamenti',
          backToHome: 'Torna alla Home',
        },
      },
      petOwnerChatDetail: {
        missingConversation: 'Chat mancante',
        empty: 'Nessun messaggio ancora',
        placeholders: {
          typeMessage: 'Scrivi un messaggio...',
        },
        errors: {
          invalidConversation: 'Chat non valida',
          failedToSend: 'Invio non riuscito',
          uploadFailed: 'Caricamento non riuscito',
          failedToSendFile: 'Invio file non riuscito',
          couldNotOpenFile: 'Impossibile aprire il file',
        },
      },
      petOwnerFavourites: {
        searchPlaceholder: 'Cerca preferiti...',
        defaults: {
          specialty: 'Veterinaria',
          vetAvatarLetter: 'V',
        },
        empty: {
          title: 'Nessun preferito ancora',
          subtitle: 'Aggiungi veterinari dalla ricerca per vederli qui.',
        },
        feeConsultation: '€{{amount}} consulenza',
        actions: {
          bookNow: 'Prenota ora',
        },
        errors: {
          loadFailed: 'Impossibile caricare i preferiti.',
          removeFailed: 'Impossibile rimuovere',
        },
        toasts: {
          removedFromFavorites: 'Rimosso dai preferiti',
        },
      },
      petOwnerAddPet: {
        title: 'Aggiungi animale',
        hint: 'Tutti i campi come in VeterinaryFrontend. Nome e specie obbligatori.',
        fields: {
          name: { label: 'Nome *', placeholder: 'Inserisci nome animale' },
          species: { label: 'Specie *' },
          breed: { label: 'Razza', placeholder: 'Inserisci razza' },
          gender: { label: 'Sesso' },
          ageMonths: { label: 'Età (mesi)', placeholder: 'es. 24' },
          weightKg: { label: 'Peso (kg)', placeholder: 'Opzionale' },
          microchipNumber: { label: 'Numero microchip', placeholder: 'Opzionale' },
          photo: { label: 'Foto', placeholder: '📷 Aggiungi foto (opzionale)' },
        },
        validation: {
          nameRequired: 'Il nome è obbligatorio',
        },
        actions: {
          saving: 'Salvataggio...',
          savePet: 'Salva animale',
        },
        toasts: {
          created: 'Animale creato',
        },
        errors: {
          createFailed: 'Impossibile creare l’animale',
        },
      },
      petOwnerPets: {
        species: {
          DOG: 'Cane',
          CAT: 'Gatto',
          BIRD: 'Uccello',
          RABBIT: 'Coniglio',
          REPTILE: 'Rettile',
          FISH: 'Pesce',
          HAMSTER: 'Criceto',
          GUINEA_PIG: 'Porcellino d’India',
          FERRET: 'Furetto',
          HORSE: 'Cavallo',
          OTHER: 'Altro',
        },
        gender: {
          MALE: 'Maschio',
          FEMALE: 'Femmina',
          NEUTERED: 'Castrato',
          SPAYED: 'Sterilizzata',
          UNKNOWN: 'Sconosciuto',
        },
      },
      petOwnerEditPet: {
        title: 'Modifica animale',
        photo: {
          changePhoto: '📷 Cambia foto',
        },
        actions: {
          saving: 'Salvataggio...',
          deletePet: 'Elimina animale',
        },
        validation: {
          nameRequired: 'Il nome è obbligatorio',
        },
        deleteConfirm: {
          title: 'Elimina animale',
          message: 'Sei sicuro di voler eliminare questo animale?',
        },
        toasts: {
          updated: 'Animale aggiornato',
          deleted: 'Animale eliminato',
        },
        errors: {
          updateFailed: 'Impossibile aggiornare l’animale',
          deleteFailed: 'Impossibile eliminare l’animale',
        },
      },
      petOwnerInvoices: {
        searchPlaceholder: 'Cerca fatture...',
        empty: 'Nessuna fattura trovata',
        defaults: {
          appointment: 'Appuntamento',
        },
        status: {
          paid: 'Pagata',
          pending: 'In sospeso',
          failed: 'Fallita',
          refunded: 'Rimborsata',
        },
        labels: {
          date: 'Data',
          appointment: 'Appuntamento',
          veterinarian: 'Veterinario',
        },
        pagination: {
          prev: 'Prec',
          next: 'Succ',
          pageOf: 'Pagina {{page}} di {{totalPages}}',
        },
      },
      petOwnerInvoiceView: {
        title: 'Fattura',
        notFound: 'Fattura non trovata.',
        meta: {
          order: 'Ordine:',
          issued: 'Emessa:',
        },
        sections: {
          from: 'Fattura da',
          to: 'Fattura a',
          paymentMethod: 'Metodo di pagamento',
        },
        table: {
          description: 'Descrizione',
          quantity: 'Quantità',
          vat: 'IVA',
          total: 'Totale',
        },
        totals: {
          subtotal: 'Subtotale:',
          discount: 'Sconto:',
          totalAmount: 'Importo totale:',
        },
      },
      petOwnerMedicalDetails: {
        mock: {
          recordType: 'Vaccinazione',
          title: 'Vaccino antirabbico',
          description: 'Richiamo annuale. Lotto #12345. Nessuna reazione avversa.',
        },
        sections: {
          details: 'Dettagli',
          latestVitals: 'Ultimi parametri (come in VeterinaryFrontend)',
        },
        labels: {
          pet: 'Animale',
          date: 'Data',
          veterinarian: 'Veterinario',
          attachment: 'Allegato',
        },
        vitals: {
          weight: 'Peso',
          temperature: 'Temperatura',
          heartRate: 'Frequenza cardiaca',
        },
      },
      petOwnerChangePassword: {
        fields: {
          currentPassword: { label: 'Password attuale *', placeholder: 'Inserisci password attuale' },
          newPassword: { label: 'Nuova password *', placeholder: 'Inserisci nuova password' },
          confirmPassword: { label: 'Conferma nuova password *', placeholder: 'Conferma nuova password' },
        },
        actions: {
          update: 'Aggiorna password',
        },
        validation: {
          currentPasswordRequired: 'La password attuale è obbligatoria',
          newPasswordRequired: 'La nuova password è obbligatoria',
          passwordsDoNotMatch: 'La nuova password e la conferma non coincidono',
          minLength: 'La nuova password deve avere almeno {{min}} caratteri',
        },
        toasts: {
          changed: 'Password aggiornata con successo',
        },
        errors: {
          changeFailed: 'Impossibile cambiare password',
        },
      },
      petOwnerMyPets: {
        searchPlaceholder: 'Cerca animali',
        empty: 'Nessun animale trovato',
        labels: {
          breed: 'Razza',
          microchip: 'Microchip',
        },
        actions: {
          addPet: 'Aggiungi animale',
        },
        age: {
          years: '{{count}} anni',
          months: '{{count}} mesi',
        },
        deleteConfirm: {
          title: 'Elimina animale',
          message: 'Eliminare "{{name}}"?',
        },
        toasts: {
          deleted: 'Animale eliminato',
        },
        errors: {
          deleteFailed: 'Impossibile eliminare l’animale',
        },
      },
      petOwnerOrders: {
        defaults: {
          pharmacy: 'Farmacia',
        },
        empty: 'Nessun ordine trovato',
        status: {
          pending: 'In sospeso',
          confirmed: 'Confermato',
          processing: 'In elaborazione',
          shipped: 'Spedito',
          delivered: 'Consegnato',
          cancelled: 'Annullato',
        },
        labels: {
          status: 'Stato',
          orderedOn: 'Ordinato il {{date}}',
          payment: 'Pagamento: {{status}}',
          paid: '✓ Pagato',
        },
        itemsCount_one: '{{count}} articolo',
        itemsCount_other: '{{count}} articoli',
        actions: {
          viewDetails: 'Vedi dettagli',
          payNow: 'Paga ora',
          cancel: 'Annulla',
          startShopping: 'Inizia acquisti',
        },
        cancelConfirm: {
          title: 'Annulla ordine',
          message: 'Sei sicuro di voler annullare questo ordine?',
          confirm: 'Sì',
        },
        toasts: {
          paymentSuccessful: 'Pagamento riuscito',
          orderCancelled: 'Ordine annullato',
        },
        errors: {
          paymentFailed: 'Pagamento non riuscito',
          cancelFailed: 'Annullamento non riuscito',
        },
        details: {
          title: 'Dettagli ordine',
          notFound: 'Ordine non trovato.',
          backToOrders: '← Torna agli ordini',
          summary: {
            orderNumber: 'Numero ordine',
            orderDate: 'Data ordine: {{date}}',
          },
          alerts: {
            waitingShippingFee: 'In attesa che la farmacia imposti la spedizione. Potrai pagare quando la spedizione sarà impostata.',
            shippingFeeSet: 'La spedizione è stata impostata. Completa il pagamento per confermare l’ordine.',
            paymentCompleted: 'Pagamento completato. Il tuo ordine è in elaborazione.',
          },
          sections: {
            items: 'Articoli ordine',
            shippingAddress: 'Indirizzo di spedizione',
            summary: 'Riepilogo ordine',
          },
          defaults: {
            product: 'Prodotto',
          },
          item: {
            quantity: 'Quantità: {{qty}}',
            eachPrice: '€{{price}} ciascuno',
          },
          totals: {
            subtotal: 'Subtotale',
            shipping: 'Spedizione',
            total: 'Totale',
          },
          actions: {
            processing: 'Elaborazione...',
            payAmount: 'Paga €{{amount}}',
            cancelOrder: 'Annulla ordine',
          },
          cancelModal: {
            title: 'Annulla ordine',
            body: 'Sei sicuro di voler annullare l’ordine #{{orderNumber}}?',
            hint: 'Questa azione non può essere annullata.',
            keep: 'No, mantieni ordine',
            cancelling: 'Annullamento...',
            confirm: 'Sì, annulla ordine',
          },
        },
      },
      petOwnerPharmacyCatalog: {
        searchPlaceholder: 'Cerca prodotti...',
        fromThisPharmacySuffix: ' da questa farmacia',
        results: 'Mostrati {{count}} prodotti{{suffix}}',
        empty: 'Nessun prodotto trovato. Prova a modificare la ricerca o la categoria.',
        defaults: {
          product: 'Prodotto',
        },
      },
      petOwnerPharmacySearch: {
        kinds: {
          pharmacies: 'Farmacie',
          parapharmacies: 'Parafarmacie',
          pharmaciesLower: 'farmacie',
          parapharmaciesLower: 'parafarmacie',
        },
        placeholders: {
          searchPharmacies: 'Cerca farmacie...',
          searchParapharmacies: 'Cerca parafarmacie...',
          cityOrLocation: 'Inserisci città o posizione...',
        },
        actions: {
          clearFilters: 'Azzera filtri',
          browseProducts: 'Sfoglia prodotti',
          call: 'Chiama',
        },
        results: 'Mostrati {{count}} {{kind}}',
        empty: {
          title: 'Nessuna farmacia trovata',
          subtitle: 'Prova a modificare ricerca o filtri',
        },
        defaults: {
          pharmacy: 'Farmacia',
        },
        popularCities: ['Città', 'Paese', 'Borgo', 'Centro', 'Centrale'],
      },
      petOwnerPharmacyCheckout: {
        redirecting: 'Reindirizzamento...',
        sections: {
          billingDetails: 'Dati di fatturazione',
          personalInfo: 'Informazioni personali',
          shippingDetails: 'Dettagli spedizione',
          paymentMethod: 'Metodo di pagamento',
          yourOrder: 'Il tuo ordine',
        },
        fields: {
          firstName: { label: 'Nome', placeholder: 'Nome' },
          lastName: { label: 'Cognome', placeholder: 'Cognome' },
          email: { label: 'Email', placeholder: 'Email' },
          phone: { label: 'Telefono', placeholder: 'Telefono' },
          shipToDifferentAddress: 'Spedire a un altro indirizzo?',
          shippingLine1: { label: 'Indirizzo (riga 1)', placeholder: 'Indirizzo' },
          shippingLine2: { label: 'Indirizzo (riga 2) (opzionale)', placeholder: 'Appartamento, interno...' },
          shippingCity: { label: 'Città', placeholder: 'Città' },
          shippingState: { label: 'Provincia/Stato', placeholder: 'Provincia/Stato' },
          shippingCountry: { label: 'Paese', placeholder: 'Paese' },
          shippingZip: { label: 'CAP', placeholder: 'CAP' },
          orderNotes: { label: 'Note ordine (opzionale)', placeholder: 'Note sul tuo ordine...' },
        },
        paymentMethods: {
          cardStripe: 'Carta / Stripe',
        },
        terms: {
          prefix: 'Ho letto e accetto i',
          link: 'Termini e condizioni',
        },
        totals: {
          subtotal: 'Subtotale',
          shipping: 'Spedizione',
          free: 'Gratis',
          total: 'Totale',
        },
        actions: {
          placingOrder: 'Invio ordine...',
          placeOrder: 'Invia ordine',
        },
        validation: {
          loginRequired: 'Accedi per effettuare un ordine.',
          acceptTerms: 'Accetta i Termini e condizioni.',
          cartEmpty: 'Il carrello è vuoto.',
          shippingRequired: 'Compila tutti i campi di spedizione obbligatori.',
        },
        errors: {
          placeOrderFailed: 'Impossibile inviare l’ordine',
          orderFailedTitle: 'Ordine non riuscito',
        },
        toasts: {
          cartEmpty: { title: 'Carrello vuoto', subtitle: 'Aggiungi prodotti per completare.' },
          orderPlaced: { title: 'Ordine inviato', subtitle: 'Potrai pagare quando la spedizione sarà impostata.' },
        },
      },
      petOwnerNotifications: {
        title: 'Notifiche',
        subtitle: 'Avvisi e aggiornamenti',
        empty: 'Nessuna notifica trovata.',
        tabs: {
          unread: 'Non lette',
          unreadWithCount: 'Non lette ({{count}})',
          read: 'Lette',
        },
        actions: {
          markAll: 'Segna tutte',
          marking: 'Segnando...',
        },
        toasts: {
          markAllRead: 'Tutte le notifiche segnate come lette',
        },
        errors: {
          markAllFailed: 'Impossibile segnare tutte come lette',
          markReadFailed: 'Impossibile segnare come letta',
        },
        defaults: {
          notification: 'Notifica',
        },
      },
      petOwnerPharmacyHome: {
        header: {
          title: 'Farmacia e negozio',
          subtitle: 'Prodotti e medicinali per animali',
        },
        banner: {
          title: 'Farmacia e negozio per animali',
          subtitle: 'Tutto ciò di cui il tuo pet ha bisogno',
          description: 'Essenziali, nutrizione, medicinali e molto altro da farmacie per animali affidabili.',
        },
        sections: {
          featuredProducts: 'Prodotti in evidenza',
        },
        actions: {
          shopNow: 'Acquista ora',
          findPharmacies: 'Trova farmacie',
          viewAll: 'Vedi tutti',
        },
        emptyProducts: 'Nessun prodotto disponibile. Sfoglia tutti i prodotti o trova una farmacia.',
        defaults: {
          product: 'Prodotto',
        },
      },
      petOwnerPharmacyCart: {
        empty: {
          title: 'Il carrello è vuoto',
          subtitle: 'Aggiungi prodotti al carrello per continuare lo shopping.',
        },
        labels: {
          sku: 'SKU: {{sku}}',
        },
        totals: {
          subtotal: 'Subtotale',
          shipping: 'Spedizione',
          free: 'Gratis',
          total: 'Totale',
        },
        actions: {
          startShopping: 'Inizia a comprare',
          clearCart: 'Svuota carrello',
          proceedToCheckout: 'Procedi al checkout',
        },
      },
      petOwnerPharmacyPaymentSuccess: {
        title: 'Pagamento riuscito!',
        subtitle: 'Il tuo ordine è stato effettuato. Potrai pagare quando la farmacia imposterà la spedizione.',
        actions: {
          backToShop: 'Torna al negozio',
          viewOrders: 'Vedi ordini',
        },
      },
      petOwnerPharmacyDetails: {
        tabs: {
          overview: 'Panoramica',
          locations: 'Sedi',
          products: 'Prodotti',
        },
        actions: {
          browseProducts: 'Sfoglia prodotti',
          callNow: 'Chiama ora',
          viewAllProducts: 'Vedi tutti i prodotti',
        },
        overview: {
          aboutTitle: 'Informazioni farmacia',
          aboutBody: '{{storeName}} offre prodotti e servizi di qualità per la salute del tuo pet.',
          locatedAtSuffix: ' Situata in {{storeAddress}}.',
        },
        locations: {
          title: 'Dettagli sede',
        },
        errors: {
          notFound: 'Farmacia non trovata.',
        },
        defaults: {
          pharmacy: 'Farmacia',
          product: 'Prodotto',
        },
      },
      petOwnerProductDetails: {
        soldBy: 'Venduto da {{soldByName}}',
        sections: {
          productDetails: 'Dettagli prodotto',
        },
        labels: {
          description: 'Descrizione',
          category: 'Categoria',
          quantity: 'Quantità',
        },
        actions: {
          addToCart: 'Aggiungi al carrello',
          buyNow: 'Compra ora',
        },
        defaults: {
          pharmacy: 'Farmacia',
          product: 'Prodotto',
          noDescription: 'Nessuna descrizione.',
        },
        discountOff: '{{percent}}% di sconto',
        stock: {
          inStock: 'Disponibile',
          inStockWithCount: 'Disponibile ({{count}})',
          outOfStock: 'Esaurito',
        },
        specs: {
          sku: 'SKU',
          stock: 'Giacenza',
          category: 'Categoria',
          stockUnits: '{{count}} unità',
        },
        errors: {
          notFound: 'Prodotto non trovato.',
        },
      },
      petOwnerPrescription: {
        title: 'Prescrizione',
        loadingPrescription: 'Caricamento prescrizione...',
        onlyAfterCompleted: 'La prescrizione è disponibile solo dopo il completamento dell’appuntamento.',
        noPrescriptionYet: 'Nessuna prescrizione è stata ancora emessa per questo appuntamento.',
        meta: {
          appointment: 'Appuntamento {{appointmentNumber}}',
          veterinarian: 'Veterinario: {{name}}',
          pet: 'Pet: {{name}}',
        },
        sections: {
          diagnosis: 'Diagnosi',
          allergies: 'Allergie',
          clinicalNotes: 'Note cliniche',
          medications: 'Farmaci',
          recommendedTests: 'Esami consigliati',
          followUp: 'Follow-up',
          advice: 'Consigli',
        },
        medFields: {
          strength: 'Concentrazione: {{value}}',
          dosage: 'Dosaggio: {{value}}',
          frequency: 'Frequenza: {{value}}',
          duration: 'Durata: {{value}}',
          quantity: 'Qtà: {{value}}',
          refills: 'Ricariche: {{value}}',
        },
        errors: {
          appointmentIdRequired: 'È richiesto l’ID dell’appuntamento.',
          appointmentNotFound: 'Appuntamento non trovato.',
        },
      },
      petOwnerWallet: {
        availableBalance: 'Saldo disponibile',
        actions: {
          topUp: 'Ricarica',
        },
      },
      petOwnerMore: {
        role: 'Proprietario',
        defaults: {
          avatarLetter: 'P',
          petOwnerName: 'Proprietario',
        },
      },
      petOwnerDocuments: {
        actions: {
          download: 'Scarica',
        },
        mockDocs: {
          vaccinationCertificateMax: 'Certificato di vaccinazione - Max',
          invoiceTx1: 'Fattura #tx-1',
          date1: '10 Feb 2024',
        },
      },
      petOwnerWeightRecords: {
        title: 'Registro peso',
        subtitle: 'Traccia la cronologia del peso del tuo pet registrata durante gli appuntamenti',
        filters: {
          pet: 'Pet',
          allPets: 'Tutti i pet',
        },
        latest: {
          title: 'Ultimo peso',
        },
        history: {
          title: 'Storico',
        },
        empty: {
          latest: 'Nessun record del peso',
          history: 'Nessun record del peso trovato',
        },
        pagination: {
          pageOf: 'Pagina {{page}} di {{pages}}',
        },
        defaults: {
          pet: 'Pet',
          unitKg: ' kg',
        },
      },
      more: {
        petOwner: {
          myPetsHealth: 'I miei animali e salute',
          appointmentsFavourites: 'Appuntamenti e preferiti',
          financeOrders: 'Finanza e ordini',
          settingsMore: 'Impostazioni e altro',
          petOwner: 'Proprietario',
        },
        vet: {
          practice: 'Attività',
          financeInvoices: 'Finanza e fatture',
          contentSettings: 'Contenuti e impostazioni',
          veterinarian: 'Veterinario',
        },
        pharmacy: {
          pharmacy: 'Farmacia',
          parapharmacy: 'Parafarmacia',
        },
      },
      menu: {
        myPets: 'I miei animali',
        petMedicalRecords: 'Cartelle cliniche',
        weightRecords: 'Registro peso',
        favoriteVets: 'Veterinari preferiti',
        requestReschedule: 'Richiedi riprogrammazione',
        rescheduleRequests: 'Richieste di riprogrammazione',
        veterinaryInvoices: 'Fatture veterinarie',
        petSupplyOrders: 'Ordini prodotti',
        nearbyClinics: 'Cliniche vicine',
        notifications: 'Notifiche',
        accountSettings: 'Impostazioni account',
        changePassword: 'Cambia password',
        language: 'Lingua',

        petRequests: 'Richieste',
        clinicHours: 'Orari clinica',
        myPetsPatients: 'I miei animali (pazienti)',
        vaccinations: 'Vaccinazioni',
        reviews: 'Recensioni',
        invoices: 'Fatture',
        paymentSettings: 'Impostazioni pagamento',
        clinicAnnouncements: 'Annunci clinica',
        subscription: 'Abbonamento',
        profileSettings: 'Impostazioni profilo',

        profile: 'Profilo',
        payouts: 'Pagamenti',
      },
      profileSettings: {
        petOwnerTitle: 'Impostazioni profilo',
        vetProfileImage: 'Immagine profilo',
        vetBasicInformation: 'Informazioni di base',
        vetConsultationFees: 'Tariffe consulenza',
        vetProfessionalMemberships: 'Iscrizioni professionali',
        choosePhoto: 'Scegli foto',
        uploadPhoto: 'Carica foto',
        uploading: 'Caricamento...',
        photoHintPetOwner: 'Immagine sotto 4 MB, jpg, png, svg',
        photoHintVet: 'Sotto 4MB, JPG, PNG, SVG',
      },
    },
  },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  compatibilityJSON: 'v4',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
