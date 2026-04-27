// src/utils/theme.js

export const getTheme = (mode, customPrimary) => {
  const primary = customPrimary || '#C5E1A5';
  
  // Helper to convert hex to rgba
  const hexToRGBA = (hex, opacity) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  if (mode === 'dark') {
    return {
      background: '#000000',      
      cardBackground: hexToRGBA(primary, 0.22), // More 'glassy' green
      primary: primary,         
      accent: '#FF9500',          
      text: '#FFFFFF',           
      textSecondary: '#8E8E93',   
      border: hexToRGBA(primary, 0.4), // Sharp glass border
      iconBg: '#1C1C1E', // Neutral grey for settings
      badgeText: '#000000',
      bottomBarBg: 'rgba(0, 0, 0, 0.88)',
      shadow: primary, // Subtle glow in the chosen color
      radius: 24,
    };
  }

  return {
    background: '#F8F9FA',     
    cardBackground: hexToRGBA(primary, 0.15), 
    primary: primary,        
    accent: '#FF9500', 
    text: '#000000',
    textSecondary: '#3C3C43',
    border: hexToRGBA(primary, 0.35),
    iconBg: '#FFFFFF', // Neutral white for light mode settings
    badgeText: '#FFFFFF',
    bottomBarBg: 'rgba(255, 255, 255, 0.9)',
    shadow: '#000000',
    radius: 24,
  };
};

// Deprecated static exports (kept for compatibility during transition)
export const DarkTheme = getTheme('dark', '#C5E1A5');
export const LightTheme = getTheme('light', '#C5E1A5');






export const Typography = {
  h1: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  h2: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, letterSpacing: -0.4 },
  caption: { fontSize: 13, fontWeight: '500' },
  bold: 'bold'
};
