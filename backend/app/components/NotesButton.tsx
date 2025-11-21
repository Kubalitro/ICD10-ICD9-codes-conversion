'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '../context/LanguageContext'
import NotesModal from './NotesModal'

interface NotesButtonProps {
    code: string
    system: string
    compact?: boolean
    className?: string
}

export default function NotesButton({ code, system, compact = false, className = '' }: NotesButtonProps) {
    const { t } = useLanguage()
    const { data: session } = useSession()
    const [hasNote, setHasNote] = useState(false)
    const [noteContent, setNoteContent] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const checkNoteStatus = async () => {
        if (session?.user) {
            try {
                const res = await fetch(`/api/favorites?code=${code}&system=${system}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.favorites && data.favorites.length > 0) {
                        const item = data.favorites[0]
                        if (item.notes) {
                            setHasNote(true)
                            setNoteContent(item.notes)
                        } else {
                            setHasNote(false)
                            setNoteContent('')
                        }
                    } else {
                        setHasNote(false)
                        setNoteContent('')
                    }
                }
            } catch (error) {
                console.error('Failed to check note status', error)
            }
        }
    }

    useEffect(() => {
        checkNoteStatus()
    }, [code, system, session])

    const handleSaveNote = async (note: string) => {
        if (!session?.user) return

        try {
            const res = await fetch('/api/favorites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, system, notes: note })
            })

            if (res.ok) {
                setNoteContent(note)
                setHasNote(!!note)
                // Dispatch event to update other components
                window.dispatchEvent(new CustomEvent('favoritesUpdated'))
            } else {
                throw new Error('Failed to save note')
            }
        } catch (error) {
            console.error('Error saving note:', error)
            throw error
        }
    }

    if (!session) return null

    return (
        <>
            {compact ? (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={`p-2 rounded-full transition-colors ${hasNote
                        ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        : 'text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                        } ${className}`}
                    title={hasNote ? t('editNote') : t('addNote')}
                >
                    <svg className="w-5 h-5" fill={hasNote ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
            ) : (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 font-medium text-sm ${hasNote
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    <svg className="w-5 h-5" fill={hasNote ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {hasNote ? t('editNote') : t('addNote')}
                </button>
            )}

            <NotesModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                code={code}
                system={system}
                initialNote={noteContent}
                onSave={handleSaveNote}
            />
        </>
    )
}
