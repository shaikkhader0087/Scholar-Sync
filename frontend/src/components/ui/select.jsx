import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const Select = ({ children, value, onValueChange }) => {
    return (
        <div className="relative">
            {React.Children.map(children, child => {
                if (child.type === SelectTrigger) {
                    return React.cloneElement(child, { value, onValueChange })
                }
                return child
            })}
        </div>
    )
}

const SelectTrigger = React.forwardRef(({ className, children, value, onValueChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <>
            <button
                ref={ref}
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                onClick={() => setIsOpen(!isOpen)}
                {...props}
            >
                {children}
                <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
            {isOpen && React.Children.map(props.content, child =>
                React.cloneElement(child, { onValueChange, setIsOpen })
            )}
        </>
    )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = ({ className, children, onValueChange, setIsOpen, ...props }) => {
    return (
        <div
            className={cn(
                "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md",
                className
            )}
            {...props}
        >
            {React.Children.map(children, child =>
                React.cloneElement(child, { onValueChange, setIsOpen })
            )}
        </div>
    )
}
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef(({ className, children, value, onValueChange, setIsOpen, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                className
            )}
            onClick={() => {
                onValueChange?.(value)
                setIsOpen?.(false)
            }}
            {...props}
        >
            {children}
        </div>
    )
})
SelectItem.displayName = "SelectItem"

const SelectValue = ({ placeholder, value, items }) => {
    const selectedItem = items?.find(item => item.value === value)
    return <span>{selectedItem?.label || placeholder}</span>
}
SelectValue.displayName = "SelectValue"

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }
