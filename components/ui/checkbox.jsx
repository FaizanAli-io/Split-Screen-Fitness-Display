import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, id, ...props }, ref) => {
  const handleChange = (e) => {
    if (onCheckedChange) {
      onCheckedChange(e.target.checked);
    }
  };

  return (
    <div className="relative">
      <input
        ref={ref}
        id={id}
        type="checkbox"
        checked={checked || false}
        onChange={handleChange}
        className="sr-only"
        {...props}
      />
      <label
        htmlFor={id}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 bg-white cursor-pointer flex items-center justify-center transition-colors hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked && "bg-blue-600 border-blue-600 text-white",
          className
        )}
      >
        {checked && <Check className="h-3 w-3" />}
      </label>
    </div>
  );
});

Checkbox.displayName = "Checkbox";

export { Checkbox };
