// Pharmacy and Parapharmacy use the same secured Admin-support conversation
// component as veterinarians. The component derives its participant field from
// the authenticated role, so the backend stores it under the correct business
// conversation type while preserving attachments and read receipts.
export { VetAdminChatScreen as PharmacyAdminChatScreen } from '../vet/VetAdminChatScreen';
