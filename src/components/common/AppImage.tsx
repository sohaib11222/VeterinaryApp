import React from 'react';
import { Image as NativeImage, ImageProps, ImageSourcePropType } from 'react-native';
import { getImageUrl } from '../../config/api';

function normalizedSource(source: ImageSourcePropType | undefined): ImageSourcePropType | undefined {
  if (!source || typeof source === 'number' || Array.isArray(source)) return source;
  const uri = (source as { uri?: unknown }).uri;
  if (!uri) return source;
  const normalizedUri = getImageUrl(uri);
  return normalizedUri ? { ...source, uri: normalizedUri } : source;
}

/**
 * App-wide image renderer for backend uploads. Backend models store relative
 * `/uploads/...` paths, while React Native needs a complete device-reachable
 * URI. Local picker URIs and already absolute URLs are preserved unchanged.
 */
export function AppImage({ source, ...props }: ImageProps) {
  return <NativeImage {...props} source={normalizedSource(source)} />;
}
