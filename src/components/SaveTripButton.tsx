import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Heart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSupabaseUser } from '../hooks/useSupabaseUser'
import { AuthModal } from './AuthModal'
import { Toast } from './Toast'
import { trackEvent } from '../lib/analytics'
import type { Place } from './ItineraryDisplay'
import type { Database } from '../types/supabase'

type SaveTripButtonProps = {
  city: string
  categories: string[]
  travelStyle: string
  places: Place[]
  isVisible?: boolean
}

type SaveTripModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => void
}

function SaveTripModal({ isOpen, onClose, onSave }: SaveTripModalProps) {
  const [name, setName] = useState('')
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-neutral-100 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-neutral-700 mb-4">Name your trip</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Summer in Paris"
          className="
            w-full px-4 py-2
            bg-neutral-100 border border-neutral-200
            rounded-lg mb-4
            text-neutral-700 placeholder-neutral-500 text-sm
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          "
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-700 hover:text-neutral-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(name)
              setName('')
            }}
            disabled={!name.trim()}
            className="
              px-6 py-2 bg-primary text-neutral-100 rounded-lg font-medium
              hover:bg-primary-light transition-colors
              disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            "
          >
            Save Trip
          </button>
        </div>
      </div>
    </div>
  )
}

export function SaveTripButton({
  city,
  categories,
  travelStyle,
  places,
  isVisible = true,
}: SaveTripButtonProps) {
  const { user } = useSupabaseUser()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const handleSave = async (name: string) => {
    try {
      setIsSaving(true)
      const { error } = await supabase
        .from('saved_trips')
        .insert({
          name,
          user_id: user!.id,
          city,
          categories,
          travel_style: travelStyle,
          places,
        } as Database['public']['Tables']['saved_trips']['Insert'])

      if (error) throw error

      // Track successful trip save
      await trackEvent('save_trip', { 
        trip_name: name,
        city 
      })

      setToastMessage(`Trip "${name}" saved! View it under Saved Trips`)
      setShowToast(true)
      setShowNameModal(false)
    } catch (err) {
      console.error('Error saving trip:', err)
      setToastMessage('Failed to save trip. Please try again.')
      setShowToast(true)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClick = () => {
    if (user) {
      setShowNameModal(true)
    } else {
      setShowAuthModal(true)
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    setShowNameModal(true)
  }

  if (!isVisible) return null

  const portalContent = (
    <>
      <button
        onClick={handleClick}
        disabled={isSaving}
        className={`
          fixed bottom-6 right-6 z-[100]
          md:right-[calc((100%-672px)/2+1rem)]
          flex items-center gap-2
          text-sm md:text-base
          px-4 py-2 md:px-6 md:py-3
          bg-primary text-neutral-100
          rounded-full shadow-lg
          transition-all transform
          hover:bg-primary-light hover:scale-105 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed
        `}
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-neutral-100" />
        ) : (
          <Heart className="w-5 h-5 text-accent" />
        )}
        <span>Save trip</span>
      </button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        mode="sign_up"
        message="Create an account to save your trip"
      />

      <SaveTripModal
        isOpen={showNameModal}
        onClose={() => setShowNameModal(false)}
        onSave={handleSave}
      />

      <Toast
        message={toastMessage}
        show={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )

  return createPortal(portalContent, document.body)
}