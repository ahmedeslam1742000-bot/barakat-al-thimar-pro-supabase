import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

/**
 * SmartDateInput - A professional date input for manual entry in DD/MM/YYYY format.
 * Automatically handles padding (e.g., 5 -> 05) and separators.
 * Syncs with parent using standard YYYY-MM-DD format.
 */
export default function SmartDateInput({ value, onChange, className, required, placeholder = "DD/MM/YYYY" }) {
  const [displayValue, setDisplayValue] = useState('');
  const isInternalChange = useRef(false);

  // Sync internal display with external YYYY-MM-DD value
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (value) {
      const [y, m, d] = value.split('-');
      if (y && m && d) {
        setDisplayValue(`${d}/${m}/${y}`);
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e) => {
    let val = e.target.value.replace(/\D/g, ''); // Digits only
    if (val.length > 8) val = val.slice(0, 8);
    
    let formatted = val;
    if (val.length > 4) {
      formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
    } else if (val.length > 2) {
      formatted = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    
    setDisplayValue(formatted);

    // If we have a full date, notify parent
    if (val.length === 8) {
      const d = val.slice(0, 2);
      const m = val.slice(2, 4);
      const y = val.slice(4, 8);
      
      const dayNum = parseInt(d);
      const monthNum = parseInt(m);
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12) {
        isInternalChange.current = true;
        onChange(`${y}-${m}-${d}`);
      }
    }
  };

  const handleBlur = () => {
    let parts = displayValue.split('/');
    
    // Pad day and month if they are single digits
    if (parts[0] && parts[0].length === 1) parts[0] = '0' + parts[0];
    if (parts[1] && parts[1].length === 1) parts[1] = '0' + parts[1];
    
    // If year is short (e.g. 26 -> 2026)
    if (parts[2] && parts[2].length === 2) {
       const currentYearPrefix = new Date().getFullYear().toString().slice(0, 2);
       parts[2] = currentYearPrefix + parts[2];
    }

    const finalDisplay = parts.filter(p => p !== '').join('/');
    setDisplayValue(finalDisplay);

    // Final Sync
    if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
      const [d, m, y] = parts;
      isInternalChange.current = true;
      onChange(`${y}-${m}-${d}`);
    }
  };

  return (
    <div className="relative group w-full">
      <input
        type="text"
        required={required}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`${className} pl-4 pr-10 tabular-nums`}
        dir="ltr"
        spellCheck="false"
        autoComplete="off"
      />
      <Calendar 
        size={15} 
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" 
      />
    </div>
  );
}
