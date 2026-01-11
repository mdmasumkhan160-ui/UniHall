// Helper to resolve best available image for a hall
// Order: local by shortName in public/halls -> hall.localImg override -> remote official -> unsplash fallback
export function getHallImage(hall) {
  if (!hall) return ''
  const baseUrl = import.meta.env.BASE_URL || '/'
  const byShortName = hall.shortName ? `${baseUrl}halls/${hall.shortName}.jpg` : ''
  // Prefer explicit localImg override first (handles renamed files like BMH.jpg for JSH, FMH.jpg for NFH),
  // then try shortName-based local path, then remote, then fallback.
  const localImg = hall.localImg ? `${baseUrl}${hall.localImg.replace(/^\//, '')}` : ''
  return localImg || byShortName || hall.img || hall.fallbackImg || ''
}
