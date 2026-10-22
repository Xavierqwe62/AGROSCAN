/** Use a bundled illustration once; avoid an error loop if the fallback also fails. */
export function useCropImageFallback(event: Event): void {
  const image = event.target as HTMLImageElement;
  if (image.dataset['fallbackApplied']) {
    image.style.visibility = 'hidden';
    return;
  }
  image.dataset['fallbackApplied'] = 'true';
  image.src = 'assets/crops/fallback.webp';
  image.alt = 'Ilustración de una planta; imagen de respaldo del cultivo';
}
