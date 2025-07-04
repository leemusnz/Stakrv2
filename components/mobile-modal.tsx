"use client"

import { ReactNode, useState, useEffect } from "react"
import { useEnhancedMobile } from "@/hooks/use-enhanced-mobile"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
  showCloseButton?: boolean
  preventClose?: boolean
}

export function MobileModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = "md",
  showCloseButton = true,
  preventClose = false
}: MobileModalProps) {
  const { isMobile } = useEnhancedMobile()
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    if (preventClose) return
    
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "max-w-sm"
      case "md":
        return "max-w-md"
      case "lg":
        return "max-w-lg"
      case "xl":
        return "max-w-xl"
      case "full":
        return "max-w-full"
      default:
        return "max-w-md"
    }
  }

  // Desktop: Use regular dialog
  if (!isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className={cn(getSizeClasses(), "mobile-safe-width", className)}>
          {(title || description) && (
            <DialogHeader>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
          )}
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  // Mobile: Use bottom drawer
  return (
    <Drawer open={isOpen} onOpenChange={handleClose}>
      <DrawerContent 
        className={cn(
          "max-h-[90vh] mobile-safe-width",
          isClosing && "animate-out slide-out-to-bottom duration-200",
          className
        )}
      >
        {/* Drawer Handle */}
        <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted" />
        
        {/* Header */}
        <DrawerHeader className="text-left">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {title && <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>}
              {description && <DrawerDescription className="text-sm text-muted-foreground mt-1">{description}</DrawerDescription>}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DrawerHeader>

        {/* Content */}
        <div className="px-4 pb-6 overflow-y-auto">
          {children}
        </div>

        {/* Safe area for devices with home indicators */}
        <div className="h-[env(safe-area-inset-bottom)] bg-background" />
      </DrawerContent>
    </Drawer>
  )
}

// Specialized mobile modal variants
export function MobileActionModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  className
}: {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: ReactNode
  primaryAction?: {
    label: string
    onClick: () => void
    variant?: "default" | "destructive" | "outline" | "secondary"
  }
  secondaryAction?: {
    label: string
    onClick: () => void
    variant?: "default" | "destructive" | "outline" | "secondary"
  }
  className?: string
}) {
  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      className={className}
      size="sm"
    >
      {children && <div className="mb-6">{children}</div>}
      
      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            variant={primaryAction.variant || "default"}
            className="w-full min-h-[48px] touch-manipulation"
          >
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant={secondaryAction.variant || "outline"}
            className="w-full min-h-[48px] touch-manipulation"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </MobileModal>
  )
}

export function MobileConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default"
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
}) {
  return (
    <MobileActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      primaryAction={{
        label: confirmLabel,
        onClick: onConfirm,
        variant
      }}
      secondaryAction={{
        label: cancelLabel,
        onClick: onClose,
        variant: "outline"
      }}
    />
  )
}

export function MobileFormModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Submit",
  isSubmitting = false,
  className
}: {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  onSubmit: () => void
  submitLabel?: string
  isSubmitting?: boolean
  className?: string
}) {
  return (
    <MobileModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      className={className}
      size="md"
      preventClose={isSubmitting}
    >
      <form 
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        className="space-y-6"
      >
        {children}
        
        <div className="flex flex-col gap-3 pt-4 border-t">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] touch-manipulation"
          >
            {isSubmitting ? "Submitting..." : submitLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full min-h-[48px] touch-manipulation"
          >
            Cancel
          </Button>
        </div>
      </form>
    </MobileModal>
  )
}

// Hook for managing mobile modal state
export function useMobileModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen(prev => !prev)

  return {
    isOpen,
    open,
    close,
    toggle,
    props: {
      isOpen,
      onClose: close
    }
  }
}
