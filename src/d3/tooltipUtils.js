import * as d3 from 'd3';

/**
 * Gets the current theme mode from theme object
 */
export const getCurrentTheme = (theme) => {
  return theme?.palette?.mode === 'dark' ? 'dark' : 'light';
};

/**
 * Creates or updates a single tooltip div based on the current theme.
 * Adds the appropriate theme class (`tooltip--light` or `tooltip--dark`).
 */
export const createTooltip = (theme) => {
  // Remove any existing tooltips to avoid duplicates
  d3.select('body').selectAll('.tooltip').remove();
  
  const themeMode = getCurrentTheme(theme);

  // Create tooltip with enhanced styling
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', `tooltip tooltip--${themeMode}`)
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('background-color', themeMode === 'dark' ? '#424242' : '#ffffff')
    .style('color', themeMode === 'dark' ? '#ffffff' : '#333333')
    .style('border-radius', '8px')
    .style('padding', '12px')
    .style('font-size', '13px')
    .style('z-index', 10000)
    .style('max-width', '300px')
    .style('box-shadow', themeMode === 'dark' 
      ? '0 4px 12px rgba(0,0,0,0.4)' 
      : '0 4px 12px rgba(0,0,0,0.15)')
    .style('transition', 'opacity 0.2s ease-in-out')
    .style('white-space', 'pre-line');
    
  return tooltip;
};

/**
 * Displays the tooltip with given HTML content and positions it near the cursor.
 * Handles both mouse and touch events properly.
 */
export const showTooltip = (tooltip, event, content) => {
  if (!tooltip || !event) return;

  // Get the correct position based on event type
  let clientX, clientY;
  
  if (event.type && event.type.includes('touch')) {
    // Handle touch events
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    if (touch) {
      clientX = touch.pageX;
      clientY = touch.pageY;
    } else {
      // Fallback if no touch object
      clientX = 0;
      clientY = 0;
    }
  } else {
    // Handle mouse events
    clientX = event.pageX !== undefined ? event.pageX : 
              event.clientX !== undefined ? event.clientX + window.pageXOffset : 0;
    clientY = event.pageY !== undefined ? event.pageY : 
              event.clientY !== undefined ? event.clientY + window.pageYOffset : 0;
  }

  // Update content if provided
  if (content !== undefined) {
    tooltip.html(content);
  }

  // Position the tooltip
  const tooltipNode = tooltip.node();
  const tooltipRect = tooltipNode ? tooltipNode.getBoundingClientRect() : { width: 200, height: 100 };
  
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // Default position with offset
  let left = clientX + 12;
  let top = clientY - 28;
  
  // Adjust if tooltip would go off right edge
  if (left + tooltipRect.width > windowWidth - 20) {
    left = clientX - tooltipRect.width - 12;
  }
  
  // Adjust if tooltip would go off bottom edge
  if (top + tooltipRect.height > windowHeight - 20) {
    top = clientY - tooltipRect.height - 12;
  }
  
  // Ensure tooltip never goes off left or top edge
  left = Math.max(10, left);
  top = Math.max(10, top);

  tooltip
    .style("top", `${event.pageY + 10}px`)
    .style("left", `${event.pageX + 15}px`)
    .transition()
    .duration(200)
    .style('opacity', 0.97);
};

/**
 * Hides the tooltip and stops tracking mouse movement.
 */
export const hideTooltip = (tooltip) => {
  if (!tooltip) return;
  
  tooltip
    .transition()
    .duration(200)
    .style('opacity', 0);
};

/**
 * Updates tooltip position dynamically as the mouse moves.
 * Call this in mousemove handlers.
 */
export const updateTooltipPosition = (tooltip, event) => {
  if (!tooltip || !event) return;
  
  // Reuse the positioning logic from showTooltip
  showTooltip(tooltip, event);
};

/**
 * Updates tooltip theme manually when theme changes.
 * Can be called on theme toggle.
 */
export const updateTooltipTheme = (theme) => {
  const tooltip = d3.select('body').select('.tooltip');
  if (!tooltip.empty()) {
    const themeMode = getCurrentTheme(theme);
    
    tooltip
      .attr('class', `tooltip tooltip--${themeMode}`)
      .style('background-color', themeMode === 'dark' ? '#424242' : '#F9F8ECFF')
      .style('color', themeMode === 'dark' ? '#F9F8ECFF' : '#333333')
      .style('box-shadow', themeMode === 'dark' 
        ? '0 4px 12px rgba(0,0,0,0.4)' 
        : '0 4px 12px rgba(0,0,0,0.15)');
  }
};

// Add CSS for tooltips to document if it doesn't exist
export const injectTooltipStyles = () => {
  const styleId = 'tooltip-injected-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .tooltip {
        padding: 12px;
        border-radius: 8px;
        font-size: 13px;
        pointer-events: none;
        opacity: 0;
        position: absolute;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: opacity 0.2s ease-in-out;
        white-space: pre-line;
        line-height: 1.4;
      }
      
      .tooltip--light {
        background-color: #F9F8ECFF;
        color: #333333;
        border: 1px solid #EAE9DDFF;
      }
      
      .tooltip--dark {
        background-color: #424242;
        color: #F9F8ECFF;
        border: 1px solid #616161;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      }
      
      .tooltip strong {
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);
  }
};

// Initialize tooltip styles when the module is imported
injectTooltipStyles();