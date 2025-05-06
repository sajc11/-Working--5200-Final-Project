// src/components/ui/IncidentTooltip.js

// This component is used to display a tooltip for incidents on the map.

const IncidentTooltip = ({ x, y, content }) => {
    return (
      <div
        className="absolute z-20 px-3 py-1 bg-white border border-gray-300 text-sm rounded shadow"
        style={{ left: x + 10, top: y + 10 }}
      >
        {content}
      </div>
    );
  };
  
  export default IncidentTooltip;
  