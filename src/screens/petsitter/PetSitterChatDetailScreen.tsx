import React from 'react';
import { PetOwnerChatDetailScreen } from '../petowner/PetOwnerChatDetailScreen';

/** The backend uses the same attachment-capable conversation records for Pet Owner ↔ Pet Sitter chat. */
export function PetSitterChatDetailScreen() {
  return <PetOwnerChatDetailScreen />;
}
