/**
 * Filename validation and normalization utilities
 * Handles markdown file naming conventions and folder names
 */

export interface FilenameValidation {
  isValid: boolean;
  errorMessage?: string;
  normalizedName: string; // With extension applied (for files)
}

/**
 * Validates and normalizes filename for markdown files
 * 
 * Rules:
 * 1. No extension → Add .md
 * 2. Explicit .md or .mdx → Keep as-is
 * 3. Other extensions → Invalid
 * 4. Empty name → Invalid
 * 5. Contains / or \ → Invalid (no paths)
 * 6. Only whitespace → Invalid
 * 7. Starts with . → Invalid (hidden files)
 * 
 * @param input - User-provided filename
 * @returns Validation result with normalized name
 * 
 * @example
 * validateAndNormalizeFilename('note') // → { isValid: true, normalizedName: 'note.md' }
 * validateAndNormalizeFilename('note.md') // → { isValid: true, normalizedName: 'note.md' }
 * validateAndNormalizeFilename('note.mdx') // → { isValid: true, normalizedName: 'note.mdx' }
 * validateAndNormalizeFilename('note.txt') // → { isValid: false, errorMessage: '...' }
 */
export function validateAndNormalizeFilename(input: string): FilenameValidation {
  const trimmed = input.trim();

  // Check empty
  if (trimmed === '') {
    return {
      isValid: false,
      errorMessage: 'Filename cannot be empty',
      normalizedName: '',
    };
  }

  // Check for path separators
  if (trimmed.includes('/') || trimmed.includes('\\')) {
    return {
      isValid: false,
      errorMessage: 'Filename cannot contain slashes',
      normalizedName: trimmed,
    };
  }

  // Check for hidden files
  if (trimmed.startsWith('.')) {
    return {
      isValid: false,
      errorMessage: 'Filename cannot start with a dot',
      normalizedName: trimmed,
    };
  }

  // Check for invalid characters (common across filesystems)
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: 'Filename contains invalid characters',
      normalizedName: trimmed,
    };
  }

  // Parse extension
  const lastDotIndex = trimmed.lastIndexOf('.');
  const hasExtension = lastDotIndex > 0 && lastDotIndex < trimmed.length - 1;

  if (hasExtension) {
    const extension = trimmed.slice(lastDotIndex + 1).toLowerCase();
    
    // Allow .md and .mdx explicitly
    if (extension === 'md' || extension === 'mdx') {
      return {
        isValid: true,
        normalizedName: trimmed,
      };
    }
    
    // Other extensions not allowed
    return {
      isValid: false,
      errorMessage: 'Only .md and .mdx files are allowed',
      normalizedName: trimmed,
    };
  }

  // No extension → Add .md
  return {
    isValid: true,
    normalizedName: `${trimmed}.md`,
  };
}

/**
 * Validates folder name
 * 
 * Rules:
 * 1. Empty name → Invalid
 * 2. Contains / or \ → Invalid (no paths)
 * 3. Only whitespace → Invalid
 * 4. Starts with . → Invalid (hidden folders)
 * 
 * @param input - User-provided folder name
 * @returns Validation result
 * 
 * @example
 * validateFolderName('notes') // → { isValid: true, normalizedName: 'notes' }
 * validateFolderName('my notes') // → { isValid: true, normalizedName: 'my notes' }
 * validateFolderName('.git') // → { isValid: false, errorMessage: '...' }
 */
export function validateFolderName(input: string): FilenameValidation {
  const trimmed = input.trim();

  // Check empty
  if (trimmed === '') {
    return {
      isValid: false,
      errorMessage: 'Folder name cannot be empty',
      normalizedName: '',
    };
  }

  // Check for path separators
  if (trimmed.includes('/') || trimmed.includes('\\')) {
    return {
      isValid: false,
      errorMessage: 'Folder name cannot contain slashes',
      normalizedName: trimmed,
    };
  }

  // Check for hidden folders
  if (trimmed.startsWith('.')) {
    return {
      isValid: false,
      errorMessage: 'Folder name cannot start with a dot',
      normalizedName: trimmed,
    };
  }

  // Check for invalid characters
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(trimmed)) {
    return {
      isValid: false,
      errorMessage: 'Folder name contains invalid characters',
      normalizedName: trimmed,
    };
  }

  return {
    isValid: true,
    normalizedName: trimmed,
  };
}
