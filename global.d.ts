// Expand the global window object, so that TypeScript recognizes the new property
// This ensures that the property is available and it is safe to use it in the implementation
interface Window {
    fromCompletedInfo: boolean;
}