const fs = require('fs');
const file = 'src/App.jsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Color Palette
c = c.replace(
    /const C = {[\s\S]*?};/,
    `const C = {
  bg: "#f8fafc", panel: "#ffffff", border: "#e2e8f0",
  accent: "#10b981", red: "#ef4444", amber: "#f59e0b",
  blue: "#3b82f6", purple: "#8b5cf6",
  dim: "#d1fae5", text: "#0f172a", muted: "#64748b",
};`
);

// 2. SEV_BG Palette
c = c.replace(
    /const SEV_BG[\s\S]*?;/,
    `const SEV_BG    = { CRITICAL: "#fee2e2", HIGH: "#fef3c7", MEDIUM: "#dbeafe", LOW: "#d1fae5", INFO: "#f1f5f9" };`
);

// 3. SEV_COLOR Palette
// Using the new values for severity colors
c = c.replace(
    /const SEV_COLOR[\s\S]*?;/,
    `const SEV_COLOR = { CRITICAL: C.red, HIGH: C.amber, MEDIUM: C.blue, LOW: C.accent, INFO: C.muted };`
);

// 4. Update font sizes: anything matching fontSize: <num> to fontSize: <num+2>
c = c.replace(/fontSize: (\d+)/g, (match, p1) => {
    let size = parseInt(p1);
    if (size < 30) {
        return 'fontSize: ' + (size + 2);
    }
    return match;
});

// 5. Update hardcoded colors
c = c.replace(/"#fff"/g, '"#ffffff"'); // standardize
c = c.replace(/"#ffffff"/g, 'C.bg'); // Often used as text color in dark mode, change to dark text. Actually, let's be careful.
c = c.replace(/color: "#ffffff"/g, 'color: C.text');
c = c.replace(/color: "#000"/g, 'color: "#ffffff"'); // Text on accented buttons should be white
c = c.replace(/fill="#fff"/g, 'fill={C.text}');
c = c.replace(/fill="#000"/g, 'fill="#ffffff"');
c = c.replace(/background: "#040608"/g, 'background: C.panel');
c = c.replace(/background: "#050809"/g, 'background: C.panel');
c = c.replace(/fill="#0a1510"/g, 'fill="#ffffff"'); // Bridge ext nodes
c = c.replace(/fill="#0a0515"/g, 'fill="#ffffff"'); // Bridge center node
c = c.replace(/fill="#040a08"/g, 'fill="#ffffff"');
c = c.replace(/background: "#0a0c10"/g, 'background: "#f8fafc"');
c = c.replace(/background: "#0a0408"/g, 'background: C.panel');
c = c.replace(/background: "#040a08"/g, 'background: C.panel');
c = c.replace(/background: "#ff2d3a10"/g, 'background: "#fee2e2"');
c = c.replace(/border: `1px solid \${C.border}22`/g, 'border: `1px solid ${C.border}`');
c = c.replace(/color="#fff"/g, 'color={C.text}');
c = c.replace(/color: color \|\| SEV_COLOR\[label\] \|\| "#ffffff"/g, 'color: color || SEV_COLOR[label] || C.text');

// 6. Fix some CSS in the style tag
c = c.replace(/color\s*:\s*#000;/g, 'color: #ffffff;');

fs.writeFileSync(file, c);
console.log('UI updated successfully.');
