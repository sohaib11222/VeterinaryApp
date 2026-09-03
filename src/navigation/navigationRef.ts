import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/** Lets app-wide overlays, such as an incoming call, navigate safely. */
export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();
