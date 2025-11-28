/**
 * Vue SFC Code Sanitizer
 * Auto-fixes common AI-generated syntax errors before sending to Vue REPL compiler
 */

export function sanitizeVueSfc(code: string): { code: string; fixes: string[] } {
  const fixes: string[] = [];
  let sanitized = code;

  // Fix 1: Missing class attribute - <p="text-gray-600"> → <p class="text-gray-600">
  sanitized = sanitized.replace(/<(\w+)="([^"]+)">/g, (match, tag, value) => {
    // Check if it looks like a class value (contains common Tailwind patterns)
    if (/^(text-|bg-|p-|m-|flex|grid|w-|h-|font-|rounded|shadow|border)/.test(value)) {
      fixes.push(`Fixed missing 'class' attribute in <${tag}>`);
      return `<${tag} class="${value}">`;
    }
    return match;
  });

  // Fix 2: Unclosed tag with emoji or content - <div class="text-6xl🎯</div> → <div class="text-6xl">🎯</div>
  sanitized = sanitized.replace(/<(\w+)\s+class="([^"]*?)([^"<>\s]+)(<\/\1>)/g, (match, tag, classValue, content, closeTag) => {
    fixes.push(`Fixed unclosed class attribute in <${tag}>`);
    return `<${tag} class="${classValue}">${content}${closeTag}`;
  });

  // Fix 3: Missing closing quote in v-for - v-for="item in items → v-for="item in items"
  sanitized = sanitized.replace(/v-for="([^"]+)\s*\n/g, (match, value) => {
    if (!value.includes('"')) {
      fixes.push('Fixed unclosed v-for attribute');
      return `v-for="${value.trim()}"\n`;
    }
    return match;
  });

  // Fix 4: Template literal in :style - ${ }% → + '%'
  sanitized = sanitized.replace(/:style="\{([^}]*)\$\{([^}]+)\}([^}]*)\}"/g, (match, before, expr, after) => {
    fixes.push('Fixed template literal in :style binding');
    // Convert ${expr}% to (expr) + '%'
    const cleanExpr = expr.replace(/%$/, '');
    const suffix = after.includes('%') ? '' : after;
    return `:style="{ ${before}(${cleanExpr}) + '%'${suffix} }"`.replace(/\s+/g, ' ');
  });

  // Fix 5: Empty/invalid closing tags - </> → remove or fix
  sanitized = sanitized.replace(/<\/>/g, () => {
    fixes.push('Removed invalid empty closing tag </>');
    return '</div>';  // Default to div, might need context
  });

  // Fix 6: Missing tag name - < class="flex" → <div class="flex"
  sanitized = sanitized.replace(/\n(\s*)<\s+class="/g, (match, indent) => {
    fixes.push('Fixed missing tag name, added <div>');
    return `\n${indent}<div class="`;
  });

  // Fix 7: Missing stroke in SVG attributes - stroke-linecap="round"-width → stroke-linecap="round" stroke-width
  sanitized = sanitized.replace(/(\w+-\w+)="([^"]*)"-width=/g, (match, attr, value) => {
    fixes.push('Fixed missing stroke- prefix in SVG');
    return `${attr}="${value}" stroke-width=`;
  });

  // Fix 8: Typo Tailwind classes - px-4-2 → px-4 py-2, bg-gray200 → bg-gray-200
  sanitized = sanitized.replace(/px-(\d+)-(\d+)/g, (match, px, py) => {
    fixes.push('Fixed Tailwind class typo px-X-Y');
    return `px-${px} py-${py}`;
  });
  sanitized = sanitized.replace(/bg-gray(\d{3})/g, (match, num) => {
    fixes.push('Fixed Tailwind class typo bg-grayXXX');
    return `bg-gray-${num}`;
  });
  sanitized = sanitized.replace(/hover:bg-(\d{3})/g, (match, num) => {
    fixes.push('Fixed Tailwind class typo hover:bg-XXX');
    return `hover:bg-gray-${num}`;
  });

  // Fix 9: Broken closing tags - </h3                  <p → </h3>\n<p
  sanitized = sanitized.replace(/<\/(\w+)\s{2,}</g, (match, tag) => {
    fixes.push(`Fixed whitespace after </${tag}>`);
    return `</${tag}>\n<`;
  });

  // Fix 10: Missing < before input - input v-model → <input v-model
  sanitized = sanitized.replace(/\n(\s*)input\s+(v-model|type|class)/g, (match, indent, attr) => {
    fixes.push('Fixed missing < before input tag');
    return `\n${indent}<input ${attr}`;
  });

  // Fix 11: toLocale() → toLocaleString()
  sanitized = sanitized.replace(/\.toLocale\(\)/g, () => {
    fixes.push('Fixed .toLocale() → .toLocaleString()');
    return '.toLocaleString()';
  });

  // Fix 12: Unclosed attribute quotes in multi-line attributes
  sanitized = sanitized.replace(/class="([^"\n]+)\n\s+:/g, (match, classValue) => {
    fixes.push('Fixed unclosed class attribute');
    return `class="${classValue.trim()}"\n            :`;
  });

  // Fix 13: Missing > after class in multi-line
  sanitized = sanitized.replace(/class="([^"]+)"\s*\n\s*(<\/\w+>)/g, (match, classValue, closeTag) => {
    if (!match.includes('>')) {
      fixes.push('Fixed missing > after class attribute');
      return `class="${classValue}">\n            ${closeTag}`;
    }
    return match;
  });

  return {
    code: sanitized,
    fixes: [...new Set(fixes)] // Remove duplicates
  };
}

/**
 * Check if the code likely has syntax errors (quick heuristic check)
 */
export function hasLikelySyntaxErrors(code: string): boolean {
  // Count opening vs closing tags
  const openingDivs = (code.match(/<div[\s>]/g) || []).length;
  const closingDivs = (code.match(/<\/div>/g) || []).length;
  if (openingDivs !== closingDivs) return true;

  // Check for common error patterns
  const errorPatterns = [
    /<\/>/,                    // Empty closing tag
    /<\s+class="/,             // Missing tag name
    /v-for="[^"]+\n/,          // Unclosed v-for
    /<\w+="[^"]+"\s*>/,        // Missing class keyword
    /\$\{[^}]+\}%/,            // Template literal in style
  ];

  return errorPatterns.some(pattern => pattern.test(code));
}

