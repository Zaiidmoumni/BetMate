import React from 'react'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogTrigger } from "../ui/alert-dialog"
import { X } from 'lucide-react'
import { Button } from '../ui/button'

interface GlassModalProps {
  trigger: React.ReactNode
  children: React.ReactNode
}

export function GlassModal({ trigger, children }: GlassModalProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px] md:max-w-screen-md md:mx-auto backdrop-filter backdrop-blur-xl bg-white/60 dark:bg-blue-900/60 border border-blue-200 dark:border-blue-700 shadow-lg rounded-xl">
      <AlertDialogCancel asChild>
          <Button className="absolute rounded-full p-3 top-2 right-2 text-blue-500 hover:text-blue-800 dark:hover:text-blue-300 w-4 h-4 ">
            <X className="w-5 h-5" aria-label="Close" />
          </Button>
        </AlertDialogCancel>
        {children}
      </AlertDialogContent>
    </AlertDialog>
  )
}